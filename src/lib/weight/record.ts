import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { isFutureDate, isIsoDate } from "@/lib/placements/dates";

export type RecordWeightInput = {
  residentId: string;
  /** YYYY-MM-DD from a date input. */
  date: string;
  /** Kilograms, already a number. */
  weightKg: number;
  /** The visit this reading was taken at, when it was taken at one. */
  vetAppointmentId?: string | null;
  notes?: string | null;
};

export type RecordWeightResult = { error: string } | { ok: true; id: string };

/**
 * Records one weight reading and hands back the row's id.
 *
 * The deceased lock (0026) and the positive-kg check (0028) are enforced
 * by the database as well as here, so a stray deep link still can't get a
 * bad row in; this repeats them to get a sentence a person can act on
 * instead of a constraint name.
 *
 * Shared by /weight/new and the assistant, which needs the same rules
 * under the same session and must not grow a second way to write a
 * weight.
 */
export async function recordWeight(
  supabase: SupabaseClient,
  t: Dictionary,
  input: RecordWeightInput,
): Promise<RecordWeightResult> {
  const errors = t.weight.errors;

  if (!input.residentId) return { error: errors.missingResident };

  // The same date rules the placement actions use. The check this
  // replaced compared a date-only value against the current instant, which
  // reads today as tomorrow for the first seven hours of every day in
  // Thailand — the server runs in UTC and the shelter does not (see the
  // backlog, d98695a). `isFutureDate` carries a day of slack for exactly
  // that, so this now behaves like move and send-to-hospital.
  if (!isIsoDate(input.date)) return { error: errors.enterDate };
  if (Number.isNaN(new Date(`${input.date}T00:00:00Z`).getTime())) {
    return { error: errors.invalidDate };
  }
  if (isFutureDate(input.date, new Date())) return { error: errors.dateInFuture };

  if (input.weightKg === null || input.weightKg === undefined) {
    return { error: errors.enterWeight };
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    return { error: errors.weightPositive };
  }

  const { data, error } = await supabase
    .from("weight")
    .insert({
      resident_id: input.residentId,
      vet_appointment_id: input.vetAppointmentId ?? null,
      date: input.date,
      weight_kg: input.weightKg,
      notes: input.notes ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) return { error: error.message };
  return { ok: true, id: data.id };
}
