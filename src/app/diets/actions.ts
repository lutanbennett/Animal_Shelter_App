"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { databaseFailure, runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { todayIso } from "@/lib/format";
import { implausibleDiet } from "@/lib/diets/plausible";

// PI FAILOVER (D), 2026-11-01: every write here goes through runWriteAction() (docs/decisions/2026-11-01-write-paths-tail-a.md).
// The redirects are taken AFTER the wrapper returns, because it rethrows one and would leave the claim open.
/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

export type DietFormState = { ok: false; error: string; confirm?: true } | undefined;

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
  dietId: string;
  startDate: string;
  endDate: string | null;
  mealsPerDay: number;
  portionFactor: number | null;
  notes: string | null;
};

/**
 * The field checks shared by create and update. The database repeats the
 * date / count checks (0051) so a stale form can't slip past them.
 */
function parseDietFields(formData: FormData, t: Dictionary): { error: string } | { fields: ParsedDiet } {
  const dietId = str(formData, "dietPick");
  if (!dietId) return { error: t.diets.errors.selectDietType };

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

  const quantityRaw = str(formData, "portionFactor");
  let portionFactor: number | null = null;
  if (quantityRaw) {
    portionFactor = Number(quantityRaw);
    if (!Number.isFinite(portionFactor) || portionFactor <= 0) {
      return { error: t.diets.errors.quantityPositive };
    }
  }

  return {
    fields: {
      dietId,
      startDate,
      endDate,
      mealsPerDay,
      portionFactor,
      notes: str(formData, "notes"),
    },
  };
}

/**
 * A diet that looks like a typo is held until the user ticks "this is right".
 * It feeds the food forecast, purchasing and cashflow, so a slipped finger
 * must not pass silently; a warning rather than a hard limit, so a genuinely
 * big eater can still be saved.
 */
function bigDietWarning(formData: FormData, fields: ParsedDiet, t: Dictionary): DietFormState {
  if (formData.get("confirmBig") === "on") return undefined;
  const why = implausibleDiet({ mealsPerDay: fields.mealsPerDay, portionFactor: fields.portionFactor });
  return why ? { ok: false, error: t.diets.errors.bigDiet, confirm: true } : undefined;
}

/**
 * Records a diet for a resident and returns to the Diet tab. The deceased
 * lock (0026 via 0051) rejects the insert for a closed record, which the
 * page refuses to show anyway.
 */
export async function createDiet(_state: DietFormState, formData: FormData): Promise<DietFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  const result = await runWriteAction<{ redirectTo: string }>(
    "diets.create",
    write(t),
    { id: writeRequestIdFrom(formData), action: "diets.create", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.diet")) return { ok: false, error: t.common.notAllowed };
      const residentId = str(formData, "residentId");
      if (!residentId) return { ok: false, error: t.diets.errors.missingResident };

      const parsed = parseDietFields(formData, t);
      if ("error" in parsed) return { ok: false, error: parsed.error };
      const { fields } = parsed;

      const big = bigDietWarning(formData, fields, t);
      if (big) return big;
      const { error } = await supabase.from("resident_diets").insert({
        resident_id: residentId,
        diet_id: fields.dietId,
        start_date: fields.startDate,
        end_date: fields.endDate,
        meals_per_day: fields.mealsPerDay,
        portion_factor: fields.portionFactor,
        notes: fields.notes,
      });
      if (error) return databaseFailure("diets.write", error, t.common);

      revalidateResidentPages(residentId);
      return { ok: true, redirectTo: `/residents/${residentId}/diet` };
    },
  );
  if (result.ok) redirect(result.redirectTo);
  return result;
}

/**
 * Rewrites an existing diet record from the same form. Every column the
 * form carries is written, so clearing the end date on a past row makes
 * it current again.
 */
export async function updateDiet(_state: DietFormState, formData: FormData): Promise<DietFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  const result = await runWriteAction<{ redirectTo: string }>(
    "diets.update",
    write(t),
    { id: writeRequestIdFrom(formData), action: "diets.update", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.diet")) return { ok: false, error: t.common.notAllowed };
      const residentId = str(formData, "residentId");
      if (!residentId) return { ok: false, error: t.diets.errors.missingResident };
      const dietId = str(formData, "dietId");
      if (!dietId) return { ok: false, error: t.diets.errors.missingDiet };

      const parsed = parseDietFields(formData, t);
      if ("error" in parsed) return { ok: false, error: parsed.error };
      const { fields } = parsed;

      const big = bigDietWarning(formData, fields, t);
      if (big) return big;
      const { data, error } = await supabase
        .from("resident_diets")
        .update({
          diet_id: fields.dietId,
          start_date: fields.startDate,
          end_date: fields.endDate,
          meals_per_day: fields.mealsPerDay,
          portion_factor: fields.portionFactor,
          notes: fields.notes,
        })
        .eq("id", dietId)
        .eq("resident_id", residentId)
        .select("id")
        .returns<{ id: string }[]>();
      if (error) return databaseFailure("diets.write", error, t.common);
      // RLS filters rather than rejects: a volunteer's update matches no rows.
      if (!data || data.length === 0) return { ok: false, error: t.diets.errors.saveFailed };

      revalidateResidentPages(residentId);
      return { ok: true, redirectTo: `/residents/${residentId}/diet` };
    },
  );
  if (result.ok) redirect(result.redirectTo);
  return result;
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
  requestId: string | null,
): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<object>("diets.endToday", write(t), { id: requestId, action: "diets.endToday", db: supabase }, async () => {
    if (!can(await loadPermissions(), "medical.diet")) return { ok: false, error: t.common.notAllowed };
    const today = todayIso();
    const { data, error } = await supabase
      .from("resident_diets")
      .update({ end_date: today })
      .eq("id", dietId)
      .eq("resident_id", residentId)
      .lte("start_date", today)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return databaseFailure("diets.write", error, t.common);
    if (!data || data.length === 0) return { ok: false, error: t.diets.errors.saveFailed };

    revalidateResidentPages(residentId);
    refresh();
    return { ok: true };
  });
}
