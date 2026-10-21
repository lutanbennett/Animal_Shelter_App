-- consumer: none
--
-- A diet is a recipe of ingredients (docs/diets-ingredients-design.md, approved 2026-10-21 in #791).
-- Schema half; the app half (Settings -> Diets, Purchasing wording, diet sheet, stock usage) is a later PR.
--
-- diet_types (0051) stays exactly as it is and is now the INGREDIENT list: stock, prices, packs,
-- deliveries and counts all still hang off it. New:
--   diets             a recipe: name, Thai name, standard flag, notes.
--   diet_ingredients  one line per (diet, ingredient): amount in one day's serve for a small, medium
--                     and large animal, in the ingredient's own unit or in a serving unit such as 'cup'
--                     that has a row in item_unit_conversions (0118; base_units_per converts to the base unit).
--   resident_diets    gains diet_id (the recipe) and portion_factor (a multiplier on the whole recipe,
--                     replacing the per-resident daily_quantity override). diet_type_id and daily_quantity
--                     stay, and diet_type_id becomes nullable, until the app stops reading them.
--
-- Nothing moves on the day it lands: every diet_types row gets a same-named one-ingredient recipe with its
-- own three quantities, every resident_diets row points at it, daily_quantity becomes portion_factor =
-- daily_quantity / the size default it replaced, and diet_forecast / stock_diet_forecast expand recipes
-- into ingredients. A one-ingredient recipe gives today's formula. Both keep signature and return shape.
--
-- Bridge for the old app, until the app PR: a new resident_diets row that names only diet_type_id gets
-- the matching recipe; a new diet_types row gets its own one-ingredient recipe; edits to a diet type's
-- quantities and standard flag are mirrored to its one-ingredient recipe. Remove with the cleanup migration.
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 1. Recipes
-- ---------------------------------------------------------------------------
create table if not exists diets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_th text,
  is_standard boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists diets_one_standard on diets (is_standard) where is_standard;

comment on table diets is
  'A diet is a recipe of ingredients (0239). What a resident is fed; the ingredients (diet_types) are what is bought and counted. is_standard moves here from diet_types (0087).';

create table if not exists diet_ingredients (
  diet_id uuid not null references diets (id) on delete cascade,
  diet_type_id uuid not null references diet_types (id),
  serving_unit text check (serving_unit is null or length(btrim(serving_unit)) > 0),
  qty_small numeric not null check (qty_small > 0),
  qty_medium numeric not null check (qty_medium > 0),
  qty_large numeric not null check (qty_large > 0),
  primary key (diet_id, diet_type_id)
);
create index if not exists diet_ingredients_diet_type_id_idx on diet_ingredients (diet_type_id);

comment on table diet_ingredients is
  'One ingredient of a recipe: the amount in one day''s serve for a small, medium and large animal, in serving_unit (null = the ingredient''s own unit). A named serving unit must be the ingredient''s unit or have a row in item_unit_conversions, whose base_units_per converts it (0239).';

-- A serving unit must convert, so the forecast never meets one it cannot.
create or replace function diet_ingredients_check_unit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.serving_unit is not null
     and not exists (select 1 from diet_types dt
                      where dt.id = new.diet_type_id and lower(btrim(dt.unit)) = lower(btrim(new.serving_unit)))
     and not exists (select 1 from item_unit_conversions c
                      where c.diet_type_id = new.diet_type_id and lower(btrim(c.unit)) = lower(btrim(new.serving_unit))) then
    raise exception 'There is no conversion for "%" on this ingredient. Add it under the ingredient''s units first.', new.serving_unit;
  end if;
  return new;
end;
$$;

drop trigger if exists diet_ingredients_check_unit on diet_ingredients;
create trigger diet_ingredients_check_unit
  before insert or update on diet_ingredients
  for each row execute function diet_ingredients_check_unit();

-- RLS: readable by whoever picks a diet (the picker_diet_types audience, 0151); no prices live here.
-- Writable by stock.diets edit, as diet_types is.
alter table diets enable row level security;
alter table diet_ingredients enable row level security;

drop policy if exists diets_select_perm on diets;
create policy diets_select_perm on diets for select to authenticated
  using ((select has_permission('stock.diets', 'read'))
      or (select has_permission('resident.register'))
      or (select has_permission('medical.diet', 'read')));
drop policy if exists diets_insert_perm on diets;
create policy diets_insert_perm on diets for insert to authenticated
  with check ((select has_permission('stock.diets', 'edit')));
drop policy if exists diets_update_perm on diets;
create policy diets_update_perm on diets for update to authenticated
  using ((select has_permission('stock.diets', 'edit')))
  with check ((select has_permission('stock.diets', 'edit')));
drop policy if exists diets_delete_perm on diets;
create policy diets_delete_perm on diets for delete to authenticated
  using ((select has_permission('stock.diets', 'edit')));

drop policy if exists diet_ingredients_select_perm on diet_ingredients;
create policy diet_ingredients_select_perm on diet_ingredients for select to authenticated
  using ((select has_permission('stock.diets', 'read'))
      or (select has_permission('resident.register'))
      or (select has_permission('medical.diet', 'read')));
drop policy if exists diet_ingredients_insert_perm on diet_ingredients;
create policy diet_ingredients_insert_perm on diet_ingredients for insert to authenticated
  with check ((select has_permission('stock.diets', 'edit')));
drop policy if exists diet_ingredients_update_perm on diet_ingredients;
create policy diet_ingredients_update_perm on diet_ingredients for update to authenticated
  using ((select has_permission('stock.diets', 'edit')))
  with check ((select has_permission('stock.diets', 'edit')));
drop policy if exists diet_ingredients_delete_perm on diet_ingredients;
create policy diet_ingredients_delete_perm on diet_ingredients for delete to authenticated
  using ((select has_permission('stock.diets', 'edit')));

revoke all on diets, diet_ingredients from public, anon, authenticated;
grant select, insert, update, delete on diets, diet_ingredients to authenticated;
grant all on diets, diet_ingredients to service_role;

-- ---------------------------------------------------------------------------
-- 2. Back-fill: one single-ingredient recipe per existing diet type
-- ---------------------------------------------------------------------------
insert into diets (name, name_th, is_standard, notes)
select dt.name, null, dt.is_standard, dt.notes
  from diet_types dt
 where not exists (select 1 from diets d where d.name = dt.name);

insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_small, qty_medium, qty_large)
select d.id, dt.id, null, dt.daily_qty_small, dt.daily_qty_medium, dt.daily_qty_large
  from diet_types dt
  join diets d on d.name = dt.name
 where not exists (select 1 from diet_ingredients di where di.diet_id = d.id and di.diet_type_id = dt.id);

-- ---------------------------------------------------------------------------
-- 3. resident_diets: the recipe and the multiplier
-- ---------------------------------------------------------------------------
alter table resident_diets add column if not exists diet_id uuid references diets (id);
alter table resident_diets add column if not exists portion_factor numeric
  check (portion_factor is null or portion_factor > 0);
create index if not exists resident_diets_diet_id_idx on resident_diets (diet_id);

comment on column resident_diets.diet_id is
  'The recipe this resident is fed (0239). Replaces diet_type_id, which is kept until the app stops reading it.';
comment on column resident_diets.portion_factor is
  'Multiplier on the whole recipe: null or 1 = normal, 0.75 = three-quarter portion (0239). Replaces daily_quantity, back-filled as daily_quantity / the size default it replaced.';

-- Deceased residents' diet rows are locked (0026). The back-fill re-keys the same fact, so it uses the
-- lock's own transaction-local bypass, as 0026 and 0027 do.
select set_config('app.deceased_lock_bypass', 'on', true);

update resident_diets rd
   set diet_id = d.id
  from diet_types dt
  join diets d on d.name = dt.name
 where rd.diet_type_id = dt.id and rd.diet_id is null;

update resident_diets rd
   set portion_factor = rd.daily_quantity / case coalesce(r.size, 'Medium'::resident_size)
         when 'Small' then dt.daily_qty_small
         when 'Large' then dt.daily_qty_large
         else dt.daily_qty_medium end
  from residents r, diet_types dt
 where r.id = rd.resident_id and dt.id = rd.diet_type_id
   and rd.daily_quantity is not null and rd.portion_factor is null;

select set_config('app.deceased_lock_bypass', 'off', true);

alter table resident_diets alter column diet_type_id drop not null;
alter table resident_diets alter column diet_id set not null;

-- ---------------------------------------------------------------------------
-- 4. Bridge for the old app (until the app PR)
-- ---------------------------------------------------------------------------
create or replace function resident_diets_fill_recipe()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.diet_id is null and new.diet_type_id is not null then
    select d.id into new.diet_id
      from diet_types dt join diets d on d.name = dt.name
     where dt.id = new.diet_type_id;
  end if;
  return new;
end;
$$;

drop trigger if exists resident_diets_fill_recipe on resident_diets;
create trigger resident_diets_fill_recipe
  before insert or update on resident_diets
  for each row execute function resident_diets_fill_recipe();

-- security definer: the writer may not hold stock.diets edit on the recipe tables.
create or replace function diet_types_mirror_recipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_diet uuid;
begin
  if tg_op = 'INSERT' then
    insert into diets (name, is_standard, notes) values (new.name, new.is_standard, new.notes)
    on conflict (name) do nothing;
    insert into diet_ingredients (diet_id, diet_type_id, qty_small, qty_medium, qty_large)
    select d.id, new.id, new.daily_qty_small, new.daily_qty_medium, new.daily_qty_large
      from diets d where d.name = new.name
    on conflict do nothing;
  else
    select d.id into v_diet from diets d where d.name = old.name;
    if v_diet is not null then
      if new.is_standard is distinct from old.is_standard then
        if new.is_standard then
          update diets set is_standard = false where is_standard and id <> v_diet;
        end if;
        update diets set is_standard = new.is_standard where id = v_diet;
      end if;
      -- only a one-ingredient recipe is a mirror of its type
      if (select count(*) from diet_ingredients where diet_id = v_diet) = 1 then
        update diet_ingredients
           set qty_small = new.daily_qty_small, qty_medium = new.daily_qty_medium, qty_large = new.daily_qty_large
         where diet_id = v_diet and diet_type_id = new.id and serving_unit is null;
      end if;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists diet_types_mirror_recipe on diet_types;
create trigger diet_types_mirror_recipe
  after insert or update of is_standard, daily_qty_small, daily_qty_medium, daily_qty_large on diet_types
  for each row execute function diet_types_mirror_recipe();

-- ---------------------------------------------------------------------------
-- 5. The forecasts expand recipes into ingredients
-- ---------------------------------------------------------------------------
-- per_day = the recipe line's amount for the resident's size (Medium when unset) x portion_factor
-- x base units per serving unit. Rows still carry one entry per ingredient (diet_type_id).

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
      case coalesce(r.size, 'Medium'::resident_size)
        when 'Small' then di.qty_small
        when 'Large' then di.qty_large
        else di.qty_medium
      end * coalesce(rd.portion_factor, 1) * coalesce(c.base_units_per, 1) as per_day
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
  join diet_ingredients di on di.diet_id = rd.diet_id
  join diet_types dt on dt.id = di.diet_type_id
  join residents r on r.id = rd.resident_id
  join private.resident_current_state s on s.resident_id = rd.resident_id
  left join item_unit_conversions c
    on c.diet_type_id = dt.id and lower(btrim(c.unit)) = lower(btrim(di.serving_unit))
  cross join lateral (
    select
      (least(p_to, coalesce(rd.end_date, p_to)) - greatest(p_from, rd.start_date) + 1)::numeric as days,
      case coalesce(r.size, 'Medium'::resident_size)
        when 'Small' then di.qty_small
        when 'Large' then di.qty_large
        else di.qty_medium
      end * coalesce(rd.portion_factor, 1) * coalesce(c.base_units_per, 1) as per_day
  ) q
  where rd.start_date <= p_to
    and (rd.end_date is null or rd.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted', 'Fostered')
  group by dt.id, dt.name, dt.unit;
end;
$$;

revoke all on function stock_diet_forecast(date, date) from public, anon;
grant execute on function stock_diet_forecast(date, date) to authenticated, service_role;

notify pgrst, 'reload schema';
