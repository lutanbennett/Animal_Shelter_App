-- consumer: none
--
-- Schema half of "Several pack sizes for one item". Nothing reads is_default_purchase or
-- item_latest_delivery_cost yet; the app half (a later PR) does. This file is not usable on its own.
--
-- 1. Bought in stops being one-per-item. The unique indexes on is_purchase_unit (0118) are dropped,
--    so an item may be bought in 20 kg, 14 kg and 10 kg bags. is_default_purchase marks the ONE size
--    forms open on, prices are typed against and Purchasing suggests; at most one per item (unique
--    index), and always a size that is also bought in. Every reader that needs "the" purchase unit
--    must resolve through is_default_purchase, not "the row with is_purchase_unit".
--
--    Until the app half ships, a trigger keeps old code safe: the first bought-in size of an item
--    becomes its default, untick of the default promotes another bought-in size, and so
--    `is_purchase_unit and is_default_purchase` names exactly the row the old unique index named.
--
-- 2. PRICE DECISION: the price actually paid on a delivery wins; a typed price is the fallback.
--    No per-size typed price column is added. The per-base-unit cost the forecasts and Cashflow read
--    is the most recent delivery's cost ÷ base quantity (view item_latest_delivery_cost, cost > 0;
--    0 means donated and says nothing about price), and when an item has no such delivery, the typed
--    diet_types.cost_per_unit / medication.cost_per_unit, which stays exactly as it is and stays
--    per base unit. Nothing is re-valued by this file: the forecasts still read cost_per_unit.
--
-- Additive and re-runnable.

drop index if exists item_unit_conversions_medication_purchase_key;
drop index if exists item_unit_conversions_diet_type_purchase_key;

alter table item_unit_conversions add column if not exists is_default_purchase boolean not null default false;

-- Back-fill: today's single purchase unit becomes the default.
update item_unit_conversions set is_default_purchase = true
 where is_purchase_unit and not is_default_purchase;

create unique index if not exists item_unit_conversions_medication_default_purchase_key
  on item_unit_conversions (medication_id) where is_default_purchase and medication_id is not null;
create unique index if not exists item_unit_conversions_diet_type_default_purchase_key
  on item_unit_conversions (diet_type_id) where is_default_purchase and diet_type_id is not null;

comment on column item_unit_conversions.is_purchase_unit is
  'A size this item is bought in; any number per item (0199, was at most one in 0118).';
comment on column item_unit_conversions.is_default_purchase is
  'The one bought-in size forms open on, prices are typed against and Purchasing suggests. At most one per item, always also is_purchase_unit (0199).';

-- Keep default and bought-in in step, before and after the write.
create or replace function item_unit_conversions_default_purchase()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if pg_trigger_depth() > 1 then return new; end if; -- the demotion below re-fires this trigger
  if not new.is_purchase_unit then new.is_default_purchase := false; end if;
  if new.is_default_purchase then
    new.is_purchase_unit := true;
    -- the new default takes the flag from any other size of the item
    update item_unit_conversions set is_default_purchase = false
     where is_default_purchase and id <> new.id
       and medication_id is not distinct from new.medication_id
       and diet_type_id is not distinct from new.diet_type_id;
  elsif new.is_purchase_unit and not exists (
    select 1 from item_unit_conversions o
     where o.is_default_purchase and o.id <> new.id
       and o.medication_id is not distinct from new.medication_id
       and o.diet_type_id is not distinct from new.diet_type_id
  ) then
    new.is_default_purchase := true;
  end if;
  return new;
end;
$$;

drop trigger if exists item_unit_conversions_default_purchase_trg on item_unit_conversions;
create trigger item_unit_conversions_default_purchase_trg
  before insert or update on item_unit_conversions
  for each row execute function item_unit_conversions_default_purchase();

-- A size that stops being bought in cannot stay default; hand the flag to another bought-in size.
create or replace function item_unit_conversions_default_purchase_heal()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if pg_trigger_depth() > 1 then return null; end if; -- a demotion by the trigger above, not a user write
  if old.is_default_purchase and not exists (
    select 1 from item_unit_conversions o
     where o.is_default_purchase
       and o.medication_id is not distinct from old.medication_id
       and o.diet_type_id is not distinct from old.diet_type_id
  ) then
    update item_unit_conversions set is_default_purchase = true
     where id = (
       select o.id from item_unit_conversions o
        where o.is_purchase_unit and o.id <> old.id
          and o.medication_id is not distinct from old.medication_id
          and o.diet_type_id is not distinct from old.diet_type_id
        order by o.created_at, o.id limit 1);
  end if;
  return null;
end;
$$;

drop trigger if exists item_unit_conversions_default_purchase_heal_trg on item_unit_conversions;
create trigger item_unit_conversions_default_purchase_heal_trg
  after update or delete on item_unit_conversions
  for each row execute function item_unit_conversions_default_purchase_heal();

-- Real price paid: latest delivery per item with a cost, per base unit.
create or replace view item_latest_delivery_cost
with (security_invoker = true) as
select distinct on (item_kind, coalesce(medication_id, diet_type_id))
       item_kind, medication_id, diet_type_id,
       cost / quantity as cost_per_base_unit,
       received_at
  from stock_receipts
 where cost > 0 and quantity > 0
 order by item_kind, coalesce(medication_id, diet_type_id), received_at desc, created_at desc;

comment on view item_latest_delivery_cost is
  'Most recent delivery''s cost ÷ base quantity per item; cost 0 (donated) skipped. Wins over the typed cost_per_unit where present (0199).';

revoke insert, update, delete, truncate, references, trigger on item_latest_delivery_cost from authenticated, anon;
grant select on item_latest_delivery_cost to authenticated, service_role;
