import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { assertPhotoWriteAccess } from "@/lib/auth/require-role";
import { getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { driveImageUrl } from "@/lib/google/drive-client";
import { ensureProjectDriveFolder } from "@/lib/projects/drive-sync";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
  "application/pdf",
]);

/**
 * Adds one photo (or a PDF — a poster, a press cutting) to a project
 * folder. The file lands in the folder's own Drive folder, mirroring the
 * tree (Projects/<Category>/<…>/), and is recorded on `attachments` as
 * owner_type 'project' so the photo proxy serves it.
 *
 * Same shape as the maintenance route: role gate before any Drive call,
 * type/size checks, then Drive, then the row. Volunteers may add photos
 * (volunteer_rw_attachments, 0001) even though they can't create folders —
 * that's the intended split.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: folderId } = await params;

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
    return NextResponse.json({ error: "File is larger than 15MB." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: folders, error: folderError } = await supabase
    .from("project_folders")
    .select("id, parent_folder_id")
    .eq("id", folderId)
    .limit(1)
    .returns<{ id: string; parent_folder_id: string | null }[]>();

  const folder = folders?.[0];
  if (folderError || !folder) {
    return NextResponse.json({ error: "Project folder not found." }, { status: 404 });
  }

  const drive = getDriveClient();
  const driveFolderId = await ensureProjectDriveFolder(supabase, drive, folderId);

  const driveFileId = await uploadImageToFolder(drive, driveFolderId, {
    name: file.name,
    mimeType: file.type,
    content: file,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inserted, error: insertError } = await supabase
    .from("attachments")
    .insert({
      owner_type: "project",
      owner_id: folderId,
      drive_file_id: driveFileId,
      file_name: file.name,
      uploaded_by: user?.id ?? null,
    })
    .select("id")
    .limit(1)
    .returns<{ id: string }[]>();

  const row = inserted?.[0];
  if (insertError || !row) {
    // The row is what makes the file reachable (the photo proxy only serves
    // known IDs), so a failed insert means an orphan in Drive — remove it.
    try {
      await drive.deleteFile(driveFileId);
    } catch {
      // Best effort.
    }
    return NextResponse.json(
      { error: insertError?.message ?? "Could not record the file." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    attachmentId: row.id,
    driveFileId,
    fileName: file.name,
    mimeType: file.type,
    fileUrl: driveImageUrl(driveFileId),
  });
}
