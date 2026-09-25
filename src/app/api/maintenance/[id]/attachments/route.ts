import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { assertPhotoWriteAccess } from "@/lib/auth/require-role";
import {
  getDriveClient,
  syncMaintenanceJobFolder,
  uploadImageToFolder,
} from "@/lib/google/drive";
import { driveImageUrl } from "@/lib/google/drive-client";
import type { MaintenancePhase } from "@/lib/maintenance/queries";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

type JobRow = {
  id: string;
  job_code: string;
  title: string;
  status: string;
  drive_folder_id: string | null;
  zones: { name: string } | null;
  enclosures: { name: string } | null;
};

/**
 * Attaches one file (a photo of the damage, a quote, a photo of the finished
 * work) to a maintenance job. `?phase=before|after` says which it is — the
 * file itself lands directly in the job's Drive folder either way (the
 * user's chosen layout keeps before and after together), and the phase is
 * recorded on the attachment row for the UI to group by.
 *
 * Same shape as the procedure attachment route: role gate, type/size
 * checks, then Drive, then the row. There's no deceased lock to worry
 * about here, so the attachment is inserted directly under RLS rather
 * than through record_attachment() — staff and volunteers both have write
 * policies on `attachments` (0001), which is the intended split: a
 * volunteer can't log a job but can add a photo to one.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: jobId } = await params;

  try {
    await assertPhotoWriteAccess();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not authorized." },
      { status: 403 },
    );
  }

  const phaseParam = new URL(request.url).searchParams.get("phase");
  const phase: MaintenancePhase = phaseParam === "after" ? "after" : "before";

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
    return NextResponse.json(
      { error: "File is larger than 15MB." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: jobs, error: jobError } = await supabase
    .from("maintenance")
    .select("id, job_code, title, status, drive_folder_id, zones(name), enclosures(name)")
    .eq("id", jobId)
    .limit(1)
    .returns<JobRow[]>();

  const job = jobs?.[0];
  if (jobError || !job) {
    return NextResponse.json({ error: "Maintenance job not found." }, { status: 404 });
  }

  const drive = getDriveClient();
  const { folderId, isNew } = await syncMaintenanceJobFolder(drive, {
    job_code: job.job_code,
    title: job.title,
    status: job.status,
    zone_name: job.zones?.name ?? "—",
    enclosure_name: job.enclosures?.name ?? null,
    drive_folder_id: job.drive_folder_id,
  });

  if (isNew) {
    // Volunteers can't update `maintenance` (RLS), so a volunteer's first
    // upload to a job leaves the cache empty; the next staff write fills
    // it. Harmless: the folder is found by name on the next sync anyway.
    await supabase
      .from("maintenance")
      .update({ drive_folder_id: folderId })
      .eq("id", jobId);
  }

  const driveFileId = await uploadImageToFolder(drive, folderId, {
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
      owner_type: "maintenance",
      owner_id: jobId,
      drive_file_id: driveFileId,
      file_name: file.name,
      phase,
      uploaded_by: user?.id ?? null,
    })
    .select("id")
    .limit(1)
    .returns<{ id: string }[]>();

  const row = inserted?.[0];
  if (insertError || !row) {
    // The row is what makes the file reachable (the photo proxy only serves
    // known IDs), so a failed insert means an orphan in Drive — remove it
    // rather than leave it behind.
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
    phase,
  });
}
