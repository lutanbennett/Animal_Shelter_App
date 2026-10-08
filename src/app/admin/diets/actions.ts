"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { DIET_UNITS, type DietUnit } from "@/lib/i18n/enum-labels";
import { loadPermissions } from "@/lib/permissions/load";
import { canEditItemSettings } from "@/lib/permissions/item-settings";

// Settings → Diets: the option-list half (name, unit, per-size daily
// quantities, notes, the standard diet, add and delete). Cost, reorder lead,
// safety stock and counts stay in /management/diets/actions.ts, which can no
// longer change any of these.

const refuse = (error: string) => ({ ok: false as const, error });

export type DietTypeFormState = ActionResult<{ success: string }> | undefined;

/** The option-list columns of a diet type, as strings from a form or a row editor. */
export type DietDefinitionFields = {
  name: string;
  unit: string;
  dailyQtySmall: string;
  dailyQtyMedium: string;
  dailyQtyLarge: string;
  notes: string;
};

type DietDefinitionRow = {
  name: string;
  unit: DietUnit;
  daily_qty_small: number;
  daily_qty_medium: number;
  daily_qty_large: number;
  notes: string | null;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function isDietUnit(value: string | null): value is DietUnit {
  return value != null && DIET_UNITS.includes(value as DietUnit);
}

async function refusal() {
  if (canEditItemSettings(await loadPermissions(), "diet")) return null;
  const { t } = await getT();
  return refuse(t.admin.security.errors.adminAccessRequired);
}

function revalidateDietPages() {
  revalidatePath("/admin/diets");
  revalidatePath("/management/diets");
  revalidatePath("/management/purchasing");
  revalidatePath("/management/cashflow");
  // The diet form's picker, the intake form, the stocktake sheet, the
  // delivery form and the hub's diet_types(name) embeds read this table too.
  revalidatePath("/diets/new");
  revalidatePath("/residents", "layout");
  revalidatePath("/stocktake");
  revalidatePath("/deliveries");
  // revalidatePath alone leaves the client router showing the row it had
  // when the action was called from a button (a <form action> refreshes
  // on its own); refresh() re-renders the page the caller is on.
  refresh();
}

function fieldsFromForm(formData: FormData): DietDefinitionFields {
  const get = (key: string) => optional(formData.get(key)) ?? "";
  return {
    name: get("name"),
    unit: get("unit"),
    dailyQtySmall: get("dailyQtySmall"),
    dailyQtyMedium: get("dailyQtyMedium"),
    dailyQtyLarge: get("dailyQtyLarge"),
    notes: get("notes"),
  };
}

/** Validates the fields and returns the row to write, or an error message. */
function parseFields(
  fields: DietDefinitionFields,
  t: Dictionary,
): { error: string; row?: never } | { row: DietDefinitionRow; error?: never } {
  const e = t.management.diets.errors;
  const name = optional(fields.name);
  if (!name) return { error: e.nameRequired };
  const unit = optional(fields.unit);
  if (!isDietUnit(unit)) return { error: e.unitInvalid };

  const quantities = [fields.dailyQtySmall, fields.dailyQtyMedium, fields.dailyQtyLarge].map(
    (value) => Number(optional(value) ?? ""),
  );
  if (quantities.some((q) => !Number.isFinite(q) || q <= 0)) {
    return { error: e.quantitiesInvalid };
  }

  return {
    row: {
      name,
      unit,
      daily_qty_small: quantities[0],
      daily_qty_medium: quantities[1],
      daily_qty_large: quantities[2],
      notes: optional(fields.notes),
    },
  };
}

/** A new diet costs 0 (the column's default) until Management → Diet stock prices it. */
export async function createDietType(
  _state: DietTypeFormState,
  formData: FormData,
): Promise<DietTypeFormState> {
  const { t } = await getT();
  return runAction("diets.createDietType", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
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
 * Changing the unit or a quantity changes what existing resident records
 * mean (their quantity is in this unit, and the size default is read live),
 * which is the point: a corrected portion should flow through to the forecast.
 */
export async function updateDietDefinition(id: string, fields: DietDefinitionFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.updateDietDefinition", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const parsed = parseFields(fields, t);
    if (parsed.error !== undefined) return refuse(parsed.error);

    const supabase = await createClient();
    const { error } = await supabase.from("diet_types").update(parsed.row).eq("id", id);
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
    const refused = await refusal();
    if (refused) return refused;
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
    const refused = await refusal();
    if (refused) return refused;
    // resident_diets.diet_type_id has no cascade: a diet that has ever been
    // recorded is part of a resident's history. Say so instead of surfacing
    // the foreign-key error.
    const supabase = await createClient();
    const { count, error: countError } = await supabase
      .from("resident_diets")
      .select("id", { count: "exact", head: true })
      .eq("diet_type_id", id);
    if (countError) return refuse(countError.message);
    if ((count ?? 0) > 0) return refuse(t.management.diets.errors.hasDiets(count ?? 0));

    const { error } = await supabase.from("diet_types").delete().eq("id", id);
    if (error) return refuse(error.message);
    revalidateDietPages();
    return { ok: true };
  });
}
