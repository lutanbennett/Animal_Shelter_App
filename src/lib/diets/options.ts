import type { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/locales";
import { localLabel } from "@/lib/translations/labels";

/** A diet_types row as the diet form and tab need it (0051). */
export type DietTypeOption = {
  id: string;
  name: string;
  unit: string;
  daily_qty_small: number;
  daily_qty_medium: number;
  daily_qty_large: number;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** `name` comes back in the reader's language where it has one (0166); the form keys on `id`. */
export async function loadDietTypeOptions(supabase: Supabase, locale: Locale) {
  const { data, error } = await supabase
    .from("picker_diet_types")
    .select("id, name, name_th, unit, daily_qty_small, daily_qty_medium, daily_qty_large")
    .order("name")
    .returns<(DietTypeOption & { name_th: string | null })[]>();
  return {
    data: data?.map(({ name_th, ...type }) => ({ ...type, name: localLabel(locale, type.name, name_th) })) ?? null,
    error,
  };
}

/**
 * The diet type's default daily quantity for a resident's size. An unset
 * size (a resident intaken before 0051) reads as Medium, as the forecast
 * does.
 */
export function defaultDailyQuantity(
  type: Pick<DietTypeOption, "daily_qty_small" | "daily_qty_medium" | "daily_qty_large">,
  size: string | null | undefined,
): number {
  if (size === "Small") return Number(type.daily_qty_small);
  if (size === "Large") return Number(type.daily_qty_large);
  return Number(type.daily_qty_medium);
}

/** "150" / "1.5" — a quantity without trailing zeros, for labels. */
export function formatQuantity(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}
