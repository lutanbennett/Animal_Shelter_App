-- record_stocktake(): save a whole stocktake in one call (backlog,
-- "Stocktake page: count everything in one go"; schema half — the feature
-- half, the /management/stocktake sheet, calls it).
--
-- Stock on hand (0083) is edited one cell at a time today:
-- updateMedicationStock / updateDietTypeStock each send one
-- `update … set stock_on_hand` through supabase-js. A stocktake of 100 items
-- is 100 writes, each with its own stock_counted_at, and a failure halfway
-- leaves half a count. This function takes the whole sheet and writes it in
-- one transaction.
--
--   record_stocktake(p_medication jsonb, p_diet_types jsonb)
--     each a JSON array of {"id": <uuid>, "count": <number>}; either may be
--     null or [] (a sheet saved from one tab). Both in one call is one
--     stocktake with one time across both tables.
--   returns (medication_updated, diet_types_updated, counted_at)
--
-- What it keeps from 0083. It is a plain `update … set stock_on_hand`, so
-- the stamp_stock_counted_at triggers do the stamping exactly as for the
-- single cell: an item in the list is restamped even when its count is
-- unchanged (the sheet's "same as last time" tick sends the old figure and
-- that is a count that confirmed it), and nobody can set stock_counted_at
-- by hand. The triggers stamp now(), which is fixed for the transaction, so
-- every row in one call gets the same counted_at — the reason for an RPC
-- rather than a loop of updates. counted_at is returned so the page can
-- show it without reading back.
--
-- What it refuses, and why, all before anything is written:
--   - an item absent from the list is left alone — absence is how the sheet
--     says "not counted this time";
--   - so a null or missing count is refused, not taken as "clear it". The
--     single cell's blank-clears meaning (0083) stays on the single cell;
--     letting it into the sheet is exactly the mix the backlog item rules
--     out;
--   - a negative count (the 0083 check constraint would too, with a less
--     useful message), a missing or repeated id, and an id that is not in
--     the table. The last one also catches a row RLS hides: all-or-nothing
--     means a sheet with one bad row saves nothing, rather than saving the
--     rest and quietly dropping it.
--
-- Who. The same as today's stock edit: assertManagementRole() in the server
-- action (admin, management), and on the tables the management_rw_* and
-- admin_all_* RLS policies (0043, 0051, 0001). The function is security
-- INVOKER, so those policies still apply to its updates, and it opens with
-- the same role check itself — written null-safe, because
-- current_user_role() is null for anon and for an archived or role-less
-- login (0082). Without the explicit check a staff caller would not be
-- refused, just have every row filtered out by RLS and hit the "not found"
-- error, which is the wrong message.
--
-- Grants: new functions start closed (0082). EXECUTE to authenticated and
-- service_role only; anon never.
--
-- Additive: a new function, nothing else changes. Re-runnable:
-- `create or replace`, idempotent grants.

create or replace function record_stocktake(
  p_medication jsonb default null,
  p_diet_types jsonb default null
)
returns table (medication_updated integer, diet_types_updated integer, counted_at timestamptz)
language plpgsql
security invoker
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
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management') then
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

  return query select v_med, v_diet, now();
end;
$$;

comment on function record_stocktake(jsonb, jsonb) is
  'Saves a stocktake in one transaction: each list is [{"id", "count"}] for medication / diet_types, and every listed row gets stock_on_hand = count and the same stock_counted_at (0083''s trigger, now()). Unlisted rows are untouched. Refuses null or negative counts, repeated or unknown ids, and callers other than admin/management — nothing is written unless everything is (0088).';

revoke all on function record_stocktake(jsonb, jsonb) from public, anon;
grant execute on function record_stocktake(jsonb, jsonb) to authenticated, service_role;

notify pgrst, 'reload schema';
