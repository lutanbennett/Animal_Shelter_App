# Diets are written as one serving: the app half (0250)

Lutan's rulings, 2026-10-22: a serving is ONE DAY's food; fractions are fine and nothing is rounded before a total;
his worked example is the Standard diet (Small 1 / Medium 1.5 / Large 2 servings; 1 serving = kibble 0.5 cup, egg 1,
rice 0.5 cup, chicken 50 g).

## Supersedes the three-amount line

**SUPERSEDED 2026-10-23:** `2026-10-21-a-diet-is-a-recipe-of-ingredients.md` says each `diet_ingredients` line
carries three amounts (small / medium / large) for one day's food. The app now writes ONE amount per serving
(`qty_per_serving`) and the diet holds `servings_small/medium/large`. That file's other decisions (a diet is a
recipe, ingredients stay `diet_types`, `portion_factor`, serving units) stand.

## What was built

- `src/lib/diets/servings.ts`: the one expansion. per day = `qty_per_serving` x servings for the dog's size
  (Medium when unset) x `portion_factor`; per meal = day / `meals_per_day`. Exact arithmetic; `formatAmount`
  (three decimals) is the only rounding, for display. The kitchen batch sheet reuses these functions.
- Editor: Amount per serving on a line; a Servings by size row on the diet; each line shows its per-day amount for
  each size. `plausible.ts` warns (confirm past) above 5 servings a day.
- `loadDietOptions` still gives callers `small/medium/large` day amounts, now computed from the serving, so the
  resident page, resident archive and diet form needed no change.
- The feeding list shows the day's total beside the per-meal amount.

## The forecast: how it stays right with no migration

The brief forbids a migration here, and `diet_forecast()` / `stock_diet_forecast()` still read
`qty_small/medium/large`. So every save from the editor writes `qty_per_serving` AND `qty_* = qty_per_serving x
servings`; saving the servings re-derives every line of that diet. The forecast therefore equals what the page
shows for any line saved since this change (`scripts/check-diets-servings-app.mjs`: forecast = hand calculation).
The 0250 bridge trigger re-derives `qty_per_serving` from `qty_small` only when `qty_small` changes and
`qty_per_serving` does not; here both are always written together, so it leaves the serving alone.

## Left open, on purpose

- **Lines nobody has re-saved still hold their old amounts.** On dev 8 of 9 lines are out of proportion, so the
  page shows the Small-based figure while the forecast uses the stored Medium/Large until the line or the diet's
  servings is saved. Which figure is right is Lutan's call per line (0250's own rule); no code decides it.
- The function-only migration that moves the forecasts to `qty_per_serving`, then the cleanup migration that drops
  `qty_small/medium/large` and the bridge trigger, are separate streams. After the first, nothing reads those
  columns (the app only writes them).
- Saving servings updates the lines one by one, then the diet; a failure part-way leaves the diet's shown servings
  unchanged and the page says so, and saving again repairs it.
