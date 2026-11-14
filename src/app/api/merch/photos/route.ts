import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { findOrCreateFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { driveImageUrl } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"]);

/**
 * Uploads one product picture for the merchandise shop and returns its Drive file id, which the add-product form then
 * saves as photo_drive_file_id. A ROUTE and not a Server Action on purpose: Next refuses a Server Action body over 1 MB
 * before the action runs, and a phone photo is routinely larger (docs/decisions/2026-09-25-upload-failures-...md).
 * The check is merch.manage at edit, the same activity saveProduct asks, so the control and the server cannot disagree.
 * The file goes to Merch/ under the Drive root; the public shop reads it through is_public_drive_file (0369).
 */
async function handlePost(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  if (!can(await loadPermissions(), "merch.manage", "edit")) {
    const { t } = await getT();
    return NextResponse.json({ error: t.photos.errors.notAuthorized }, { status: 403 });
  }

  const { t } = await getT();
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: t.uploads.errors.noFile }, { status: 400 });
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type || "unknown"}.` }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: t.uploads.errors.tooLarge }, { status: 400 });
  const mimeType = await checkFileSignature(file, ALLOWED_MIME_TYPES);
  if (!mimeType) {
    return NextResponse.json({ error: t.uploads.notReadable(file.name, formatNames(ALLOWED_MIME_TYPES)) }, { status: 400 });
  }

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  const drive = getDriveClient();
  const folderId = await findOrCreateFolder(drive, rootId, "Merch");
  const driveFileId = await uploadImageToFolder(drive, folderId, { name: file.name, mimeType, content: file });

  return NextResponse.json({ driveFileId, fileUrl: driveImageUrl(driveFileId) });
}

export const POST = withDriveErrors(handlePost);
