"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { todayIso } from "@/lib/format";

export type DietFormState = { error: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function revalidateResidentPages(residentId: string) {
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/diet`);
  revalidatePath("/management/diets");
}

type ParsedDiet = {
  dietTypeId: string;
  startDate: string;
  endDate: string | null;
  mealsPerDay: number;
  dailyQuantity: number | null;
  notes: string | null;
};

/**
 * The field checks shared by create and update. The database repeats the
 * date / count checks (0051) so a stale form can't slip past them.
 */
function parseDietFields(formData: FormData, t: Dictionary): { error: string } | { fields: ParsedDiet } {
  const dietTypeId = str(formData, "dietTypeId");
  if (!dietTypeId) return { error: t.diets.errors.selectDietType };

  const startDate = str(formData, "startDate");
  if (!startDate) return { error: t.diets.errors.enterStartDate };
  if (!isoDate(startDate)) return { error: t.diets.errors.invalidStartDate };

  const endDate = str(formData, "endDate");
  if (endDate && !isoDate(endDate)) return { error: t.diets.errors.invalidEndDate };
  if (endDate && endDate < startDate) return { error: t.diets.errors.endBeforeStart };

  const mealsPerDay = Number(str(formData, "mealsPerDay") ?? "");
  if (!Number.isInteger(mealsPerDay) || mealsPerDay <= 0) {
    return { error: t.diets.errors.mealsPositive };
  }

  const quantityRaw = str(formData, "dailyQuantity");
  let dailyQuantity: number | null = null;
  if (quantityRaw) {
    dailyQuantity = Number(quantityRaw);
    if (!Number.isFinite(dailyQuantity) || dailyQuantity <= 0) {
      return { error: t.diets.errors.quantityPositive };
    }
  }

  return {
    fields: {
      dietTypeId,
      startDate,
      endDate,
      mealsPerDay,
      dailyQuantity,
      notes: str(formData, "notes"),
    },
  };
}

/**
 * Records a diet for a resident and returns to the Diet tab. The deceased
 * lock (0026 via 0051) rejects the insert for a closed record, which the
 * page refuses to show anyway.
 */
export async function createDiet(_state: DietFormState, formData: FormData): Promise<DietFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.diets.errors.missingResident };

  const parsed = parseDietFields(formData, t);
  if ("error" in parsed) return parsed;
  const { fields } = parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("resident_diets").insert({
    resident_id: residentId,
    diet_type_id: fields.dietTypeId,
    start_date: fields.startDate,
    end_date: fields.endDate,
    meals_per_day: fields.mealsPerDay,
    daily_quantity: fields.dailyQuantity,
    notes: fields.notes,
  });
  if (error) return { error: error.message };

  revalidateResidentPages(residentId);
  redirect(`/residents/${residentId}/diet`);
}

/**
 * Rewrites an existing diet record from the same form. Every column the
 * form carries is written, so clearing the end date on a past row makes
 * it current again.
 */
export async function updateDiet(_state: DietFormState, formData: FormData): Promise<DietFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.diets.errors.missingResident };
  const dietId = str(formData, "dietId");
  if (!dietId) return { error: t.diets.errors.missingDiet };

  const parsed = parseDietFields(formData, t);
  if ("error" in parsed) return parsed;
  const { fields } = parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resident_diets")
    .update({
      diet_type_id: fields.dietTypeId,
      start_date: fields.startDate,
      end_date: fields.endDate,
      meals_per_day: fields.mealsPerDay,
      daily_quantity: fields.dailyQuantity,
      notes: fields.notes,
    })
    .eq("id", dietId)
    .eq("resident_id", residentId)
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return { error: error.message };
  // RLS filters rather than rejects: a volunteer's update matches no rows.
  if (!data || data.length === 0) return { error: t.diets.errors.saveFailed };

  revalidateResidentPages(residentId);
  redirect(`/residents/${residentId}/diet`);
}

/**
 * The "End today" shortcut on a current row. Only offered on rows that
 * have started — ending a future diet today would fail the end-after-start
 * check; those are edited instead. Called from a button, so the page is
 * refreshed here rather than by a form submission.
 */
export async function endDietToday(
  residentId: string,
  dietId: string,
): Promise<{ error: string } | undefined> {
  const { t } = await getT();
  const today = todayIso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resident_diets")
    .update({ end_date: today })
    .eq("id", dietId)
    .eq("resident_id", residentId)
    .lte("start_date", today)
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: t.diets.errors.saveFailed };

  revalidateResidentPages(residentId);
  refresh();
}
