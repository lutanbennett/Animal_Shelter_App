"use server";

import { revalidatePath } from "next/cache";
import { assertManagementRole } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { DOSE_UNITS, type DoseUnit } from "@/lib/i18n/enum-labels";
import { parseBahtAmount } from "@/lib/format";
import { parseLeadDays, parseStockCount } from "@/lib/management/stock";

export type MedicationFormState =
  | { error: string }
  | { success: string }
  | undefined;

export type MedicationFields = {
  name: string;
  doseUnit: string;
  /** Baht per dose_unit, or null for "not priced yet" (0071). */
  costPerUnit: number | null;
  /** Supplier lead time in days, as typed; blank = no reorder flag (0083). */
  reorderLeadDays: string;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function isDoseUnit(value: string | null): value is DoseUnit {
  return value != null && DOSE_UNITS.includes(value as DoseUnit);
}

function revalidateMedicationPages() {
  revalidatePath("/management/medications");
  // The prescription form's pickers and the hub's medication(name) embeds
  // read these tables too.
  revalidatePath("/prescriptions/new");
  revalidatePath("/residents", "layout");
}

async function countPrescriptions(id: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("prescriptions")
    .select("id", { count: "exact", head: true })
    .eq("medication_id", id);
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

  // Optional: a medication can be added before anyone knows the price.
  const cost = parseBahtAmount(formData.get("costPerUnit") as string | null);
  if (!cost.ok) return { error: t.management.medications.errors.costInvalid };

  const supabase = await createClient();
  const { error } = await supabase
    .from("medication")
    .insert({ name, dose_unit: doseUnit, cost_per_unit: cost.value });

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
  // Re-checked here, not only in the table: null clears the price back to
  // "not priced yet", but a bad number must not become one.
  const cost = parseBahtAmount(fields.costPerUnit?.toString() ?? null);
  if (!cost.ok) throw new Error(t.management.medications.errors.costInvalid);
  const leadDays = parseLeadDays(fields.reorderLeadDays);
  if (!leadDays.ok) throw new Error(t.management.stock.errors.leadDaysInvalid);

  // stock_on_hand is deliberately not in this write: naming it restamps
  // stock_counted_at (0083), and a rename is not a stocktake.
  const supabase = await createClient();
  const { error } = await supabase
    .from("medication")
    .update({
      name,
      dose_unit: doseUnit,
      cost_per_unit: cost.value,
      reorder_lead_days: leadDays.value,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateMedicationPages();
}

/**
 * Records a stocktake. Always writes stock_on_hand, so the trigger stamps
 * the count as taken now — re-saving the same figure is a count that
 * confirmed it (0083). Blank clears it back to "not counted".
 */
export async function updateMedicationStock(id: string, count: string) {
  await assertManagementRole();
  const { t } = await getT();

  const parsed = parseStockCount(count);
  if (!parsed.ok) throw new Error(t.management.stock.errors.countInvalid);

  const supabase = await createClient();
  const { error } = await supabase
    .from("medication")
    .update({ stock_on_hand: parsed.value })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/management/medications");
}

export async function deleteMedication(id: string) {
  await assertManagementRole();
  const { t } = await getT();

  // prescriptions.medication_id has no cascade: a medication that has ever
  // been prescribed is part of a resident's medical record. Say so instead
  // of surfacing the foreign-key error.
  const count = await countPrescriptions(id);
  if (count > 0) {
    throw new Error(t.management.medications.errors.hasPrescriptions(count));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("medication").delete().eq("id", id);

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
