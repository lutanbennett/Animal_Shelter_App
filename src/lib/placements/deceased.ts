import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { isFutureDate, isIsoDate, placementStartAfter, placementStartDate } from "./dates";

/** Name of the Lifecycle pseudo-enclosure that holds deceased residents. */
export const DECEASED_ENCLOSURE = "Deceased";

export type RecordDeathInput = {
  residentId: string;
  /** YYYY-MM-DD from a date input. */
  date: string;
  causeOfDeath: string | null;
  notes: string | null;
};

export type RecordDeathResult = { error: string } | { ok: true };

/**
 * Records a Deceased placement into the Lifecycle/Deceased pseudo-enclosure.
 *
 * Everything that follows in the database is a consequence of this one
 * insert, handled by triggers in the same transaction (0002 / 0026): future
 * vet appointments are cancelled, active prescriptions are ended,
 * ready_for_adoption is cleared, and from then on every write to this
 * resident's record is rejected. The Drive side of the workflow (moving the
 * folder to Residents/Deceased/ and generating the summary PDF and offline
 * index) runs after this commits — see archiveDeceasedResident().
 */
export async function recordResidentDeath(
  supabase: SupabaseClient,
  t: Dictionary,
  input: RecordDeathInput,
): Promise<RecordDeathResult> {
  const errors = t.residents.deceased.errors;

  // RLS would reject the insert for a vet or volunteer with a raw policy
  // error — say why.
  if (!can(await loadPermissions(), "placement.death")) {
    return { error: t.residents.deceased.notAuthorized };
  }

  if (!isIsoDate(input.date)) return { error: errors.enterDate };
  const now = new Date();
  if (isFutureDate(input.date, now)) return { error: errors.dateInFuture };

  const [deceasedResult, currentResult, stateResult] = await Promise.all([
    supabase
      .from("enclosures")
      .select("id, zone_id, zones!inner(name)")
      .eq("name", DECEASED_ENCLOSURE)
      .eq("zones.name", SYSTEM_ZONE)
      .limit(1)
      .returns<{ id: string; zone_id: string }[]>(),
    supabase
      .from("placement_history")
      .select("enclosure_id, start_date")
      .eq("resident_id", input.residentId)
      .is("end_date", null)
      .limit(1)
      .returns<{ enclosure_id: string | null; start_date: string }[]>(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", input.residentId)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
  ]);

  if (deceasedResult.error) return { error: deceasedResult.error.message };
  if (currentResult.error) return { error: currentResult.error.message };
  if (stateResult.error) return { error: stateResult.error.message };

  const deceased = deceasedResult.data?.[0];
  if (!deceased) return { error: errors.enclosureNotFound };

  const state = stateResult.data?.[0];
  if (!state) return { error: errors.residentNotFound };
  if (state.is_deceased) return { error: errors.alreadyDeceased };

  const current = currentResult.data?.[0];
  // A date before the current placement began is refused with words rather
  // than the end_after_start constraint's name; the same day is allowed.
  const startDate = current
    ? placementStartAfter(input.date, now, current.start_date)
    : placementStartDate(input.date, now);
  if (!startDate) return { error: errors.dateBeforeCurrent };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("placement_history").insert({
    resident_id: input.residentId,
    placement_type: "Deceased",
    start_date: startDate,
    zone_id: deceased.zone_id,
    enclosure_id: deceased.id,
    // Where they were when they died, so the housing history reads
    // "Kennel 3 → Deceased" like every other transition does.
    previous_enclosure_id: current?.enclosure_id ?? null,
    notes: input.notes,
    cause_of_death: input.causeOfDeath,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  return { ok: true };
}

export type UndoDeathInput = {
  residentId: string;
  /** Why the death was recorded in error — kept as the reversal's notes. */
  reason: string | null;
};

export type UndoDeathResult = { error: string } | { ok: true };

/**
 * Withdraws the open Deceased placement by appending a DeceasedInError
 * placement back into whatever the death closed (their enclosure, or
 * their carer), via undo_deceased_placement() in 0049. The database side
 * puts back exactly what the death's cascade did — the appointments it
 * cancelled, the prescriptions it ended (with the end dates they had),
 * ready_for_adoption — and the lock lifts because the resident is no
 * longer in the Deceased pseudo-enclosure. The Drive side (folder back
 * under Residents/, generated files removed) runs after this commits: see
 * restoreDeceasedResident().
 */
export async function undoResidentDeath(
  supabase: SupabaseClient,
  t: Dictionary,
  input: UndoDeathInput,
): Promise<UndoDeathResult> {
  const u = t.residents.deceased.undo;

  // The function checks the role again; this just turns a policy error
  // into a sentence.
  if (!can(await loadPermissions(), "placement.death_withdraw")) {
    return { error: u.notAuthorized };
  }

  const reason = input.reason?.trim() ?? "";
  if (reason.length === 0) return { error: u.errors.enterReason };

  const { error } = await supabase.rpc("undo_deceased_placement", {
    p_resident_id: input.residentId,
    p_reason: reason,
  });
  if (error) return { error: error.message };

  return { ok: true };
}
