import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DriveApiError,
  getDriveClient,
  moveResidentFolderOutOfDeceasedArchive,
} from "@/lib/google/drive";

/**
 * The Drive half of withdrawing a death recorded in error, run after the
 * DeceasedInError placement has been committed (undoResidentDeath()):
 *
 *   1. move Residents/Deceased/<Name> (<ID>)/ back under Residents/
 *   2. delete the generated summary PDF and offline index — a "deceased
 *      summary" of a living resident is worse than no file, and both are
 *      regenerated from scratch if a death is ever recorded again
 *   3. clear the archive bookkeeping on the resident
 *
 * Mirror image of archiveDeceasedResident(), with the same stance on
 * failure: the database transition is the source of truth and has already
 * happened, so a Drive error leaves the resident correctly alive with the
 * archive columns still set, which is what the hub reads as "their Drive
 * folder is still in the archive" and offers a retry for. Every step is
 * safe to repeat: the folder move no-ops once it's back, and a file that's
 * already gone is treated as deleted.
 */

export type RestoreDeceasedResidentResult = { ok: true } | { error: string };

export async function restoreDeceasedResident(
  supabase: SupabaseClient,
  residentId: string,
): Promise<RestoreDeceasedResidentResult> {
  const [residentResult, stateResult] = await Promise.all([
    supabase
      .from("residents")
      .select(
        "id, name, resident_code, drive_folder_id, deceased_summary_drive_file_id, deceased_index_drive_file_id",
      )
      .eq("id", residentId)
      .limit(1)
      .returns<
        {
          id: string;
          name: string;
          resident_code: string;
          drive_folder_id: string | null;
          deceased_summary_drive_file_id: string | null;
          deceased_index_drive_file_id: string | null;
        }[]
      >(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", residentId)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
  ]);

  if (residentResult.error) return { error: residentResult.error.message };
  const resident = residentResult.data?.[0];
  if (!resident) return { error: "Resident not found." };
  if (stateResult.error) return { error: stateResult.error.message };
  // Never dismantle the archive of a resident who is still recorded as
  // deceased — this only follows a withdrawn death.
  if (stateResult.data?.[0]?.is_deceased) {
    return { error: "This resident is still recorded as deceased." };
  }

  try {
    const drive = getDriveClient();

    await moveResidentFolderOutOfDeceasedArchive(drive, resident);

    for (const fileId of [
      resident.deceased_summary_drive_file_id,
      resident.deceased_index_drive_file_id,
    ]) {
      if (!fileId) continue;
      try {
        await drive.deleteFile(fileId);
      } catch (error) {
        // Already deleted by hand in Drive: the outcome we wanted.
        if (!(error instanceof DriveApiError) || error.status !== 404) throw error;
      }
    }

    // The resident is alive again, so the deceased lock no longer applies
    // and this is an ordinary update.
    const { error } = await supabase
      .from("residents")
      .update({
        deceased_summary_drive_file_id: null,
        deceased_index_drive_file_id: null,
        deceased_archived_at: null,
      })
      .eq("id", residentId);
    if (error) return { error: error.message };

    return { ok: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to restore the resident's Drive folder.",
    };
  }
}
