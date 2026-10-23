"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPermissions } from "@/lib/permissions/load";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import type { DietServings } from "@/lib/diets/servings";

// Settings → Diets, the recipe half (0239): a diet is a recipe of ingredients
// (diet_types). Ingredients, stock and prices stay in ./actions.ts and
// /management/diets. Admin only, as the rest of the page.

const refuse = (error: string) => ({ ok: false as const, error });

export type RecipeFormState = ActionResult<{ success: string; id: string }> | undefined;

export type RecipeFields = { name: string; nameTh: string; notes: string };
export type RecipeLineFields = {
  ingredientId: string;
  /** "" = the ingredient's own unit. */
  servingUnit: string;
  /** The amount in ONE serving (0250). */
  qty: string;
};

export type ServingsFields = { small: string; medium: string; large: string };

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

async function refusal() {
  if (canEditItemSettings(await loadPermissions(), "diet")) return null;
  const { t } = await getT();
  return refuse(t.admin.security.errors.adminAccessRequired);
}

function revalidateRecipePages() {
  revalidatePath("/admin/diets", "layout");
  revalidatePath("/management/diets");
  revalidatePath("/management/purchasing");
  revalidatePath("/management/cashflow");
  revalidatePath("/management/stock-usage");
  revalidatePath("/diets/new");
  revalidatePath("/residents", "layout");
  revalidatePath("/enclosures", "layout");
  refresh();
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function residentRecordCount(supabase: Supabase, dietId: string) {
  const { count, error } = await supabase
    .from("resident_diets")
    .select("id", { count: "exact", head: true })
    .eq("diet_id", dietId);
  return { count: count ?? 0, error };
}

export async function createRecipe(_state: RecipeFormState, formData: FormData): Promise<RecipeFormState> {
  const { t } = await getT();
  const e = t.admin.diets.recipes.errors;
  return runAction("diets.createRecipe", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const name = optional(formData.get("name"));
    if (!name) return refuse(e.nameRequired);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("diets")
      .insert({
        name,
        name_th: optional(formData.get("nameTh")),
        notes: optional(formData.get("notes")),
      })
      .select("id")
      .single<{ id: string }>();
    if (error) return refuse(error.code === "23505" ? e.nameTaken : error.message);
    revalidateRecipePages();
    return { ok: true, success: t.admin.diets.recipes.created(name), id: data.id };
  });
}

export async function updateRecipe(id: string, fields: RecipeFields): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.diets.recipes.errors;
  return runAction("diets.updateRecipe", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const name = optional(fields.name);
    if (!name) return refuse(e.nameRequired);
    const supabase = await createClient();
    const { error } = await supabase
      .from("diets")
      .update({ name, name_th: optional(fields.nameTh), notes: optional(fields.notes) })
      .eq("id", id);
    if (error) return refuse(error.code === "23505" ? e.nameTaken : error.message);
    revalidateRecipePages();
    return { ok: true };
  });
}

/**
 * Moves the Standard flag. The partial unique index is checked row by row, so
 * the old flag is cleared first; if the second statement fails the shelter is
 * left with no standard, which the page says out loud, never with two.
 */
export async function setStandardRecipe(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.setStandardRecipe", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const supabase = await createClient();
    const cleared = await supabase.from("diets").update({ is_standard: false }).eq("is_standard", true);
    if (cleared.error) return refuse(cleared.error.message);
    const { error } = await supabase.from("diets").update({ is_standard: true }).eq("id", id);
    if (error) return refuse(error.message);
    revalidateRecipePages();
    return { ok: true };
  });
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.deleteRecipe", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const supabase = await createClient();
    const { count, error: countError } = await residentRecordCount(supabase, id);
    if (countError) return refuse(countError.message);
    if (count > 0) return refuse(t.admin.diets.recipes.errors.inUse(count));
    const { error } = await supabase.from("diets").delete().eq("id", id);
    if (error) return refuse(error.message);
    revalidateRecipePages();
    return { ok: true };
  });
}

/**
 * The columns the database forecast still reads (0239's diet_forecast reads qty_small/medium/large until a
 * cleanup migration moves it to qty_per_serving). The app owns the truth in qty_per_serving and keeps these
 * equal to qty_per_serving x servings, so the forecast and the sheets can never disagree.
 */
function derivedAmounts(qtyPerServing: number, servings: DietServings) {
  return {
    qty_per_serving: qtyPerServing,
    qty_small: qtyPerServing * servings.small,
    qty_medium: qtyPerServing * servings.medium,
    qty_large: qtyPerServing * servings.large,
  };
}

async function loadServings(supabase: Supabase, dietId: string) {
  const { data, error } = await supabase
    .from("diets")
    .select("servings_small, servings_medium, servings_large")
    .eq("id", dietId)
    .single<{ servings_small: number | string; servings_medium: number | string; servings_large: number | string }>();
  if (error || !data) return { servings: null, error: error?.message ?? "" };
  return {
    servings: { small: Number(data.servings_small), medium: Number(data.servings_medium), large: Number(data.servings_large) },
    error: null,
  };
}

/** Adds the ingredient to the recipe or changes its amount per serving (one line per ingredient). */
export async function saveRecipeLine(dietId: string, fields: RecipeLineFields): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.diets.recipes.errors;
  return runAction("diets.saveRecipeLine", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    if (!fields.ingredientId) return refuse(e.pickIngredient);
    const qty = Number(optional(fields.qty) ?? "");
    if (!Number.isFinite(qty) || qty <= 0) return refuse(e.amountsInvalid);
    const supabase = await createClient();
    const { servings, error: servingsError } = await loadServings(supabase, dietId);
    if (!servings) return refuse(servingsError ?? "");
    // A serving unit with no conversion is refused by a trigger (0239) with a plain message.
    const { error } = await supabase.from("diet_ingredients").upsert(
      {
        diet_id: dietId,
        diet_type_id: fields.ingredientId,
        serving_unit: optional(fields.servingUnit),
        ...derivedAmounts(qty, servings),
      },
      { onConflict: "diet_id,diet_type_id" },
    );
    if (error) return refuse(error.message);
    revalidateRecipePages();
    return { ok: true };
  });
}

/** Sets how many servings a small, medium and large dog gets in a day, then re-derives every line. */
export async function saveServings(dietId: string, fields: ServingsFields): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.diets.recipes.errors;
  return runAction("diets.saveServings", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const [small, medium, large] = [fields.small, fields.medium, fields.large].map((v) => Number(optional(v) ?? ""));
    if ([small, medium, large].some((q) => !Number.isFinite(q) || q <= 0)) return refuse(e.servingsInvalid);
    const servings = { small, medium, large };
    const supabase = await createClient();
    const lines = await supabase
      .from("diet_ingredients")
      .select("diet_type_id, serving_unit, qty_per_serving")
      .eq("diet_id", dietId)
      .returns<{ diet_type_id: string; serving_unit: string | null; qty_per_serving: number | string | null }[]>();
    if (lines.error) return refuse(lines.error.message);
    // Lines first, diet last: a failure part-way leaves the shown servings unchanged and the page says so.
    for (const line of lines.data ?? []) {
      const { error } = await supabase
        .from("diet_ingredients")
        .update(derivedAmounts(Number(line.qty_per_serving), servings))
        .eq("diet_id", dietId)
        .eq("diet_type_id", line.diet_type_id);
      if (error) return refuse(error.message);
    }
    const { error } = await supabase
      .from("diets")
      .update({ servings_small: small, servings_medium: medium, servings_large: large })
      .eq("id", dietId);
    if (error) return refuse(error.message);
    revalidateRecipePages();
    return { ok: true };
  });
}

export async function removeRecipeLine(dietId: string, ingredientId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("diets.removeRecipeLine", t.common.somethingWentWrong, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const supabase = await createClient();
    const lines = await supabase
      .from("diet_ingredients")
      .select("diet_type_id", { count: "exact", head: true })
      .eq("diet_id", dietId);
    if (lines.error) return refuse(lines.error.message);
    if ((lines.count ?? 0) <= 1) {
      const { count } = await residentRecordCount(supabase, dietId);
      if (count > 0) return refuse(t.admin.diets.recipes.errors.lastLineInUse);
    }
    const { error } = await supabase
      .from("diet_ingredients")
      .delete()
      .eq("diet_id", dietId)
      .eq("diet_type_id", ingredientId);
    if (error) return refuse(error.message);
    revalidateRecipePages();
    return { ok: true };
  });
}
