import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertPhotoWriteAccess } from "@/lib/auth/require-role";
import {
  ensureResidentPhotosFolder,
  getDriveClient,
  uploadImageToFolder,
} from "@/lib/google/drive";
import { PHOTO_CATEGORIES, dateToYymm, driveImageUrl, type PhotoCategory } from "@/lib/google/drive-client";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const category = formData.get("category");
  if (typeof category !== "string" || !PHOTO_CATEGORIES.includes(category as PhotoCategory)) {
    return NextResponse.json(
      { error: `Folder must be one of: ${PHOTO_CATEGORIES.join(", ")}.` },
      { status: 400 },
    );
  }

  const dateTaken = formData.get("dateTaken");
  if (typeof dateTaken !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateTaken)) {
    return NextResponse.json(
      { error: "Date taken must be a valid date." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const [
    { data: resident, error: residentError },
    { data: state },
  ] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, animal_code, drive_folder_id")
      .eq("id", id)
      .limit(1)
      .returns<
        { id: string; name: string; animal_code: string; drive_folder_id: string | null }[]
      >(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", id)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
  ]);

  const residentRow = resident?.[0];
  if (residentError || !residentRow) {
    return NextResponse.json({ error: "Resident not found." }, { status: 404 });
  }

  // record_attachment() would be rejected by the deceased lock (migration
  // 0025) — but only after the file had already been uploaded, leaving it
  // orphaned in Drive. Stop before touching Drive at all.
  if (state?.[0]?.is_deceased) {
    return NextResponse.json(
      { error: "This resident has died — their record is closed." },
      { status: 409 },
    );
  }

  const drive = getDriveClient();
  const yymm = dateToYymm(dateTaken);
  const { residentFolderId, uploadFolderId, isNewResidentFolder } =
    await ensureResidentPhotosFolder(drive, residentRow, category, yymm);

  if (isNewResidentFolder) {
    await supabase
      .from("residents")
      .update({ drive_folder_id: residentFolderId })
      .eq("id", id);
  }

  const driveFileId = await uploadImageToFolder(drive, uploadFolderId, {
    name: file.name,
    mimeType: file.type,
    content: file,
  });

  const { data: recordResult, error: recordError } = await supabase.rpc(
    "record_attachment",
    {
      p_owner_type: "resident",
      p_owner_id: id,
      p_drive_file_id: driveFileId,
      p_file_name: file.name,
      p_sub_folder: category,
      p_date_taken: dateTaken,
    },
  );

  if (recordError) {
    return NextResponse.json({ error: recordError.message }, { status: 500 });
  }

  const row = (
    recordResult as { attachment: { id: string }; is_profile: boolean }[]
  )[0];

  return NextResponse.json({
    attachmentId: row.attachment.id,
    driveFileId,
    fileName: file.name,
    isProfile: row.is_profile,
    thumbnailUrl: driveImageUrl(driveFileId),
  });
}
