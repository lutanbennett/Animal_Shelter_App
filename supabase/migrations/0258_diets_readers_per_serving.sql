-- consumer: src/lib/diets/special-list.ts, src/app/medical/diets/page.tsx
--
-- Link 2 of 4 in "Simplify diets to 'one serving' recipes". Schema only; the app and the drop are links 3 and 4.
--   1. special_diet_list reads diet_ingredients.qty_per_serving x the diet's servings for the resident's size
--      (0254's shape) instead of qty_small / qty_medium / qty_large. Same columns, same order, same grants.
--   2. qty_small / qty_medium / qty_large lose NOT NULL so the app can stop writing them (link 3). Their
--      check (qty_x > 0) constraints stay: a CHECK fails only on FALSE and NULL > 0 is unknown, so they already
--      allow NULL. Dropping them is link 4.
--   3. The 0250 bridge trigger no longer fires on a NULL qty_small. Once the column is nullable, an update that
--      blanked it would have overwritten a good qty_per_serving with NULL / servings = NULL.
-- Re-runnable.

create or replace view special_diet_list as
select rd.id as resident_diet_id,
       r.id as resident_id,
       r.name,
       r.thai_name,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.name as zone_name,
       z.name_th as zone_name_th,
       t.id as diet_type_id,
       dd.name as diet_name,
       coalesce(nullif(btrim(di.serving_unit), ''), t.unit) as diet_unit,
       rd.meals_per_day,
       di.qty_per_serving
         * case coalesce(r.size, 'Medium'::resident_size)
             when 'Small' then dd.servings_small
             when 'Large' then dd.servings_large
             else dd.servings_medium
           end
         * coalesce(rd.portion_factor, 1) as daily_quantity,
       rd.notes,
       coalesce((select array_agg(ro.key order by ro.sort_order)
                   from resident_diet_rounds x
                   join rounds ro on ro.id = x.round_id
                  where x.resident_diet_id = rd.id), array[]::text[]) as round_keys,
       z.colour as zone_colour,
       dd.name_th as diet_name_th,
       dd.id as diet_id,
       t.name as ingredient_name,
       t.name_th as ingredient_name_th
  from resident_diets rd
  join diets dd on dd.id = rd.diet_id
  join diet_ingredients di on di.diet_id = dd.id
  join diet_types t on t.id = di.diet_type_id
  join residents r on r.id = rd.resident_id
  left join private.resident_current_state s on s.resident_id = r.id
  left join enclosures e on e.id = s.current_enclosure_id
  left join zones z on z.id = e.zone_id
 where dd.is_standard = false
   and rd.start_date <= shelter_today()
   and (rd.end_date is null or rd.end_date >= shelter_today())
   and (select has_permission('medical.diet', 'read'))
   and (select sees_all_clinical());

revoke all on special_diet_list from anon, authenticated, service_role;
grant select on special_diet_list to authenticated, service_role;

alter table diet_ingredients alter column qty_small drop not null;
alter table diet_ingredients alter column qty_medium drop not null;
alter table diet_ingredients alter column qty_large drop not null;

create or replace function diet_ingredients_fill_serving()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.qty_small is not null
     and (new.qty_per_serving is null
          or (tg_op = 'UPDATE' and new.qty_small is distinct from old.qty_small
              and new.qty_per_serving is not distinct from old.qty_per_serving)) then
    select new.qty_small / d.servings_small into new.qty_per_serving
      from diets d where d.id = new.diet_id;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
