"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { DIET_UNITS, type DietUnit } from "@/lib/i18n/enum-labels";
import { parseLeadDays, parseSafetyStock, parseStockCount } from "@/lib/management/stock";
import { resolveSafetyStock } from "@/lib/management/purchasing";
import { loadConversions } from "@/lib/units-server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

const refuse = (error: string) => ({ ok: false as const, error });

export type DietTypeFormState = ActionResult<{ success: string }> | undefined;

/** The editable columns of a diet type, as strings from a form or a row editor. */
export type DietTypeFields = {
  name: string;
  unit: string;
  costPerUnit: string;
  dailyQtySmall: string;
  dailyQtyMedium: string;
  dailyQtyLarge: string;
  notes: string;
  /** Supplier lead time in days; blank = no reorder flag (0083). Not on the add form. */
  reorderLeadDays: string;
  /**
   * Safety stock as typed, in `safetyUnit` (0128). Blank = no floor (null);
   * 0 is a floor of nothing. Converted to the base unit on save.
   */
  safetyStock: string;
  /** Blank = the base unit; else the name of one of the item's other units. */
  safetyUnit: string;
};

type DietTypeRowInput = {
  name: string;
  unit: DietUnit;
  cost_per_unit: number;
  daily_qty_small: number;
  daily_qty_medium: number;
  daily_qty_large: number;
  notes: string | null;
  reorder_lead_days: number | null;
  safety_stock: number | null;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function isDietUnit(value: string | null): value is DietUnit {
  return value != null && DIET_UNITS.includes(value as DietUnit);
}

function revalidateDietPages() {
  revalidatePath("/management/diets");
  revalidatePath("/management/purchasing");
  // The diet form's picker, the intake form and the hub's diet_types(name)
  // embeds read this table too.
  revalidatePath("/diets/new");
  revalidatePath("/residents", "layout");
  // revalidatePath alone leaves the client router showing the row it had
  // when the action was called from a button (a <form action> refreshes
  // on its own); refresh() re-renders the page the caller is on.
  refresh();
}

function fieldsFromForm(formData: FormData): DietTypeFields {
  const get = (key: string) => optional(formData.get(key)) ?? "";
  return {
    name: get("name"),
    unit: get("unit"),
    costPerUnit: get("costPerUnit"),
    dailyQtySmall: get("dailyQtySmall"),
    dailyQtyMedium: get("dailyQtyMedium"),
    dailyQtyLarge: get("dailyQtyLarge"),
    notes: get("notes"),
    reorderLeadDays: get("reorderLeadDays"),
    safetyStock: get("safetyStock"),
    safetyUnit: get("safetyUnit"),
  };
}

/** Validates the fields and returns the row to write, or an error message. */
function parseFields(
  fields: DietTypeFields,
  t: Dictionary,
): { error: string; row?: never } | { row: DietTypeRowInput; error?: never } {
  const e = t.management.diets.errors;
  const name = optional(fields.name);
  if (!name) return { error: e.nameRequired };
  const unit = optional(fields.unit);
  if (!isDietUnit(unit)) return { error: e.unitInvalid };

  const cost = Number(optional(fields.costPerUnit) ?? "0");
  if (!Number.isFinite(cost) || cost < 0) return { error: e.costInvalid };

  const quantities = [fields.dailyQtySmall, fields.dailyQtyMedium, fields.dailyQtyLarge].map(
    (value) => Number(optional(value) ?? ""),
  );
  if (quantities.some((q) => !Number.isFinite(q) || q <= 0)) {
    return { error: e.quantitiesInvalid };
  }

  const leadDays = parseLeadDays(fields.reorderLeadDays);
  if (!leadDays.ok) return { error: t.management.stock.errors.leadDaysInvalid };

  // As typed, taken to be in the base unit: right for the add form, which
  // has no other units yet. updateDietType converts a purchase-unit entry.
  const safety = parseSafetyStock(fields.safetyStock);
  if (!safety.ok) return { error: t.management.stock.errors.safetyInvalid };

  return {
    row: {
      name,
      unit,
      cost_per_unit: cost,
      daily_qty_small: quantities[0],
      daily_qty_medium: quantities[1],
      daily_qty_large: quantities[2],
      notes: optional(fields.notes),
      reorder_lead_days: leadDays.value,
      safety_stock: safety.value,
    },
  };
}

export async function createDietType(
  _state: DietTypeFormState,
  formData: FormData,
): Promise<DietTypeFormState> {
  const { t } = await getT();
  return runAction("diets.createDietType", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(t.management.errors.managementAccessRequired);
    const parsed = parseFields(fieldsFromForm(formData), t);
    if (parsed.error !== undefined) return refuse(parsed.error);

    const supabase = await createClient();
    const { error } = await supabase.from("diet_types").insert(parsed.row);
    if (error) return refuse(error.message);

    revalidateDietPages();
    return { ok: true, success: t.management.diets.createdDiet(parsed.row.name) };
  });
}

/**
 * Every column is editable in place. Changing the unit or a quantity
 * changes what existing resident records mean (their quantity is in this
 * unit, and the size default is read live), which is the point: a price
 * rise or a corrected portion should flow through to the forecast.
 */
export async function updateDietType(id: string, fields: DietTypeFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.updateDietType", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(t.management.errors.managementAccessRequired);
    const parsed = parseFields(fields, t);
    if (parsed.error !== undefined) return refuse(parsed.error);

    // The floor may be typed in the purchase unit; it is stored in base
    // units (0128), converted with the factor in force now.
    const supabase = await createClient();
    const conversions = await loadConversions(supabase, "diet", [id]);
    if (conversions.error) return refuse(conversions.error);
    const safety = resolveSafetyStock(
      fields.safetyStock,
      fields.safetyUnit,
      conversions.data[id] ?? [],
      [parsed.row.unit],
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
      .update({ ...parsed.row, safety_stock: safety.value })
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

/**
 * Makes this diet type the standard. set_standard_diet (0090) clears the
 * old row and sets the new one in one transaction — the partial unique
 * index is checked row by row, so it has to be two statements in that
 * order, and supabase-js can't wrap two updates in a transaction.
 */
export async function setStandardDietType(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.setStandardDietType", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { error } = await supabase.rpc("set_standard_diet", { p_diet_type_id: id });
    if (error) return refuse(error.message);
    revalidateDietPages();
    // Special-diet markers on the enclosure cards read the flag.
    revalidatePath("/enclosures", "layout");
    return { ok: true };
  });
}

export async function deleteDietType(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.deleteDietType", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.diets")) return refuse(t.management.errors.managementAccessRequired);
    // resident_diets.diet_type_id has no cascade: a diet that has ever been
    // recorded is part of a resident's history. Say so instead of surfacing
    // the foreign-key error.
    const supabase = await createClient();
    const { count, error: countError } = await supabase
      .from("resident_diets")
      .select("id", { count: "exact", head: true })
      .eq("diet_type_id", id);
    if (countError) return refuse(countError.message);
    if ((count ?? 0) > 0) {
      return refuse(t.management.diets.errors.hasDiets(count ?? 0));
    }

    const { error } = await supabase.from("diet_types").delete().eq("id", id);
    if (error) return refuse(error.message);
    revalidateDietPages();
    return { ok: true };
  });
}
