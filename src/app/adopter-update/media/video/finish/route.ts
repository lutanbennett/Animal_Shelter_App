import { NextResponse } from "next/server";
import { getT } from "@/lib/i18n/get-t";
import { hasRoom, loadOwnUpdate, recordAdopterFile } from "@/lib/adopter/media";
import { getDriveClient } from "@/lib/google/drive";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";
import { createAdminClient } from "@/lib/supabase/admin";

/** Step 3 of an adopter's video: Drive must hold exactly the promised size and type, and the upload row must be this login's. */
async function handlePost(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;
  const { t } = await getT();
  const e = t.adopterUpdate.errors;

  let body: { residentId?: unknown; updateId?: unknown; uploadId?: unknown; driveFileId?: unknown; durationMs?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { residentId, updateId, uploadId, driveFileId, durationMs } = body;
  if (
    typeof residentId !== "string" || typeof updateId !== "string" || typeof uploadId !== "string" ||
    typeof driveFileId !== "string" || !/^[A-Za-z0-9_-]{10,100}$/.test(driveFileId)
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const own = await loadOwnUpdate(residentId, updateId);
  if (!own) return NextResponse.json({ error: e.notYours }, { status: 403 });
  if (!hasRoom(own)) return NextResponse.json({ error: e.noRoom }, { status: 400 });

  const admin = createAdminClient();
  const { data: upload } = await admin
    .from("video_uploads")
    .select("id, resident_id, sub_folder, file_name, mime_type, size_bytes, state, started_by")
    .eq("id", uploadId)
    .maybeSingle();
  if (!upload || upload.resident_id !== residentId || upload.state !== "started" || upload.started_by !== own.userId || upload.sub_folder !== own.subFolder) {
    return NextResponse.json({ error: "Unknown upload." }, { status: 404 });
  }
  const file = await getDriveClient().getFile(driveFileId, "id, size, mimeType");
  if (Number(file.size) !== Number(upload.size_bytes) || file.mimeType !== upload.mime_type) {
    return NextResponse.json({ error: t.photos.videos.errors.incomplete }, { status: 400 });
  }
  const duration = typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs) : null;
  const recorded = await recordAdopterFile(own, { driveFileId, fileName: upload.file_name, kind: "video", durationMs: duration });
  if ("error" in recorded) return NextResponse.json({ error: t.common.somethingWentWrong("adopter-update") }, { status: 500 });
  await admin.from("video_uploads").update({ state: "complete", attachment_id: recorded.id, finished_at: new Date().toISOString() }).eq("id", uploadId);
  return NextResponse.json({ attachmentId: recorded.id });
}

export const POST = withDriveErrors(handlePost);
