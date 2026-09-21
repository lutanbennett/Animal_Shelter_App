"use server";

import { refresh, revalidatePath } from "next/cache";
import { assertManagementRole } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { DIET_UNITS, type DietUnit } from "@/lib/i18n/enum-labels";

export type DietTypeFormState =
  | { error: string }
  | { success: string }
  | undefined;

/** The editable columns of a diet type, as strings from a form or a row editor. */
export type DietTypeFields = {
  name: string;
  unit: string;
  costPerUnit: string;
  dailyQtySmall: string;
  dailyQtyMedium: string;
  dailyQtyLarge: string;
  notes: string;
};

type DietTypeRowInput = {
  name: string;
  unit: DietUnit;
  cost_per_unit: number;
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

function revalidateDietPages() {
  revalidatePath("/management/diets");
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

  return {
    row: {
      name,
      unit,
      cost_per_unit: cost,
      daily_qty_small: quantities[0],
      daily_qty_medium: quantities[1],
      daily_qty_large: quantities[2],
      notes: optional(fields.notes),
    },
  };
}

export async function createDietType(
  _state: DietTypeFormState,
  formData: FormData,
): Promise<DietTypeFormState> {
  await assertManagementRole();
  const { t } = await getT();

  const parsed = parseFields(fieldsFromForm(formData), t);
  if (parsed.error !== undefined) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("diet_types").insert(parsed.row);
  if (error) return { error: error.message };

  revalidateDietPages();
  return { success: t.management.diets.createdDiet(parsed.row.name) };
}

/**
 * Every column is editable in place. Changing the unit or a quantity
 * changes what existing resident records mean (their quantity is in this
 * unit, and the size default is read live), which is the point: a price
 * rise or a corrected portion should flow through to the forecast.
 */
export async function updateDietType(id: string, fields: DietTypeFields) {
  await assertManagementRole();
  const { t } = await getT();

  const parsed = parseFields(fields, t);
  if (parsed.error !== undefined) throw new Error(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("diet_types").update(parsed.row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateDietPages();
}

export async function deleteDietType(id: string) {
  await assertManagementRole();
  const { t } = await getT();

  // resident_diets.diet_type_id has no cascade: a diet that has ever been
  // recorded is part of a resident's history. Say so instead of surfacing
  // the foreign-key error.
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("resident_diets")
    .select("id", { count: "exact", head: true })
    .eq("diet_type_id", id);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error(t.management.diets.errors.hasDiets(count ?? 0));
  }

  const { error } = await supabase.from("diet_types").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateDietPages();
}
