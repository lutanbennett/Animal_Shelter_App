-- consumer: none
--
-- Schema half of three backlog items, one section each so they can be checked separately. The screens that read
-- and write all of this are later streams from the updated main; nothing reads any of it yet, and every change is
-- harmless to today's code (new nullable columns, a wider numeric, two views that only gain a trailing column).
--
--   1. Zones and enclosures in the shelter's own order   zones.sort_order, enclosures.sort_order (within the zone)
--   2. Stocktake in cupboard order                        medication.sort_order, diet_types.sort_order, and the
--                                                         two stocktake views (stock_medications, stock_diet_types)
--   3. Cost per unit keeps only 2 decimals                both cost_per_unit columns widened to numeric(12, 4)
--
-- Shared by 1 and 2: a new row goes LAST in its list, by trigger (place_sort_order_last below), so the Settings and
-- Management "add" forms put it there without knowing the column exists. Order is not unique: the Move up / Move
-- down actions renumber the whole list 0..n as Management → Shelter Friends' moveFriend does, and readers sort by
-- sort_order, then name, so a tie (two inserts at once) is harmless.
--
-- Seeding: today's order with numbers read naturally ("Enclosure 2" before "Enclosure 10"), so nothing jumps
-- around on the day the screens start using it. A row that already has a sort_order is never renumbered, so a
-- re-run never undoes an order someone has set.
--
-- Views, checked 2026-10-08: zones and enclosures lists are read from the two TABLES (`.from("zones")` /
-- `.from("enclosures")`), whose select policy asks facility.enclosures Read, held by every app role but the vet
-- (admin passes everything), so the order needs no view. The resident views (resident_list_view and friends)
-- carry zone and enclosure names only; a screen grouping residents by place sorts those names with the order
-- read from the tables. The vet, who cannot read the tables, keeps name order. public_enclosures is one
-- enclosure per page and lists nothing in order. The stocktake reads the fixed-column views stock_medications /
-- stock_diet_types (0143), so those two gain sort_order at the end. picker_medications / picker_diet_types
-- (0151) are pickers, not the stocktake, and are left alone.
--
-- Re-runnable throughout.

-- ===================================================================================================================
-- Natural-order key, used only to seed below: digit runs zero-padded so they compare as numbers.
-- ===================================================================================================================
-- Written inline in each seed rather than as a function: the screens' "Sort A-Z (numbers in order)" button sorts
-- in the app, so there is nothing to keep it for.

-- ===================================================================================================================
-- 1. Zones and enclosures in the shelter's own order
-- ===================================================================================================================
alter table zones add column if not exists sort_order integer;
alter table enclosures add column if not exists sort_order integer;

comment on column zones.sort_order is
  'Where this zone comes in the shelter''s own order (Settings → Zones), low first; ties by name. Null for the Lifecycle pseudo-zone, which takes no order (0161).';
comment on column enclosures.sort_order is
  'Where this enclosure comes WITHIN its zone (Settings → Enclosures), low first; ties by name. Null for the Lifecycle pseudo-enclosures (0161).';

-- Seed: zones in natural name order, enclosures in natural name order within their zone. Lifecycle stays null.
with keyed as (
  select z.id,
         row_number() over (order by (
           select string_agg(case when p[1] ~ '^\d' then lpad(p[1], 12, '0') else lower(p[1]) end, '' order by o)
             from regexp_matches(z.name, '\d+|\D+', 'g') with ordinality as t(p, o)
         ), z.name, z.id) as n
    from zones z
   where z.name <> 'Lifecycle'
)
update zones z
   set sort_order = keyed.n
  from keyed
 where z.id = keyed.id
   and z.sort_order is null
   and not exists (select 1 from zones s where s.sort_order is not null);

with keyed as (
  select e.id,
         row_number() over (partition by e.zone_id order by (
           select string_agg(case when p[1] ~ '^\d' then lpad(p[1], 12, '0') else lower(p[1]) end, '' order by o)
             from regexp_matches(e.name, '\d+|\D+', 'g') with ordinality as t(p, o)
         ), e.name, e.id) as n
    from enclosures e
    join zones z on z.id = e.zone_id
   where z.name <> 'Lifecycle'
)
update enclosures e
   set sort_order = keyed.n
  from keyed
 where e.id = keyed.id
   and e.sort_order is null
   and not exists (select 1 from enclosures s where s.zone_id = e.zone_id and s.sort_order is not null);

-- The Lifecycle refusal (0142) now refuses an order too. Same function, same triggers, sort_order added to the
-- columns they watch; the map message is unchanged.
create or replace function refuse_lifecycle_map()
returns trigger
language plpgsql
as $$
declare
  v_zone_id uuid;
  v_shape boolean := false;
  v_order boolean := false;
begin
  if tg_table_name = 'zones' then
    v_zone_id := new.id;
    v_shape := new.map_shape is not null;
    v_order := new.sort_order is not null;
  elsif tg_table_name = 'enclosures' then
    v_zone_id := new.zone_id;
    v_shape := new.map_shape is not null;
    v_order := new.sort_order is not null;
  else
    v_zone_id := new.zone_id;
    v_shape := v_zone_id is not null;
  end if;
  if not (v_shape or v_order) then return new; end if;
  -- A zone row is checked by its own name too: on insert it is not in the table yet for the lookup to find.
  if (tg_table_name = 'zones' and new.name = 'Lifecycle')
     or exists (select 1 from zones where id = v_zone_id and name = 'Lifecycle') then
    if v_shape then
      raise exception 'The Lifecycle zone is not a physical place and cannot be on the map';
    end if;
    raise exception 'The Lifecycle zone keeps its fixed place and takes no order';
  end if;
  return new;
end;
$$;

drop trigger if exists zones_refuse_lifecycle_map on zones;
create trigger zones_refuse_lifecycle_map before insert or update of map_shape, sort_order on zones
  for each row execute function refuse_lifecycle_map();
drop trigger if exists enclosures_refuse_lifecycle_map on enclosures;
create trigger enclosures_refuse_lifecycle_map before insert or update of map_shape, zone_id, sort_order on enclosures
  for each row execute function refuse_lifecycle_map();

-- ===================================================================================================================
-- 2. Stocktake in cupboard order
-- ===================================================================================================================
-- The item asks for "a shelf or sort_order". The shelter has not yet described its shelves, so this is the
-- order only: a shelf name is text the stocktake sheet could show later, but the sheet's ORDER is what staff
-- walking the cupboard need, and an order works whatever the shelves turn out to be called.
alter table medication add column if not exists sort_order integer;
alter table diet_types add column if not exists sort_order integer;

comment on column medication.sort_order is
  'Where this medicine comes on the stocktake sheet, in the order the cupboard is laid out (set on Management → Medications), low first; ties by name (0161).';
comment on column diet_types.sort_order is
  'Where this diet comes on the stocktake sheet, in the order the store is laid out (set on Management → Diets), low first; ties by name (0161).';

with keyed as (
  select m.id,
         row_number() over (order by (
           select string_agg(case when p[1] ~ '^\d' then lpad(p[1], 12, '0') else lower(p[1]) end, '' order by o)
             from regexp_matches(m.name, '\d+|\D+', 'g') with ordinality as t(p, o)
         ), m.name, m.id) as n
    from medication m
)
update medication m
   set sort_order = keyed.n
  from keyed
 where m.id = keyed.id
   and m.sort_order is null
   and not exists (select 1 from medication s where s.sort_order is not null);

with keyed as (
  select d.id,
         row_number() over (order by (
           select string_agg(case when p[1] ~ '^\d' then lpad(p[1], 12, '0') else lower(p[1]) end, '' order by o)
             from regexp_matches(d.name, '\d+|\D+', 'g') with ordinality as t(p, o)
         ), d.name, d.id) as n
    from diet_types d
)
update diet_types d
   set sort_order = keyed.n
  from keyed
 where d.id = keyed.id
   and d.sort_order is null
   and not exists (select 1 from diet_types s where s.sort_order is not null);

-- The stocktake reads these two (0143), so the order goes on the end of each. Same columns, same audience, same
-- grants as 0143; only sort_order is new.
create or replace view stock_medications as
select m.id, m.name, m.dose_unit, m.stock_on_hand, m.stock_counted_at, m.reorder_lead_days,
       m.safety_stock, m.label_drive_file_id, m.sort_order
  from medication m
 where (select has_permission('stock.count'))
    or (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'));

create or replace view stock_diet_types as
select d.id, d.name, d.unit, d.stock_on_hand, d.stock_counted_at, d.reorder_lead_days,
       d.safety_stock, d.is_standard, d.sort_order
  from diet_types d
 where (select has_permission('stock.count'))
    or (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'));

revoke all on stock_medications, stock_diet_types from anon, authenticated, service_role;
grant select on stock_medications, stock_diet_types to authenticated, service_role;

-- ===================================================================================================================
-- 1 and 2: a new row goes last
-- ===================================================================================================================
-- On insert with no sort_order: one more than the highest in its list (zones; the enclosure's zone; medication;
-- diet_types). An enclosure moved to another zone with its order untouched goes last in the new zone, or takes no
-- order if the new zone is Lifecycle. Lifecycle rows get nothing. This fires before the Lifecycle refusal (triggers
-- run in name order: "..._assign_sort_order" before "..._refuse_lifecycle_map"), so an explicit order on a
-- Lifecycle row is still refused.
create or replace function place_sort_order_last()
returns trigger
language plpgsql
as $$
declare
  v_lifecycle boolean;
begin
  if tg_table_name = 'zones' then
    if tg_op = 'INSERT' and new.sort_order is null and new.name <> 'Lifecycle' then
      select coalesce(max(sort_order), 0) + 1 into new.sort_order from zones;
    end if;
  elsif tg_table_name = 'enclosures' then
    v_lifecycle := exists (select 1 from zones where id = new.zone_id and name = 'Lifecycle');
    if tg_op = 'INSERT' then
      if new.sort_order is null and not v_lifecycle then
        select coalesce(max(sort_order), 0) + 1 into new.sort_order from enclosures where zone_id = new.zone_id;
      end if;
    elsif new.zone_id is distinct from old.zone_id and new.sort_order is not distinct from old.sort_order then
      if v_lifecycle then
        new.sort_order := null;
      else
        select coalesce(max(sort_order), 0) + 1 into new.sort_order from enclosures where zone_id = new.zone_id;
      end if;
    end if;
  elsif tg_table_name = 'medication' then
    if new.sort_order is null then
      select coalesce(max(sort_order), 0) + 1 into new.sort_order from medication;
    end if;
  elsif tg_table_name = 'diet_types' then
    if new.sort_order is null then
      select coalesce(max(sort_order), 0) + 1 into new.sort_order from diet_types;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists zones_assign_sort_order on zones;
create trigger zones_assign_sort_order before insert on zones
  for each row execute function place_sort_order_last();
drop trigger if exists enclosures_assign_sort_order on enclosures;
create trigger enclosures_assign_sort_order before insert or update of zone_id on enclosures
  for each row execute function place_sort_order_last();
drop trigger if exists medication_assign_sort_order on medication;
create trigger medication_assign_sort_order before insert on medication
  for each row execute function place_sort_order_last();
drop trigger if exists diet_types_assign_sort_order on diet_types;
create trigger diet_types_assign_sort_order before insert on diet_types
  for each row execute function place_sort_order_last();

-- ===================================================================================================================
-- 3. Cost per unit keeps only 2 decimals
-- ===================================================================================================================
-- BOTH columns, as the item's example (35 baht a kg = 0.035 a gram) applies to a diet bought by the kilo and to
-- a medicine bought by the bottle and given by the ml alike. numeric(12, 4): 4 places holds a per-gram or per-ml
-- price to a hundredth of a satang, 8 whole digits is far beyond any price here. Widening loses nothing (35.50
-- reads back as 35.5). No view reads either column (checked on dev, pg_depend, 2026-10-08), so neither ALTER is
-- blocked; diet_forecast and cashflow_forecast multiply by it in their bodies and every screen formats the result
-- with formatBaht. The app still rounds to 2 places in costPerBaseUnit (src/lib/units.ts) and refuses a price that
-- moves more than 1%; dropping that refusal is the per-gram price stream's job, after this file is live, because
-- code saving 4 places into a 2-place column would round silently.
alter table diet_types alter column cost_per_unit type numeric(12, 4);
alter table medication alter column cost_per_unit type numeric(12, 4);

comment on column diet_types.cost_per_unit is
  'Baht per unit, for the food forecast, to 4 places so a per-gram price bought by the kilo keeps its value (0161). Zero until management has a price.';

-- ===================================================================================================================
-- Grants (docs/decisions.md, 2026-09-24)
-- ===================================================================================================================
revoke all on function place_sort_order_last() from public, anon;
revoke all on function refuse_lifecycle_map() from public, anon;

notify pgrst, 'reload schema';
