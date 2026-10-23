/**
 * Diets are written as ONE serving (0250). A serving is one day's food (Lutan, 2026-10-22), so
 * per day = amount per serving x the diet's servings for the dog's size x the dog's portion factor.
 * The same expansion the kitchen batch sheet and the stock forecast use: keep every step exact and
 * round only what is displayed (a zone's batch is summed from unrounded per-dog amounts).
 */

export type DietServings = { small: number; medium: number; large: number };

/** What a new diet starts with, matching the column defaults in 0250. */
export const DEFAULT_SERVINGS: DietServings = { small: 1, medium: 1.5, large: 2 };

/** The servings a dog of this size gets in a day; an unset size reads as Medium, as the forecast does. */
export function servingsFor(servings: DietServings, size: string | null | undefined): number {
  if (size === "Small") return servings.small;
  if (size === "Large") return servings.large;
  return servings.medium;
}

/** One ingredient's amount for a dog for the whole day, unrounded. */
export function dayAmount(qtyPerServing: number, servings: DietServings, size: string | null | undefined, portionFactor: number | null | undefined = null): number {
  return qtyPerServing * servingsFor(servings, size) * (portionFactor ?? 1);
}

/** The day's amount split across the meals; with no meals on record the day is one round. */
export function perMealAmount(dayQty: number, mealsPerDay: number | null | undefined): number {
  return dayQty / (mealsPerDay && mealsPerDay > 0 ? mealsPerDay : 1);
}

/** For display only: up to three decimals, no trailing zeros ("0.375", "37.5", "2"). */
export function formatAmount(value: number): string {
  return String(Number(value.toFixed(3)));
}
