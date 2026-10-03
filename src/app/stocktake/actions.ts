"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { resolveEntered, type EnteredLine } from "@/lib/units";
import { loadConversions } from "@/lib/units-server";

/**
 * `count` is in base units. When the row was typed in another unit, `unit`
 * names it and `quantity` is what was typed: the server recomputes the base
 * figure from the live conversion and stamps the factor into `entered`
 * (0118), so the browser's copy of the factor is never trusted or stored.
 */
export type StocktakeCount = { id: string; count: number; quantity?: number; unit?: string };

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

  if (!can(await loadPermissions(), "stock.count")) return { ok: false, error: e.notAuthorized };

  // The function checks all of this too; checked here so a bad payload
  // gets the sheet's own wording.
  const valid = (list: StocktakeCount[]) =>
    Array.isArray(list) &&
    list.every(
      (row) =>
        typeof row?.id === "string" &&
        typeof row.count === "number" &&
        Number.isFinite(row.count) &&
        row.count >= 0 &&
        (!row.unit || (typeof row.unit === "string" && typeof row.quantity === "number" && row.quantity >= 0)),
    );
  if (!valid(medication) || !valid(diet)) return { ok: false, error: e.countInvalid };
  if (medication.length + diet.length === 0) return { ok: false, error: e.nothingToSave };

  const stamped = async (kind: "medication" | "diet", list: StocktakeCount[]) => {
    const typed = list.filter((row) => row.unit);
    const conversions = typed.length
      ? await loadConversions(supabase, kind, typed.map((row) => row.id))
      : { data: {}, error: null };
    if (conversions.error) return { error: conversions.error };
    const rows: { id: string; count: number; entered?: EnteredLine[] }[] = [];
    for (const row of list) {
      if (!row.unit) {
        rows.push({ id: row.id, count: row.count });
        continue;
      }
      const resolved = resolveEntered(row.quantity ?? NaN, row.unit, conversions.data[row.id] ?? []);
      if (!resolved.ok) {
        return { error: resolved.reason === "unknownUnit" ? t.units.errors.unknownUnit : e.countInvalid };
      }
      rows.push(resolved.entered ? { id: row.id, count: resolved.base, entered: resolved.entered } : { id: row.id, count: resolved.base });
    }
    return { rows };
  };
  const [medicationRows, dietRows] = await Promise.all([stamped("medication", medication), stamped("diet", diet)]);
  if ("error" in medicationRows) return { ok: false, error: medicationRows.error ?? e.failed };
  if ("error" in dietRows) return { ok: false, error: dietRows.error ?? e.failed };

  const { data, error } = await supabase
    .rpc("record_stocktake", {
      p_medication: medicationRows.rows,
      p_diet_types: dietRows.rows,
    })
    .single<{ medication_updated: number; diet_types_updated: number; counted_at: string }>();

  if (error || !data) {
    const message = error?.message ?? "";
    if (/not authorized/i.test(message)) return { ok: false, error: e.notAuthorized };
    if (/were found/i.test(message)) return { ok: false, error: e.stale };
    if (/negative|needs an id and a number|do not add up/i.test(message)) return { ok: false, error: e.countInvalid };
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
