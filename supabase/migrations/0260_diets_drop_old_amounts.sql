-- consumer: none
--
-- Link 4 of 4 in "Simplify diets to 'one serving' recipes". Drops the three per-size amount columns on
-- diet_ingredients and 0250's bridge that kept qty_per_serving in step with qty_small.
--   * Readers moved to qty_per_serving x servings in 0254 (forecasts) and 0258 (special_diet_list); the app
--     stopped writing the old columns in #918. Nothing reads them any more.
--   * The bridge trigger and function go first: the trigger names qty_small, so the column cannot drop while it exists.
--   * The (qty_x > 0) CHECK constraints are dropped with their columns.
-- Re-runnable.

drop trigger if exists diet_ingredients_fill_serving on diet_ingredients;
drop function if exists diet_ingredients_fill_serving();

alter table diet_ingredients
  drop column if exists qty_small,
  drop column if exists qty_medium,
  drop column if exists qty_large;

notify pgrst, 'reload schema';
