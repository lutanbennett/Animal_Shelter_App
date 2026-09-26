-- Stock deliveries (backlog, "Record stock deliveries, so Stock between
-- counts can state usage", split out 2026-09-26; schema half — the feature
-- half adds "Record a delivery" to Management → Medications / Diets).
--
-- 0093 gave every stocktake a history row, and said plainly what it could
-- not do:
--
--     used = previous count + stock received − new count
--
-- and nothing recorded "received". This file is that missing term: one
-- stock_receipts row per delivery of one item, and a view,
-- stock_count_intervals, that does the sum for every pair of consecutive
-- counts so the feature (and anyone checking it) reads one figure rather
-- than re-deriving the join.
--
-- The table is stock_counts' sibling and is read with it, so the item shape
-- is 0093's exactly:
--   item_kind         'medication' | 'diet_type', with exactly the matching
--                     one of medication_id / diet_type_id set (checked).
--   medication_id,    ON DELETE CASCADE, for 0093's reason: both item tables
--   diet_type_id      are hard-deleted from Management, and a delete must not
--                     start failing because the item was once delivered.
--   quantity          in the item's own unit, as stock_on_hand and
--                     counted_quantity are. > 0: a delivery of nothing is not
--                     a delivery, and a return to the supplier is not modelled
--                     here (it would be a negative "received" and deserves its
--                     own word if it is ever needed).
--   unit              the item's unit AT RECEIPT (medication.dose_unit,
--                     diet_types.unit), stamped by the trigger below from the
--                     item, never from the caller. A separate column from the
--                     item's current unit because that one is editable: 20
--                     "tablet" received in March must not become 20 "ml"
--                     because someone corrects the unit in May. Same rule as
--                     stock_counts.unit, and the view refuses to add across a
--                     difference. The form converts what the supplier shipped
--                     ("2 boxes of 50") into the item's unit before saving;
--                     the row records the result and which unit it was in.
--   received_at       timestamptz, not a date. The sum needs to put every
--                     delivery on one side of every count, and stocktakes are
--                     stamped to the instant (counted_at). With a date, a
--                     delivery on the day of a stocktake is ambiguous — was it
--                     on the shelf when it was counted? — and whichever way a
--                     date rule guesses, one interval's usage is overstated by
--                     the delivery and the next is understated by it. Default
--                     now(): a delivery recorded as it is unpacked lands
--                     correctly with no question asked. A back-dated delivery
--                     needs a time only when it falls on a count day; the
--                     feature asks "before or after the stocktake?" then.
--   supplier_contact_id  optional; a contacts row (Vendor, in practice — not
--                     enforced, as nothing else enforces a contact's type on
--                     reference). ON DELETE SET NULL: contacts are archived,
--                     not deleted, since 0075, and a delivery outlives its
--                     supplier record.
--   cost              optional, the total paid for this delivery in baht
--                     (the app's only currency). >= 0; 0 is a donation.
--   note              free text.
--   recorded_by       auth.uid() of whoever saved it, stamped by the trigger;
--                     null for service-role writes.
--
-- The interval rule, which is the whole reason for the table:
--
--   for consecutive counts A then B of one item (stock_counts, by counted_at),
--   received = sum(quantity) of that item's receipts with
--              A.counted_at < received_at <= B.counted_at
--   used     = A.counted_quantity + received − B.counted_quantity
--
-- Half-open on the left, closed on the right, so every receipt belongs to
-- exactly one interval and a delivery stamped at the same instant as a count
-- is taken to be on the shelf when it was counted. stock_count_intervals
-- returns one row per such pair with used, or used = null and
-- unit_changed = true when A, B and every receipt in between do not share
-- one unit (0093: "the feature should not subtract across a unit change").
-- A negative used is left as it comes: it means a delivery nobody logged,
-- and hiding it would hide exactly that.
--
-- What the view still cannot know: 0093's caveat that the single-cell stock
-- edit on Management → Medications / Diets writes stock_on_hand with no
-- history row. The intervals are between stocktakes only. And receipts do
-- NOT touch stock_on_hand — a delivery is not a count, and bumping the
-- counted figure by the delivery would make the next "previous count"
-- something nobody counted. Whether the page should also offer "and set the
-- count to …" is the feature's call; if it does, that is a count and goes
-- through record_stocktake.
--
-- Who: read by the roles that see stock (0091's list: admin, management,
-- staff, volunteer), as stock_counts is. Written directly (no function) by
-- admin, management and staff — the people who take a delivery at the door;
-- volunteers count but do not record deliveries or costs. Vets, public
-- viewers and anon get nothing; current_user_role() is null for anon and an
-- archived login, and `null in (…)` is not true. Unlike stock_counts,
-- receipts are editable and deletable: a delivery typed wrong is corrected,
-- not re-counted.
--
-- Additive: a new table, trigger function and view. Re-runnable throughout.
-- To undo, drop the view, the table and the function in a new file.

create table if not exists stock_receipts (
  id uuid primary key default gen_random_uuid(),
  item_kind text not null check (item_kind in ('medication', 'diet_type')),
  medication_id uuid references medication (id) on delete cascade,
  diet_type_id uuid references diet_types (id) on delete cascade,
  quantity numeric not null check (quantity > 0),
  unit text,
  received_at timestamptz not null default now(),
  supplier_contact_id uuid references contacts (id) on delete set null,
  cost numeric check (cost >= 0),
  note text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint stock_receipts_one_item check (
    (item_kind = 'medication' and medication_id is not null and diet_type_id is null)
    or (item_kind = 'diet_type' and diet_type_id is not null and medication_id is null)
  )
);

create index if not exists stock_receipts_medication_idx
  on stock_receipts (medication_id, received_at) where medication_id is not null;
create index if not exists stock_receipts_diet_type_idx
  on stock_receipts (diet_type_id, received_at) where diet_type_id is not null;

comment on table stock_receipts is
  'One row per delivery of one item, in the item''s unit at receipt (0096). With stock_counts it gives used = previous count + received − new count; stock_count_intervals does that sum. Does not change stock_on_hand.';
comment on column stock_receipts.unit is
  'The item''s unit when the delivery was recorded, stamped from the item by the trigger; not the item''s current unit (0096).';
comment on column stock_receipts.received_at is
  'When the delivery arrived. A timestamp so each delivery falls on one side of each stocktake: it belongs to the interval with previous.counted_at < received_at <= next.counted_at (0096).';
comment on column stock_receipts.cost is
  'Optional total paid for this delivery, in baht. 0 = donated.';

-- The unit snapshot and the recorder come from the database, not the form.
-- On insert, and on an update that moves the row to a different item, the
-- unit is the item's current one; an update that only fixes the quantity,
-- date, cost or note keeps the unit it was received in.
create or replace function stock_receipts_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     or new.medication_id is distinct from old.medication_id
     or new.diet_type_id is distinct from old.diet_type_id then
    new.unit := case new.item_kind
      when 'medication' then (select m.dose_unit from medication m where m.id = new.medication_id)
      else (select d.unit from diet_types d where d.id = new.diet_type_id)
    end;
  else
    new.unit := old.unit;
  end if;

  if tg_op = 'INSERT' then
    new.recorded_by := auth.uid();
    new.created_at := now();
  else
    new.recorded_by := old.recorded_by;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;

drop trigger if exists stock_receipts_stamp on stock_receipts;
create trigger stock_receipts_stamp
  before insert or update on stock_receipts
  for each row execute function stock_receipts_stamp();

alter table stock_receipts enable row level security;

drop policy if exists stock_roles_read_stock_receipts on stock_receipts;
create policy stock_roles_read_stock_receipts on stock_receipts for select
  using (current_user_role() in ('admin', 'management', 'staff', 'volunteer'));

drop policy if exists stock_keepers_write_stock_receipts on stock_receipts;
create policy stock_keepers_write_stock_receipts on stock_receipts for all
  using (current_user_role() in ('admin', 'management', 'staff'))
  with check (current_user_role() in ('admin', 'management', 'staff'));

revoke all on stock_receipts from public, anon, authenticated;
grant select, insert, update, delete on stock_receipts to authenticated;
grant all on stock_receipts to service_role;

-- One row per pair of consecutive counts of one item. security_invoker, so
-- the caller's RLS on stock_counts and stock_receipts applies and the view
-- shows nobody more than the tables do.
create or replace view stock_count_intervals with (security_invoker = true) as
with counts as (
  select c.id, c.item_kind, c.medication_id, c.diet_type_id,
         c.counted_quantity, c.unit, c.counted_at,
         lag(c.id) over w as from_count_id,
         lag(c.counted_quantity) over w as from_quantity,
         lag(c.unit) over w as from_unit,
         lag(c.counted_at) over w as from_counted_at
    from stock_counts c
  window w as (partition by c.item_kind, c.medication_id, c.diet_type_id order by c.counted_at, c.id)
)
select k.item_kind,
       k.medication_id,
       k.diet_type_id,
       k.from_count_id,
       k.from_counted_at,
       k.from_quantity,
       k.id as to_count_id,
       k.counted_at as to_counted_at,
       k.counted_quantity as to_quantity,
       k.unit,
       coalesce(r.received, 0) as received,
       coalesce(r.receipts, 0) as receipts,
       (k.from_unit is distinct from k.unit or coalesce(r.other_units, 0) > 0) as unit_changed,
       case
         when k.from_unit is distinct from k.unit or coalesce(r.other_units, 0) > 0 then null
         else k.from_quantity + coalesce(r.received, 0) - k.counted_quantity
       end as used
  from counts k
  left join lateral (
    select sum(s.quantity) as received,
           count(*) as receipts,
           count(*) filter (where s.unit is distinct from k.unit) as other_units
      from stock_receipts s
     where s.item_kind = k.item_kind
       and s.medication_id is not distinct from k.medication_id
       and s.diet_type_id is not distinct from k.diet_type_id
       and s.received_at > k.from_counted_at
       and s.received_at <= k.counted_at
  ) r on true
 where k.from_count_id is not null;

comment on view stock_count_intervals is
  'Consecutive stocktake counts of one item, with the deliveries between them (previous.counted_at < received_at <= next.counted_at) and used = from_quantity + received − to_quantity. used is null and unit_changed true when the counts and receipts do not share one unit. A negative used means an unlogged delivery (0096).';

revoke all on stock_count_intervals from public, anon, authenticated;
grant select on stock_count_intervals to authenticated;
grant all on stock_count_intervals to service_role;

notify pgrst, 'reload schema';
