"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type WeightFormState = { error: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Records one weight reading and redirects to the resident's Weight tab.
 * The deceased lock (0026) and the positive-kg check (0028) are enforced by
 * the database as well as here, so a stray deep link still can't get a bad
 * row in.
 */
export async function createWeight(
  _state: WeightFormState,
  formData: FormData,
): Promise<WeightFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.weight.errors.missingResident };

  const date = str(formData, "date");
  if (!date) return { error: t.weight.errors.enterDate };
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: t.weight.errors.invalidDate };
  }
  if (parsedDate.getTime() > Date.now()) {
    return { error: t.weight.errors.dateInFuture };
  }

  const weightRaw = str(formData, "weightKg");
  if (!weightRaw) return { error: t.weight.errors.enterWeight };
  const weightKg = Number(weightRaw);
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return { error: t.weight.errors.weightPositive };
  }

  const vetAppointmentId = str(formData, "vetAppointmentId");
  const notes = str(formData, "notes");

  const supabase = await createClient();
  const { error } = await supabase.from("weight").insert({
    resident_id: residentId,
    vet_appointment_id: vetAppointmentId,
    date,
    weight_kg: weightKg,
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/weight`);
  redirect(`/residents/${residentId}/weight`);
}
