import { NextResponse } from "next/server";
import { getT } from "@/lib/i18n/get-t";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { WEBSITE_IMAGE_MIME_TYPES } from "@/lib/uploads/limits";
import { ADOPTER_MAX_PHOTO_BYTES } from "@/lib/adopter/limits";
import { hasRoom, loadOwnUpdate, recordAdopterFile } from "@/lib/adopter/media";
import { ensureResidentAdoptionUpdateFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";
import { createAdminClient } from "@/lib/supabase/admin";

/** An adopter's photo for their own update. Gate: loadOwnUpdate (src/lib/adopter/media.ts), asked before Drive is touched. */
async function handlePost(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;
  const { t } = await getT();
  const e = t.adopterUpdate.errors;

  const form = await request.formData();
  const file = form.get("file");
  const residentId = form.get("residentId");
  const updateId = form.get("updateId");
  if (typeof residentId !== "string" || typeof updateId !== "string") return NextResponse.json({ error: e.notYours }, { status: 400 });

  const own = await loadOwnUpdate(residentId, updateId);
  if (!own) return NextResponse.json({ error: e.notYours }, { status: 403 });
  if (!hasRoom(own)) return NextResponse.json({ error: e.noRoom }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: t.uploads.errors.noFile }, { status: 400 });
  if (file.size > ADOPTER_MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: t.adopterUpdate.media.photoTooLarge(file.name, Math.round(ADOPTER_MAX_PHOTO_BYTES / 1048576)) }, { status: 400 });
  }
  const mimeType = await checkFileSignature(file, WEBSITE_IMAGE_MIME_TYPES);
  if (!mimeType) return NextResponse.json({ error: t.uploads.notReadable(file.name, formatNames(WEBSITE_IMAGE_MIME_TYPES)) }, { status: 400 });

  const drive = getDriveClient();
  const { residentFolderId, uploadFolderId, isNewResidentFolder } = await ensureResidentAdoptionUpdateFolder(drive, own.resident, own.subFolder);
  if (isNewResidentFolder) {
    await createAdminClient().from("residents").update({ drive_folder_id: residentFolderId }).eq("id", own.residentId);
  }
  const driveFileId = await uploadImageToFolder(drive, uploadFolderId, { name: file.name, mimeType, content: file });
  const recorded = await recordAdopterFile(own, { driveFileId, fileName: file.name, kind: "photo" });
  if ("error" in recorded) return NextResponse.json({ error: t.common.somethingWentWrong("adopter-update") }, { status: 500 });
  return NextResponse.json({ attachmentId: recorded.id });
}

export const POST = withDriveErrors(handlePost);
