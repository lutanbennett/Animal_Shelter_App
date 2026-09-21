import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { archiveDeceasedResident } from "./archive-deceased-resident";

/**
 * After one of the edits a deceased resident's record still allows (bio
 * and photos, 0052), the summary PDF and offline index in Drive are
 * stale, so they are regenerated in place. archiveDeceasedResident() is
 * idempotent — the folder move no-ops and both files are replaced — so
 * this is just that, gated on the resident actually being deceased and
 * already archived. A resident whose first archive never completed keeps
 * the hub's Retry button as the way to produce it.
 *
 * Best effort: the edit itself has already been saved, and a Drive hiccup
 * shouldn't fail it. The stale files are overwritten on the next edit or
 * Retry. Returns the outcome for callers that want to surface it.
 */
export async function refreshDeceasedArchiveIfNeeded(
  supabase: SupabaseClient,
  residentId: string,
): Promise<{ refreshed: boolean; error?: string }> {
  const [{ data: state }, { data: resident }] = await Promise.all([
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", residentId)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
    supabase
      .from("residents")
      .select("deceased_archived_at")
      .eq("id", residentId)
      .limit(1)
      .returns<{ deceased_archived_at: string | null }[]>(),
  ]);
  if (!state?.[0]?.is_deceased || !resident?.[0]?.deceased_archived_at) {
    return { refreshed: false };
  }

  const result = await archiveDeceasedResident(supabase, residentId);
  if ("error" in result) return { refreshed: false, error: result.error };
  return { refreshed: true };
}
