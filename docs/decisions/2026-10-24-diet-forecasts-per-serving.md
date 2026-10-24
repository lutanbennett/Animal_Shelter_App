# The two diet forecasts read the per-serving columns (0254)

2026-10-24, `claude/diets-and-stock-switches-schema`. Shared migration `0254` with
`2026-10-24-stocktaking-switches-schema.md`: only one in-flight branch may carry a migration, so two unrelated
subjects went in one file.

## What changed

`diet_forecast()` and `stock_diet_forecast()` (last defined in `0239`) now compute, per day,
`qty_per_serving` x the diet's `servings_{small,medium,large}` for the dog's size (Medium when unset) x
`resident_diets.portion_factor` x the unit conversion. Same signatures, columns and grants. A serving is one day's
food (Lutan, 2026-10-22), so there is no meals-per-day factor and nothing is rounded.

## Why it moves no figure

Production is in proportion on every line (`check-diets-proportion.mjs --env production`: 0 lines, read
2026-10-24 14:20 local, after Lutan fixed Kidney Support himself on 2026-10-23). The app has also written
`qty_per_serving x servings` into the old columns on every save since `diets-servings-app`, so old and new
arithmetic agree. This is an anti-drift step: a line nobody re-saves can no longer diverge from what the page shows.

## Why plain columns, no `coalesce` back to `qty_small`

A fallback would keep the old columns alive in the function and make the later drop harder. Nulls are not a risk
today (the harness asserts none on dev, and 0250's bridge fills one on insert), but a null would silently drop out
of the sum, so `check-diets-forecast-functions.mjs` checks for it.

## Left alone, on purpose

`qty_small/medium/large` and 0250's bridge trigger stay. They go in a later cleanup migration once the app stops
writing them (the chain is: this, stop writing, drop).
