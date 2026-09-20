"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { DOSE_UNITS, type DoseUnit } from "@/lib/i18n/enum-labels";
import { parseSchedule, type FrequencySchedule } from "@/lib/prescriptions/frequency";

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

/**
 * Records a prescription, creating the medication and/or frequency first when
 * the form was used to add a new one inline. Three inserts at most, and the
 * reference rows are worth keeping even if the prescription insert then
 * fails (a typo'd dose shouldn't make the user re-type the medication), so
 * this is deliberately not one transaction. Redirects to the resident's
 * prescriptions tab on success; the deceased lock (0026) and the date /
 * dose checks (0027) are enforced by the database as well as here.
 */
export async function createPrescription(
  _state: PrescriptionFormState,
  formData: FormData,
): Promise<PrescriptionFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.prescriptions.errors.missingResident };

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

  const supabase = await createClient();

  if (!medicationId) {
    const { data, error } = await supabase
      .from("medication")
      .insert({ name: newMedicationName, dose_unit: newMedicationUnit })
      .select("id")
      .limit(1)
      .returns<{ id: string }[]>();
    if (error) return { error: error.message };
    medicationId = data?.[0]?.id ?? null;
    if (!medicationId) return { error: t.prescriptions.errors.saveFailed };
  }

  if (!frequencyId && newFrequencyLabel) {
    const { data, error } = await supabase
      .from("frequency")
      .insert({ label: newFrequencyLabel, ...newSchedule })
      .select("id")
      .limit(1)
      .returns<{ id: string }[]>();
    if (error) return { error: error.message };
    frequencyId = data?.[0]?.id ?? null;
    if (!frequencyId) return { error: t.prescriptions.errors.saveFailed };
  }

  const { error } = await supabase.from("prescriptions").insert({
    resident_id: residentId,
    medication_id: medicationId,
    frequency_id: frequencyId,
    vet_appointment_id: str(formData, "vetAppointmentId"),
    dose_quantity: doseQuantity,
    start_date: startDate,
    end_date: endDate,
    notes: str(formData, "notes"),
  });
  if (error) return { error: error.message };

  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/prescriptions`);
  revalidatePath(`/residents/${residentId}/vet-appointments`);
  redirect(`/residents/${residentId}/prescriptions`);
}
