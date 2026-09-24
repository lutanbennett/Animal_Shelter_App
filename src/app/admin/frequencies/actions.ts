"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  parseSchedule,
  type ScheduleError,
  type ScheduleFields,
} from "@/lib/prescriptions/frequency";

export type FrequencyFormState =
  | { error: string }
  | { success: string }
  | undefined;

export type FrequencyFields = {
  label: string;
  schedule: ScheduleFields;
};

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
  await assertAdminRole();
  const { t } = await getT();

  const label = optional(formData.get("label"));
  if (!label) return { error: t.admin.frequencies.errors.labelRequired };
  const parsed = parseSchedule(scheduleFromForm(formData));
  if ("error" in parsed) return { error: await scheduleErrorMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("frequency")
    .insert({ label, ...parsed.schedule });

  if (error) return { error: error.message };

  revalidateFrequencyPages();
  return { success: t.admin.frequencies.createdFrequency(label) };
}

export async function updateFrequency(id: string, fields: FrequencyFields) {
  await assertAdminRole();
  const { t } = await getT();

  const label = optional(fields.label);
  if (!label) throw new Error(t.admin.frequencies.errors.labelRequired);
  const parsed = parseSchedule(fields.schedule);
  if ("error" in parsed) throw new Error(await scheduleErrorMessage(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("frequency")
    .update({ label, ...parsed.schedule })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateFrequencyPages();
}

export async function deleteFrequency(id: string) {
  await assertAdminRole();
  const { t } = await getT();

  // prescriptions.frequency_id has no cascade: a prescription is part of the
  // resident's medical record. Say so instead of surfacing the FK error.
  const count = await countPrescriptions(id);
  if (count > 0) {
    throw new Error(t.admin.frequencies.errors.hasPrescriptions(count));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("frequency").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateFrequencyPages();
}

/**
 * Moves every prescription from `fromId` onto `intoId` and deletes `fromId`,
 * in one transaction (0043). Returns how many prescriptions moved.
 */
export async function mergeFrequency(fromId: string, intoId: string) {
  await assertAdminRole();
  const { t } = await getT();
  if (fromId === intoId) {
    throw new Error(t.admin.frequencies.errors.mergeSelf);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("merge_frequency", {
    p_from: fromId,
    p_into: intoId,
  });
  if (error) throw new Error(error.message);

  revalidateFrequencyPages();
  return (data as number | null) ?? 0;
}
