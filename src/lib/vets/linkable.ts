import type { SupabaseClient } from "@supabase/supabase-js";
import { todayIso } from "@/lib/format";

/** A vet visit as the "linked vet visit" pickers list it. */
export type LinkableVisit = {
  id: string;
  appointment_date: string;
  reason: string | null;
};

export type LinkableVisitOptions = {
  /**
   * Hide visits a row of this table already links to through
   * `vet_appointment_id` — the one-per-visit rule. Weight passes "weight"
   * (0106's `weight_one_per_visit` is what actually holds it).
   */
  onePerVisit?: string;
  /** Hide visits dated after today at the shelter. */
  notInFuture?: boolean;
  /**
   * A visit to list even if a rule above would hide it: the one the record
   * being edited is already linked to, so an edit form can show its own link.
   */
  keep?: string | null;
};

/**
 * The vet visits a record for `residentId` may be linked to, newest first.
 *
 * The form's half of a rule — the pleasant half, which saves a person
 * picking a visit only to be refused. It is not the guarantee: a second tab
 * or an import never sees this list, so a rule that matters also needs the
 * database (for weight, 0106's unique indexes; for prescriptions'
 * `notInFuture`, 0107's triggers).
 */
export async function loadLinkableVisits(
  supabase: SupabaseClient,
  residentId: string,
  options: LinkableVisitOptions = {},
): Promise<{ visits: LinkableVisit[]; error: string | null }> {
  const [visitsResult, takenResult] = await Promise.all([
    supabase
      .from("vet_appointments")
      .select("id, appointment_date, reason")
      .is("archived_at", null)
      .eq("resident_id", residentId)
      .order("appointment_date", { ascending: false })
      .returns<LinkableVisit[]>(),
    options.onePerVisit
      ? supabase
          .from(options.onePerVisit)
          .select("vet_appointment_id")
          .is("archived_at", null)
          .eq("resident_id", residentId)
          .not("vet_appointment_id", "is", null)
          .returns<{ vet_appointment_id: string }[]>()
      : Promise.resolve({ data: [], error: null }),
  ]);

  const error = visitsResult.error?.message ?? takenResult.error?.message ?? null;
  const taken = new Set((takenResult.data ?? []).map((row) => row.vet_appointment_id));
  const today = todayIso();

  const visits = (visitsResult.data ?? []).filter((visit) => {
    if (options.keep && visit.id === options.keep) return true;
    if (taken.has(visit.id)) return false;
    if (options.notInFuture && visitDate(visit) > today) return false;
    return true;
  });
  return { visits, error };
}

/**
 * The visit's date, YYYY-MM-DD, on the shelter's calendar — the date the
 * linked-visit forms default a record's date to, and the day `notInFuture`
 * tests, so a record defaulted from a visit and the visit's own test agree.
 *
 * The shelter's day, not the leading date of the stored UTC timestamp (as
 * this read until 0107): a visit at 06:00 Bangkok on the 29th is 23:00Z on
 * the 28th, and 0107's trigger — shelter_date(), like every date rule in SQL
 * since 0073 — calls it the 29th. The UTC date would list it on the 28th for
 * a database that then refuses it.
 */
export function visitDate(visit: { appointment_date: string }): string {
  return todayIso(new Date(visit.appointment_date));
}
