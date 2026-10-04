"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { dietUnitLabel, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { costPerBaseUnit, defaultUnit, parseConversion, type ItemKind } from "@/lib/units";
import { loadConversions } from "@/lib/units-server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

const refuse = (error: string) => ({ ok: false as const, error });

export type ConversionFields = {
  unit: string;
  /** Base units in one of this unit, as typed. */
  factor: string;
  note: string;
  isPurchase: boolean;
  isCount: boolean;
};

function revalidateUnitPages() {
  revalidatePath("/management/medications");
  revalidatePath("/management/diets");
  revalidatePath("/deliveries");
  revalidatePath("/stocktake");
  refresh();
}

function table(kind: ItemKind) {
  return kind === "medication"
    ? ({ items: "medication", unitColumn: "dose_unit", idColumn: "medication_id", itemKind: "medication" } as const)
    : ({ items: "diet_types", unitColumn: "unit", idColumn: "diet_type_id", itemKind: "diet_type" } as const);
}

/** The item's base unit, as stored and as the reader sees it. */
async function baseUnitOf(kind: ItemKind, itemId: string) {
  const supabase = await createClient();
  const { t } = await getT();
  const tb = table(kind);
  const { data } = await supabase
    .from(tb.items)
    .select(`unit:${tb.unitColumn}`)
    .eq("id", itemId)
    .maybeSingle<{ unit: string }>();
  if (!data) return null;
  const label = kind === "medication" ? doseUnitLabel(t, data.unit) : dietUnitLabel(t, data.unit);
  return { stored: data.unit, label };
}

/**
 * Adds or edits one conversion. Editing a factor is the intended way to
 * correct one, and is safe: deliveries and counts already saved carry their
 * own copy of the factor (stock_*.entered, 0118), so nothing recorded moves.
 *
 * Purchase and count are one-per-item (partial unique indexes checked row by
 * row), so the flag is cleared on the others first.
 */
export async function saveConversion(
  kind: ItemKind,
  itemId: string,
  id: string | null,
  fields: ConversionFields,
): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.units.errors;
  return runAction("units.saveConversion", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(e.notAuthorized);
    if (kind !== "medication" && kind !== "diet") return refuse(e.failed);

    const base = await baseUnitOf(kind, itemId);
    if (!base) return refuse(e.gone);

    const supabase = await createClient();
    const existing = await loadConversions(supabase, kind, [itemId]);
    if (existing.error) return refuse(`${e.failed}: ${existing.error}`);
    const others = existing.data[itemId] ?? [];

    const parsed = parseConversion(fields, [base.stored, base.label], others, id);
    if (!parsed.ok) return refuse(parsed.reason === "sameAsBase" ? e.sameAsBase(base.label) : e[parsed.reason]);

    const tb = table(kind);
    for (const [flag, column] of [
      [fields.isPurchase, "is_purchase_unit"],
      [fields.isCount, "is_count_unit"],
    ] as const) {
      if (!flag) continue;
      let clear = supabase.from("item_unit_conversions").update({ [column]: false }).eq(tb.idColumn, itemId).eq(column, true);
      if (id) clear = clear.neq("id", id);
      const { error } = await clear;
      if (error) return refuse(`${e.failed}: ${error.message}`);
    }

    const row = {
      unit: parsed.unit,
      base_units_per: parsed.basePer,
      is_purchase_unit: fields.isPurchase,
      is_count_unit: fields.isCount,
      note: parsed.note,
    };
    const { error } = id
      ? await supabase.from("item_unit_conversions").update(row).eq("id", id).eq(tb.idColumn, itemId)
      : await supabase.from("item_unit_conversions").insert({ ...row, item_kind: tb.itemKind, [tb.idColumn]: itemId });
    if (error) return refuse(`${e.failed}: ${error.message}`);

    revalidateUnitPages();
    return { ok: true };
  });
}

/** Safe for history for the same reason editing is: past rows keep their own copy of the factor. */
export async function deleteConversion(id: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.units.errors;
  return runAction("units.deleteConversion", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(e.notAuthorized);
    const supabase = await createClient();
    const { error, count } = await supabase
      .from("item_unit_conversions")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) return refuse(`${e.failed}: ${error.message}`);
    if (!count) return refuse(e.gone);
    revalidateUnitPages();
    return { ok: true };
  });
}

/**
 * "850 baht a bag": stores price ÷ base_units_per as the item's existing
 * cost per base unit (cost_per_unit), which the forecasts and Cashflow
 * already multiply by. No new column; the purchase-unit price is derived
 * again from the cost and the current factor when shown.
 */
export async function setPricePerPurchaseUnit(
  kind: ItemKind,
  itemId: string,
  price: string,
): Promise<ActionResult<{ costPerBase: number }>> {
  const { t } = await getT();
  const e = t.units.errors;
  return runAction("units.setPricePerPurchaseUnit", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(e.notAuthorized);
    if (kind !== "medication" && kind !== "diet") return refuse(e.failed);
    const typed = price.trim();
    const amount = Number(typed);
    if (!typed || !Number.isFinite(amount)) return refuse(e.priceInvalid);

    const supabase = await createClient();
    const conversions = await loadConversions(supabase, kind, [itemId]);
    if (conversions.error) return refuse(`${e.failed}: ${conversions.error}`);
    const purchase = defaultUnit(conversions.data[itemId] ?? [], "purchase");
    if (!purchase) return refuse(e.noPurchaseUnit);

    const cost = costPerBaseUnit(amount, purchase.basePer);
    if (!cost.ok) return refuse(e[cost.reason]);

    const tb = table(kind);
    const { error } = await supabase.from(tb.items).update({ cost_per_unit: cost.value }).eq("id", itemId);
    if (error) return refuse(`${e.failed}: ${error.message}`);
    revalidateUnitPages();
    return { ok: true, costPerBase: cost.value };
  });
}
