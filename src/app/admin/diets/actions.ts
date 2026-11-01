"use server";

import { refresh, revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { loadUnitList } from "@/lib/unit-list-server";
import { usableUnit } from "@/lib/unit-list";
import { loadPermissions } from "@/lib/permissions/load";
import { canEditItemSettings } from "@/lib/permissions/item-settings";

// Settings → Diets, the ingredient half (diet_types, 0239): name, unit, notes,
// add and delete. The recipes that use them are in ./recipe-actions.ts. Cost,
// reorder lead, safety stock and counts stay in /management/diets/actions.ts.
// An ingredient's old per-size quantities and standard flag are no longer
// read by anything; the columns stay until the cleanup migration.

const refuse = (error: string) => ({ ok: false as const, error });

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

export type DietTypeFormState = ActionResult<{ success: string; id: string }> | undefined;

/** The option-list columns of a diet type, as strings from a form or a row editor. */
export type DietDefinitionFields = {
  name: string;
  /** Empty: Thai readers see the English (0166). */
  nameTh: string;
  unit: string;
  notes: string;
};

type DietDefinitionRow = {
  name: string;
  name_th: string | null;
  unit: string;
  notes: string | null;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

async function refusal() {
  if (canEditItemSettings(await loadPermissions(), "diet")) return null;
  const { t } = await getT();
  return refuse(t.admin.security.errors.adminAccessRequired);
}

function revalidateDietPages() {
  revalidatePath("/admin/diets", "layout");
  revalidatePath("/management/diets");
  revalidatePath("/management/purchasing");
  revalidatePath("/management/cashflow");
  // The recipe editor, the stocktake sheet and the delivery form read this table too.
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
    nameTh: get("nameTh"),
    unit: get("unit"),
    notes: get("notes"),
  };
}

/** Validates the fields and returns the row to write, or an error message. */
async function parseFields(
  fields: DietDefinitionFields,
  t: Dictionary,
): Promise<{ error: string; row?: never } | { row: DietDefinitionRow; error?: never }> {
  const e = t.management.diets.errors;
  const name = optional(fields.name);
  if (!name) return { error: e.nameRequired };
  // Settings → Units is the list (0252). The write-time trigger refuses the same things; this says it in words.
  // A row saved unchanged on a unit since archived still saves: the trigger lets an untouched value through.
  const unit = usableUnit(await loadUnitList(), "ingredients", optional(fields.unit))?.name ?? null;
  if (!unit) return { error: e.unitInvalid };

  return {
    row: {
      name,
      name_th: optional(fields.nameTh),
      unit,
      notes: optional(fields.notes),
    },
  };
}

/** A new ingredient costs 0 (the column's default) until Management → Diet stock prices it. */
export async function createDietType(
  _state: DietTypeFormState,
  formData: FormData,
): Promise<DietTypeFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("diets.createDietType", write(t), { id: writeRequestIdFrom(formData), action: "diets.createDietType", db: supabase }, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const parsed = await parseFields(fieldsFromForm(formData), t);
    if (parsed.error !== undefined) return refuse(parsed.error);
    const { data, error } = await supabase.from("diet_types").insert(parsed.row).select("id").single<{ id: string }>();
    if (error) return refuse(error.message);

    revalidateDietPages();
    return { ok: true, success: t.management.diets.createdDiet(parsed.row.name), id: data.id };
  });
}

/**
 * Changing the unit or a quantity changes what existing resident records
 * mean (their quantity is in this unit, and the size default is read live),
 * which is the point: a corrected portion should flow through to the forecast.
 */
export async function updateDietDefinition(id: string, fields: DietDefinitionFields, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("diets.updateDietDefinition", write(t), { id: requestId, action: "diets.updateDietDefinition", db: supabase }, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const parsed = await parseFields(fields, t);
    if (parsed.error !== undefined) return refuse(parsed.error);
    const { error } = await supabase.from("diet_types").update(parsed.row).eq("id", id);
    if (error) return refuse(error.message);
    revalidateDietPages();
    return { ok: true };
  });
}

export async function deleteDietType(id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("diets.deleteDietType", write(t), { id: requestId, action: "diets.deleteDietType", db: supabase }, async () => {
    const refused = await refusal();
    if (refused) return refused;
    // An ingredient in a diet is part of what was fed and
    // bought. Say so instead of surfacing the
    // foreign-key error.
    const inDiets = await supabase.from("diet_ingredients").select("diet_id", { count: "exact", head: true }).eq("diet_type_id", id);
    if (inDiets.error) return refuse(inDiets.error.message);
    if ((inDiets.count ?? 0) > 0) return refuse(t.management.diets.errors.inRecipes(inDiets.count ?? 0));

    const { error } = await supabase.from("diet_types").delete().eq("id", id);
    if (error) return refuse(error.message);
    revalidateDietPages();
    return { ok: true };
  });
}
