-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/lib/diets/recipe-book.ts, src/app/admin/diets/page.tsx, src/app/admin/diets/actions.ts, src/app/admin/diets/recipe-actions.ts, src/app/management/units/actions.ts, src/app/deliveries/promote-actions.ts
--
-- SETTINGS → DIETS GETS ONE CARD (#d3cw7). Lutan, 2026-11-08, asked directly: one card opens diet settings, over splitting the page.
--
-- THE FAULT. /admin/diets and every action on it asked canEditItemSettings(perms, "diet"): reference.types Edit AND stock.diets Edit
-- together. Nothing anywhere a person looks said the page needed two cells, so a role given one of them got a tile it could not use or
-- no tile and no explanation (cardTile() in src/lib/home/tiles.ts). Reported by #1370, docs/decisions/2026-11-07-control-gates-list-pages.md.
--
-- THE ACTIVITY: diets.settings (yes/no). Every screen and every action of Settings → Diets asks it and nothing else: the recipe book,
-- a diet's page, the ingredients list, an ingredient's page, add / change / delete an ingredient or a diet, its lines, its servings,
-- the standard flag, and the ways an ingredient is measured (item_unit_conversions rows for an ingredient). Yes/no, not a level,
-- because there is nothing on these screens to read that is not also offered to change: one question, one answer.
-- It is NOT stock.diets alone (the item forbids it: that would widen a cell the stock side already uses) and NOT reference.types.
--
-- THE CARD: diet_settings, holding diets.settings and nothing else, filed under the stock feature beside the food forecast.
-- Equal to src/lib/permissions/cards.ts cell for cell (scripts/check-card-grants.mjs fails when they differ).
--
-- WHAT THE CARD APPLIES (a card must apply the access that lets its activity be performed, CLAUDE.md). New PERMISSIVE policies, added
-- beside the existing ones and never replacing them, so nobody who could read or write these rows before loses anything:
--   diet_types, diets, diet_ingredients   select, insert, update, delete
--   item_unit_conversions                 the same four, on an ingredient's rows only (diet_type_id is not null)
--   units                                 select: the unit picker on an ingredient and a recipe line reads the list
-- and one function, diet_usage(), which tells the recipe book how many residents are on each diet now and how many diet records
-- name it, as COUNTS. The page used to read resident_diets for that, which asks medical.diet; a card for setting up recipes should
-- not be handed who eats what, and without it the book read every diet as unused and Delete hit the foreign key's raw error.
--
-- NOBODY IS GIVEN THE CARD. On dev, 2026-11-09, no card in the catalogue grants reference.types or stock.diets at Edit, so no role
-- could open this page through its cards: Admin alone used it, and Admin sits outside the card system. There is no one to back-fill.
-- Lutan rebuilds the card assignments himself.
--
-- Additive and re-runnable. To undo: drop the seventeen *_diet_settings policies and the function, delete the card rows, then the activity row.

-- ---------------------------------------------------------------------------
-- 1. The activity. Sort 87, after 86 (0338): sort is compared per key with the migration that seeded it, so nothing is renumbered.
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('diets.settings', 'yesno', 'settings', 87)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- 2. The card, and the feature it is filed under (the food forecast's)
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level)
values ('diet_settings', 'diets.settings', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'diet_settings', cf.feature_id from card_features cf where cf.card = 'food_forecast'
on conflict (card) do update set feature_id = excluded.feature_id;

-- ---------------------------------------------------------------------------
-- 3. The policies the card applies
-- ---------------------------------------------------------------------------
drop policy if exists diet_types_select_diet_settings on diet_types;
create policy diet_types_select_diet_settings on diet_types for select to authenticated
  using ((select has_permission('diets.settings')));
drop policy if exists diet_types_insert_diet_settings on diet_types;
create policy diet_types_insert_diet_settings on diet_types for insert to authenticated
  with check ((select has_permission('diets.settings')));
drop policy if exists diet_types_update_diet_settings on diet_types;
create policy diet_types_update_diet_settings on diet_types for update to authenticated
  using ((select has_permission('diets.settings')))
  with check ((select has_permission('diets.settings')));
drop policy if exists diet_types_delete_diet_settings on diet_types;
create policy diet_types_delete_diet_settings on diet_types for delete to authenticated
  using ((select has_permission('diets.settings')));

drop policy if exists diets_select_diet_settings on diets;
create policy diets_select_diet_settings on diets for select to authenticated
  using ((select has_permission('diets.settings')));
drop policy if exists diets_insert_diet_settings on diets;
create policy diets_insert_diet_settings on diets for insert to authenticated
  with check ((select has_permission('diets.settings')));
drop policy if exists diets_update_diet_settings on diets;
create policy diets_update_diet_settings on diets for update to authenticated
  using ((select has_permission('diets.settings')))
  with check ((select has_permission('diets.settings')));
drop policy if exists diets_delete_diet_settings on diets;
create policy diets_delete_diet_settings on diets for delete to authenticated
  using ((select has_permission('diets.settings')));

drop policy if exists diet_ingredients_select_diet_settings on diet_ingredients;
create policy diet_ingredients_select_diet_settings on diet_ingredients for select to authenticated
  using ((select has_permission('diets.settings')));
drop policy if exists diet_ingredients_insert_diet_settings on diet_ingredients;
create policy diet_ingredients_insert_diet_settings on diet_ingredients for insert to authenticated
  with check ((select has_permission('diets.settings')));
drop policy if exists diet_ingredients_update_diet_settings on diet_ingredients;
create policy diet_ingredients_update_diet_settings on diet_ingredients for update to authenticated
  using ((select has_permission('diets.settings')))
  with check ((select has_permission('diets.settings')));
drop policy if exists diet_ingredients_delete_diet_settings on diet_ingredients;
create policy diet_ingredients_delete_diet_settings on diet_ingredients for delete to authenticated
  using ((select has_permission('diets.settings')));

-- An ingredient's ways of measuring only: a medicine's rows stay with whatever already guards them.
drop policy if exists item_unit_conversions_select_diet_settings on item_unit_conversions;
create policy item_unit_conversions_select_diet_settings on item_unit_conversions for select to authenticated
  using (diet_type_id is not null and (select has_permission('diets.settings')));
drop policy if exists item_unit_conversions_insert_diet_settings on item_unit_conversions;
create policy item_unit_conversions_insert_diet_settings on item_unit_conversions for insert to authenticated
  with check (diet_type_id is not null and (select has_permission('diets.settings')));
drop policy if exists item_unit_conversions_update_diet_settings on item_unit_conversions;
create policy item_unit_conversions_update_diet_settings on item_unit_conversions for update to authenticated
  using (diet_type_id is not null and (select has_permission('diets.settings')))
  with check (diet_type_id is not null and (select has_permission('diets.settings')));
drop policy if exists item_unit_conversions_delete_diet_settings on item_unit_conversions;
create policy item_unit_conversions_delete_diet_settings on item_unit_conversions for delete to authenticated
  using (diet_type_id is not null and (select has_permission('diets.settings')));

drop policy if exists units_select_diet_settings on units;
create policy units_select_diet_settings on units for select to authenticated
  using ((select has_permission('diets.settings')));

-- ---------------------------------------------------------------------------
-- 4. diet_usage(): counts, never who. Definer so it can count resident_diets for a caller who may not read it; it refuses at the top
-- unless the caller holds diets.settings (Admin passes inside has_permission()).
-- ---------------------------------------------------------------------------
create or replace function diet_usage()
returns table (diet_id uuid, residents_now integer, records integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (select has_permission('diets.settings')) then
    raise exception 'diets.settings_not_allowed' using errcode = '42501';
  end if;
  return query
    select rd.diet_id,
           (count(distinct rd.resident_id) filter (
              where rd.start_date <= shelter_today() and (rd.end_date is null or rd.end_date >= shelter_today())))::integer,
           count(*)::integer
      from resident_diets rd
     where rd.diet_id is not null
     group by rd.diet_id;
end
$$;

revoke all on function diet_usage() from public, anon;
grant execute on function diet_usage() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Proof
-- ---------------------------------------------------------------------------
do $report$
begin
  if not exists (select 1 from public.permission_activities where key = 'diets.settings' and kind = 'yesno') then
    raise exception '0340 diets.settings is not in permission_activities after this file ran';
  end if;
  if not exists (select 1 from public.card_grants where card = 'diet_settings' and activity = 'diets.settings' and level = 2) then
    raise exception '0340 the diet_settings card does not grant diets.settings after this file ran';
  end if;
  if exists (select 1 from public.card_grants where card = 'diet_settings' and activity <> 'diets.settings') then
    raise exception '0340 the diet_settings card grants something besides diets.settings, which it must never do';
  end if;
  if not exists (select 1 from public.card_features where card = 'diet_settings') then
    raise exception '0340 the diet_settings card is not filed under a feature, so it would read Not yet sorted';
  end if;
  if (select count(*) from pg_policies where policyname like '%\_diet\_settings' escape '\'
        and tablename in ('diet_types', 'diets', 'diet_ingredients', 'item_unit_conversions', 'units')) <> 17 then
    raise exception '0340 expected seventeen diet_settings policies';
  end if;
end
$report$;

notify pgrst, 'reload schema';
