import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { isFutureDate, isIsoDate, placementStartDate } from "./dates";

export type MoveResidentInput = {
  residentId: string;
  enclosureId: string;
  /** YYYY-MM-DD from a date input. */
  moveDate: string;
  notes: string | null;
};

export type MoveResidentResult = { error: string } | { ok: true };

/** Roles whose placement_history insert policy admits ChangeEnclosure. */
const MOVE_ROLES = new Set(["admin", "staff", "volunteer"]);

/**
 * Records a ChangeEnclosure placement for the resident. The
 * placement_history_close_prior trigger ends the previous placement in the
 * same statement (see 0001 / 0024), so this is a single insert.
 *
 * Shared by the hub's move page and the edit form, which both check the
 * same rules: the target must be a physical (non-Lifecycle) enclosure the
 * resident isn't already in, the date can't be in the future or before the
 * current placement started, and deceased, hospitalised, fostered or
 * adopted residents can't be moved (the way back from hospital is a
 * ReturnFromHospital placement; from a carer it's ReturnToShelter).
 */
export async function moveResidentToEnclosure(
  supabase: SupabaseClient,
  t: Dictionary,
  input: MoveResidentInput,
): Promise<MoveResidentResult> {
  const errors = t.residents.move.errors;

  // RLS would reject the insert for a vet with a raw policy error — say why.
  const { data: role } = await supabase.rpc("current_user_role");
  if (typeof role !== "string" || !MOVE_ROLES.has(role)) {
    return { error: t.residents.move.notAuthorized };
  }

  if (!input.enclosureId) return { error: errors.selectEnclosure };
  if (!isIsoDate(input.moveDate)) return { error: errors.enterDate };
  const now = new Date();
  if (isFutureDate(input.moveDate, now)) return { error: errors.dateInFuture };

  const [targetResult, currentResult, stateResult] = await Promise.all([
    supabase
      .from("enclosures")
      .select("id, zone_id, zones!inner(name)")
      .eq("id", input.enclosureId)
      .limit(1)
      .returns<{ id: string; zone_id: string; zones: { name: string } }[]>(),
    supabase
      .from("placement_history")
      .select("enclosure_id, start_date")
      .eq("resident_id", input.residentId)
      .is("end_date", null)
      .limit(1)
      .returns<{ enclosure_id: string | null; start_date: string }[]>(),
    supabase
      .from("resident_current_state")
      .select("current_status, is_deceased")
      .eq("resident_id", input.residentId)
      .limit(1)
      .returns<{ current_status: string | null; is_deceased: boolean }[]>(),
  ]);

  if (targetResult.error) return { error: targetResult.error.message };
  if (currentResult.error) return { error: currentResult.error.message };
  if (stateResult.error) return { error: stateResult.error.message };

  const target = targetResult.data?.[0];
  if (!target) return { error: errors.enclosureNotFound };
  if (target.zones.name === SYSTEM_ZONE) return { error: errors.systemEnclosure };

  const state = stateResult.data?.[0];
  if (!state) return { error: errors.residentNotFound };
  if (state.is_deceased) return { error: errors.deceased };
  if (state.current_status === "Hospitalised") return { error: errors.inHospital };
  if (state.current_status === "Fostered" || state.current_status === "Adopted") {
    return { error: errors.withCarer };
  }

  const current = currentResult.data?.[0];
  if (current?.enclosure_id === target.id) return { error: errors.alreadyThere };

  const startDate = placementStartDate(input.moveDate, now);
  // end_after_start on the prior row would reject this anyway, but with a
  // constraint name rather than something a person can act on.
  if (current && new Date(startDate) <= new Date(current.start_date)) {
    return { error: errors.dateBeforeCurrent };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("placement_history").insert({
    resident_id: input.residentId,
    placement_type: "ChangeEnclosure",
    start_date: startDate,
    zone_id: target.zone_id,
    enclosure_id: target.id,
    previous_enclosure_id: current?.enclosure_id ?? null,
    notes: input.notes,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  return { ok: true };
}
