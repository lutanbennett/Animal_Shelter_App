# Feed Special Diets and intake read recipes (migration 0242)

Follows `2026-10-21-diets-app-half.md`, which said not to release the app half without this.

- `special_diet_list` now joins `resident_diets.diet_id` -> `diets` -> `diet_ingredients` and filters on `diets.is_standard`. It returns **one row per ingredient**, not per diet, so the quantity stays a single number: the resident's size (Medium when unset) times `portion_factor`. Existing columns keep name and order (`diet_name` is the recipe, `diet_type_id` the ingredient, `diet_unit` the serving unit or the ingredient's unit); `diet_id`, `ingredient_name`, `ingredient_name_th` are appended. `special-list.ts` folds the rows back into one diet with a list of ingredients.
- `record_intake` takes `p_diet_id` (the old `p_diet_type_id` overload is dropped, so a caller passing the old name fails loudly). New view `picker_diets` feeds the intake picker. The check scripts that call `record_intake` were moved to `p_diet_id`.
- Pre-recipe diets keep working because every one has a same-named recipe from the 0239 back-fill.
- **`dropBridgeRecipe` is deliberately kept.** The brief asked to remove it, but the 0239 trigger that creates a same-named recipe for every new ingredient is still live until the cleanup migration, and the intake picker now lists recipes, so removing it would put "Chicken" in the intake picker. It goes with the triggers. `legacyDietTypeId` is removed: nothing reads `resident_diets.diet_type_id` now.
- Not done (the next stream): dropping the bridge triggers, `diet_types.daily_qty_*`/`is_standard`, `resident_diets.diet_type_id`/`daily_quantity`.
- Proof: `node scripts/check-diets-sheet.mjs` (rolled back on dev).
