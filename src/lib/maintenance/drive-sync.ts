import type { SupabaseClient } from "@supabase/supabase-js";
import { getDriveClient, syncMaintenanceJobFolder } from "@/lib/google/drive";

type SyncRow = {
  id: string;
  job_code: string;
  title: string;
  status: string;
  drive_folder_id: string | null;
  zones: { name: string } | null;
  enclosures: { name: string } | null;
};

/**
 * After a job's status, title or enclosure changes, put its Drive folder
 * where the new values say it belongs. A job that has never had a file
 * uploaded has no folder (drive_folder_id is null) and nothing is created
 * for it — the first upload does that — so jobs without photos cost no
 * Drive calls at all.
 *
 * Returns an error message rather than throwing: the database is already
 * updated by the time this runs and is the source of truth, and the next
 * upload or status change re-syncs from Drive's actual state
 * (syncMaintenanceJobFolder reads the folder's current parents), so a
 * Drive failure here is worth a warning, not a failed save.
 */
export async function syncJobFolderAfterChange(
  supabase: SupabaseClient,
  jobId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("maintenance")
    .select("id, job_code, title, status, drive_folder_id, zones(name), enclosures(name)")
    .eq("id", jobId)
    .limit(1)
    .returns<SyncRow[]>();
  const job = data?.[0];
  if (!job?.drive_folder_id) return null;

  try {
    await syncMaintenanceJobFolder(getDriveClient(), {
      job_code: job.job_code,
      title: job.title,
      status: job.status,
      zone_name: job.zones?.name ?? "—",
      enclosure_name: job.enclosures?.name ?? null,
      drive_folder_id: job.drive_folder_id,
    });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Could not move the Drive folder.";
  }
}
