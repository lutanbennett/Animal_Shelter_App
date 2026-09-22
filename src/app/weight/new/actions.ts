"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { recordWeight } from "@/lib/weight/record";

export type WeightFormState = { error: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Records one weight reading and redirects to the resident's Weight tab.
 * The rules live in the shared helper, which the assistant uses too.
 */
export async function createWeight(
  _state: WeightFormState,
  formData: FormData,
): Promise<WeightFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.weight.errors.missingResident };

  const weightRaw = str(formData, "weightKg");
  if (!weightRaw) return { error: t.weight.errors.enterWeight };

  const supabase = await createClient();
  const result = await recordWeight(supabase, t, {
    residentId,
    date: str(formData, "date") ?? "",
    weightKg: Number(weightRaw),
    vetAppointmentId: str(formData, "vetAppointmentId"),
    notes: str(formData, "notes"),
  });
  if ("error" in result) return result;

  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/weight`);
  redirect(`/residents/${residentId}/weight`);
}
