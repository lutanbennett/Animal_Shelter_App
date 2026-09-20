import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";

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

// A date-only input has no time of day. Tie a same-day move to the current
// instant so it sorts after anything recorded earlier today (an intake this
// morning, an earlier move); for back-dated moves use midday so the row
// still lands on that calendar day in any timezone the shelter is likely to
// read it from, and after a midnight-stamped intake on the same date.
function moveStartDate(moveDate: string, now: Date) {
  const today = now.toISOString().slice(0, 10);
  return moveDate >= today ? now.toISOString() : `${moveDate}T12:00:00.000Z`;
}

/**
 * Records a ChangeEnclosure placement for the resident. The
 * placement_history_close_prior trigger ends the previous placement in the
 * same statement (see 0001 / 0024), so this is a single insert.
 *
 * Shared by the hub's move page and the edit form, which both check the
 * same rules: the target must be a physical (non-Lifecycle) enclosure the
 * resident isn't already in, the date can't be in the future or before the
 * current placement started, and deceased residents can't be moved.
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.moveDate)) {
    return { error: errors.enterDate };
  }
  const now = new Date();
  // Allow up to a day ahead of UTC "today" so a date picked in Bangkok
  // shortly after local midnight isn't rejected as being in the future.
  if (
    new Date(`${input.moveDate}T00:00:00Z`).getTime() - now.getTime() >
    24 * 60 * 60 * 1000
  ) {
    return { error: errors.dateInFuture };
  }

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
      .select("is_deceased")
      .eq("resident_id", input.residentId)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
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

  const current = currentResult.data?.[0];
  if (current?.enclosure_id === target.id) return { error: errors.alreadyThere };

  const startDate = moveStartDate(input.moveDate, now);
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
