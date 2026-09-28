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
import {
  parseSchedule,
  type ScheduleError,
  type ScheduleFields,
} from "@/lib/prescriptions/frequency";

export type FrequencyFormState = ActionResult<{ success: string }> | undefined;

export type FrequencyFields = {
  label: string;
  schedule: ScheduleFields;
};

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function scheduleFromForm(formData: FormData): ScheduleFields {
  return {
    kind: optional(formData.get("kind")),
    dosesPerDay: optional(formData.get("dosesPerDay")),
    intervalCount: optional(formData.get("intervalCount")),
    intervalUnit: optional(formData.get("intervalUnit")),
  };
}

async function scheduleErrorMessage(code: ScheduleError) {
  const { t } = await getT();
  return t.frequency.errors[code];
}

function revalidateFrequencyPages() {
  revalidatePath("/admin/frequencies");
  // The medication forecast counts each prescription's schedule, the
  // prescription form's picker lists these rows, and the hub's
  // frequency(label) embeds read this table too.
  revalidatePath("/management/medications");
  revalidatePath("/prescriptions/new");
  revalidatePath("/residents", "layout");
}

async function countPrescriptions(id: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("prescriptions")
    .select("id", { count: "exact", head: true })
    .eq("frequency_id", id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function createFrequency(
  _state: FrequencyFormState,
  formData: FormData,
): Promise<FrequencyFormState> {
  const { t } = await getT();
  return runAction("frequencies.createFrequency", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const label = optional(formData.get("label"));
    if (!label) return refuse(t.admin.frequencies.errors.labelRequired);
    const parsed = parseSchedule(scheduleFromForm(formData));
    if ("error" in parsed) return refuse(await scheduleErrorMessage(parsed.error));

    const supabase = await createClient();
    const { error } = await supabase
      .from("frequency")
      .insert({ label, ...parsed.schedule });

    if (error) return refuse(error.message);

    revalidateFrequencyPages();
    return { ok: true, success: t.admin.frequencies.createdFrequency(label) };
  });
}

export async function updateFrequency(
  id: string,
  fields: FrequencyFields,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("frequencies.updateFrequency", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const label = optional(fields.label);
    if (!label) return refuse(t.admin.frequencies.errors.labelRequired);
    const parsed = parseSchedule(fields.schedule);
    if ("error" in parsed) return refuse(await scheduleErrorMessage(parsed.error));

    const supabase = await createClient();
    const { error } = await supabase
      .from("frequency")
      .update({ label, ...parsed.schedule })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateFrequencyPages();
    return { ok: true };
  });
}

export async function deleteFrequency(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("frequencies.deleteFrequency", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    // prescriptions.frequency_id has no cascade: a prescription is part of the
    // resident's medical record. Say so instead of surfacing the FK error.
    const count = await countPrescriptions(id);
    if (count > 0) {
      return refuse(t.admin.frequencies.errors.hasPrescriptions(count));
    }

    const supabase = await createClient();
    const { error } = await supabase.from("frequency").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidateFrequencyPages();
    return { ok: true };
  });
}

/**
 * Moves every prescription from `fromId` onto `intoId` and deletes `fromId`,
 * in one transaction (0043). Returns how many prescriptions moved.
 */
export async function mergeFrequency(
  fromId: string,
  intoId: string,
): Promise<ActionResult<{ count: number }>> {
  const { t } = await getT();
  return runAction("frequencies.mergeFrequency", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);
    if (fromId === intoId) {
      return refuse(t.admin.frequencies.errors.mergeSelf);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("merge_frequency", {
      p_from: fromId,
      p_into: intoId,
    });
    if (error) return refuse(error.message);

    revalidateFrequencyPages();
    return { ok: true, count: (data as number | null) ?? 0 };
  });
}
