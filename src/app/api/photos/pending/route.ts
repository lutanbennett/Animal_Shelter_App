import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { findOrCreateFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { photoCategoriesFor } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";
import { isUuid } from "@/lib/tags/links";
import { enclosureNameFor } from "@/lib/photos/pending";

/**
 * A photo tagged to an ENCLOSURE because the person did not know which resident it is (0218). The sibling of
 * /api/photos/shelter/[id], with no resident and no service role at all: the file goes to `Unsorted/<enclosure>` in
 * Drive, and a `pending_photos` row is inserted as the login (RLS and `can_file_pending_photo()` decide).
 *
 * It does not call record_attachment(): an unassigned photo is not an attachment of anything and is never public. The
 * row has no approval state to set. docs/decisions/2026-10-17-pending-photos-schema.md,
 * docs/decisions/2026-10-17-enclosure-photos-app.md.
 *
 * Order: Drive first (the row needs the file's id), then the row. If the row is refused, the file just uploaded is
 * moved to Drive's bin, so a refused photo does not leave a file nothing names.
 */

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const HOLDING_FOLDER = "Unsorted";

async function handlePost(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { t } = await getT();

  // Drive is not RLS-protected, so this runs before any Drive call. The same two logins the database lets file one
  // (can_file_pending_photo), and never a Medical-only login.
  const perms = await loadPermissions();
  const mayFile = can(perms, "photos.shelter_add") || can(perms, "photos.resident_publish");
  if (!mayFile || !photoCategoriesFor(perms).includes("Shelter")) {
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
  const mimeType = await checkFileSignature(file, ALLOWED_MIME_TYPES);
  if (!mimeType) {
    return NextResponse.json(
      { error: t.uploads.notReadable(file.name, formatNames(ALLOWED_MIME_TYPES)) },
      { status: 400 },
    );
  }

  const enclosureId = formData.get("enclosureId");
  if (typeof enclosureId !== "string" || !isUuid(enclosureId)) {
    return NextResponse.json({ error: t.addPhotos.errors.noEnclosure }, { status: 400 });
  }
  const supabase = await createClient();
  const enclosureName = await enclosureNameFor(supabase, enclosureId);
  if (!enclosureName) {
    return NextResponse.json({ error: t.addPhotos.errors.noEnclosure }, { status: 404 });
  }

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  const drive = getDriveClient();
  const holdingId = await findOrCreateFolder(drive, rootId, HOLDING_FOLDER);
  // Slashes cannot appear in a Drive path segment, the same rule as a resident's folder name.
  const enclosureFolderId = await findOrCreateFolder(drive, holdingId, enclosureName.trim().replace(/\//g, "-"));
  const driveFileId = await uploadImageToFolder(drive, enclosureFolderId, {
    name: file.name,
    mimeType,
    content: file,
  });

  const { data: user } = await supabase.auth.getUser();
  const { error: insertError } = await supabase.from("pending_photos").insert({
    enclosure_id: enclosureId,
    drive_file_id: driveFileId,
    file_name: file.name,
    uploaded_by: user.user?.id,
  });
  if (insertError) {
    try {
      await drive.trashFile(driveFileId);
    } catch {
      /* the file is in Unsorted/<enclosure> where only someone browsing Drive would meet it; the answer below still says it was not saved */
    }
    return NextResponse.json({ error: t.addPhotos.errors.notSaved }, { status: 500 });
  }

  return NextResponse.json({ driveFileId, fileName: file.name });
}

// A Drive failure answers in a sentence rather than a bare 500 (drive-errors.ts).
export const POST = withDriveErrors(handlePost);
