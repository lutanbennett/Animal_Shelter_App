-- consumer: src/app/management/diets/page.tsx, src/app/management/diets/DietStockCards.tsx, src/app/management/purchasing/page.tsx, src/app/management/stock-usage/page.tsx, src/lib/management/stock-usage.ts, src/app/admin/diets/recipe-actions.ts
--
-- ONE migration carrying two unrelated subjects, because only one in-flight branch may carry a migration at a time.
--
-- A. diet_forecast() and stock_diet_forecast() read the per-serving columns (0250) instead of qty_small/medium/large.
--      per day = diet_ingredients.qty_per_serving x the diet's servings_{small,medium,large} for the dog's size
--                (Medium when unset) x resident_diets.portion_factor x the unit conversion
--    A serving is ONE DAY's food (Lutan, 2026-10-22), so there is no meals-per-day factor. Nothing is rounded.
--    Production is in proportion on every line (check-diets-proportion.mjs, 2026-10-23), so no production figure
--    moves. Same signatures, same columns out, same grants (create or replace keeps them).
--    qty_small/medium/large and 0250's bridge trigger are NOT touched here: dropping them is a later migration,
--    once the app stops writing them.
--
-- B. Two Stocktaking switches on site_content (the settings singleton, 0018; it already holds non-website shelter
--    settings such as clinic_visit_estimate, 0172). Both default TRUE, so nothing changes the day this lands.
--      stocktaking_food_enabled      diet ingredients: stock pages, purchasing lines, counts
--      stocktaking_medical_enabled   medications and vaccines: the same
--    NOTHING READS THEM YET. The app half is a later PR; there is no consumer for these two columns today.
--    Written only by Admin at 2-step (trigger below: the table's own policy is website.content, which is wider),
--    and audited. record_audit() cannot be attached to site_content (its id is boolean and the function casts
--    id to uuid), so a small dedicated audit trigger writes the same audit_log shape for these two columns only.
--    The audit row's row_id is a fixed uuid, because the singleton has no uuid of its own.

-- A ------------------------------------------------------------------------------------------------------------
create or replace function diet_forecast(p_from date, p_to date)
returns table (
  diet_type_id uuid,
  diet_type_name text,
  unit text,
  diet_count bigint,
  resident_count bigint,
  quantity numeric,
  cost numeric
)
language sql
stable
set search_path = public
as $$
  select
    dt.id,
    dt.name,
    dt.unit,
    count(rd.id),
    count(distinct rd.resident_id),
    coalesce(sum(q.days * q.per_day), 0),
    coalesce(sum(q.days * q.per_day), 0) * coalesce(lc.cost_per_base_unit, dt.cost_per_unit)
  from resident_diets rd
  join diets d on d.id = rd.diet_id
  join diet_ingredients di on di.diet_id = rd.diet_id
  join diet_types dt on dt.id = di.diet_type_id
  join residents r on r.id = rd.resident_id
  join resident_current_state s on s.resident_id = rd.resident_id
  left join item_latest_delivery_cost lc on lc.item_kind = 'diet_type' and lc.diet_type_id = dt.id
  left join item_unit_conversions c
    on c.diet_type_id = dt.id and lower(btrim(c.unit)) = lower(btrim(di.serving_unit))
  cross join lateral (
    select
      (least(p_to, coalesce(rd.end_date, p_to)) - greatest(p_from, rd.start_date) + 1)::numeric as days,
      di.qty_per_serving
        * case coalesce(r.size, 'Medium'::resident_size)
            when 'Small' then d.servings_small
            when 'Large' then d.servings_large
            else d.servings_medium
          end
        * coalesce(rd.portion_factor, 1) * coalesce(c.base_units_per, 1) as per_day
  ) q
  where rd.start_date <= p_to
    and (rd.end_date is null or rd.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted', 'Fostered')
  group by dt.id, dt.name, dt.unit, dt.cost_per_unit, lc.cost_per_base_unit;
$$;

create or replace function stock_diet_forecast(p_from date, p_to date)
returns table (diet_type_id uuid, diet_type_name text, unit text, diet_count bigint,
               resident_count bigint, quantity numeric)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not has_permission('stock.purchasing') then
    raise exception 'Not authorized to read the purchasing forecast.' using errcode = 'insufficient_privilege';
  end if;
  return query
  select
    dt.id,
    dt.name,
    dt.unit,
    count(rd.id),
    count(distinct rd.resident_id),
    coalesce(sum(q.days * q.per_day), 0)
  from resident_diets rd
  join diets d on d.id = rd.diet_id
  join diet_ingredients di on di.diet_id = rd.diet_id
  join diet_types dt on dt.id = di.diet_type_id
  join residents r on r.id = rd.resident_id
  join private.resident_current_state s on s.resident_id = rd.resident_id
  left join item_unit_conversions c
    on c.diet_type_id = dt.id and lower(btrim(c.unit)) = lower(btrim(di.serving_unit))
  cross join lateral (
    select
      (least(p_to, coalesce(rd.end_date, p_to)) - greatest(p_from, rd.start_date) + 1)::numeric as days,
      di.qty_per_serving
        * case coalesce(r.size, 'Medium'::resident_size)
            when 'Small' then d.servings_small
            when 'Large' then d.servings_large
            else d.servings_medium
          end
        * coalesce(rd.portion_factor, 1) * coalesce(c.base_units_per, 1) as per_day
  ) q
  where rd.start_date <= p_to
    and (rd.end_date is null or rd.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted', 'Fostered')
  group by dt.id, dt.name, dt.unit;
end;
$$;

revoke all on function stock_diet_forecast(date, date) from public, anon;
grant execute on function stock_diet_forecast(date, date) to authenticated, service_role;

-- B ------------------------------------------------------------------------------------------------------------
alter table site_content add column if not exists stocktaking_food_enabled boolean not null default true;
alter table site_content add column if not exists stocktaking_medical_enabled boolean not null default true;

comment on column site_content.stocktaking_food_enabled is
  'Stocktaking switch for diet ingredients (0254). While false every food forecast assumes zero stock. Admin at 2-step only; audited. Nothing reads it until the app half lands.';
comment on column site_content.stocktaking_medical_enabled is
  'Stocktaking switch for medications and vaccines (0254). While false every medical forecast assumes zero stock. Admin at 2-step only; audited. Nothing reads it until the app half lands.';

-- Only an Admin whose session is at 2-step may change either switch. A caller with no login (service role,
-- migrations, scripts) is not a signed-in user and is let through, as it is for the other aal2 policies.
create or replace function site_content_stocktaking_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.stocktaking_food_enabled is distinct from old.stocktaking_food_enabled
      or new.stocktaking_medical_enabled is distinct from old.stocktaking_medical_enabled)
     and (select auth.uid()) is not null then
    if not (select public.is_admin()) then
      raise exception 'Only an Admin can switch Stocktaking on or off.' using errcode = 'insufficient_privilege';
    end if;
    if coalesce((select auth.jwt() ->> 'aal'), '') <> 'aal2' then
      raise exception 'Switching Stocktaking on or off needs 2-step verification.' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function site_content_stocktaking_guard() from public, anon, authenticated;

drop trigger if exists site_content_stocktaking_guard on site_content;
create trigger site_content_stocktaking_guard before update on site_content
  for each row execute function site_content_stocktaking_guard();

-- The audit row carries only the two switches, not the website copy that shares the row.
create or replace function site_content_stocktaking_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_named text;
begin
  if new.stocktaking_food_enabled is not distinct from old.stocktaking_food_enabled
     and new.stocktaking_medical_enabled is not distinct from old.stocktaking_medical_enabled then
    return null;
  end if;

  v_actor := auth.uid();
  if v_actor is null then
    v_named := current_setting('app.actor', true);
    if v_named ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_actor := v_named::uuid;
    end if;
  end if;

  insert into audit_log (table_name, row_id, op, actor, old_row, new_row)
  values (
    'site_content',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'UPDATE',
    v_actor,
    jsonb_build_object('stocktaking_food_enabled', old.stocktaking_food_enabled,
                       'stocktaking_medical_enabled', old.stocktaking_medical_enabled),
    jsonb_build_object('stocktaking_food_enabled', new.stocktaking_food_enabled,
                       'stocktaking_medical_enabled', new.stocktaking_medical_enabled)
  );
  return null;
end;
$$;

revoke execute on function site_content_stocktaking_audit() from public, anon, authenticated;

drop trigger if exists site_content_stocktaking_audit on site_content;
create trigger site_content_stocktaking_audit after update on site_content
  for each row execute function site_content_stocktaking_audit();

notify pgrst, 'reload schema';
