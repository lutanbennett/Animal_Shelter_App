-- Units of measure: a per-item conversion table, and the point-in-time
-- "as entered" record on deliveries and counts (backlog, "Units of measure:
-- buy and count in one unit, feed or dose in another"; schema half — the
-- feature half reads and writes these).
--
-- Today each item has one unit (diet_types.unit, medication.dose_unit) used
-- for feeding, stock, counts and deliveries. That unit stays, and becomes the
-- item's BASE unit: nothing is renamed, nothing is rewritten, every existing
-- stock_counts / stock_receipts row is already in base units. This file adds
-- other units an item is bought, received or counted in, each with how many
-- base units one of it holds.
--
-- 1. item_unit_conversions — one row per (item, other unit).
--      item_kind / medication_id / diet_type_id   the item, in the exact shape
--        of stock_counts and stock_receipts (0093, 0096), ON DELETE CASCADE
--        for the same reason: both item tables are hard-deleted from
--        Management.
--      unit            the name staff see: 'kg', 'bag (20 kg)', 'box'. Unique
--        per item, case-insensitively. It must not repeat the base unit (1
--        base unit = 1 base unit is implicit); the schema cannot check that
--        across tables without a trigger, so the feature's form does.
--      base_units_per  how many base units ONE of this unit holds (> 0):
--        kibble base 'cup', 'kg' = 10, 'bag (20 kg)' = 200. May be an
--        approximation (a cup of kibble); nothing here says which.
--      is_purchase_unit / is_count_unit   which conversion forms default to.
--        At most one of each per item (partial unique indexes); the same row
--        may be both; neither is required.
--    This table is MUTABLE on purpose — a factor that turns out to be wrong is
--    edited here. That is safe only because nothing that has been recorded
--    looks the factor up again, which is the next part.
--
-- 2. `entered` on stock_receipts and stock_counts — the point-in-time factor.
--    A jsonb array of lines, each {"quantity", "unit", "factor"}: what was
--    typed, in which unit, and the base units per that unit AT THAT MOMENT.
--    The row's own quantity / counted_quantity stays the base-unit total and
--    is what every reader (usage intervals, stock_on_hand, forecasts) keeps
--    using, so editing a conversion later cannot re-value a past row: the row
--    carries its own copy of the factor, not a reference to the live one.
--    An array, not three columns, so "3 bags and 4 kg" (mixed entry, still
--    undecided) needs no second migration. Null = entered directly in the
--    base unit, which is every row that exists today, every correction
--    (record_stock_correction) and every back-fill.
--    A CHECK ties the two together: entered must be a non-empty array of
--    well-formed lines whose sum of quantity × factor equals the base-unit
--    total (to rounding), so the copy and the figure cannot drift apart.
--
-- 3. record_stocktake() keeps its signature. Each element of either list may
--    now carry an optional "entered" array as above, alongside "id" and
--    "count" (count stays base units); it is validated against count and
--    stored on the stock_counts row. Without it the function behaves exactly
--    as in 0093/0112.
--
-- Stock deliveries need no function: stock_receipts is written directly and
-- the feature half sets quantity (base) and entered together; the CHECK
-- enforces they agree. Its `unit` column is still stamped by trigger and
-- stays the BASE unit, so stock_count_intervals (which compares units) is
-- untouched.
--
-- Cost is not here: price per purchase unit ÷ base_units_per gives the
-- existing per-base-unit cost the forecasts already use, so the feature half
-- can derive it without a column.
--
-- Additive and invisible: no code reads any of this yet. Re-runnable.

-- ---------------------------------------------------------------------------
-- 1. Conversions
-- ---------------------------------------------------------------------------

create table if not exists item_unit_conversions (
  id uuid primary key default gen_random_uuid(),
  item_kind text not null check (item_kind in ('medication', 'diet_type')),
  medication_id uuid references medication (id) on delete cascade,
  diet_type_id uuid references diet_types (id) on delete cascade,
  unit text not null check (length(btrim(unit)) > 0),
  base_units_per numeric not null check (base_units_per > 0),
  is_purchase_unit boolean not null default false,
  is_count_unit boolean not null default false,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint item_unit_conversions_one_item check (
    (item_kind = 'medication' and medication_id is not null and diet_type_id is null)
    or (item_kind = 'diet_type' and diet_type_id is not null and medication_id is null)
  )
);

create unique index if not exists item_unit_conversions_medication_unit_key
  on item_unit_conversions (medication_id, lower(btrim(unit))) where medication_id is not null;
create unique index if not exists item_unit_conversions_diet_type_unit_key
  on item_unit_conversions (diet_type_id, lower(btrim(unit))) where diet_type_id is not null;
create unique index if not exists item_unit_conversions_medication_purchase_key
  on item_unit_conversions (medication_id) where is_purchase_unit and medication_id is not null;
create unique index if not exists item_unit_conversions_diet_type_purchase_key
  on item_unit_conversions (diet_type_id) where is_purchase_unit and diet_type_id is not null;
create unique index if not exists item_unit_conversions_medication_count_key
  on item_unit_conversions (medication_id) where is_count_unit and medication_id is not null;
create unique index if not exists item_unit_conversions_diet_type_count_key
  on item_unit_conversions (diet_type_id) where is_count_unit and diet_type_id is not null;

comment on table item_unit_conversions is
  'Other units an item is bought, received or counted in, each with how many of the item''s base unit (medication.dose_unit / diet_types.unit) one of it holds. Mutable: a recorded row keeps its own copy of the factor in stock_receipts.entered / stock_counts.entered, so editing a factor never re-values history (0118).';
comment on column item_unit_conversions.base_units_per is
  'How many base units one of this unit holds (kibble, base cup: kg = 10, bag = 200). May be approximate (0118).';
comment on column item_unit_conversions.is_purchase_unit is
  'The unit deliveries and prices default to; at most one per item (0118).';
comment on column item_unit_conversions.is_count_unit is
  'The unit stocktakes default to; at most one per item, may be the same row as the purchase unit (0118).';

drop trigger if exists item_unit_conversions_touch_updated_at on item_unit_conversions;
create trigger item_unit_conversions_touch_updated_at
  before update on item_unit_conversions
  for each row execute function touch_updated_at();

alter table item_unit_conversions enable row level security;

drop policy if exists stock_roles_read_item_unit_conversions on item_unit_conversions;
create policy stock_roles_read_item_unit_conversions on item_unit_conversions for select
  using (current_user_role() in ('admin', 'management', 'staff', 'volunteer'));

drop policy if exists managers_write_item_unit_conversions on item_unit_conversions;
create policy managers_write_item_unit_conversions on item_unit_conversions for all
  using (current_user_role() in ('admin', 'management'))
  with check (current_user_role() in ('admin', 'management'));

revoke all on item_unit_conversions from public, anon, authenticated;
grant select, insert, update, delete on item_unit_conversions to authenticated;
grant all on item_unit_conversions to service_role;

-- ---------------------------------------------------------------------------
-- 2. The point-in-time record on receipts and counts
-- ---------------------------------------------------------------------------

-- Sum of quantity × factor over the lines of an `entered` array, or null when
-- it is not a non-empty array of {quantity >= 0, unit (text), factor > 0}.
create or replace function units_entered_total(p_entered jsonb)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when jsonb_typeof(p_entered) is distinct from 'array'
      or jsonb_array_length(p_entered) = 0 then null
    when exists (
      select 1 from jsonb_array_elements(p_entered) e
       where jsonb_typeof(e) is distinct from 'object'
          or jsonb_typeof(e -> 'quantity') is distinct from 'number'
          or jsonb_typeof(e -> 'unit') is distinct from 'string'
          or jsonb_typeof(e -> 'factor') is distinct from 'number'
    ) then null
    when exists (
      select 1 from jsonb_array_elements(p_entered) e
       where (e ->> 'quantity')::numeric < 0
          or (e ->> 'factor')::numeric <= 0
          or length(btrim(e ->> 'unit')) = 0
    ) then null
    else (select sum((e ->> 'quantity')::numeric * (e ->> 'factor')::numeric)
            from jsonb_array_elements(p_entered) e)
  end;
$$;

comment on function units_entered_total(jsonb) is
  'Base-unit total of an "entered" array [{"quantity","unit","factor"}], or null when malformed. Used by the CHECKs on stock_receipts and stock_counts (0118).';

revoke all on function units_entered_total(jsonb) from public, anon;
grant execute on function units_entered_total(jsonb) to authenticated, service_role;

alter table stock_receipts add column if not exists entered jsonb;
alter table stock_counts add column if not exists entered jsonb;

alter table stock_receipts drop constraint if exists stock_receipts_entered_matches;
alter table stock_receipts add constraint stock_receipts_entered_matches check (
  entered is null
  or coalesce(abs(units_entered_total(entered) - quantity) <= 0.000001 * greatest(1, quantity), false)
);

alter table stock_counts drop constraint if exists stock_counts_entered_matches;
alter table stock_counts add constraint stock_counts_entered_matches check (
  entered is null
  or coalesce(abs(units_entered_total(entered) - counted_quantity) <= 0.000001 * greatest(1, counted_quantity), false)
);

comment on column stock_receipts.entered is
  'What was typed, as [{"quantity","unit","factor"}]: factor = base units per that unit when the delivery was recorded, a copy, not a reference, so editing a conversion never re-values the row. quantity stays the base-unit total and must equal sum(quantity × factor). Null = entered in the base unit (0118).';
comment on column stock_counts.entered is
  'What was typed, as [{"quantity","unit","factor"}]: factor = base units per that unit at the time of the count. counted_quantity stays the base-unit total and must equal sum(quantity × factor). Null = entered in the base unit, which includes every correction and back-fill (0118).';

-- ---------------------------------------------------------------------------
-- 3. record_stocktake(): same signature, optional "entered" per element
-- ---------------------------------------------------------------------------

create or replace function record_stocktake(
  p_medication jsonb default null,
  p_diet_types jsonb default null
)
returns table (medication_updated integer, diet_types_updated integer, counted_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lists jsonb := jsonb_build_object(
    'medication', coalesce(p_medication, '[]'::jsonb),
    'diet_types', coalesce(p_diet_types, '[]'::jsonb)
  );
  v_kind text;
  v_label text;
  v_bad integer;
  v_repeated integer;
  v_med integer := 0;
  v_diet integer := 0;
  v_stocktake uuid := gen_random_uuid();
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'volunteer') then
    raise exception 'Not authorized to record a stocktake.';
  end if;

  foreach v_kind in array array['medication', 'diet_types'] loop
    v_label := case v_kind when 'medication' then 'medication' else 'diet type' end;
    if jsonb_typeof(v_lists -> v_kind) <> 'array' then
      raise exception 'The % counts must be a list.', v_label;
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_lists -> v_kind) e
       where jsonb_typeof(e) <> 'object'
          or jsonb_typeof(e -> 'id') is distinct from 'string'
          or (e ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          or jsonb_typeof(e -> 'count') is distinct from 'number'
    ) then
      raise exception 'Every % count needs an id and a number. Leave out an item that was not counted.', v_label;
    end if;
    select count(*) filter (where (e ->> 'count')::numeric < 0),
           count(*) - count(distinct (e ->> 'id')::uuid)
      into v_bad, v_repeated
      from jsonb_array_elements(v_lists -> v_kind) e;
    if v_bad > 0 then
      raise exception 'A stock count cannot be negative.';
    end if;
    if v_repeated > 0 then
      raise exception 'The same % is listed twice.', v_label;
    end if;
    -- Optional "entered": when present it must be well-formed and add up to
    -- count, the same rule the stock_counts CHECK would enforce, raised here
    -- first so the message names the problem.
    if exists (
      select 1 from jsonb_array_elements(v_lists -> v_kind) e
       where e ? 'entered'
         and jsonb_typeof(e -> 'entered') <> 'null'
         and (units_entered_total(e -> 'entered') is null
              or abs(units_entered_total(e -> 'entered') - (e ->> 'count')::numeric)
                   > 0.000001 * greatest(1, (e ->> 'count')::numeric))
    ) then
      raise exception 'The units entered for a % count do not add up to the count.', v_label;
    end if;
  end loop;

  update medication m
     set stock_on_hand = x.count
    from jsonb_to_recordset(v_lists -> 'medication') as x(id uuid, count numeric)
   where m.id = x.id;
  get diagnostics v_med = row_count;
  if v_med <> jsonb_array_length(v_lists -> 'medication') then
    raise exception 'Stocktake not saved: % of % medications were found. Reload the page and count again.',
      v_med, jsonb_array_length(v_lists -> 'medication');
  end if;

  update diet_types d
     set stock_on_hand = x.count
    from jsonb_to_recordset(v_lists -> 'diet_types') as x(id uuid, count numeric)
   where d.id = x.id;
  get diagnostics v_diet = row_count;
  if v_diet <> jsonb_array_length(v_lists -> 'diet_types') then
    raise exception 'Stocktake not saved: % of % diet types were found. Reload the page and count again.',
      v_diet, jsonb_array_length(v_lists -> 'diet_types');
  end if;

  insert into stock_counts
    (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at, counted_by, entered)
  select v_stocktake, 'medication', m.id, m.stock_on_hand, m.dose_unit, now(), auth.uid(),
         case when jsonb_typeof(x.entered) = 'array' then x.entered end
    from jsonb_to_recordset(v_lists -> 'medication') as x(id uuid, entered jsonb)
    join medication m on m.id = x.id;

  insert into stock_counts
    (stocktake_id, item_kind, diet_type_id, counted_quantity, unit, counted_at, counted_by, entered)
  select v_stocktake, 'diet_type', d.id, d.stock_on_hand, d.unit, now(), auth.uid(),
         case when jsonb_typeof(x.entered) = 'array' then x.entered end
    from jsonb_to_recordset(v_lists -> 'diet_types') as x(id uuid, entered jsonb)
    join diet_types d on d.id = x.id;

  return query select v_med, v_diet, now();
end;
$$;

comment on function record_stocktake(jsonb, jsonb) is
  'Saves a stocktake in one transaction: each list is [{"id", "count", "entered"?}] for medication / diet_types, count in BASE units, and every listed row gets stock_on_hand = count and the same stock_counted_at (0083''s trigger, now()), and a stock_counts history row (source count) with one stocktake_id for the call (0093). The optional entered array [{"quantity","unit","factor"}] is what was typed and the factors then in force, stored on the history row; it must add up to count (0118). Unlisted rows are untouched. Security definer: callable by admin, management, staff and volunteer, and writes only stock_on_hand and the history (0091). Refuses null or negative counts and repeated or unknown ids: nothing is written unless everything is (0088). A figure typed in a Management cell does not come through here: record_stock_correction() writes it with source correction (0112).';

revoke all on function record_stocktake(jsonb, jsonb) from public, anon;
grant execute on function record_stocktake(jsonb, jsonb) to authenticated, service_role;

notify pgrst, 'reload schema';
