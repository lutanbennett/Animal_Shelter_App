import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { ensureResidentPhotosFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { dateToYymm, driveImageUrl, photoCategoriesFor } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";
import { todayIso } from "@/lib/format";

/**
 * Add Shelter Photos, the upload route for a login that holds photos.shelter_add and nothing wider (a volunteer).
 * The sibling of /api/residents/[id]/photos and /api/medical/residents/[id]/photos, narrower than both on purpose:
 * the Shelter folder only, today's date, no adopter's photo, an open (not deceased, not adopted) resident.
 *
 * Why its own route: the staff route reads `residents` and writes its Drive folder id, and a volunteer reads only
 * `resident_who_and_where` (0134), so the staff route answers "Resident not found". Here the login is authorised
 * first (shelter_add, the Shelter folder, and the resident is one it can see through who-and-where), and only then
 * does the service role read and, once, write the resident's Drive folder id: the one thing the login cannot do for
 * itself. The photo is recorded as the login (record_attachment), so 0217's trigger marks it WAITING and the 0152
 * folder guards still refuse it anywhere but Shelter. Nothing here can publish a photo.
 */

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const FOLDER = "Shelter";

async function handlePost(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { id } = await params;
  const { t } = await getT();

  // Drive is not RLS-protected, so this runs before any Drive call.
  const perms = await loadPermissions();
  if (!can(perms, "photos.shelter_add") || !photoCategoriesFor(perms).includes(FOLDER)) {
    return NextResponse.json({ error: t.photos.errors.notAuthorized }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type || "unknown"}.` }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is larger than 15MB." }, { status: 400 });
  }
  // The browser's type is a guess from the name; the bytes decide (file-signature.ts).
  const mimeType = await checkFileSignature(file, ALLOWED_MIME_TYPES);
  if (!mimeType) {
    return NextResponse.json(
      { error: t.uploads.notReadable(file.name, formatNames(ALLOWED_MIME_TYPES)) },
      { status: 400 },
    );
  }
  // This login files into Shelter and nowhere else, and never an adopter's photo.
  if (formData.get("category") !== FOLDER || formData.get("adoptionUpdateId")) {
    return NextResponse.json({ error: t.photos.errors.onlyFolder(FOLDER) }, { status: 403 });
  }

  // The resident must be one this login can see: the same view the picker reads.
  const supabase = await createClient();
  const { data: rows, error: residentError } = await supabase
    .from("resident_who_and_where")
    .select("id, name, resident_code, current_status")
    .eq("id", id)
    .limit(1)
    .returns<{ id: string; name: string; resident_code: string | null; current_status: string | null }[]>();
  const resident = rows?.[0];
  if (residentError || !resident || !resident.resident_code) {
    return NextResponse.json({ error: "Resident not found." }, { status: 404 });
  }
  if (resident.current_status === "Deceased" || resident.current_status === "Adopted") {
    return NextResponse.json({ error: t.photos.errors.notAuthorized }, { status: 409 });
  }

  const admin = createAdminClient();
  const { data: folderRows } = await admin
    .from("residents")
    .select("drive_folder_id")
    .eq("id", id)
    .limit(1)
    .returns<{ drive_folder_id: string | null }[]>();
  if (!folderRows?.[0]) {
    return NextResponse.json({ error: "Resident not found." }, { status: 404 });
  }

  const dateTaken = todayIso();
  const drive = getDriveClient();
  const { residentFolderId, uploadFolderId, isNewResidentFolder } = await ensureResidentPhotosFolder(
    drive,
    { name: resident.name, resident_code: resident.resident_code, drive_folder_id: folderRows[0].drive_folder_id },
    FOLDER,
    dateToYymm(dateTaken),
  );
  if (isNewResidentFolder) {
    // Only when there is none: this can never repoint a resident at another folder.
    await admin.from("residents").update({ drive_folder_id: residentFolderId }).eq("id", id).is("drive_folder_id", null);
  }

  const driveFileId = await uploadImageToFolder(drive, uploadFolderId, {
    name: file.name,
    mimeType,
    content: file,
  });

  const { data: recordResult, error: recordError } = await supabase.rpc("record_attachment", {
    p_owner_type: "resident",
    p_owner_id: id,
    p_drive_file_id: driveFileId,
    p_file_name: file.name,
    p_sub_folder: FOLDER,
    p_date_taken: dateTaken,
    p_adoption_update_id: null,
  });
  if (recordError) {
    return NextResponse.json({ error: recordError.message }, { status: 500 });
  }
  const row = (recordResult as { attachment: { id: string }; is_profile: boolean }[])[0];

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
