import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { getDriveClient } from "@/lib/google/drive";
import { dateToYyyymmdd, photoCategoriesFor, type PhotoCategory } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";

/**
 * Step 3 of a video upload: Drive has the whole file and the browser says so. The route does not take the
 * browser's word for it: the upload row must be this login's, still open and for this resident, and Drive itself
 * must hold a file of exactly the promised size and type. Only then is the attachment recorded (the same
 * record_attachment as a photo, so the approval trigger and the Medical guards apply) and marked a video.
 */
async function handlePost(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { id } = await params;
  const { t } = await getT();

  const perms = await loadPermissions();
  if (!can(perms, "photos.resident_add")) {
    return NextResponse.json({ error: t.photos.errors.notAuthorized }, { status: 403 });
  }

  let body: { uploadId?: unknown; driveFileId?: unknown; dateTaken?: unknown; durationMs?: unknown; adoptionUpdateId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { uploadId, driveFileId, dateTaken, durationMs, adoptionUpdateId } = body;
  if (
    typeof uploadId !== "string" ||
    typeof driveFileId !== "string" ||
    !/^[A-Za-z0-9_-]{10,100}$/.test(driveFileId) ||
    typeof dateTaken !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateTaken) ||
    (adoptionUpdateId !== undefined && (typeof adoptionUpdateId !== "string" || !adoptionUpdateId))
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data: upload } = await admin
    .from("video_uploads")
    .select("id, resident_id, sub_folder, file_name, mime_type, size_bytes, state, started_by")
    .eq("id", uploadId)
    .maybeSingle();
  if (
    !upload ||
    upload.resident_id !== id ||
    upload.state !== "started" ||
    upload.started_by !== (userData.user?.id ?? null)
  ) {
    return NextResponse.json({ error: "Unknown upload." }, { status: 404 });
  }

  // An adopter's video: the update must be this resident's and the folder start filed it in must be that
  // update's dated one. Anything else is filed by category, as before.
  let updateId: string | null = null;
  if (typeof adoptionUpdateId === "string") {
    const { data: updateRows } = await supabase
      .from("adoption_updates")
      .select("id, received_on")
      .eq("id", adoptionUpdateId)
      .eq("resident_id", id)
      .limit(1)
      .returns<{ id: string; received_on: string }[]>();
    const row = updateRows?.[0];
    if (!row || photoCategoriesFor(perms).length < 2 || upload.sub_folder !== dateToYyyymmdd(row.received_on)) {
      return NextResponse.json({ error: "Unknown upload." }, { status: 404 });
    }
    updateId = row.id;
  } else if (!photoCategoriesFor(perms).includes(upload.sub_folder as PhotoCategory)) {
    return NextResponse.json({ error: "Unknown upload." }, { status: 404 });
  }

  const drive = getDriveClient();
  const file = await drive.getFile(driveFileId, "id, size, mimeType");
  if (Number(file.size) !== Number(upload.size_bytes) || file.mimeType !== upload.mime_type) {
    return NextResponse.json({ error: t.photos.videos.errors.incomplete }, { status: 400 });
  }

  const { data: recordResult, error: recordError } = await supabase.rpc("record_attachment", {
    p_owner_type: "resident",
    p_owner_id: id,
    p_drive_file_id: driveFileId,
    p_file_name: upload.file_name,
    p_sub_folder: upload.sub_folder,
    p_date_taken: dateTaken,
    p_adoption_update_id: updateId,
  });
  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 500 });
  const attachmentId = (recordResult as { attachment: { id: string } }[])[0].attachment.id;

  const duration =
    typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs) : null;
  const { error: kindError } = await admin
    .from("attachments")
    .update({ media_kind: "video", duration_ms: duration })
    .eq("id", attachmentId);
  if (kindError) return NextResponse.json({ error: kindError.message }, { status: 500 });

  await admin
    .from("video_uploads")
    .update({ state: "complete", attachment_id: attachmentId, finished_at: new Date().toISOString() })
    .eq("id", uploadId);

  return NextResponse.json({ attachmentId, driveFileId });
}

export const POST = withDriveErrors(handlePost);
