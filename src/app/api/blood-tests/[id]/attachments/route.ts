import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { assertPhotoWriteAccess } from "@/lib/auth/require-role";
import {
  ensureResidentBloodTestFolder,
  getDriveClient,
  uploadImageToFolder,
} from "@/lib/google/drive";
import { dateToYyyymmdd, driveImageUrl } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

async function handlePost(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: bloodTestId } = await params;

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
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 15MB." },
      { status: 400 },
    );
  }

  // The browser's type is a guess from the name; the bytes decide (file-signature.ts).
  const mimeType = await checkFileSignature(file, ALLOWED_MIME_TYPES);
  if (!mimeType) {
    const { t } = await getT();
    return NextResponse.json(
      { error: t.uploads.notReadable(file.name, formatNames(ALLOWED_MIME_TYPES)) },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Every role with SELECT on blood_tests (all four — see 0001's RLS) can
  // reach this lookup; the actual write gate is assertPhotoWriteAccess()
  // above plus record_attachment()'s own role check below, both of which
  // intentionally allow staff/volunteers to attach files to a blood test
  // even though only vet/admin can create the row itself (decisions.md:
  // volunteers may write "attachments/photos, any owner type").
  const { data: bloodTest, error: bloodTestError } = await supabase
    .from("blood_tests")
    .select("id, date, residents(id, name, resident_code, drive_folder_id)")
    .eq("id", bloodTestId)
    .limit(1)
    .returns<
      {
        id: string;
        date: string;
        residents: {
          id: string;
          name: string;
          resident_code: string;
          drive_folder_id: string | null;
        } | null;
      }[]
    >();

  const bloodTestRow = bloodTest?.[0];
  if (bloodTestError || !bloodTestRow || !bloodTestRow.residents) {
    return NextResponse.json({ error: "Blood test not found." }, { status: 404 });
  }

  const residentRow = bloodTestRow.residents;

  // record_attachment() would be rejected by the deceased lock (migration
  // 0025) — but only after the file had already been uploaded, leaving it
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
  const yyyymmdd = dateToYyyymmdd(bloodTestRow.date);
  const { residentFolderId, uploadFolderId, isNewResidentFolder } =
    await ensureResidentBloodTestFolder(drive, residentRow, yyyymmdd);

  if (isNewResidentFolder) {
    await supabase
      .from("residents")
      .update({ drive_folder_id: residentFolderId })
      .eq("id", residentRow.id);
  }

  const driveFileId = await uploadImageToFolder(drive, uploadFolderId, {
    name: file.name,
    mimeType,
    content: file,
  });

  const { data: recordResult, error: recordError } = await supabase.rpc(
    "record_attachment",
    {
      p_owner_type: "blood_test",
      p_owner_id: bloodTestId,
      p_drive_file_id: driveFileId,
      p_file_name: file.name,
      p_date_taken: bloodTestRow.date,
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
    mimeType,
    fileUrl: driveImageUrl(driveFileId),
  });
}

// A Drive failure answers in a sentence rather than a bare 500 (drive-errors.ts).
export const POST = withDriveErrors(handlePost);
