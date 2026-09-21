"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  recordResidentDeath,
  undoResidentDeath,
  DECEASED_ROLES,
  UNDO_DECEASED_ROLES,
} from "@/lib/placements/deceased";
import { archiveDeceasedResident } from "@/lib/archive/archive-deceased-resident";
import { restoreDeceasedResident } from "@/lib/archive/restore-deceased-resident";

export type RecordDeathState = { error: string } | undefined;
export type RetryArchiveState = { error: string } | { ok: true } | undefined;
export type UndoDeathState = { error: string } | undefined;
export type RetryRestoreState = { error: string } | { ok: true } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Everything a death — or withdrawing one — touches, across the app. */
function revalidateResident(residentId: string) {
  revalidatePath("/residents");
  revalidatePath(`/residents/${residentId}`, "layout");
  // Occupancy on the enclosure browser and both enclosure hubs changes too.
  revalidatePath("/enclosures", "layout");
  // The resident drops off (or comes back to) the public adoption pages.
  revalidatePath("/adopt", "layout");
  revalidatePath("/");
  // The month's deaths and the trend on the management dashboard.
  revalidatePath("/management/dashboard");
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

/**
 * Withdraws a death recorded in error from the hub's undo page, then puts
 * the resident's Drive folder back.
 *
 * Same two halves, same order and same reasoning as recordDeath(): the
 * DeceasedInError placement commits first and is the source of truth; the
 * Drive restore (folder back under Residents/, generated summary and index
 * deleted) follows, and if it fails the resident is still correctly alive
 * and the hub offers a retry.
 */
export async function undoDeath(
  residentId: string,
  _state: UndoDeathState,
  formData: FormData,
): Promise<UndoDeathState> {
  const { t } = await getT();
  const supabase = await createClient();

  const result = await undoResidentDeath(supabase, t, {
    residentId,
    reason: str(formData, "reason"),
  });
  if ("error" in result) return result;

  await restoreDeceasedResident(supabase, residentId);

  revalidateResident(residentId);
  redirect(`/residents/${residentId}`);
}

/**
 * Re-runs the Drive restore for a living resident whose archive columns
 * are still set — offered on the hub after a withdrawn death whose Drive
 * half failed. Admin-only like the undo itself.
 */
export async function retryDeceasedRestore(
  residentId: string,
  state: RetryRestoreState,
): Promise<RetryRestoreState> {
  void state;
  const { t } = await getT();
  const supabase = await createClient();

  const { data: role } = await supabase.rpc("current_user_role");
  if (typeof role !== "string" || !UNDO_DECEASED_ROLES.has(role)) {
    return { error: t.residents.deceased.undo.notAuthorized };
  }

  const result = await restoreDeceasedResident(supabase, residentId);
  if ("error" in result) return result;

  revalidatePath(`/residents/${residentId}`, "layout");
  return { ok: true };
}
