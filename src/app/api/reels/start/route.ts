import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_VIDEO_BYTES, VIDEO_MIME_TYPES } from "@/lib/uploads/limits";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { findOrCreateFolder, getDriveClient } from "@/lib/google/drive";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";

/**
 * Step 1 of a reel upload, the reel twin of /api/residents/[id]/videos/start (docs/decisions/2026-11-06-reels-app.md):
 * the browser says what it is about to send, this route checks it, opens a Drive resumable upload in the Reels
 * folder and hands the session's address back. The video never passes through the app.
 *
 * Asks social.library at Edit, the activity the reels table's write policy asks (0322), BEFORE any Drive call: Drive
 * is not RLS-protected. The service-role client is used only for video_uploads (service role only, 0229), after that
 * check; the row is owner_kind 'reel' with no resident, as 0322 allows.
 */
const REELS_FOLDER = "Reels";

async function handlePost(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { t } = await getT();
  if (!can(await loadPermissions(), "social.library")) {
    return NextResponse.json({ error: t.reels.errors.notAllowed }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.json({ error: "Missing origin." }, { status: 400 });

  let body: { fileName?: unknown; mimeType?: unknown; size?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { fileName, mimeType, size } = body;

  if (typeof fileName !== "string" || !fileName.trim()) {
    return NextResponse.json({ error: t.uploads.errors.noFile }, { status: 400 });
  }
  if (typeof mimeType !== "string" || !VIDEO_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: t.photos.videos.errors.wrongType(fileName) }, { status: 400 });
  }
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: t.uploads.errors.noFile }, { status: 400 });
  }
  if (size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: t.photos.videos.errors.tooBig(fileName) }, { status: 400 });
  }

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) return NextResponse.json({ error: t.reels.errors.driveNotConfigured }, { status: 500 });

  const drive = getDriveClient();
  const folderId = await findOrCreateFolder(drive, rootId, REELS_FOLDER);
  const uploadUrl = await drive.startResumableUpload({ name: fileName, mimeType, parentId: folderId, size, origin });

  const { data: userData } = await (await createClient()).auth.getUser();
  const { data: row, error } = await createAdminClient()
    .from("video_uploads")
    .insert({
      owner_kind: "reel",
      resident_id: null,
      sub_folder: REELS_FOLDER,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: size,
      started_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? t.uploads.errors.couldNotStartUpload }, { status: 500 });
  }

  return NextResponse.json({ uploadId: row.id, uploadUrl });
}

export const POST = withDriveErrors(handlePost);
