import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
 * Add Medical Photos, the sibling of /api/residents/[id]/photos for a login that cannot read
 * `residents` (the Head of Medical; docs/decisions/2026-10-04-medical-jobs-app.md).
 *
 * The staff route selects from `residents`, reads `resident_current_state` and `.update()`s the
 * resident's Drive folder: three things a volunteer-based role can do none of (0134, 0140). This
 * one reads the resident through `medical_photo_residents` and writes the folder through
 * `set_resident_drive_folder()`, and is narrower on purpose: Medical folder only, today's date,
 * no adopter's photo, and an open (not deceased) record. The database enforces the Medical-only
 * scope too (`record_attachment()`, 0140); the route refuses first because Drive is not RLS and an
 * upload followed by a refused record leaves an orphan file.
 *
 * Deceased: the staff route keeps photos open after death and regenerates the archive. That
 * needs reads she does not have, so this route refuses and the page says to ask Management.
 */

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const FOLDER = "Medical";

async function handlePost(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { id } = await params;
  const { t } = await getT();
  const e = t.medicalJobs.photos.errors;

  const perms = await loadPermissions();
  if (!can(perms, "photos.resident_add") || perms?.scopes.clinical !== "any") {
    return NextResponse.json({ error: e.notAuthorized }, { status: 403 });
  }
  // Whoever can file in Medical at all; the role's own scope is checked again in the database.
  if (!photoCategoriesFor(perms).includes(FOLDER)) {
    return NextResponse.json({ error: e.onlyMedical }, { status: 403 });
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
  const mimeType = await checkFileSignature(file, ALLOWED_MIME_TYPES);
  if (!mimeType) {
    return NextResponse.json(
      { error: t.uploads.notReadable(file.name, formatNames(ALLOWED_MIME_TYPES)) },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: rows, error: residentError } = await supabase
    .from("medical_photo_residents")
    .select("id, name, resident_code, drive_folder_id, is_deceased")
    .eq("id", id)
    .limit(1)
    .returns<{ id: string; name: string; resident_code: string; drive_folder_id: string | null; is_deceased: boolean }[]>();
  const resident = rows?.[0];
  if (residentError || !resident) {
    return NextResponse.json({ error: e.notFound }, { status: 404 });
  }
  if (resident.is_deceased) {
    return NextResponse.json({ error: e.closed }, { status: 409 });
  }

  const dateTaken = todayIso();
  const drive = getDriveClient();
  const { residentFolderId, uploadFolderId, isNewResidentFolder } = await ensureResidentPhotosFolder(
    drive,
    resident,
    FOLDER,
    dateToYymm(dateTaken),
  );
  if (isNewResidentFolder) {
    const { error } = await supabase.rpc("set_resident_drive_folder", {
      p_resident_id: id,
      p_folder_id: residentFolderId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

export const POST = withDriveErrors(handlePost);
