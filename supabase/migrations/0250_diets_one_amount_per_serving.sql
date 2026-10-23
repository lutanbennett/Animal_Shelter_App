-- consumer: src/app/admin/diets/actions.ts, src/app/admin/diets/recipe-actions.ts, src/lib/diets/recipes.ts
--
-- Diets: one amount per serving (backlog: "Simplify diets to 'one serving' recipes"). Schema half.
--
--   diet_ingredients.qty_per_serving   the amount of this ingredient in ONE serving, in serving_unit (or the
--                                      ingredient's own unit when serving_unit is null).
--   diets.servings_small/medium/large  how many servings a small, medium and large dog gets in a day,
--                                      defaulting to 1 / 1.5 / 2, editable per diet.
--   resident_diets.portion_factor      unchanged: the per-dog multiplier on top (0239).
--
-- The forecast, once the app reads this, is per day = qty_per_serving x the diet's servings for the dog's size
-- x portion_factor x the unit conversion. A serving IS one day's food (Lutan, 2026-10-22), so there is no
-- meals-per-day factor; meals_per_day only splits the day into rounds (0137). Nothing is rounded before the
-- total: round only what is displayed.
--
-- WHAT THIS FILE DOES NOT DO: it leaves diet_forecast() and stock_diet_forecast() (0239) alone. They keep
-- reading qty_small/medium/large, so no forecast moves on the day this lands. Medium and Large are not exactly
-- 1.5x and 2x Small on every line today; switching the forecast to the new shape would change those lines'
-- numbers, and that is Lutan's call per line, not this migration's. qty_small/medium/large stay until the app
-- has stopped reading them; a cleanup migration then drops them.
--
-- Back-fill: qty_per_serving = qty_small / servings_small (Small = 1 serving, so the Small amount is the
-- serving). The lines whose Medium and Large amounts are not 1.5x and 2x Small (within 0.005) are named in a
-- NOTICE when this runs, so the list for the database being migrated is in the apply log.
--
-- Bridge for the old app, until the app PR: a line inserted without qty_per_serving gets it from its Small
-- amount, and an edit to qty_small re-derives it. Remove with the cleanup migration.
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table diets add column if not exists servings_small numeric not null default 1
  check (servings_small > 0);
alter table diets add column if not exists servings_medium numeric not null default 1.5
  check (servings_medium > 0);
alter table diets add column if not exists servings_large numeric not null default 2
  check (servings_large > 0);

comment on column diets.servings_small is
  'Servings of this diet a small dog gets in a day (0250). A serving is one day''s food at 1; Medium and Large default to 1.5 and 2.';
comment on column diets.servings_medium is
  'Servings of this diet a medium dog gets in a day (0250). Default 1.5.';
comment on column diets.servings_large is
  'Servings of this diet a large dog gets in a day (0250). Default 2.';

alter table diet_ingredients add column if not exists qty_per_serving numeric
  check (qty_per_serving is null or qty_per_serving > 0);

comment on column diet_ingredients.qty_per_serving is
  'The amount of this ingredient in ONE serving, in serving_unit (null = the ingredient''s own unit) (0250). Back-filled as qty_small / the diet''s servings_small. Replaces qty_small/medium/large, which stay until the app stops reading them.';

-- ---------------------------------------------------------------------------
-- 2. Back-fill, and the lines that are not in proportion
-- ---------------------------------------------------------------------------
update diet_ingredients di
   set qty_per_serving = di.qty_small / d.servings_small
  from diets d
 where d.id = di.diet_id and di.qty_per_serving is null;

do $report$
declare
  r record;
  n int := 0;
begin
  for r in
    select d.name as diet, dt.name as ingredient, di.qty_small, di.qty_medium, di.qty_large
      from diet_ingredients di
      join diets d on d.id = di.diet_id
      join diet_types dt on dt.id = di.diet_type_id
     where abs(di.qty_medium - d.servings_medium / d.servings_small * di.qty_small) > 0.005
        or abs(di.qty_large - d.servings_large / d.servings_small * di.qty_small) > 0.005
     order by d.name, dt.name
  loop
    n := n + 1;
    raise notice 'NOT IN PROPORTION: % / % (small %, medium %, large %)', r.diet, r.ingredient, r.qty_small, r.qty_medium, r.qty_large;
  end loop;
  raise notice '0250: % ingredient line(s) are not in the 1 : 1.5 : 2 proportion. Each is Lutan''s call.', n;
end
$report$;

-- ---------------------------------------------------------------------------
-- 3. Bridge for the old app (until the app PR)
-- ---------------------------------------------------------------------------
create or replace function diet_ingredients_fill_serving()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.qty_per_serving is null
     or (tg_op = 'UPDATE' and new.qty_small is distinct from old.qty_small
         and new.qty_per_serving is not distinct from old.qty_per_serving) then
    select new.qty_small / d.servings_small into new.qty_per_serving
      from diets d where d.id = new.diet_id;
  end if;
  return new;
end;
$$;

drop trigger if exists diet_ingredients_fill_serving on diet_ingredients;
create trigger diet_ingredients_fill_serving
  before insert or update on diet_ingredients
  for each row execute function diet_ingredients_fill_serving();

notify pgrst, 'reload schema';
