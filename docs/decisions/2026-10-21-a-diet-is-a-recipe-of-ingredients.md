# A diet is a recipe of ingredients (supersedes 0051's one-product diet)

Decided 2026-10-21 by Lutan on `docs/diets-ingredients-design.md`; schema half is migration `0239`.

- `diet_types` stays as the **ingredient** list (stock, prices, packs, deliveries, counts untouched). A **diet** is a new `diets` row with `diet_ingredients` lines: amount per day for a small, medium and large dog, in the ingredient's own unit or a serving unit (`cup`) that has an `item_unit_conversions` row.
- The per-resident quantity override becomes `resident_diets.portion_factor`, a multiplier on the whole recipe. The back-fill is `daily_quantity / the size default it replaced`; that division can differ from the old figure in the 16th digit, so the proof compares to 1e-9, not bit for bit.
- `diet_forecast()` and `stock_diet_forecast()` keep signature and shape and now return one row per **ingredient**. A one-ingredient recipe gives today's formula; `scripts/check-diets-recipes-schema.mjs` proves it on dev data, before and after, in a rolled-back transaction.
- A serving unit with no conversion is refused by a trigger, so a forecast never meets one.
- **Bridge until the app PR:** triggers fill `diet_id` on rows that name only `diet_type_id`, give a new `diet_types` row its own one-ingredient recipe, and mirror edits to its quantities and standard flag. A diet type *renamed* before the app PR is not followed; the app PR replaces the bridge, and a cleanup migration drops it with `diet_types.daily_qty_*`, `is_standard` and `resident_diets.diet_type_id`/`daily_quantity`.
- The back-fill touches deceased residents' diet rows, so it uses the deceased-lock's transaction-local bypass (as `0026` does).
- Menus say "Diets" (recipes) and "Ingredients" (stock items); the diet sheet lists every ingredient at the dog's size with meals per day.
