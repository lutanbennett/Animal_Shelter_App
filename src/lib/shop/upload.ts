import "server-only";
import { MAX_UPLOAD_BYTES, WEBSITE_IMAGE_MIME_TYPES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { confirmUploaded, findOrCreateFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * A shop's photo goes to the Website folder in Drive, as the donation QR does. Same checks as
 * src/app/admin/website/actions.ts (type, size, the file's real bytes, read-back); written here so
 * the Shop screen does not reach into that file.
 */
export async function uploadShopPhoto(file: File, t: Dictionary): Promise<string> {
  if (!WEBSITE_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error(t.admin.website.errors.unsupportedFileType(file.type || "unknown"));
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(t.admin.website.errors.fileTooLarge);
  const mimeType = await checkFileSignature(file, WEBSITE_IMAGE_MIME_TYPES);
  if (!mimeType) throw new Error(t.uploads.notReadable(file.name, formatNames(WEBSITE_IMAGE_MIME_TYPES)));

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error(t.admin.website.errors.driveNotConfigured);

  const drive = getDriveClient();
  const folderId = await findOrCreateFolder(drive, rootId, "Website");
  const fileId = await uploadImageToFolder(drive, folderId, { name: file.name, mimeType, content: file });
  try {
    await confirmUploaded(drive, fileId, file.size);
  } catch (err) {
    console.error("Shop photo did not land whole:", err);
    await trashShopPhoto(fileId);
    throw new Error(t.admin.website.errors.uploadFailed);
  }
  return fileId;
}

/** To Drive's trash, not a permanent delete, so a bad replacement can be undone. Best effort. */
export async function trashShopPhoto(fileId: string) {
  try {
    await getDriveClient().trashFile(fileId);
  } catch {
    // An orphaned Drive file is a minor cleanup issue, not worth failing the action over.
  }
}
