"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { DOSE_UNITS, type DoseUnit } from "@/lib/i18n/enum-labels";
import { parseSchedule, type FrequencySchedule } from "@/lib/prescriptions/frequency";
import { todayIso } from "@/lib/format";

export type PrescriptionFormState = { error: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function revalidateResidentPages(residentId: string) {
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/prescriptions`);
  revalidatePath(`/residents/${residentId}/vet-appointments`);
}

type ParsedPrescription = {
  startDate: string;
  endDate: string | null;
  doseQuantity: number | null;
  medicationId: string | null;
  newMedicationName: string | null;
  newMedicationUnit: string | null;
  frequencyId: string | null;
  newFrequencyLabel: string | null;
  newSchedule: FrequencySchedule | null;
  vetAppointmentId: string | null;
  notes: string | null;
};

/**
 * The field checks shared by create and update: dates, dose, and the
 * pick-or-add-new pairs for medication and frequency. Returns an error
 * string or the parsed values; the database repeats the date / dose checks
 * (0027) so a stale form can't slip past them.
 */
function parsePrescriptionFields(
  formData: FormData,
  t: Dictionary,
): { error: string } | { fields: ParsedPrescription } {
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
  if (!medicationId && !DOSE_UNITS.includes(newMedicationUnit as DoseUnit)) {
    return { error: t.prescriptions.errors.newMedicationUnit };
  }

  // Frequency: optional; an existing id, or a new label + schedule (0044:
  // times a day, every N days/weeks/months, or as needed).
  let frequencyId = str(formData, "frequencyId");
  const newFrequencyLabel = str(formData, "newFrequencyLabel");
  let newSchedule: FrequencySchedule | null = null;
  if (frequencyId === "__new__") frequencyId = null;
  if (!frequencyId && newFrequencyLabel) {
    const parsed = parseSchedule({
      kind: str(formData, "newFrequencyKind"),
      dosesPerDay: str(formData, "newFrequencyDosesPerDay"),
      intervalCount: str(formData, "newFrequencyIntervalCount"),
      intervalUnit: str(formData, "newFrequencyIntervalUnit"),
    });
    if ("error" in parsed) return { error: t.frequency.errors[parsed.error] };
    newSchedule = parsed.schedule;
  }

  return {
    fields: {
      startDate,
      endDate,
      doseQuantity,
      medicationId,
      newMedicationName,
      newMedicationUnit,
      frequencyId,
      newFrequencyLabel,
      newSchedule,
      vetAppointmentId: str(formData, "vetAppointmentId"),
      notes: str(formData, "notes"),
    },
  };
}

/**
 * Creates the medication and/or frequency the form added inline, returning
 * the ids to write on the prescription. The reference rows are worth
 * keeping even if the prescription write then fails (a typo'd dose
 * shouldn't make the user re-type the medication), so this is
 * deliberately not one transaction with it.
 */
async function ensureReferenceRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fields: ParsedPrescription,
  t: Dictionary,
): Promise<{ error: string } | { medicationId: string; frequencyId: string | null }> {
  let { medicationId, frequencyId } = fields;

  if (!medicationId) {
    const { data, error } = await supabase
      .from("medication")
      .insert({ name: fields.newMedicationName, dose_unit: fields.newMedicationUnit })
      .select("id")
      .limit(1)
      .returns<{ id: string }[]>();
    if (error) return { error: error.message };
    medicationId = data?.[0]?.id ?? null;
    if (!medicationId) return { error: t.prescriptions.errors.saveFailed };
  }

  if (!frequencyId && fields.newFrequencyLabel) {
    const { data, error } = await supabase
      .from("frequency")
      .insert({ label: fields.newFrequencyLabel, ...fields.newSchedule })
      .select("id")
      .limit(1)
      .returns<{ id: string }[]>();
    if (error) return { error: error.message };
    frequencyId = data?.[0]?.id ?? null;
    if (!frequencyId) return { error: t.prescriptions.errors.saveFailed };
  }

  return { medicationId, frequencyId };
}

/**
 * Records a prescription, creating the medication and/or frequency first
 * when the form was used to add a new one inline. Three inserts at most.
 * Redirects to the resident's prescriptions tab on success; the deceased
 * lock (0026) and the date / dose checks (0027) are enforced by the
 * database as well as here.
 */
export async function createPrescription(
  _state: PrescriptionFormState,
  formData: FormData,
): Promise<PrescriptionFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.prescriptions.errors.missingResident };

  const parsed = parsePrescriptionFields(formData, t);
  if ("error" in parsed) return parsed;
  const { fields } = parsed;

  const supabase = await createClient();
  const refs = await ensureReferenceRows(supabase, fields, t);
  if ("error" in refs) return refs;

  const { error } = await supabase.from("prescriptions").insert({
    resident_id: residentId,
    medication_id: refs.medicationId,
    frequency_id: refs.frequencyId,
    vet_appointment_id: fields.vetAppointmentId,
    dose_quantity: fields.doseQuantity,
    start_date: fields.startDate,
    end_date: fields.endDate,
    notes: fields.notes,
  });
  if (error) return { error: error.message };

  revalidateResidentPages(residentId);
  redirect(`/residents/${residentId}/prescriptions`);
}

/**
 * Rewrites an existing prescription from the same form — a wrong dose, a
 * course cut short or extended, a missed linked visit. Every column the
 * form carries is written, so clearing the end date on an expired row
 * makes it current again. The deceased lock (0026) rejects the update for
 * a closed record, which the edit page already refuses to show.
 */
export async function updatePrescription(
  _state: PrescriptionFormState,
  formData: FormData,
): Promise<PrescriptionFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.prescriptions.errors.missingResident };
  const prescriptionId = str(formData, "prescriptionId");
  if (!prescriptionId) return { error: t.prescriptions.errors.missingPrescription };

  const parsed = parsePrescriptionFields(formData, t);
  if ("error" in parsed) return parsed;
  const { fields } = parsed;

  const supabase = await createClient();
  const refs = await ensureReferenceRows(supabase, fields, t);
  if ("error" in refs) return refs;

  const { data, error } = await supabase
    .from("prescriptions")
    .update({
      medication_id: refs.medicationId,
      frequency_id: refs.frequencyId,
      vet_appointment_id: fields.vetAppointmentId,
      dose_quantity: fields.doseQuantity,
      start_date: fields.startDate,
      end_date: fields.endDate,
      notes: fields.notes,
    })
    .eq("id", prescriptionId)
    .eq("resident_id", residentId)
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return { error: error.message };
  // RLS filters rather than rejects: a volunteer's update matches no rows.
  if (!data || data.length === 0) return { error: t.prescriptions.errors.saveFailed };

  revalidateResidentPages(residentId);
  redirect(`/residents/${residentId}/prescriptions`);
}

/**
 * The "End today" shortcut on a current row: sets end_date to today so
 * the course stops counting toward the medication requirement from
 * tomorrow. Called from a button, so the page is refreshed here rather
 * than by a form submission. Only offered on rows that have started —
 * ending a future course today would fail 0027's end-after-start check;
 * those are edited (or the start moved) instead.
 */
export async function endPrescriptionToday(
  residentId: string,
  prescriptionId: string,
): Promise<{ error: string } | undefined> {
  const { t } = await getT();
  const today = todayIso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .update({ end_date: today })
    .eq("id", prescriptionId)
    .eq("resident_id", residentId)
    .lte("start_date", today)
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: t.prescriptions.errors.saveFailed };

  revalidateResidentPages(residentId);
  refresh();
}
