"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export type ImmunizationTypeFormState =
  | { error: string }
  | { success: string }
  | undefined;

function parseIntervalMonths(t: Dictionary, raw: string | null): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(t.admin.immunizationTypes.errors.intervalPositive);
  }
  return value;
}

export async function createImmunizationType(
  _state: ImmunizationTypeFormState,
  formData: FormData,
): Promise<ImmunizationTypeFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const name = (formData.get("name") as string | null)?.trim();
  const isMandatory = formData.get("isMandatory") === "on";
  const intervalRaw = formData.get("intervalMonths") as string | null;

  if (!name) return { error: t.admin.immunizationTypes.errors.nameRequired };

  let intervalMonths: number | null;
  try {
    intervalMonths = parseIntervalMonths(t, intervalRaw);
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : t.admin.immunizationTypes.errors.invalidInterval,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("immunization_types").insert({
    name,
    is_mandatory: isMandatory,
    interval_months: intervalMonths,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/immunization-types");
  return { success: t.admin.immunizationTypes.createdType(name) };
}

export async function updateImmunizationType(
  id: string,
  fields: { name: string; isMandatory: boolean; intervalMonths: number | null },
) {
  await assertAdminRole();
  const { t } = await getT();
  if (!fields.name.trim()) {
    throw new Error(t.admin.immunizationTypes.errors.nameRequired);
  }
  if (fields.intervalMonths != null && fields.intervalMonths <= 0) {
    throw new Error(t.admin.immunizationTypes.errors.intervalPositive);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("immunization_types")
    .update({
      name: fields.name.trim(),
      is_mandatory: fields.isMandatory,
      interval_months: fields.intervalMonths,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/immunization-types");
}

export async function deleteImmunizationType(id: string) {
  await assertAdminRole();

  const supabase = await createClient();
  const { error } = await supabase
    .from("immunization_types")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/immunization-types");
}
