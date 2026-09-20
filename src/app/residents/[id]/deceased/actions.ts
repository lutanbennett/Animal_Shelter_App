"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { recordResidentDeath, DECEASED_ROLES } from "@/lib/placements/deceased";
import { archiveDeceasedResident } from "@/lib/archive/archive-deceased-resident";

export type RecordDeathState = { error: string } | undefined;
export type RetryArchiveState = { error: string } | { ok: true } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Everything a death touches, across the app. */
function revalidateResident(residentId: string) {
  revalidatePath("/residents");
  revalidatePath(`/residents/${residentId}`, "layout");
  // Occupancy on the enclosure browser and both enclosure hubs changes too.
  revalidatePath("/enclosures", "layout");
  // The animal drops off the public adoption pages.
  revalidatePath("/adopt", "layout");
  revalidatePath("/");
}

/**
 * Records a death from the hub's record-death page, then archives the
 * resident's Drive folder.
 *
 * The two halves are deliberately not one unit of work: the placement is
 * the source of truth and commits on its own, and the Drive work (folder
 * move, summary PDF, offline index) follows. If Drive fails, the resident
 * is still correctly deceased and the hub shows the archive as incomplete
 * with a retry — far better than refusing to record a death because
 * Google is having a bad morning.
 */
export async function recordDeath(
  residentId: string,
  _state: RecordDeathState,
  formData: FormData,
): Promise<RecordDeathState> {
  const { t } = await getT();
  const supabase = await createClient();

  const result = await recordResidentDeath(supabase, t, {
    residentId,
    date: str(formData, "date") ?? "",
    causeOfDeath: str(formData, "causeOfDeath"),
    notes: str(formData, "notes"),
  });
  if ("error" in result) return result;

  await archiveDeceasedResident(supabase, residentId);

  revalidateResident(residentId);
  redirect(`/residents/${residentId}`);
}

/**
 * Re-runs the Drive archive for a resident already recorded as deceased —
 * offered on the hub whenever the archive is incomplete. Safe to run any
 * number of times: the folder move no-ops once the folder is in the
 * archive, and the two generated files are replaced in place.
 */
export async function retryDeceasedArchive(
  residentId: string,
  state: RetryArchiveState,
): Promise<RetryArchiveState> {
  void state;
  const { t } = await getT();
  const supabase = await createClient();

  const { data: role } = await supabase.rpc("current_user_role");
  if (typeof role !== "string" || !DECEASED_ROLES.has(role)) {
    return { error: t.residents.deceased.notAuthorized };
  }

  const result = await archiveDeceasedResident(supabase, residentId);
  if ("error" in result) return result;

  revalidatePath(`/residents/${residentId}`, "layout");
  return { ok: true };
}
