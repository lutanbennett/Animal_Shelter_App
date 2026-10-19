/** More meals than this in a day is almost certainly a slipped finger. */
export const MAX_PLAUSIBLE_MEALS = 8;
/** A daily amount above this many times the type's biggest default is flagged. */
export const MAX_QUANTITY_RATIO = 3;

type Defaults = { daily_qty_small: number; daily_qty_medium: number; daily_qty_large: number };

/**
 * Why a diet looks like a typo, or null when it looks ordinary. A warning the
 * user can confirm past, not a hard limit: a big dog may really eat a lot,
 * and a block would push staff to type something false.
 */
export function implausibleDiet(d: {
  mealsPerDay: number;
  dailyQuantity: number | null;
  type: Defaults;
}): "meals" | "quantity" | null {
  if (d.mealsPerDay > MAX_PLAUSIBLE_MEALS) return "meals";
  if (d.dailyQuantity != null) {
    const biggest = Math.max(Number(d.type.daily_qty_small), Number(d.type.daily_qty_medium), Number(d.type.daily_qty_large));
    if (biggest > 0 && d.dailyQuantity > biggest * MAX_QUANTITY_RATIO) return "quantity";
  }
  return null;
}
