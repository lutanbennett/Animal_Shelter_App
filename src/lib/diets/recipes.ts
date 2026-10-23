import type { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/locales";
import { localLabel } from "@/lib/translations/labels";
import { dayAmount, type DietServings } from "@/lib/diets/servings";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** One ingredient line of a recipe: the amount in ONE serving (0250), with the day's amount per size worked out. */
export type RecipeLine = {
  ingredientId: string;
  ingredient: string;
  /** The ingredient's own (stock) unit, e.g. "kg". */
  unit: string;
  /** A serving unit such as "cup"; null means the amounts are in `unit`. */
  servingUnit: string | null;
  /** The amount in one serving, in servingUnit (or the ingredient's own unit). */
  qtyPerServing: number;
  /** The whole day's amount for a dog of each size (qtyPerServing x the diet's servings), unrounded. */
  small: number;
  medium: number;
  large: number;
};

/** A diet as staff pick it: a recipe of ingredients. */
export type DietOption = {
  id: string;
  name: string;
  isStandard: boolean;
  servings: DietServings;
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
      .select("id, name, name_th, is_standard, servings_small, servings_medium, servings_large")
      .order("name")
      .returns<
        {
          id: string;
          name: string;
          name_th: string | null;
          is_standard: boolean;
          servings_small: number | string;
          servings_medium: number | string;
          servings_large: number | string;
        }[]
      >(),
    supabase
      .from("diet_ingredients")
      .select("diet_id, diet_type_id, serving_unit, qty_per_serving")
      .returns<
        {
          diet_id: string;
          diet_type_id: string;
          serving_unit: string | null;
          qty_per_serving: number | string | null;
        }[]
      >(),
    supabase
      .from("picker_diet_types")
      .select("id, name, name_th, unit")
      .returns<{ id: string; name: string; name_th: string | null; unit: string }[]>(),
  ]);

  const ingredientById = new Map((ingredients.data ?? []).map((i) => [i.id, i]));
  const servingsByDiet = new Map<string, DietServings>(
    (diets.data ?? []).map((d) => [
      d.id,
      { small: Number(d.servings_small), medium: Number(d.servings_medium), large: Number(d.servings_large) },
    ]),
  );
  const linesByDiet = new Map<string, RecipeLine[]>();
  for (const row of lines.data ?? []) {
    const ingredient = ingredientById.get(row.diet_type_id);
    const servings = servingsByDiet.get(row.diet_id);
    if (!ingredient || !servings) continue;
    const qtyPerServing = Number(row.qty_per_serving ?? 0);
    const list = linesByDiet.get(row.diet_id) ?? [];
    list.push({
      ingredientId: row.diet_type_id,
      ingredient: localLabel(locale, ingredient.name, ingredient.name_th),
      unit: ingredient.unit,
      servingUnit: row.serving_unit,
      qtyPerServing,
      small: dayAmount(qtyPerServing, servings, "Small"),
      medium: dayAmount(qtyPerServing, servings, "Medium"),
      large: dayAmount(qtyPerServing, servings, "Large"),
    });
    linesByDiet.set(row.diet_id, list);
  }

  const data: DietOption[] | null = diets.data
    ? diets.data.map((d) => ({
        id: d.id,
        name: localLabel(locale, d.name, d.name_th),
        isStandard: d.is_standard,
        servings: servingsByDiet.get(d.id)!,
        lines: (linesByDiet.get(d.id) ?? []).sort((a, b) => a.ingredient.localeCompare(b.ingredient)),
      }))
    : null;
  return { data, error: diets.error ?? lines.error ?? ingredients.error };
}
