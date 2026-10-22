import type { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/format";
import { formatQuantity } from "@/lib/diets/options";
import { groupConversions, CONVERSION_COLUMNS, type ConversionRow, type UnitConversion } from "@/lib/units";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Settings → Diets, the recipe book: one ingredient (a diet_types row) with the units it can be measured in. */
export type BookIngredient = {
  id: string;
  name: string;
  nameTh: string | null;
  /** Its own stock unit (g, ml, can…). */
  unit: string;
  notes: string | null;
  /** Other ways to measure it (item_unit_conversions): cup, kg, bag… */
  conversions: UnitConversion[];
};

export type BookLine = {
  ingredientId: string;
  /** Null: the amounts are in the ingredient's own unit. */
  servingUnit: string | null;
  small: number;
  medium: number;
  large: number;
};

export type BookRecipe = {
  id: string;
  name: string;
  nameTh: string | null;
  notes: string | null;
  isStandard: boolean;
  lines: BookLine[];
  /** Residents on it today. */
  residentsNow: number;
  /** Every resident_diets row ever written for it — any at all blocks delete. */
  records: number;
};

export type RecipeBook = {
  ingredients: BookIngredient[];
  recipes: BookRecipe[];
  /** Resident records that reach each ingredient through a diet that uses it. */
  recordsByIngredient: Map<string, number>;
  error: string | null;
};

type TypeRow = { id: string; name: string; name_th: string | null; unit: string; notes: string | null };
type DietRow = { id: string; name: string; name_th: string | null; notes: string | null; is_standard: boolean };
type LineRow = {
  diet_id: string;
  diet_type_id: string;
  serving_unit: string | null;
  qty_small: number | string;
  qty_medium: number | string;
  qty_large: number | string;
};
type ResidentDietRow = { diet_id: string; resident_id: string; start_date: string; end_date: string | null };

/** Everything the four recipe-book screens draw, in one round of reads. */
export async function loadRecipeBook(supabase: Supabase): Promise<RecipeBook> {
  const [types, diets, lines, residentDiets, conversions] = await Promise.all([
    supabase.from("diet_types").select("id, name, name_th, unit, notes").order("name").returns<TypeRow[]>(),
    supabase.from("diets").select("id, name, name_th, notes, is_standard").order("name").returns<DietRow[]>(),
    supabase
      .from("diet_ingredients")
      .select("diet_id, diet_type_id, serving_unit, qty_small, qty_medium, qty_large")
      .returns<LineRow[]>(),
    supabase.from("resident_diets").select("diet_id, resident_id, start_date, end_date").returns<ResidentDietRow[]>(),
    supabase
      .from("item_unit_conversions")
      .select(CONVERSION_COLUMNS)
      .not("diet_type_id", "is", null)
      .returns<ConversionRow[]>(),
  ]);

  const today = todayIso();
  const records = new Map<string, number>();
  const current = new Map<string, Set<string>>();
  for (const row of residentDiets.data ?? []) {
    records.set(row.diet_id, (records.get(row.diet_id) ?? 0) + 1);
    if (row.start_date <= today && (!row.end_date || row.end_date >= today)) {
      const set = current.get(row.diet_id) ?? new Set<string>();
      set.add(row.resident_id);
      current.set(row.diet_id, set);
    }
  }

  const byIngredient = groupConversions(conversions.data ?? []);
  const recordsByIngredient = new Map<string, number>();
  for (const line of lines.data ?? []) {
    recordsByIngredient.set(line.diet_type_id, (recordsByIngredient.get(line.diet_type_id) ?? 0) + (records.get(line.diet_id) ?? 0));
  }

  return {
    ingredients: (types.data ?? []).map((type) => ({
      id: type.id,
      name: type.name,
      nameTh: type.name_th,
      unit: type.unit,
      notes: type.notes,
      conversions: byIngredient[type.id] ?? [],
    })),
    recipes: (diets.data ?? []).map((diet) => ({
      id: diet.id,
      name: diet.name,
      nameTh: diet.name_th,
      notes: diet.notes,
      isStandard: diet.is_standard,
      residentsNow: current.get(diet.id)?.size ?? 0,
      records: records.get(diet.id) ?? 0,
      lines: (lines.data ?? [])
        .filter((line) => line.diet_id === diet.id)
        .map((line) => ({
          ingredientId: line.diet_type_id,
          servingUnit: line.serving_unit,
          small: Number(line.qty_small),
          medium: Number(line.qty_medium),
          large: Number(line.qty_large),
        })),
    })),
    recordsByIngredient,
    error: types.error?.message ?? diets.error?.message ?? lines.error?.message ?? residentDiets.error?.message ?? null,
  };
}

export type Size = "small" | "medium" | "large";
export const SIZES: Size[] = ["small", "medium", "large"];

/** "cup" becomes "cups" for any amount but 1; short symbols (g, ml) and phrases are left alone. */
export function pluralUnit(unit: string, qty: number): string {
  return qty !== 1 && /^[a-z]{3,}$/.test(unit) && !unit.endsWith("s") ? `${unit}s` : unit;
}

/** The unit word for an amount: "cups", "can", "g". `ownLabel` is the translated label of the ingredient's own unit. */
export function unitText(qty: number, servingUnit: string | null, ownLabel: string): string {
  // The dictionary labels its own units "can(s)"; in a sentence that is "can" or "cans".
  return servingUnit ? pluralUnit(servingUnit, qty) : ownLabel.replace("(s)", qty === 1 ? "" : "s");
}

/** "1.5 cups", "200 g". */
export function amountText(qty: number, servingUnit: string | null, ownLabel: string): string {
  return `${formatQuantity(qty)} ${unitText(qty, servingUnit, ownLabel)}`;
}

/**
 * One size's total across a recipe, grouped by what the lines are measured in, so a recipe of
 * 1 cup + 1.5 cups + 1.5 cups reads "4 cups" and a mixed one reads "3 cups + 200 g".
 * Amounts in different units are never added together.
 */
export function totalText(
  lines: BookLine[],
  size: Size,
  ingredientUnit: (ingredientId: string) => string,
  ownLabel: (unit: string) => string,
): string | null {
  const totals = new Map<string, { servingUnit: string | null; own: string; qty: number }>();
  for (const line of lines) {
    const own = ingredientUnit(line.ingredientId);
    const key = line.servingUnit ?? `\u0000${own}`;
    const entry = totals.get(key) ?? { servingUnit: line.servingUnit, own, qty: 0 };
    entry.qty += line[size];
    totals.set(key, entry);
  }
  if (totals.size === 0) return null;
  return [...totals.values()]
    .map((entry) => amountText(Math.round(entry.qty * 1000) / 1000, entry.servingUnit, ownLabel(entry.own)))
    .join(" + ");
}
