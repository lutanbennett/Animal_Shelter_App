import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { loadUnitList } from "@/lib/unit-list-server";
import { usableUnit } from "@/lib/unit-list";
import { MAX_DOSES_PER_DAY, parseScheduleForm, type RxSchedule } from "@/lib/prescriptions/schedule";

/**
 * The prescription write, and the checks around it, moved out of src/app/prescriptions/actions.ts.
 *
 * WHY IT MOVED (docs/decisions/2026-11-01-write-paths-tail-b.md): that file is a "use server" module, so every
 * function it exports is a public Server Action. `recordPrescription` was exported from it for the assistant's
 * prescription card to call, which made it a second, unclaimed way to write a prescription. The assistant now
 * claims its own request id in assistantAddPrescription, and the form claims one in createPrescription, so the
 * shared write has to be a plain server function that neither claim wraps twice. This file is not "use server".
 */

export type PrescriptionResult = { error: string } | { ok: true; id: string; residentId: string };

export function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function revalidateResidentPages(residentId: string) {
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/prescriptions`);
  revalidatePath(`/residents/${residentId}/clinic-visits`);
}

/**
 * A prescription on a clinic visit that has not happened yet (0107). The form
 * only lists visits on or before today, but a second tab or a stale page
 * still reaches the trigger — this turns its refusal into a sentence.
 */
export function writeError(t: Dictionary, error: { code?: string; message: string }): { error: string } {
  if (error.code === "23514" && error.message.includes("prescriptions_visit_not_in_future")) {
    return { error: t.prescriptions.errors.visitInFuture };
  }
  return { error: error.message };
}

/**
 * Writes the ticked rounds for a prescription, replacing what was there. The new
 * set goes in first and only then are the others removed, so a failure part-way
 * leaves a superset rather than a prescription with no round. Each tick is one dose on every
 * scheduled day.
 */
export async function saveRounds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  prescriptionId: string,
  roundIds: string[],
  /** Amount per ticked round (null = not stated). */
  doses: Record<string, number | null>,
): Promise<{ error: string } | undefined> {
  if (roundIds.length > 0) {
    const { error } = await supabase
      .from("prescription_rounds")
      .upsert(
        roundIds.map((round_id) => ({
          prescription_id: prescriptionId,
          round_id,
          dose_quantity: doses[round_id] ?? null,
        })),
        { onConflict: "prescription_id,round_id" },
      );
    if (error) return { error: error.message };
  }
  let del = supabase.from("prescription_rounds").delete().eq("prescription_id", prescriptionId);
  if (roundIds.length > 0) del = del.not("round_id", "in", `(${roundIds.join(",")})`);
  const { error } = await del;
  if (error) return { error: error.message };
}

/** The prescriptions.schedule_* columns for a write. */
export const scheduleColumns = (s: RxSchedule) => ({
  schedule_unit: s.schedule_unit,
  schedule_every: s.schedule_every,
  schedule_weekdays: s.schedule_weekdays,
  schedule_month_days: s.schedule_month_days,
});

export type ParsedPrescription = {
  roundIds: string[];
  /** Amount per ticked round; a blank box takes the prescription's dose. */
  roundDoses: Record<string, number | null>;
  startDate: string;
  endDate: string | null;
  doseQuantity: number | null;
  medicationId: string | null;
  newMedicationName: string | null;
  newMedicationUnit: string | null;
  schedule: RxSchedule;
  clinicVisitId: string | null;
  notes: string | null;
};

/**
 * The field checks shared by create and update: dates, dose, and the
 * pick-or-add-new pair for medication, and the day pattern with its ticks. Returns an error
 * string or the parsed values; the database repeats the date / dose checks
 * (0027) so a stale form can't slip past them.
 */
export async function parsePrescriptionFields(
  formData: FormData,
  t: Dictionary,
): Promise<{ error: string } | { fields: ParsedPrescription }> {
  const startDate = str(formData, "startDate");
  if (!startDate) return { error: t.prescriptions.errors.enterStartDate };
  if (!isoDate(startDate)) return { error: t.prescriptions.errors.invalidStartDate };

  const endDate = str(formData, "endDate");
  if (endDate && !isoDate(endDate)) return { error: t.prescriptions.errors.invalidEndDate };
  if (endDate && endDate < startDate) return { error: t.prescriptions.errors.endBeforeStart };

  const doseRaw = str(formData, "doseQuantity");
  let doseQuantity: number | null = null;
  if (doseRaw) {
    doseQuantity = Number(doseRaw);
    if (!Number.isFinite(doseQuantity) || doseQuantity <= 0) {
      return { error: t.prescriptions.errors.dosePositive };
    }
  }

  // Medication: an existing id, or a new name + unit to create first.
  let medicationId = str(formData, "medicationId");
  const newMedicationName = str(formData, "newMedicationName");
  const newMedicationUnit = str(formData, "newMedicationUnit");
  if (medicationId === "__new__") medicationId = null;
  if (!medicationId && !newMedicationName) {
    return { error: t.prescriptions.errors.selectMedication };
  }
  if (!medicationId && !usableUnit(await loadUnitList(), "medicines", newMedicationUnit)) {
    return { error: t.prescriptions.errors.newMedicationUnit };
  }

  // Which days (0283): every N days, every N weeks on chosen weekdays, every N months on chosen days of the
  // month, or as needed. The times on those days are the ticked rounds below.
  const strings = (key: string) => formData.getAll(key).filter((v): v is string => typeof v === "string");
  const parsedDays = parseScheduleForm({
    unit: str(formData, "scheduleUnit"),
    every: str(formData, "scheduleEvery"),
    weekdays: strings("scheduleWeekday"),
    monthDays: strings("scheduleMonthDay"),
  });
  if ("error" in parsedDays) return { error: t.prescriptions.days.errors[parsedDays.error] };
  const schedule = parsedDays.schedule;

  const roundIds = formData
    .getAll("roundId")
    .filter((v): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v));
  // As needed owes no times; anything else owes one to four (one dose per tick).
  const recurring = schedule.schedule_unit != null;
  if (!recurring && roundIds.length > 0) roundIds.length = 0;
  if (recurring && roundIds.length === 0) return { error: t.prescriptions.days.errors.ticksNone };
  if (roundIds.length > MAX_DOSES_PER_DAY) return { error: t.prescriptions.days.errors.ticksTooMany };
  const roundDoses: Record<string, number | null> = {};
  for (const id of roundIds) {
    const raw = str(formData, `roundDose_${id}`);
    if (!raw) {
      roundDoses[id] = doseQuantity;
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return { error: t.prescriptions.errors.dosePositive };
    roundDoses[id] = n;
  }
  // The dose above stays as typed. The forecast (0284) and the medication list read each ticked round's own
  // amount, falling back to this one where a round has none, so nothing averages the amounts any more.

  return {
    fields: {
      startDate,
      endDate,
      doseQuantity,
      medicationId,
      newMedicationName,
      newMedicationUnit,
      schedule,
      clinicVisitId: str(formData, "clinicVisitId"),
      notes: str(formData, "notes"),
      roundIds,
      roundDoses,
    },
  };
}

/**
 * Creates the medication the form added inline, returning the id to write on the
 * prescription. The reference row is worth keeping even if the prescription write
 * then fails (a typo'd dose shouldn't make the user re-type the medication), so this
 * is deliberately not one transaction with it.
 */
export async function ensureMedication(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fields: ParsedPrescription,
): Promise<{ error: string } | { medicationId: string }> {
  let { medicationId } = fields;

  if (!medicationId) {
    // The id is made here, not read back with .select(): a login holding only
    // the add cell cannot read the table (0151), and RETURNING needs to.
    const newId = crypto.randomUUID();
    const { error } = await supabase
      .from("medication")
      .insert({ id: newId, name: fields.newMedicationName, dose_unit: fields.newMedicationUnit });
    if (error) return { error: error.message };
    medicationId = newId;
  }

  return { medicationId };
}


/**
 * Records a prescription, creating the medication first when the form was
 * used to add a new one inline. Two inserts at most. The deceased lock
 * (0026) and the date / dose checks (0027) are enforced by the database as
 * well as here.
 *
 * The card check stays here, inside the write, so no caller can skip it. It does NOT claim a write request: the
 * caller does (createPrescription for the form, assistantAddPrescription for the assistant).
 */
export async function writePrescription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  t: Dictionary,
  formData: FormData,
): Promise<PrescriptionResult> {
  if (!can(await loadPermissions(), "medical.prescriptions")) return { error: t.common.notAllowed };
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.prescriptions.errors.missingResident };

  const parsed = await parsePrescriptionFields(formData, t);
  if ("error" in parsed) return parsed;
  const { fields } = parsed;

  const refs = await ensureMedication(supabase, fields);
  if ("error" in refs) return refs;

  const prescriptionId = crypto.randomUUID();
  const { error } = await supabase.from("prescriptions").insert({
    id: prescriptionId,
    resident_id: residentId,
    medication_id: refs.medicationId,
    ...scheduleColumns(fields.schedule),
    clinic_visit_id: fields.clinicVisitId,
    dose_quantity: fields.doseQuantity,
    start_date: fields.startDate,
    end_date: fields.endDate,
    notes: fields.notes,
  });
  if (error) return writeError(t, error);
  const roundsResult = await saveRounds(supabase, prescriptionId, fields.roundIds, fields.roundDoses);
  if (roundsResult) return roundsResult;

  revalidateResidentPages(residentId);
  return { ok: true, id: prescriptionId, residentId };
}

/** The assistant's entry: its own client and words, under the assistant's own claim. */
export async function recordPrescription(formData: FormData): Promise<PrescriptionResult> {
  const { t } = await getT();
  return writePrescription(await createClient(), t, formData);
}
