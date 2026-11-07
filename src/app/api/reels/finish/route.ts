import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { getDriveClient } from "@/lib/google/drive";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";
import { parseTagField } from "@/lib/note-tags/text";
import { checkReelFields, splitDescription } from "@/lib/reels/form";

/**
 * Step 3 of a reel upload, the reel twin of /api/residents/[id]/videos/finish: Drive has the whole file and the
 * browser says so. The route does not take the browser's word for it: the upload row must be this login's, still
 * open and a reel's, and Drive itself must hold a file of exactly the promised size and type. Only then is the reels
 * row written, AS THE CALLER (so reels_write_perm, social.reels, is the database's check), with the description's
 * residents in reel_residents and its other hashtags in reels.tags.
 *
 * Asks social.reels at Edit, the activity both policies ask (0322). A failed reels insert trashes the Drive file
 * and leaves the upload row open (the abandoned-upload sweep closes it); a failed resident link is reported, not undone.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function handlePost(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { t } = await getT();
  if (!can(await loadPermissions(), "social.reels")) {
    return NextResponse.json({ error: t.reels.errors.notAllowed }, { status: 403 });
  }

  let body: { uploadId?: unknown; driveFileId?: unknown; dateTaken?: unknown; durationMs?: unknown; description?: unknown; picks?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { uploadId, driveFileId, dateTaken, durationMs } = body;
  const description = typeof body.description === "string" ? body.description : "";
  if (
    typeof uploadId !== "string" ||
    !UUID.test(uploadId) ||
    typeof driveFileId !== "string" ||
    !/^[A-Za-z0-9_-]{10,100}$/.test(driveFileId) ||
    typeof dateTaken !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const problem = checkReelFields({ description, dateTaken });
  if (problem) return NextResponse.json({ error: t.reels.form.errors[problem] }, { status: 400 });

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data: upload } = await admin
    .from("video_uploads")
    .select("id, owner_kind, file_name, mime_type, size_bytes, state, started_by")
    .eq("id", uploadId)
    .maybeSingle();
  if (!upload || upload.owner_kind !== "reel" || upload.state !== "started" || upload.started_by !== (userData.user?.id ?? null)) {
    return NextResponse.json({ error: "Unknown upload." }, { status: 404 });
  }

  const drive = getDriveClient();
  const file = await drive.getFile(driveFileId, "id, size, mimeType");
  if (Number(file.size) !== Number(upload.size_bytes) || file.mimeType !== upload.mime_type) {
    return NextResponse.json({ error: t.photos.videos.errors.incomplete }, { status: 400 });
  }

  const { residentIds, tags } = splitDescription(description, parseTagField(JSON.stringify(body.picks ?? [])));
  const duration = typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs) : null;

  const { data: reel, error } = await supabase
    .from("reels")
    .insert({
      drive_file_id: driveFileId,
      file_name: upload.file_name,
      description: description.trim(),
      tags,
      duration_ms: duration,
      date_taken: dateTaken,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !reel) {
    console.error("Reel insert failed:", error);
    try {
      await drive.trashFile(driveFileId);
    } catch (err) {
      console.error("Reel upload: could not trash the orphaned file", driveFileId, err);
    }
    return NextResponse.json({ error: t.reels.form.errors.saveFailed }, { status: 500 });
  }

  let linkFailed = false;
  if (residentIds.length > 0) {
    const { error: linkError } = await supabase
      .from("reel_residents")
      .insert(residentIds.map((resident_id) => ({ reel_id: reel.id, resident_id })));
    if (linkError) {
      console.error("Reel residents insert failed:", linkError);
      linkFailed = true;
    }
  }

  await admin.from("video_uploads").update({ state: "complete", finished_at: new Date().toISOString() }).eq("id", uploadId);

  return NextResponse.json({ reelId: reel.id, driveFileId, linkFailed });
}

export const POST = withDriveErrors(handlePost);
