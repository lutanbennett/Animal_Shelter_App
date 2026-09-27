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
 * A correction to an existing reading. `undefined` leaves a field as it is;
 * `null` clears it. The edit page sends every field; a same-day correction
 * from /weight/new leaves blank notes and visit undefined so it keeps them.
 */
export type UpdateWeightInput = {
  residentId: string;
  date: string;
  weightKg: number;
  vetAppointmentId?: string | null;
  notes?: string | null;
};

/** The date and kg rules both writes share; null when the input passes. */
function checkReading(
  t: Dictionary,
  input: { residentId: string; date: string; weightKg: number },
): { error: string } | null {
  const errors = t.weight.errors;

  if (!input.residentId) return { error: errors.missingResident };

  // The same date rules the placement actions use. `isFutureDate` now
  // compares against today at the shelter (see @/lib/format), so a weight
  // recorded at 01:00 in Chiang Mai is dated today rather than being
  // rejected as tomorrow, and a date that really is tomorrow still is.
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
  return null;
}

/**
 * One weight per resident per day, one per vet visit (0106). The form hides
 * taken visits and offers a correction on a taken day, but a second tab, the
 * assistant or a stale page still reaches the index — this turns its refusal
 * into a sentence.
 */
function writeError(t: Dictionary, error: { code?: string; message: string }): { error: string } {
  if (error.code === "23505" && error.message.includes("weight_one_per_day")) {
    return { error: t.weight.errors.alreadyOnDay };
  }
  if (error.code === "23505" && error.message.includes("weight_one_per_visit")) {
    return { error: t.weight.errors.alreadyOnVisit };
  }
  return { error: error.message };
}

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
 * weight. A second reading on a day or a visit is refused by 0106's
 * indexes; correcting one is `updateWeight`.
 */
export async function recordWeight(
  supabase: SupabaseClient,
  t: Dictionary,
  input: RecordWeightInput,
): Promise<RecordWeightResult> {
  const invalid = checkReading(t, input);
  if (invalid) return invalid;

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

  if (error) return writeError(t, error);
  return { ok: true, id: data.id };
}

/**
 * Corrects reading `id` in place — the one way to change a weight, so a
 * mistyped reading never becomes a second row for the day. Scoped to the
 * resident as well as the id, so a posted form can't move another
 * resident's reading; no row matched means it went away in the meantime.
 */
export async function updateWeight(
  supabase: SupabaseClient,
  t: Dictionary,
  id: string,
  input: UpdateWeightInput,
): Promise<RecordWeightResult> {
  if (!id) return { error: t.weight.errors.readingGone };
  const invalid = checkReading(t, input);
  if (invalid) return invalid;

  const changes: Record<string, unknown> = {
    date: input.date,
    weight_kg: input.weightKg,
  };
  if (input.vetAppointmentId !== undefined) changes.vet_appointment_id = input.vetAppointmentId;
  if (input.notes !== undefined) changes.notes = input.notes;

  const { data, error } = await supabase
    .from("weight")
    .update(changes)
    .eq("id", id)
    .eq("resident_id", input.residentId)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) return writeError(t, error);
  if (!data?.length) return { error: t.weight.errors.readingGone };
  return { ok: true, id };
}
