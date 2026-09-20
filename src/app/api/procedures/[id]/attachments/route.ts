import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertPhotoWriteAccess } from "@/lib/auth/require-role";
import {
  ensureResidentProcedureFolder,
  getDriveClient,
  procedureFolderName,
  uploadImageToFolder,
} from "@/lib/google/drive";
import { dateToYyyymmdd, driveImageUrl } from "@/lib/google/drive-client";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

/**
 * Attaches one file (an X-ray, an ultrasound still, a discharge sheet) to
 * a procedure. Same shape as the blood-test attachment route: role gate,
 * type/size checks, deceased check before Drive is touched, upload into
 * Residents/<Name> (<ID>)/Procedures/<Type> <YYYYMMDD>/, then
 * record_attachment() with owner_type 'procedure'.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: procedureId } = await params;

  try {
    await assertPhotoWriteAccess();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not authorized." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}.` },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 15MB." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Every role can read procedures (0001), so the lookup itself isn't the
  // gate: assertPhotoWriteAccess() above and record_attachment()'s own role
  // check are, and both let staff/volunteers attach files to a record a
  // vet created (decisions.md: volunteers may write "attachments/photos,
  // any owner type").
  const { data: procedure, error: procedureError } = await supabase
    .from("procedures")
    .select(
      "id, date, procedure_types(name), residents(id, name, animal_code, drive_folder_id)",
    )
    .eq("id", procedureId)
    .limit(1)
    .returns<
      {
        id: string;
        date: string;
        procedure_types: { name: string } | null;
        residents: {
          id: string;
          name: string;
          animal_code: string;
          drive_folder_id: string | null;
        } | null;
      }[]
    >();

  const procedureRow = procedure?.[0];
  if (procedureError || !procedureRow || !procedureRow.residents) {
    return NextResponse.json({ error: "Procedure not found." }, { status: 404 });
  }

  const residentRow = procedureRow.residents;

  // record_attachment() would be rejected by the deceased lock (migration
  // 0026) — but only after the file had already been uploaded, leaving it
  // orphaned in Drive. Stop before touching Drive at all.
  const { data: state } = await supabase
    .from("resident_current_state")
    .select("is_deceased")
    .eq("resident_id", residentRow.id)
    .limit(1)
    .returns<{ is_deceased: boolean }[]>();
  if (state?.[0]?.is_deceased) {
    return NextResponse.json(
      { error: "This resident has died — their record is closed." },
      { status: 409 },
    );
  }

  const drive = getDriveClient();
  const folderName = procedureFolderName(
    procedureRow.procedure_types?.name ?? "Procedure",
    dateToYyyymmdd(procedureRow.date),
  );
  const { residentFolderId, uploadFolderId, isNewResidentFolder } =
    await ensureResidentProcedureFolder(drive, residentRow, folderName);

  if (isNewResidentFolder) {
    await supabase
      .from("residents")
      .update({ drive_folder_id: residentFolderId })
      .eq("id", residentRow.id);
  }

  const driveFileId = await uploadImageToFolder(drive, uploadFolderId, {
    name: file.name,
    mimeType: file.type,
    content: file,
  });

  // sub_folder keeps the folder the file actually landed in, so the
  // deceased archive can point at it even if the type is renamed later.
  const { data: recordResult, error: recordError } = await supabase.rpc(
    "record_attachment",
    {
      p_owner_type: "procedure",
      p_owner_id: procedureId,
      p_drive_file_id: driveFileId,
      p_file_name: file.name,
      p_sub_folder: folderName,
      p_date_taken: procedureRow.date,
    },
  );

  if (recordError) {
    return NextResponse.json({ error: recordError.message }, { status: 500 });
  }

  const row = (recordResult as { attachment: { id: string } }[])[0];

  return NextResponse.json({
    attachmentId: row.attachment.id,
    driveFileId,
    fileName: file.name,
    mimeType: file.type,
    fileUrl: driveImageUrl(driveFileId),
  });
}
