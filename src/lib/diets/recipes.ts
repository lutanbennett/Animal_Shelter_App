import type { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/locales";
import { localLabel } from "@/lib/translations/labels";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** One ingredient line of a recipe: amounts for one day's serve (0239). */
export type RecipeLine = {
  ingredientId: string;
  ingredient: string;
  /** The ingredient's own (stock) unit, e.g. "kg". */
  unit: string;
  /** A serving unit such as "cup"; null means the amounts are in `unit`. */
  servingUnit: string | null;
  small: number;
  medium: number;
  large: number;
};

/** A diet as staff pick it: a recipe of ingredients. */
export type DietOption = {
  id: string;
  name: string;
  isStandard: boolean;
  lines: RecipeLine[];
};

/** A line's amount for a resident's size; an unset size reads as Medium, as the forecast does. */
export function lineAmount(line: Pick<RecipeLine, "small" | "medium" | "large">, size: string | null | undefined): number {
  if (size === "Small") return line.small;
  if (size === "Large") return line.large;
  return line.medium;
}

/** The largest amount a recipe line gives any size, for the "looks like a typo" check. */
export function largestAmount(line: Pick<RecipeLine, "small" | "medium" | "large">): number {
  return Math.max(line.small, line.medium, line.large);
}

/**
 * Every recipe with its ingredient lines, names in the reader's language where
 * they have one (0166). Ingredient names come from the price-free picker view
 * (0151): the table itself is closed to logins without the price cell.
 */
export async function loadDietOptions(supabase: Supabase, locale: Locale) {
  const [diets, lines, ingredients] = await Promise.all([
    supabase
      .from("diets")
      .select("id, name, name_th, is_standard")
      .order("name")
      .returns<{ id: string; name: string; name_th: string | null; is_standard: boolean }[]>(),
    supabase
      .from("diet_ingredients")
      .select("diet_id, diet_type_id, serving_unit, qty_small, qty_medium, qty_large")
      .returns<
        {
          diet_id: string;
          diet_type_id: string;
          serving_unit: string | null;
          qty_small: number | string;
          qty_medium: number | string;
          qty_large: number | string;
        }[]
      >(),
    supabase
      .from("picker_diet_types")
      .select("id, name, name_th, unit")
      .returns<{ id: string; name: string; name_th: string | null; unit: string }[]>(),
  ]);

  const ingredientById = new Map((ingredients.data ?? []).map((i) => [i.id, i]));
  const linesByDiet = new Map<string, RecipeLine[]>();
  for (const row of lines.data ?? []) {
    const ingredient = ingredientById.get(row.diet_type_id);
    if (!ingredient) continue;
    const list = linesByDiet.get(row.diet_id) ?? [];
    list.push({
      ingredientId: row.diet_type_id,
      ingredient: localLabel(locale, ingredient.name, ingredient.name_th),
      unit: ingredient.unit,
      servingUnit: row.serving_unit,
      small: Number(row.qty_small),
      medium: Number(row.qty_medium),
      large: Number(row.qty_large),
    });
    linesByDiet.set(row.diet_id, list);
  }

  const data: DietOption[] | null = diets.data
    ? diets.data.map((d) => ({
        id: d.id,
        name: localLabel(locale, d.name, d.name_th),
        isStandard: d.is_standard,
        lines: (linesByDiet.get(d.id) ?? []).sort((a, b) => a.ingredient.localeCompare(b.ingredient)),
      }))
    : null;
  return { data, error: diets.error ?? lines.error ?? ingredients.error };
}
