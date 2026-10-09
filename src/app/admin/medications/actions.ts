"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { DOSE_UNITS, type DoseUnit } from "@/lib/i18n/enum-labels";
import { loadPermissions } from "@/lib/permissions/load";
import { canEditItemSettings } from "@/lib/permissions/item-settings";

// Settings → Medications: the option-list half (name, dose unit, add, delete,
// merge). The stock half's actions stay in /management/medications/actions.ts
// and can no longer rename or re-unit a medication.

const refuse = (error: string) => ({ ok: false as const, error });

export type MedicationFormState = ActionResult<{ success: string }> | undefined;

export type MedicationDefinition = {
  name: string;
  /** Optional (0166): a drug or brand name usually reads the same in Thai; empty shows the name as typed. */
  nameTh: string;
  doseUnit: string;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function isDoseUnit(value: string | null): value is DoseUnit {
  return value != null && DOSE_UNITS.includes(value as DoseUnit);
}

async function refusal() {
  if (canEditItemSettings(await loadPermissions(), "medication")) return null;
  const { t } = await getT();
  return refuse(t.admin.security.errors.adminAccessRequired);
}

function revalidateMedicationPages() {
  revalidatePath("/admin/medications");
  revalidatePath("/management/medications");
  revalidatePath("/management/purchasing");
  // The prescription form's pickers and the hub's medication(name) embeds
  // read these tables too, and so do the stocktake sheet and the delivery form.
  revalidatePath("/prescriptions/new");
  revalidatePath("/residents", "layout");
  revalidatePath("/stocktake");
  revalidatePath("/deliveries");
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

/** A new medication is not priced: Management → Medication stock sets the cost. */
export async function createMedication(
  _state: MedicationFormState,
  formData: FormData,
): Promise<MedicationFormState> {
  const { t } = await getT();
  return runAction("medications.createMedication", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const name = optional(formData.get("name"));
    if (!name) return refuse(t.management.medications.errors.nameRequired);
    const doseUnit = optional(formData.get("doseUnit"));
    if (!isDoseUnit(doseUnit)) return refuse(t.management.medications.errors.unitInvalid);

    const supabase = await createClient();
    const { error } = await supabase.from("medication").insert({ name, name_th: optional(formData.get("nameTh")), dose_unit: doseUnit });
    if (error) return refuse(error.message);

    revalidateMedicationPages();
    return { ok: true, success: t.management.medications.createdMedication(name) };
  });
}

/**
 * Renaming is safe; changing the unit silently redefines the dose of every
 * prescription written against this medication (the unit lives on the
 * product, 0027), so the table asks for confirmation first when any exist.
 */
export async function updateMedicationDefinition(
  id: string,
  fields: MedicationDefinition,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medications.updateMedicationDefinition", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const name = optional(fields.name);
    if (!name) return refuse(t.management.medications.errors.nameRequired);
    const doseUnit = optional(fields.doseUnit);
    if (!isDoseUnit(doseUnit)) return refuse(t.management.medications.errors.unitInvalid);

    const supabase = await createClient();
    const { error } = await supabase.from("medication").update({ name, name_th: optional(fields.nameTh), dose_unit: doseUnit }).eq("id", id);
    if (error) return refuse(error.message);
    revalidateMedicationPages();
    return { ok: true };
  });
}

export async function deleteMedication(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medications.deleteMedication", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    // prescriptions.medication_id has no cascade: a medication that has ever
    // been prescribed is part of a resident's medical record. Say so instead
    // of surfacing the foreign-key error.
    const count = await countPrescriptions(id);
    if (count > 0) return refuse(t.management.medications.errors.hasPrescriptions(count));

    const supabase = await createClient();
    const { error } = await supabase.from("medication").delete().eq("id", id);
    if (error) return refuse(error.message);
    revalidateMedicationPages();
    return { ok: true };
  });
}

/**
 * Moves every prescription from `fromId` onto `intoId` and deletes `fromId`
 * (0043: one transaction in the database). Both must share a dose_unit — the
 * moved doses keep their numbers, so they must keep their meaning; the
 * function enforces it too. Returns how many prescriptions moved.
 */
export async function mergeMedication(
  fromId: string,
  intoId: string,
): Promise<ActionResult<{ count: number }>> {
  const { t } = await getT();
  return runAction("medications.mergeMedication", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    if (fromId === intoId) return refuse(t.management.medications.errors.mergeSelf);

    const supabase = await createClient();
    const { data: pair, error: pairError } = await supabase
      .from("medication")
      .select("id, dose_unit")
      .in("id", [fromId, intoId])
      .returns<{ id: string; dose_unit: string }[]>();
    if (pairError) return refuse(pairError.message);
    if (!pair || pair.length !== 2) return refuse(t.management.medications.errors.notFound);
    if (pair[0].dose_unit !== pair[1].dose_unit) {
      return refuse(t.management.medications.errors.mergeUnitMismatch);
    }

    const { data, error } = await supabase.rpc("merge_medication", { p_from: fromId, p_into: intoId });
    if (error) return refuse(error.message);

    revalidateMedicationPages();
    return { ok: true, count: (data as number | null) ?? 0 };
  });
}
