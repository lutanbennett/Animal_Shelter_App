-- Stock count history (backlog, "Actual usage from stocktakes, compared with
-- planned usage", Lutan 2026-09-26; schema half — the feature half reads it).
--
-- stock_on_hand (0083) is one figure per item, overwritten at every count,
-- so the previous count is gone the moment a new one is saved. Actual usage
-- is
--
--     used = previous count + stock received − new count
--
-- and this file supplies the first missing piece: a stock_counts row per
-- item per stocktake, written by record_stocktake() as it saves.
--
-- What the history does NOT give you: "stock received". Nothing records a
-- delivery, so between two counts the app knows the two figures and the
-- forecast but not what came in. Until a receipts concept exists (not
-- invented here; it is its own backlog question), a rise between counts is
-- a delivery nobody logged and a fall is a LOWER BOUND on usage only when
-- nothing arrived. The feature can show count-to-count change beside the
-- planned usage for the same interval; it cannot yet state actual usage.
--
-- The table.
--   stocktake_id      one uuid per record_stocktake() call, so one session's
--                     rows group together. Not a foreign key: there is no
--                     stocktakes table, and the call is the session.
--   item_kind         'medication' | 'diet_type', with exactly the matching
--                     one of medication_id / diet_type_id set (checked).
--                     Two real foreign keys rather than one untyped item id,
--                     so a row cannot point at nothing.
--   medication_id,    ON DELETE CASCADE: both tables are hard-deleted from
--   diet_type_id      Management today, and a delete must not start failing
--                     because the item was once counted. An item's history
--                     goes with it.
--   counted_quantity  in the item's own unit, as stock_on_hand is. >= 0.
--   unit              the unit at the moment of counting (medication.
--                     dose_unit, diet_types.unit), because both are editable:
--                     a count of 40 "tablet" must not silently become 40 "ml"
--                     when someone fixes the unit later. The feature should
--                     not subtract across a unit change.
--   counted_at        the same now() the 0083 trigger stamps on the item, so
--                     the latest history row and stock_counted_at agree.
--   counted_by        auth.uid() of the caller; null for the back-fill below
--                     and for service-role calls.
--
-- Who writes it: nobody directly. There are no INSERT / UPDATE / DELETE
-- policies and no write grants to authenticated; the only writer is
-- record_stocktake(), security definer since 0091. So the history is what
-- stocktakes said, and nobody can back-date or edit a count through the
-- API. Who reads it: the roles that can see stock and run a stocktake —
-- admin, management, staff, volunteer (0091's list). Vets, public viewers
-- and anon read nothing; current_user_role() is null for anon and an
-- archived login, and `null in (…)` is not true.
--
-- What is NOT recorded: the single-cell stock edit on Management →
-- Medications / Diets (updateMedicationStock / updateDietTypeStock) still
-- sets stock_on_hand without a history row, as the brief scoped it to the
-- stocktake save. That edit is also how a typo is corrected, and logging a
-- correction as a count would invent usage. So the latest history row can
-- be older than stock_counted_at; the feature should compare the two and
-- say so rather than trust the history alone.
--
-- record_stocktake() is 0091 unchanged — same signature, return type,
-- validation, refusals, roles and grants — plus one insert per list after
-- both updates have succeeded. 0088's guarantees survive:
--   - one counted_at for the whole call: the updates' trigger and the
--     history insert both use now(), fixed for the transaction;
--   - an item absent from the list is left alone, and gets no history row;
--   - callers cannot set counted_at: it is not a parameter, and the table
--     cannot be written except through this function;
--   - all or nothing: a refusal raises, and the history insert is in the
--     same transaction as the updates, so a refused sheet leaves no rows.
-- The history insert reads stock_on_hand back from the row just updated
-- rather than from the JSON, so it records what was stored (the column's
-- numeric), not a second parse of the input.
--
-- Back-fill: every item that already has a count gets one history row from
-- stock_on_hand / stock_counted_at, grouped into one stocktake_id per
-- distinct counted_at, counted_by null. Without it the first stocktake after
-- this applies would have no "previous count" to compare with. Guarded by
-- `not exists` on (item, counted_at), so re-running adds nothing.
--
-- Additive: a new table, and the function re-created with the same
-- signature. Re-runnable throughout. To undo, re-apply 0091's definition and
-- drop the table in a new file.

create table if not exists stock_counts (
  id uuid primary key default gen_random_uuid(),
  stocktake_id uuid not null,
  item_kind text not null check (item_kind in ('medication', 'diet_type')),
  medication_id uuid references medication (id) on delete cascade,
  diet_type_id uuid references diet_types (id) on delete cascade,
  counted_quantity numeric not null check (counted_quantity >= 0),
  unit text,
  counted_at timestamptz not null default now(),
  counted_by uuid references auth.users (id) on delete set null,
  constraint stock_counts_one_item check (
    (item_kind = 'medication' and medication_id is not null and diet_type_id is null)
    or (item_kind = 'diet_type' and diet_type_id is not null and medication_id is null)
  )
);

create index if not exists stock_counts_medication_idx
  on stock_counts (medication_id, counted_at) where medication_id is not null;
create index if not exists stock_counts_diet_type_idx
  on stock_counts (diet_type_id, counted_at) where diet_type_id is not null;
create index if not exists stock_counts_stocktake_idx on stock_counts (stocktake_id);

comment on table stock_counts is
  'One row per item per stocktake: what record_stocktake() saved, in the item''s unit at the time. Written only by record_stocktake(); readable by admin, management, staff and volunteer. No stock-received figure exists yet, so this alone cannot give actual usage (0093).';

alter table stock_counts enable row level security;

drop policy if exists stock_roles_read_stock_counts on stock_counts;
create policy stock_roles_read_stock_counts on stock_counts for select
  using (current_user_role() in ('admin', 'management', 'staff', 'volunteer'));

revoke all on stock_counts from public, anon, authenticated;
grant select on stock_counts to authenticated;
grant all on stock_counts to service_role;

-- Back-fill: today's counts become the first history rows.
insert into stock_counts
  (stocktake_id, item_kind, medication_id, diet_type_id, counted_quantity, unit, counted_at, counted_by)
select g.stocktake_id, i.item_kind, i.medication_id, i.diet_type_id,
       i.stock_on_hand, i.unit, i.stock_counted_at, null
  from (
    select 'medication' as item_kind, m.id as medication_id, null::uuid as diet_type_id,
           m.stock_on_hand, m.dose_unit as unit, m.stock_counted_at
      from medication m
     where m.stock_on_hand is not null and m.stock_counted_at is not null
    union all
    select 'diet_type', null, d.id, d.stock_on_hand, d.unit, d.stock_counted_at
      from diet_types d
     where d.stock_on_hand is not null and d.stock_counted_at is not null
  ) i
  join (
    select t.stock_counted_at, gen_random_uuid() as stocktake_id
      from (
        select stock_counted_at from medication where stock_on_hand is not null
        union
        select stock_counted_at from diet_types where stock_on_hand is not null
      ) t
     where t.stock_counted_at is not null
  ) g on g.stock_counted_at = i.stock_counted_at
 where not exists (
   select 1 from stock_counts s
    where s.counted_at = i.stock_counted_at
      and s.medication_id is not distinct from i.medication_id
      and s.diet_type_id is not distinct from i.diet_type_id
 );

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

  -- Validate both lists before either is written.
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

  -- History (0093): one row per listed item, read back from what was just
  -- stored, stamped with the same now() the trigger gave the item.
  insert into stock_counts
    (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at, counted_by)
  select v_stocktake, 'medication', m.id, m.stock_on_hand, m.dose_unit, now(), auth.uid()
    from jsonb_to_recordset(v_lists -> 'medication') as x(id uuid)
    join medication m on m.id = x.id;

  insert into stock_counts
    (stocktake_id, item_kind, diet_type_id, counted_quantity, unit, counted_at, counted_by)
  select v_stocktake, 'diet_type', d.id, d.stock_on_hand, d.unit, now(), auth.uid()
    from jsonb_to_recordset(v_lists -> 'diet_types') as x(id uuid)
    join diet_types d on d.id = x.id;

  return query select v_med, v_diet, now();
end;
$$;

comment on function record_stocktake(jsonb, jsonb) is
  'Saves a stocktake in one transaction: each list is [{"id", "count"}] for medication / diet_types, and every listed row gets stock_on_hand = count and the same stock_counted_at (0083''s trigger, now()), and a stock_counts history row with one stocktake_id for the call (0093). Unlisted rows are untouched. Security definer: callable by admin, management, staff and volunteer, and writes only stock_on_hand and the history (0091). Refuses null or negative counts and repeated or unknown ids — nothing is written unless everything is (0088).';

revoke all on function record_stocktake(jsonb, jsonb) from public, anon;
grant execute on function record_stocktake(jsonb, jsonb) to authenticated, service_role;

notify pgrst, 'reload schema';
