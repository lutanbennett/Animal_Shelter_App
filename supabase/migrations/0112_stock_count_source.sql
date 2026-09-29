-- 0112: a stock_counts row now says where it came from, and the single-cell
-- stock edit on Management writes one.
--
-- The problem (backlog, found 2026-09-27). 0093 made record_stocktake() write
-- a stock_counts row per item, and back-filled one synthetic stocktake for
-- every figure already on an item. But the single-cell edit on Management →
-- Medications / Diets (updateMedicationStock / updateDietTypeStock) updated
-- stock_on_hand directly and wrote nothing. So a cell edit made before 0093
-- is in the history (as a back-fill row) and the same edit made after it is
-- not: a split nobody could reconstruct from the data later. 0093's header
-- also said the omission was deliberate ("logging a correction as a count
-- would invent usage") without saying the back-fill had done exactly that.
--
-- Decision (Lutan, 2026-09-29): one way in, honestly labelled.
--   source = 'count'       a stocktake saved by record_stocktake()
--            'correction'  a figure typed in a Management cell, written by
--                          record_stock_correction() below
--            'backfill'    0093's synthetic rows, made from stock_on_hand and
--                          stock_counted_at when the history began
-- Existing rows: counted_by null is exactly what 0093's back-fill wrote (a
-- stocktake always records auth.uid()), so those become 'backfill'; the rest
-- keep the column default, 'count'.
--
-- Corrections are history but not counts. stock_count_intervals (0096) pairs
-- consecutive COUNTS, so it now ignores 'correction' rows: fixing a typo must
-- not read as usage, and a correction between two stocktakes leaves that
-- interval as it was. 'backfill' rows still pair, as they did: they are the
-- only baseline the earliest items have.
--
-- record_stock_correction(kind, id, count): admin and management (who can edit
-- the cell today), security definer so the history stays function-only. It
-- sets stock_on_hand (0083's trigger stamps stock_counted_at once, as before;
-- this function does not touch it) and inserts one 'correction' row with the
-- item's unit and counted_at = the stamp the trigger just wrote. A null count
-- clears the item back to "not counted" (the cell's blank), which has no
-- figure to record, so no row is written. Refuses a negative count or an
-- unknown item. Callers cannot set counted_at.
--
-- Additive and re-runnable. To undo: drop the function, recreate the view
-- from 0096 and drop the column, in a new file.

alter table stock_counts add column if not exists source text not null default 'count';

alter table stock_counts drop constraint if exists stock_counts_source_check;
alter table stock_counts add constraint stock_counts_source_check
  check (source in ('count', 'correction', 'backfill'));

update stock_counts set source = 'backfill'
 where counted_by is null and source = 'count';

comment on column stock_counts.source is
  'count = a stocktake saved by record_stocktake(); correction = a figure typed in a Management cell (record_stock_correction, 0112); backfill = the synthetic row 0093 made from an existing stock_on_hand. Corrections are history but are not paired into usage intervals.';

comment on table stock_counts is
  'One row per item per stocktake or typed correction, in the item''s unit at the time. Written only by record_stocktake() (source count) and record_stock_correction() (source correction); 0093 back-filled source backfill. Readable by admin, management, staff and volunteer. Usage intervals pair counts and back-fills, not corrections (0112).';

create or replace function record_stock_correction(
  p_kind text,
  p_id uuid,
  p_count numeric
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_at timestamptz;
  v_unit text;
  v_found integer;
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management') then
    raise exception 'Not authorized to edit stock.';
  end if;
  if p_kind not in ('medication', 'diet_type') then
    raise exception 'Unknown item kind.';
  end if;
  if p_count is not null and p_count < 0 then
    raise exception 'A stock count cannot be negative.';
  end if;

  if p_kind = 'medication' then
    update medication set stock_on_hand = p_count where id = p_id
      returning stock_counted_at, dose_unit into v_at, v_unit;
  else
    update diet_types set stock_on_hand = p_count where id = p_id
      returning stock_counted_at, unit into v_at, v_unit;
  end if;
  get diagnostics v_found = row_count;
  if v_found = 0 then
    raise exception 'That item was not found. Reload the page and try again.';
  end if;

  if p_count is not null then
    insert into stock_counts
      (stocktake_id, item_kind, medication_id, diet_type_id, counted_quantity, unit, counted_at, counted_by, source)
    values
      (gen_random_uuid(), p_kind,
       case when p_kind = 'medication' then p_id end,
       case when p_kind = 'diet_type' then p_id end,
       p_count, v_unit, v_at, auth.uid(), 'correction');
  end if;

  return v_at;
end;
$$;

comment on function record_stock_correction(text, uuid, numeric) is
  'The single-cell stock edit on Management: sets stock_on_hand (0083''s trigger stamps stock_counted_at) and writes one stock_counts row with source correction. A null count clears the item to "not counted" and writes no row. admin and management only; security definer (0112).';

revoke all on function record_stock_correction(text, uuid, numeric) from public, anon;
grant execute on function record_stock_correction(text, uuid, numeric) to authenticated, service_role;

comment on function record_stocktake(jsonb, jsonb) is
  'Saves a stocktake in one transaction: each list is [{"id", "count"}] for medication / diet_types, and every listed row gets stock_on_hand = count and the same stock_counted_at (0083''s trigger, now()), and a stock_counts history row (source count) with one stocktake_id for the call (0093). Unlisted rows are untouched. Security definer: callable by admin, management, staff and volunteer, and writes only stock_on_hand and the history (0091). Refuses null or negative counts and repeated or unknown ids: nothing is written unless everything is (0088). A figure typed in a Management cell does not come through here: record_stock_correction() writes it with source correction (0112).';

create or replace view stock_count_intervals with (security_invoker = true) as
with counts as (
  select c.id, c.item_kind, c.medication_id, c.diet_type_id,
         c.counted_quantity, c.unit, c.counted_at,
         lag(c.id) over w as from_count_id,
         lag(c.counted_quantity) over w as from_quantity,
         lag(c.unit) over w as from_unit,
         lag(c.counted_at) over w as from_counted_at
    from stock_counts c
   where c.source <> 'correction'
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
  'Consecutive counts (source count or backfill, not correction) of one item, with the deliveries between them (previous.counted_at < received_at <= next.counted_at) and used = from_quantity + received − to_quantity. used is null and unit_changed true when the counts and receipts do not share one unit. A negative used means an unlogged delivery (0096, 0112).';

notify pgrst, 'reload schema';
