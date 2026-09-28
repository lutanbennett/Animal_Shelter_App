"use server";

import { revalidatePath } from "next/cache";
import {
  runAction,
  type ActionRefusal,
  type ActionResult,
} from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { parseBahtAmount } from "@/lib/format";

export type ImmunizationTypeFormState = ActionResult<{ success: string }> | undefined;

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

type IntervalResult = { ok: true; value: number | null } | { ok: false };

function parseIntervalMonths(raw: string | null): IntervalResult {
  if (!raw) return { ok: true, value: null };
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false };
  }
  return { ok: true, value };
}

export async function createImmunizationType(
  _state: ImmunizationTypeFormState,
  formData: FormData,
): Promise<ImmunizationTypeFormState> {
  const { t } = await getT();
  return runAction("immunizationTypes.createImmunizationType", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = (formData.get("name") as string | null)?.trim();
    const isMandatory = formData.get("isMandatory") === "on";
    const intervalRaw = formData.get("intervalMonths") as string | null;

    if (!name) return refuse(t.admin.immunizationTypes.errors.nameRequired);

    const interval = parseIntervalMonths(intervalRaw);
    if (!interval.ok) return refuse(t.admin.immunizationTypes.errors.intervalPositive);

    // Optional: a vaccine can be listed before anyone knows what it costs.
    const cost = parseBahtAmount(formData.get("cost") as string | null);
    if (!cost.ok) return refuse(t.admin.immunizationTypes.errors.costInvalid);

    const supabase = await createClient();
    const { error } = await supabase.from("immunization_types").insert({
      name,
      is_mandatory: isMandatory,
      interval_months: interval.value,
      cost: cost.value,
    });

    if (error) return refuse(error.message);

    revalidatePath("/admin/immunization-types");
    return { ok: true, success: t.admin.immunizationTypes.createdType(name) };
  });
}

export async function updateImmunizationType(
  id: string,
  fields: {
    name: string;
    isMandatory: boolean;
    intervalMonths: number | null;
    /** Baht per dose, or null for "not priced yet" (0071). */
    cost: number | null;
  },
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("immunizationTypes.updateImmunizationType", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);
    if (!fields.name.trim()) {
      return refuse(t.admin.immunizationTypes.errors.nameRequired);
    }
    if (fields.intervalMonths != null && fields.intervalMonths <= 0) {
      return refuse(t.admin.immunizationTypes.errors.intervalPositive);
    }
    // Re-checked here, not only in the table: null clears the price back to
    // "not priced yet", but a bad number must not become one.
    const cost = parseBahtAmount(fields.cost?.toString() ?? null);
    if (!cost.ok) return refuse(t.admin.immunizationTypes.errors.costInvalid);

    const supabase = await createClient();
    const { error } = await supabase
      .from("immunization_types")
      .update({
        name: fields.name.trim(),
        is_mandatory: fields.isMandatory,
        interval_months: fields.intervalMonths,
        cost: cost.value,
      })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidatePath("/admin/immunization-types");
    return { ok: true };
  });
}

export async function deleteImmunizationType(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("immunizationTypes.deleteImmunizationType", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { error } = await supabase
      .from("immunization_types")
      .delete()
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidatePath("/admin/immunization-types");
    return { ok: true };
  });
}
