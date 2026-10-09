"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { recordWeight, updateWeight } from "@/lib/weight/record";

export type WeightFormState = { error: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function done(residentId: string): never {
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/weight`);
  revalidatePath(`/residents/${residentId}/clinic-visits`);
  redirect(`/residents/${residentId}/weight`);
}

/**
 * Records one weight reading and redirects to the resident's Weight tab.
 * The rules live in the shared helper, which the assistant uses too.
 *
 * When the form found a reading already on the chosen day it posts that
 * reading's id as `replaceWeightId`, and saving corrects it instead: one
 * weight per day (0106). Blank notes and visit keep the reading's own, so a
 * doctor weighing an animal on its intake day links the intake reading to the
 * visit without wiping anything.
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
  const replaceWeightId = str(formData, "replaceWeightId");
  const input = {
    residentId,
    date: str(formData, "date") ?? "",
    weightKg: Number(weightRaw),
  };
  const result = replaceWeightId
    ? await updateWeight(supabase, t, replaceWeightId, {
        ...input,
        clinicVisitId: str(formData, "clinicVisitId") ?? undefined,
        notes: str(formData, "notes") ?? undefined,
      })
    : await recordWeight(supabase, t, {
        ...input,
        clinicVisitId: str(formData, "clinicVisitId"),
        notes: str(formData, "notes"),
      });
  if ("error" in result) return result;

  done(residentId);
}

/** Saves /weight/[id]/edit: every field as the form shows it. */
export async function saveWeightEdit(
  _state: WeightFormState,
  formData: FormData,
): Promise<WeightFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.weight.errors.missingResident };

  const weightRaw = str(formData, "weightKg");
  if (!weightRaw) return { error: t.weight.errors.enterWeight };

  const supabase = await createClient();
  const result = await updateWeight(supabase, t, str(formData, "weightId") ?? "", {
    residentId,
    date: str(formData, "date") ?? "",
    weightKg: Number(weightRaw),
    clinicVisitId: str(formData, "clinicVisitId"),
    notes: str(formData, "notes"),
  });
  if ("error" in result) return result;

  done(residentId);
}
