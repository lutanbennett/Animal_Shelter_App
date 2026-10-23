/** More meals than this in a day is almost certainly a slipped finger. */
export const MAX_PLAUSIBLE_MEALS = 8;
/** A portion factor above this is flagged: three times the recipe is a typo far more often than a dog. */
export const MAX_PORTION_FACTOR = 3;

/**
 * Why a diet looks like a typo, or null when it looks ordinary. A warning the
 * user can confirm past, not a hard limit: a big dog may really eat a lot,
 * and a block would push staff to type something false.
 */
export function implausibleDiet(d: {
  mealsPerDay: number;
  portionFactor: number | null;
}): "meals" | "quantity" | null {
  if (d.mealsPerDay > MAX_PLAUSIBLE_MEALS) return "meals";
  if (d.portionFactor != null && d.portionFactor > MAX_PORTION_FACTOR) return "quantity";
  return null;
}

/** More servings than this in a day is flagged: a dog eating five times a serving is a typo far more often than a dog. */
export const MAX_PLAUSIBLE_SERVINGS = 5;

/** True when any size's servings look like a typo (a warning to confirm past, like the rest of this file). */
export function implausibleServings(s: { small: number; medium: number; large: number }): boolean {
  return Math.max(s.small, s.medium, s.large) > MAX_PLAUSIBLE_SERVINGS;
}
