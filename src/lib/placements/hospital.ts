import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { isFutureDate, isIsoDate, placementStartDate } from "./dates";

/** Name of the Lifecycle pseudo-enclosure that holds hospitalised residents. */
export const HOSPITAL_ENCLOSURE = "Hospital";

export type SendToHospitalInput = {
  residentId: string;
  /** YYYY-MM-DD from a date input. */
  date: string;
  notes: string | null;
};

export type SendToHospitalResult = { error: string } | { ok: true };

/**
 * Roles whose placement_history insert policy admits SendToHospital.
 * Volunteers may only record ChangeEnclosure and vets can't write
 * placements at all (docs/decisions.md, "Volunteer tier").
 */
export const HOSPITAL_ROLES = new Set(["admin", "staff"]);

/**
 * Records a SendToHospital placement into the Lifecycle/Hospital
 * pseudo-enclosure. The resident's current enclosure is stored as
 * previous_enclosure_id so a later ReturnFromHospital can put them back;
 * the placement_history_close_prior trigger ends the current placement in
 * the same statement (see 0001 / 0024), so this is a single insert.
 *
 * Shared by the hub's send-to-hospital page, which is reached from the
 * Housing card, the housing section and individual vet visit records.
 */
export async function sendResidentToHospital(
  supabase: SupabaseClient,
  t: Dictionary,
  input: SendToHospitalInput,
): Promise<SendToHospitalResult> {
  const errors = t.residents.hospital.errors;

  // RLS would reject the insert for a vet or volunteer with a raw policy
  // error — say why.
  const { data: role } = await supabase.rpc("current_user_role");
  if (typeof role !== "string" || !HOSPITAL_ROLES.has(role)) {
    return { error: t.residents.hospital.notAuthorized };
  }

  if (!isIsoDate(input.date)) return { error: errors.enterDate };
  const now = new Date();
  if (isFutureDate(input.date, now)) return { error: errors.dateInFuture };

  const [hospitalResult, currentResult, stateResult] = await Promise.all([
    supabase
      .from("enclosures")
      .select("id, zone_id, zones!inner(name)")
      .eq("name", HOSPITAL_ENCLOSURE)
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
      .select("current_status, is_deceased")
      .eq("resident_id", input.residentId)
      .limit(1)
      .returns<{ current_status: string | null; is_deceased: boolean }[]>(),
  ]);

  if (hospitalResult.error) return { error: hospitalResult.error.message };
  if (currentResult.error) return { error: currentResult.error.message };
  if (stateResult.error) return { error: stateResult.error.message };

  const hospital = hospitalResult.data?.[0];
  if (!hospital) return { error: errors.hospitalNotFound };

  const state = stateResult.data?.[0];
  if (!state) return { error: errors.residentNotFound };
  if (state.is_deceased) return { error: errors.deceased };
  if (state.current_status === "Hospitalised") {
    return { error: errors.alreadyInHospital };
  }

  const current = currentResult.data?.[0];
  const startDate = placementStartDate(input.date, now);
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
    placement_type: "SendToHospital",
    start_date: startDate,
    zone_id: hospital.zone_id,
    enclosure_id: hospital.id,
    previous_enclosure_id: current?.enclosure_id ?? null,
    notes: input.notes,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  return { ok: true };
}
