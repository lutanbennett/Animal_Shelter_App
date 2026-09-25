-- Stock on hand and reorder lead time on medication and diet_types (backlog,
-- "Stock on hand and days-of-stock"; schema half — the feature half,
-- claude/stock-on-hand, reads these).
--
-- The forecasts on Management → Medications and → Diets say how much will be
-- used; nothing records what is in the cupboard, so nobody can see when it
-- runs out. Three columns on each table, identical on both:
--
--   stock_on_hand      numeric, null. In the item's OWN unit — medication's
--                      dose_unit (tablets, ml), diet_types.unit (g, can) —
--                      because that is the unit medication_forecast and
--                      diet_forecast already return quantity in, so
--                      days-of-stock is a plain division with no conversion.
--                      Null = never counted, which is not the same as 0 = out
--                      of stock; the page must show the two differently.
--   stock_counted_at   timestamptz, null. When stock_on_hand was last set,
--                      stamped by trigger. The count is a snapshot and the
--                      cupboard empties from that moment, so days-of-stock
--                      read later has to know how old the figure is.
--   reorder_lead_days  integer, null. How many days the supplier takes
--                      (Lutan, 2026-09-25: a lead time in days, per item, not a
--                      reorder quantity and not one shelter-wide figure). The
--                      feature flags an item when days-of-stock <= this.
--                      Null = no flag for that item.
--
-- Days-of-stock is NOT stored: it is computed at read time from the 30-day
-- forecast rate, so it can never disagree with the forecast next to it.
--
-- The trigger fires on INSERT, and on UPDATE only when stock_on_hand is in
-- the SET list (`update of stock_on_hand`). That list-based rule is
-- deliberate: saving the same count again is a stocktake that confirmed it,
-- and restamps; renaming the item or changing its price does not. Clearing
-- stock_on_hand to null clears the stamp. A caller cannot set
-- stock_counted_at itself — a hand-set value is overwritten when the count is
-- in the same write, and ignored (kept at its old value) when it is not.
--
-- Additive; no code reads the columns. Existing grants (0077) and RLS
-- policies are table-level and cover them. Re-runnable: every statement is
-- guarded.

alter table medication add column if not exists stock_on_hand numeric;
alter table medication add column if not exists stock_counted_at timestamptz;
alter table medication add column if not exists reorder_lead_days integer;

alter table diet_types add column if not exists stock_on_hand numeric;
alter table diet_types add column if not exists stock_counted_at timestamptz;
alter table diet_types add column if not exists reorder_lead_days integer;

alter table medication drop constraint if exists medication_stock_on_hand_nonnegative;
alter table medication add constraint medication_stock_on_hand_nonnegative
  check (stock_on_hand is null or stock_on_hand >= 0);
alter table medication drop constraint if exists medication_reorder_lead_days_positive;
alter table medication add constraint medication_reorder_lead_days_positive
  check (reorder_lead_days is null or reorder_lead_days > 0);

alter table diet_types drop constraint if exists diet_types_stock_on_hand_nonnegative;
alter table diet_types add constraint diet_types_stock_on_hand_nonnegative
  check (stock_on_hand is null or stock_on_hand >= 0);
alter table diet_types drop constraint if exists diet_types_reorder_lead_days_positive;
alter table diet_types add constraint diet_types_reorder_lead_days_positive
  check (reorder_lead_days is null or reorder_lead_days > 0);

comment on column medication.stock_on_hand is
  'How much is in the cupboard, in dose_unit (the unit medication_forecast.quantity uses). Null = never counted, distinct from 0 = out of stock. Days-of-stock is computed from this and the 30-day forecast, not stored.';
comment on column medication.stock_counted_at is
  'When stock_on_hand was last set (stamped by trigger stamp_stock_counted_at, also on re-saving the same figure). Null while stock_on_hand is null. Callers cannot set it.';
comment on column medication.reorder_lead_days is
  'Days the supplier takes to deliver. The page flags the item when days-of-stock <= this. Null = never flagged.';

comment on column diet_types.stock_on_hand is
  'How much is in the cupboard, in unit (the unit diet_forecast.quantity uses). Null = never counted, distinct from 0 = out of stock. Days-of-stock is computed from this and the 30-day forecast, not stored.';
comment on column diet_types.stock_counted_at is
  'When stock_on_hand was last set (stamped by trigger stamp_stock_counted_at, also on re-saving the same figure). Null while stock_on_hand is null. Callers cannot set it.';
comment on column diet_types.reorder_lead_days is
  'Days the supplier takes to deliver. The page flags the item when days-of-stock <= this. Null = never flagged.';

create or replace function stamp_stock_counted_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and tg_nargs = 1 and tg_argv[0] = 'keep' then
    -- the other trigger: stock_on_hand was not in the SET list
    new.stock_counted_at := old.stock_counted_at;
  elsif new.stock_on_hand is null then
    new.stock_counted_at := null;
  else
    new.stock_counted_at := now();
  end if;
  return new;
end;
$$;

comment on function stamp_stock_counted_at() is
  'BEFORE row trigger for medication and diet_types. On insert and on an update naming stock_on_hand: stock_counted_at := now(), or null when stock_on_hand is null. With argument ''keep'' (every other update): stock_counted_at keeps its old value. Callers cannot set it.';

-- Two triggers per table, because "was stock_on_hand in the SET list" is
-- visible only to a trigger declared `update of stock_on_hand` — a function
-- cannot ask. Same-event triggers fire in name order: *_1_keep runs on every
-- update and puts back the old stock_counted_at (so a hand-set value never
-- sticks); *_2_stamp runs only when stock_on_hand was named, after it, and
-- stamps.
drop trigger if exists medication_stock_1_keep on medication;
create trigger medication_stock_1_keep
  before update on medication
  for each row execute function stamp_stock_counted_at('keep');
drop trigger if exists medication_stock_2_stamp on medication;
create trigger medication_stock_2_stamp
  before insert or update of stock_on_hand on medication
  for each row execute function stamp_stock_counted_at();

drop trigger if exists diet_types_stock_1_keep on diet_types;
create trigger diet_types_stock_1_keep
  before update on diet_types
  for each row execute function stamp_stock_counted_at('keep');
drop trigger if exists diet_types_stock_2_stamp on diet_types;
create trigger diet_types_stock_2_stamp
  before insert or update of stock_on_hand on diet_types
  for each row execute function stamp_stock_counted_at();

notify pgrst, 'reload schema';
