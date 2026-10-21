-- consumer: src/app/admin/diets/actions.ts, src/app/admin/diets/page.tsx
--
-- Cleanup after diets became recipes (0239, 0242) and after the Home screen panel went (#812).
-- Nothing in the app reads or writes any of this any more:
--   * the 0239 bridge triggers (resident_diets_fill_recipe, diet_types_mirror_recipe) and their functions;
--   * diet_types.daily_qty_small / _medium / _large and diet_types.is_standard (a recipe holds both now);
--   * resident_diets.diet_type_id and resident_diets.daily_quantity (diet_id and portion_factor replace them);
--   * set_standard_diet(uuid): no caller; it wrote diet_types.is_standard. The standard diet is diets.is_standard,
--     moved from Settings -> Diets (recipe-actions.ts);
--   * role_home_tiles (0225) and its guard: written and read by nothing since #812.
-- diet_forecast and stock_diet_forecast already read recipes (0239), so they are not touched. The two views that
-- still exposed the legacy columns are restated without them, same names, same remaining columns, same grants.
--
-- Apply only once the app that no longer writes daily_qty_* on a new ingredient is live (an older app inserting
-- a diet_types row would otherwise fail on the missing columns).
-- Audit history that names role_home_tiles stays readable: the label and undo mapping are kept in code.
-- Re-runnable: drop ... if exists.

-- 1. The bridge
drop trigger if exists resident_diets_fill_recipe on resident_diets;
drop trigger if exists diet_types_mirror_recipe on diet_types;
drop function if exists resident_diets_fill_recipe();
drop function if exists diet_types_mirror_recipe();
drop function if exists set_standard_diet(uuid);

-- 2. Views that exposed the legacy columns
drop view if exists picker_diet_types;
create view picker_diet_types as
  select id, name, unit, name_th
    from diet_types d
   where (select has_permission('stock.diets', 'read'))
      or (select has_permission('resident.register'))
      or (select has_permission('medical.diet', 'read'));
comment on view picker_diet_types is
  'Ingredients as pickers show them: id, name, unit, Thai name. No price, no stock figure (0151). The per-size quantities and the standard flag moved to diet_ingredients and diets (0243).';
revoke all on picker_diet_types from anon, authenticated, service_role;
grant select on picker_diet_types to authenticated, service_role;

drop view if exists stock_diet_types;
create view stock_diet_types as
  select id, name, unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock, sort_order, name_th
    from diet_types d
   where (select has_permission('stock.count'))
      or (select has_permission('stock.delivery'))
      or (select has_permission('stock.purchasing'));
comment on view stock_diet_types is
  'What the stock screens read of a diet type (0143): name, unit, stock, reorder. No cost, no quantities. Rows for a login holding stock.count, stock.delivery or stock.purchasing. A new diet_types column is private until it is added here.';
revoke all on stock_diet_types from anon, authenticated, service_role;
grant select on stock_diet_types to authenticated, service_role;

-- 3. The columns (their checks and indexes go with them)
alter table diet_types
  drop column if exists daily_qty_small,
  drop column if exists daily_qty_medium,
  drop column if exists daily_qty_large,
  drop column if exists is_standard;
alter table resident_diets
  drop column if exists diet_type_id,
  drop column if exists daily_quantity;

-- 4. The dead Home screen table
drop table if exists role_home_tiles;
drop function if exists role_home_tiles_guard();

notify pgrst, 'reload schema';
