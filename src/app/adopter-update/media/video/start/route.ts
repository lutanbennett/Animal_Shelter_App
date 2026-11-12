import { NextResponse } from "next/server";
import { getT } from "@/lib/i18n/get-t";
import { VIDEO_MIME_TYPES } from "@/lib/uploads/limits";
import { ADOPTER_MAX_VIDEO_BYTES } from "@/lib/adopter/limits";
import { hasRoom, loadOwnUpdate } from "@/lib/adopter/media";
import { ensureResidentAdoptionUpdateFolder, getDriveClient } from "@/lib/google/drive";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Step 1 of an adopter's video (the staff shape: /api/residents/[id]/videos/start). Gate: loadOwnUpdate. The video goes to
 * Drive in chunks from the phone and never through the app; video_uploads (service role only, 0229) records the promise.
 */
async function handlePost(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;
  const { t } = await getT();
  const e = t.adopterUpdate.errors;
  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.json({ error: "Missing origin." }, { status: 400 });

  let body: { residentId?: unknown; updateId?: unknown; fileName?: unknown; mimeType?: unknown; size?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { residentId, updateId, fileName, mimeType, size } = body;
  if (typeof residentId !== "string" || typeof updateId !== "string") return NextResponse.json({ error: e.notYours }, { status: 400 });

  const own = await loadOwnUpdate(residentId, updateId);
  if (!own) return NextResponse.json({ error: e.notYours }, { status: 403 });
  if (!hasRoom(own)) return NextResponse.json({ error: e.noRoom }, { status: 400 });
  if (typeof fileName !== "string" || !fileName.trim() || typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: t.uploads.errors.noFile }, { status: 400 });
  }
  if (typeof mimeType !== "string" || !VIDEO_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: t.photos.videos.errors.wrongType(fileName) }, { status: 400 });
  }
  if (size > ADOPTER_MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: t.adopterUpdate.media.videoTooLarge(fileName, Math.round(ADOPTER_MAX_VIDEO_BYTES / 1048576)) }, { status: 400 });
  }

  const drive = getDriveClient();
  const admin = createAdminClient();
  const { residentFolderId, uploadFolderId, isNewResidentFolder } = await ensureResidentAdoptionUpdateFolder(drive, own.resident, own.subFolder);
  if (isNewResidentFolder) await admin.from("residents").update({ drive_folder_id: residentFolderId }).eq("id", own.residentId);

  const uploadUrl = await drive.startResumableUpload({ name: fileName, mimeType, parentId: uploadFolderId, size, origin });
  const { data: row, error } = await admin
    .from("video_uploads")
    .insert({ resident_id: own.residentId, sub_folder: own.subFolder, file_name: fileName, mime_type: mimeType, size_bytes: size, started_by: own.userId })
    .select("id")
    .single();
  if (error || !row) return NextResponse.json({ error: t.uploads.errors.couldNotStartUpload }, { status: 500 });
  return NextResponse.json({ uploadId: row.id, uploadUrl });
}

export const POST = withDriveErrors(handlePost);
