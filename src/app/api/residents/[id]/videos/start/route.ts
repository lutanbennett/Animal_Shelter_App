import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_VIDEO_BYTES, VIDEO_MIME_TYPES } from "@/lib/uploads/limits";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { ensureResidentPhotosFolder, getDriveClient } from "@/lib/google/drive";
import { dateToYymm, photoCategoriesFor, type PhotoCategory } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";

/**
 * Step 1 of a video upload (docs/decisions/2026-10-20-videos-uploaded-straight-to-drive.md): the browser says
 * what it is about to send, this route checks it as the photo route checks a photo, opens a Drive resumable
 * upload session in the right folder and hands the session's address back. The video itself never passes
 * through the app, so the 15 MB photo cap and the Worker's and the Pi's request-size limits do not apply.
 * The service-role client is used only for video_uploads (service role only, 0229), after the permission check.
 */
async function handlePost(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { id } = await params;
  const { t } = await getT();

  // Drive is not RLS-protected, so this runs before any Drive call.
  const perms = await loadPermissions();
  if (!can(perms, "photos.resident_add")) {
    return NextResponse.json({ error: t.photos.errors.notAuthorized }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.json({ error: "Missing origin." }, { status: 400 });

  let body: { fileName?: unknown; mimeType?: unknown; size?: unknown; category?: unknown; dateTaken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { fileName, mimeType, size, category, dateTaken } = body;

  if (typeof fileName !== "string" || !fileName.trim()) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (typeof mimeType !== "string" || !VIDEO_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: t.photos.videos.errors.wrongType(fileName) }, { status: 400 });
  }
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: t.photos.videos.errors.tooBig(fileName) }, { status: 400 });
  }

  const categories = photoCategoriesFor(perms);
  const onlyFolder = categories.length === 1 ? categories[0] : null;
  if (onlyFolder && category !== onlyFolder) {
    return NextResponse.json({ error: t.photos.errors.onlyFolder(onlyFolder) }, { status: 403 });
  }
  if (typeof category !== "string" || !categories.includes(category as PhotoCategory)) {
    return NextResponse.json({ error: `Folder must be one of: ${categories.join(", ")}.` }, { status: 400 });
  }
  if (typeof dateTaken !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateTaken)) {
    return NextResponse.json({ error: "Date taken must be a valid date." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: resident, error: residentError } = await supabase
    .from("residents")
    .select("id, name, resident_code, drive_folder_id")
    .eq("id", id)
    .limit(1)
    .returns<{ id: string; name: string; resident_code: string; drive_folder_id: string | null }[]>();
  const residentRow = resident?.[0];
  if (residentError || !residentRow) {
    return NextResponse.json({ error: "Resident not found." }, { status: 404 });
  }

  const drive = getDriveClient();
  const { residentFolderId, uploadFolderId, isNewResidentFolder } = await ensureResidentPhotosFolder(
    drive,
    residentRow,
    category,
    dateToYymm(dateTaken),
  );
  if (isNewResidentFolder) {
    await supabase.from("residents").update({ drive_folder_id: residentFolderId }).eq("id", id);
  }

  const uploadUrl = await drive.startResumableUpload({
    name: fileName,
    mimeType,
    parentId: uploadFolderId,
    size,
    origin,
  });

  const { data: userData } = await supabase.auth.getUser();
  const { data: row, error } = await createAdminClient()
    .from("video_uploads")
    .insert({
      resident_id: id,
      sub_folder: category,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: size,
      started_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "Could not start the upload." }, { status: 500 });
  }

  return NextResponse.json({ uploadId: row.id, uploadUrl });
}

export const POST = withDriveErrors(handlePost);
