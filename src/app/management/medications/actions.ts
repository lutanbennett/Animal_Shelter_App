"use server";

import { revalidatePath } from "next/cache";
import { assertManagementRole } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { DOSE_UNITS, type DoseUnit } from "@/lib/i18n/enum-labels";

export type MedicationFormState =
  | { error: string }
  | { success: string }
  | undefined;

export type MedicationFields = {
  name: string;
  doseUnit: string;
};

export type FrequencyFields = {
  label: string;
  /** Empty string clears it (= "as needed", can't be forecast per day). */
  dosesPerDay: string;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function isDoseUnit(value: string | null): value is DoseUnit {
  return value != null && DOSE_UNITS.includes(value as DoseUnit);
}

/**
 * Doses per day is optional; when given it must be a positive number
 * (0027's check). Returns undefined on a validation failure so the caller
 * can pick the message.
 */
function parseDosesPerDay(raw: string | null): number | null | undefined {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

function revalidateMedicationPages() {
  revalidatePath("/management/medications");
  // The prescription form's pickers and the hub's medication(name) embeds
  // read these tables too.
  revalidatePath("/prescriptions/new");
  revalidatePath("/residents", "layout");
}

async function countPrescriptions(
  column: "medication_id" | "frequency_id",
  id: string,
) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("prescriptions")
    .select("id", { count: "exact", head: true })
    .eq(column, id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

export async function createMedication(
  _state: MedicationFormState,
  formData: FormData,
): Promise<MedicationFormState> {
  await assertManagementRole();
  const { t } = await getT();

  const name = optional(formData.get("name"));
  if (!name) return { error: t.management.medications.errors.nameRequired };
  const doseUnit = optional(formData.get("doseUnit"));
  if (!isDoseUnit(doseUnit)) {
    return { error: t.management.medications.errors.unitInvalid };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("medication")
    .insert({ name, dose_unit: doseUnit });

  if (error) return { error: error.message };

  revalidateMedicationPages();
  return { success: t.management.medications.createdMedication(name) };
}

/**
 * Renaming is safe; changing the unit silently redefines the dose of every
 * prescription written against this medication (the unit lives on the
 * product, 0027), so the table asks for confirmation first when any exist.
 */
export async function updateMedication(id: string, fields: MedicationFields) {
  await assertManagementRole();
  const { t } = await getT();

  const name = optional(fields.name);
  if (!name) throw new Error(t.management.medications.errors.nameRequired);
  const doseUnit = optional(fields.doseUnit);
  if (!isDoseUnit(doseUnit)) {
    throw new Error(t.management.medications.errors.unitInvalid);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("medication")
    .update({ name, dose_unit: doseUnit })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateMedicationPages();
}

export async function deleteMedication(id: string) {
  await assertManagementRole();
  const { t } = await getT();

  // prescriptions.medication_id has no cascade: a medication that has ever
  // been prescribed is part of a resident's medical record. Say so instead
  // of surfacing the foreign-key error.
  const count = await countPrescriptions("medication_id", id);
  if (count > 0) {
    throw new Error(t.management.medications.errors.hasPrescriptions(count));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("medication").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateMedicationPages();
}

// ---------------------------------------------------------------------------
// Frequencies
// ---------------------------------------------------------------------------

export async function createFrequency(
  _state: MedicationFormState,
  formData: FormData,
): Promise<MedicationFormState> {
  await assertManagementRole();
  const { t } = await getT();

  const label = optional(formData.get("label"));
  if (!label) return { error: t.management.medications.errors.labelRequired };
  const dosesPerDay = parseDosesPerDay(optional(formData.get("dosesPerDay")));
  if (dosesPerDay === undefined) {
    return { error: t.management.medications.errors.dosesPerDayPositive };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("frequency")
    .insert({ label, doses_per_day: dosesPerDay });

  if (error) return { error: error.message };

  revalidateMedicationPages();
  return { success: t.management.medications.createdFrequency(label) };
}

export async function updateFrequency(id: string, fields: FrequencyFields) {
  await assertManagementRole();
  const { t } = await getT();

  const label = optional(fields.label);
  if (!label) throw new Error(t.management.medications.errors.labelRequired);
  const dosesPerDay = parseDosesPerDay(optional(fields.dosesPerDay));
  if (dosesPerDay === undefined) {
    throw new Error(t.management.medications.errors.dosesPerDayPositive);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("frequency")
    .update({ label, doses_per_day: dosesPerDay })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateMedicationPages();
}

export async function deleteFrequency(id: string) {
  await assertManagementRole();
  const { t } = await getT();

  const count = await countPrescriptions("frequency_id", id);
  if (count > 0) {
    throw new Error(
      t.management.medications.errors.frequencyHasPrescriptions(count),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("frequency").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateMedicationPages();
}

// ---------------------------------------------------------------------------
// Merging duplicates (0043: one transaction in the database)
// ---------------------------------------------------------------------------

/**
 * Moves every prescription from `fromId` onto `intoId` and deletes `fromId`.
 * Both must share a dose_unit — the moved doses keep their numbers, so they
 * must keep their meaning; the function enforces it too. Returns how many
 * prescriptions moved.
 */
export async function mergeMedication(fromId: string, intoId: string) {
  await assertManagementRole();
  const { t } = await getT();
  if (fromId === intoId) {
    throw new Error(t.management.medications.errors.mergeSelf);
  }

  const supabase = await createClient();
  const { data: pair, error: pairError } = await supabase
    .from("medication")
    .select("id, dose_unit")
    .in("id", [fromId, intoId])
    .returns<{ id: string; dose_unit: string }[]>();
  if (pairError) throw new Error(pairError.message);
  if (!pair || pair.length !== 2) {
    throw new Error(t.management.medications.errors.notFound);
  }
  if (pair[0].dose_unit !== pair[1].dose_unit) {
    throw new Error(t.management.medications.errors.mergeUnitMismatch);
  }

  const { data, error } = await supabase.rpc("merge_medication", {
    p_from: fromId,
    p_into: intoId,
  });
  if (error) throw new Error(error.message);

  revalidateMedicationPages();
  return (data as number | null) ?? 0;
}

export async function mergeFrequency(fromId: string, intoId: string) {
  await assertManagementRole();
  const { t } = await getT();
  if (fromId === intoId) {
    throw new Error(t.management.medications.errors.mergeSelf);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("merge_frequency", {
    p_from: fromId,
    p_into: intoId,
  });
  if (error) throw new Error(error.message);

  revalidateMedicationPages();
  return (data as number | null) ?? 0;
}
