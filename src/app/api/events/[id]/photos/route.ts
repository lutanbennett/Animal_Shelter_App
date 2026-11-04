import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { ensureEventFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { driveImageUrl } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";

// Pictures only: the gallery guard (0312) refuses anything else.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Adds one picture to a fundraising event's gallery. The check is events.run, the activity record_attachment() and the
 * table's own policy ask (0314), so the route and the database cannot disagree. The file goes to Drive under
 * Events/<year>/<date title>/, is filed through record_attachment() as owner type 'event' (which leaves it waiting in
 * /photos/approve unless the filer can approve it, 0312), and then joins the gallery. Nothing is public until approved.
 */
async function handlePost(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;

  const { id: eventId } = await params;

  if (!can(await loadPermissions(), "events.run")) {
    const { t } = await getT();
    return NextResponse.json({ error: t.photos.errors.notAuthorized }, { status: 403 });
  }
  if (!UUID.test(eventId)) {
    return NextResponse.json({ error: (await getT()).t.eventsAdmin.errors.notFound }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: (await getT()).t.uploads.errors.noFile }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type || "unknown"}.` }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: (await getT()).t.uploads.errors.tooLarge }, { status: 400 });
  }
  // The browser's type is a guess from the name; the bytes decide (file-signature.ts).
  const mimeType = await checkFileSignature(file, ALLOWED_MIME_TYPES);
  if (!mimeType) {
    const { t } = await getT();
    return NextResponse.json({ error: t.uploads.notReadable(file.name, formatNames(ALLOWED_MIME_TYPES)) }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("fundraising_events")
    .select("id, title, event_date")
    .eq("id", eventId)
    .maybeSingle<{ id: string; title: string; event_date: string }>();
  if (!event) {
    return NextResponse.json({ error: (await getT()).t.eventsAdmin.errors.notFound }, { status: 404 });
  }

  const drive = getDriveClient();
  const driveFolderId = await ensureEventFolder(drive, event);
  const driveFileId = await uploadImageToFolder(drive, driveFolderId, { name: file.name, mimeType, content: file });

  // The row is what makes the file reachable, so any failure after the upload removes the orphan from Drive.
  const orphan = async () => {
    try {
      await drive.deleteFile(driveFileId);
    } catch {
      // Best effort.
    }
  };

  const { data: recorded, error: recordError } = await supabase.rpc("record_attachment", {
    p_owner_type: "event",
    p_owner_id: eventId,
    p_drive_file_id: driveFileId,
    p_file_name: file.name,
  });
  const attachmentId = (recorded as { attachment: { id: string } }[] | null)?.[0]?.attachment.id;
  if (recordError || !attachmentId) {
    await orphan();
    return NextResponse.json({ error: recordError?.message ?? (await getT()).t.uploads.errors.couldNotRecordFile }, { status: 500 });
  }

  const { data: last } = await supabase
    .from("fundraising_event_photos")
    .select("position")
    .eq("event_id", eventId)
    .order("position", { ascending: false })
    .limit(1)
    .returns<{ position: number }[]>();
  const { error: joinError } = await supabase
    .from("fundraising_event_photos")
    .insert({ event_id: eventId, attachment_id: attachmentId, position: (last?.[0]?.position ?? -1) + 1 });
  if (joinError) {
    await supabase.from("attachments").delete().eq("id", attachmentId);
    await orphan();
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  return NextResponse.json({
    attachmentId,
    driveFileId,
    fileName: file.name,
    mimeType,
    fileUrl: driveImageUrl(driveFileId),
  });
}

// A Drive failure answers in a sentence rather than a bare 500 (drive-errors.ts).
export const POST = withDriveErrors(handlePost);
