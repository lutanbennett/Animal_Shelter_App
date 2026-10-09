import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { findOrCreateFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { driveImageUrl } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

/** Under GOOGLE_DRIVE_ROOT_FOLDER_ID: Outreach visits/<yyyy-mm>/. */
const OUTREACH_FOLDER = "Outreach visits";

/**
 * Adds one photo to an outreach visit (0169). Same shape as the project
 * photo route: permission before any Drive call, type and size checks, then
 * Drive, then the row. The row is recorded with is_public false (the
 * column's default): a photo is never public unless someone ticks it.
 */
async function handlePost(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { id: outingId } = await params;

  if (!can(await loadPermissions(), "community.outings")) {
    const { t } = await getT();
    return NextResponse.json({ error: t.outreach.errors.notAuthorized }, { status: 403 });
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
    const { t } = await getT();
    return NextResponse.json(
      { error: t.uploads.notReadable(file.name, formatNames(ALLOWED_MIME_TYPES)) },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: outings } = await supabase
    .from("community_dog_outings")
    .select("id, outing_on")
    .eq("id", outingId)
    .limit(1)
    .returns<{ id: string; outing_on: string }[]>();
  const outing = outings?.[0];
  if (!outing) return NextResponse.json({ error: "Visit not found." }, { status: 404 });

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  const drive = getDriveClient();
  const outreachId = await findOrCreateFolder(drive, rootId, OUTREACH_FOLDER);
  const monthId = await findOrCreateFolder(drive, outreachId, outing.outing_on.slice(0, 7));
  const driveFileId = await uploadImageToFolder(drive, monthId, {
    name: `${outing.outing_on} ${file.name}`,
    mimeType,
    content: file,
  });

  const { data: inserted, error } = await supabase
    .from("community_outing_photos")
    .insert({ outing_id: outingId, drive_file_id: driveFileId, file_name: file.name })
    .select("id")
    .limit(1)
    .returns<{ id: string }[]>();
  const row = inserted?.[0];
  if (error || !row) {
    // The row is what makes the file reachable; without it the file is an orphan.
    try {
      await drive.deleteFile(driveFileId);
    } catch {
      // Best effort.
    }
    return NextResponse.json({ error: error?.message ?? "Could not record the photo." }, { status: 500 });
  }

  return NextResponse.json({ photoId: row.id, driveFileId, fileName: file.name, mimeType, fileUrl: driveImageUrl(driveFileId) });
}

export const POST = withDriveErrors(handlePost);
