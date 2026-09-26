"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { canStocktake } from "@/lib/management/stocktake";

export type StocktakeCount = { id: string; count: number };

export type SaveStocktakeResult =
  | { ok: true; medicationUpdated: number; dietUpdated: number; countedAt: string }
  | { ok: false; error: string };

/**
 * Saves the whole sheet in one record_stocktake() call (0088): every row
 * listed is written in one transaction with one counted-at time, and a row
 * left out is left alone. The sheet never lists a blank row, so nothing
 * here can clear a count.
 *
 * Returns rather than throws, so the refusal the sheet shows is the
 * readable one below rather than whatever a thrown server-action error
 * becomes in production.
 */
export async function saveStocktake(
  medication: StocktakeCount[],
  diet: StocktakeCount[],
): Promise<SaveStocktakeResult> {
  const { t } = await getT();
  const e = t.stocktake.errors;
  const supabase = await createClient();

  const { data: role } = await supabase.rpc("current_user_role");
  if (!canStocktake(role)) return { ok: false, error: e.notAuthorized };

  // The function checks all of this too; checked here so a bad payload
  // gets the sheet's own wording.
  const valid = (list: StocktakeCount[]) =>
    Array.isArray(list) &&
    list.every(
      (row) =>
        typeof row?.id === "string" &&
        typeof row.count === "number" &&
        Number.isFinite(row.count) &&
        row.count >= 0,
    );
  if (!valid(medication) || !valid(diet)) return { ok: false, error: e.countInvalid };
  if (medication.length + diet.length === 0) return { ok: false, error: e.nothingToSave };

  const { data, error } = await supabase
    .rpc("record_stocktake", {
      p_medication: medication.map(({ id, count }) => ({ id, count })),
      p_diet_types: diet.map(({ id, count }) => ({ id, count })),
    })
    .single<{ medication_updated: number; diet_types_updated: number; counted_at: string }>();

  if (error || !data) {
    const message = error?.message ?? "";
    if (/not authorized/i.test(message)) return { ok: false, error: e.notAuthorized };
    if (/were found/i.test(message)) return { ok: false, error: e.stale };
    if (/negative|needs an id and a number/i.test(message)) return { ok: false, error: e.countInvalid };
    return { ok: false, error: message ? `${e.failed}: ${message}` : e.failed };
  }

  revalidatePath("/stocktake");
  revalidatePath("/management/medications");
  revalidatePath("/management/diets");
  return {
    ok: true,
    medicationUpdated: data.medication_updated,
    dietUpdated: data.diet_types_updated,
    countedAt: data.counted_at,
  };
}
