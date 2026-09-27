import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { assertPhotoWriteAccess } from "@/lib/auth/require-role";
import { refreshDeceasedArchiveIfNeeded } from "@/lib/archive/refresh-deceased-archive";
import {
  ensureResidentAdoptionUpdateFolder,
  ensureResidentPhotosFolder,
  getDriveClient,
  uploadImageToFolder,
} from "@/lib/google/drive";
import {
  PHOTO_CATEGORIES,
  dateToYymm,
  dateToYyyymmdd,
  driveImageUrl,
  type PhotoCategory,
} from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

async function handlePost(
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

  // A photo an adopter sent is tagged with its update (0097) and filed
  // under Adoption updates/<YYYYMMDD>/ instead of a Photos category, so it
  // posts no category. Everything else about the upload is the same.
  const adoptionUpdateId = formData.get("adoptionUpdateId");
  if (adoptionUpdateId !== null && (typeof adoptionUpdateId !== "string" || !adoptionUpdateId)) {
    return NextResponse.json({ error: "Invalid adoption update." }, { status: 400 });
  }

  const category = formData.get("category");
  if (
    !adoptionUpdateId &&
    (typeof category !== "string" || !PHOTO_CATEGORIES.includes(category as PhotoCategory))
  ) {
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
    { data: update },
  ] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, resident_code, drive_folder_id")
      .eq("id", id)
      .limit(1)
      .returns<
        { id: string; name: string; resident_code: string; drive_folder_id: string | null }[]
      >(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", id)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
    typeof adoptionUpdateId === "string"
      ? supabase
          .from("adoption_updates")
          .select("id, received_on")
          .eq("id", adoptionUpdateId)
          .eq("resident_id", id)
          .limit(1)
          .returns<{ id: string; received_on: string }[]>()
      : { data: null },
  ]);

  const residentRow = resident?.[0];
  if (residentError || !residentRow) {
    return NextResponse.json({ error: "Resident not found." }, { status: 404 });
  }

  // Photos stay open after death (0052): the upload lands in the archived
  // folder (drive_folder_id follows the move) and the archive's index and
  // summary are regenerated below so they list it.
  const isDeceased = state?.[0]?.is_deceased ?? false;

  // record_attachment refuses an update about another resident too; this
  // answers before anything is written to Drive.
  const updateRow = update?.[0];
  if (adoptionUpdateId && !updateRow) {
    const { t } = await getT();
    return NextResponse.json({ error: t.adoptionUpdates.errors.notFound }, { status: 404 });
  }

  const drive = getDriveClient();
  // sub_folder is the folder under the resident's own: a Photos category,
  // or for an adopter's photo the update's <YYYYMMDD> under Adoption
  // updates/ (the archive index rebuilds the path from it).
  const subFolder = updateRow
    ? dateToYyyymmdd(updateRow.received_on)
    : (category as PhotoCategory);
  const { residentFolderId, uploadFolderId, isNewResidentFolder } = updateRow
    ? await ensureResidentAdoptionUpdateFolder(drive, residentRow, subFolder)
    : await ensureResidentPhotosFolder(drive, residentRow, subFolder, dateToYymm(dateTaken));

  if (isNewResidentFolder) {
    await supabase
      .from("residents")
      .update({ drive_folder_id: residentFolderId })
      .eq("id", id);
  }

  const driveFileId = await uploadImageToFolder(drive, uploadFolderId, {
    name: file.name,
    mimeType,
    content: file,
  });

  const { data: recordResult, error: recordError } = await supabase.rpc(
    "record_attachment",
    {
      p_owner_type: "resident",
      p_owner_id: id,
      p_drive_file_id: driveFileId,
      p_file_name: file.name,
      p_sub_folder: subFolder,
      p_date_taken: dateTaken,
      p_adoption_update_id: updateRow?.id ?? null,
    },
  );

  if (recordError) {
    return NextResponse.json({ error: recordError.message }, { status: 500 });
  }

  const row = (
    recordResult as { attachment: { id: string }; is_profile: boolean }[]
  )[0];

  // Uploads are sequential (DeferredUploads), so this runs once per file;
  // acceptable for the handful of photos added after a death.
  if (isDeceased) await refreshDeceasedArchiveIfNeeded(supabase, id);

  return NextResponse.json({
    attachmentId: row.attachment.id,
    driveFileId,
    fileName: file.name,
    isProfile: row.is_profile,
    thumbnailUrl: driveImageUrl(driveFileId),
  });
}

// A Drive failure answers in a sentence rather than a bare 500 (drive-errors.ts).
export const POST = withDriveErrors(handlePost);
