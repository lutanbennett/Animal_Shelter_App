"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { parseUnitCost } from "@/lib/format";
import { parseLeadDays, parseStockCount } from "@/lib/management/stock";
import { resolveSafetyStock } from "@/lib/management/purchasing";
import { loadConversions } from "@/lib/units-server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

const refuse = (error: string) => ({ ok: false as const, error });

/**
 * What Management → Diet stock edits on a row. The name, unit, per-size
 * quantities, notes and the standard diet are Settings → Diets'
 * (admin/diets/actions.ts) since the split of 2026-10-08, so they are not in
 * this write at all: an action is reachable whatever the page shows.
 */
export type DietStockFields = {
  /** Baht per unit as typed, up to 4 places (0161). Blank is 0: diet_types.cost_per_unit is not null. */
  costPerUnit: string;
  /** Supplier lead time in days; blank = no reorder flag (0083). */
  reorderLeadDays: string;
  /**
   * Safety stock as typed, in `safetyUnit` (0128). Blank = no floor (null);
   * 0 is a floor of nothing. Converted to the base unit on save.
   */
  safetyStock: string;
  /** Blank = the base unit; else the name of one of the item's other units. */
  safetyUnit: string;
};

function revalidateDietPages() {
  revalidatePath("/management/diets");
  revalidatePath("/management/purchasing");
  revalidatePath("/management/cashflow");
  // revalidatePath alone leaves the client router showing the row it had
  // when the action was called from a button (a <form action> refreshes
  // on its own); refresh() re-renders the page the caller is on.
  refresh();
}

/**
 * Cost, reorder lead time and safety stock. A price rise flows straight
 * through to the forecast and Cashflow, which is the point.
 */
export async function updateDietStockSettings(id: string, fields: DietStockFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.updateDietStockSettings", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(t.management.errors.managementAccessRequired);
    const cost = parseUnitCost(fields.costPerUnit);
    if (!cost.ok) return refuse(t.management.diets.errors.costInvalid);
    const leadDays = parseLeadDays(fields.reorderLeadDays);
    if (!leadDays.ok) return refuse(t.management.stock.errors.leadDaysInvalid);

    const supabase = await createClient();
    const { data: row, error: rowError } = await supabase
      .from("diet_types")
      .select("unit")
      .eq("id", id)
      .maybeSingle<{ unit: string }>();
    if (rowError) return refuse(rowError.message);
    if (!row) return refuse(t.units.errors.gone);

    // The floor may be typed in the purchase unit; it is stored in base
    // units (0128), converted with the factor in force now.
    const conversions = await loadConversions(supabase, "diet", [id]);
    if (conversions.error) return refuse(conversions.error);
    const safety = resolveSafetyStock(
      fields.safetyStock,
      fields.safetyUnit,
      conversions.data[id] ?? [],
      [row.unit],
    );
    if (!safety.ok) {
      return refuse(
        safety.reason === "unknownUnit" ? t.units.errors.unknownUnit : t.management.stock.errors.safetyInvalid,
      );
    }

    // stock_on_hand is deliberately not in this write: naming it restamps
    // stock_counted_at (0083), and a price change is not a stocktake.
    const { error } = await supabase
      .from("diet_types")
      .update({
        cost_per_unit: cost.value ?? 0,
        reorder_lead_days: leadDays.value,
        safety_stock: safety.value,
      })
      .eq("id", id);
    if (error) return refuse(error.message);
    revalidateDietPages();
    return { ok: true };
  });
}

/**
 * Records a stocktake. Always writes stock_on_hand, so the trigger stamps
 * the count as taken now — re-saving the same figure is a count that
 * confirmed it (0083). Blank clears it back to "not counted".
 */
export async function updateDietTypeStock(id: string, count: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.updateDietTypeStock", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(t.management.errors.managementAccessRequired);
    const parsed = parseStockCount(count);
    if (!parsed.ok) return refuse(t.management.stock.errors.countInvalid);

    const supabase = await createClient();
    // One way in (0112): see updateMedicationStock.
    const { error } = await supabase.rpc("record_stock_correction", {
      p_kind: "diet_type",
      p_id: id,
      p_count: parsed.value,
    });
    if (error) return refuse(error.message);
    revalidateDietPages();
    return { ok: true };
  });
}
