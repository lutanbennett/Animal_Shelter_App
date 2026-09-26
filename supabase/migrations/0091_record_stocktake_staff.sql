-- record_stocktake(): staff and volunteers can save a stocktake too
-- (backlog, "Stocktake page: count everything in one go"; second schema
-- half — Lutan, 2026-09-26: "this will be carried out by staff so staff
-- and or volunteers will need access").
--
-- 0088 kept the stocktake to today's stock-edit roles (admin, management):
-- it was security INVOKER, so the management_rw_* / admin_all_* RLS policies
-- decided who could write, and it refused everyone else itself. Staff and
-- volunteers can read medication and diet_types (0027, 0051) but have no
-- UPDATE policy on either, and they should not get one: a table-wide UPDATE
-- policy would let them rename an item, reprice it or change its daily
-- quantities too, not just count it.
--
-- So the function becomes security DEFINER and is the one door. What a
-- caller can do through it is exactly what its body writes — stock_on_hand
-- on listed rows, nothing else — and the role check it opens with is now
-- the whole of the access rule rather than a friendlier message in front of
-- RLS: admin, management, staff, volunteer. Vets and public_viewer (0085)
-- are refused, as are anon and an archived or role-less login, for whom
-- current_user_role() is null (hence the null-safe test).
--
-- Everything else is 0088 unchanged: validate both lists before writing,
-- refuse a null or negative count, a repeated or unknown id; a listed row is
-- restamped by 0083's triggers even when the count is unchanged; an absent
-- row is left alone; one now() for the whole call, returned as counted_at.
-- One difference follows from DEFINER: RLS no longer filters the update, so
-- the "N of M found" refusal now means only "that id is not in the table"
-- (deleted since the page loaded), never "hidden from you".
--
-- set search_path = public stays, which is what keeps a DEFINER function
-- safe from a caller's search_path. Grants unchanged: EXECUTE to
-- authenticated and service_role; anon and public never.
--
-- Widens who may call one function; nothing else changes. Re-runnable:
-- `create or replace` with the same signature and return type, idempotent
-- grants. To undo, re-apply 0088's definition in a new file.

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

  return query select v_med, v_diet, now();
end;
$$;

comment on function record_stocktake(jsonb, jsonb) is
  'Saves a stocktake in one transaction: each list is [{"id", "count"}] for medication / diet_types, and every listed row gets stock_on_hand = count and the same stock_counted_at (0083''s trigger, now()). Unlisted rows are untouched. Security definer: callable by admin, management, staff and volunteer, and writes only stock_on_hand (0091). Refuses null or negative counts and repeated or unknown ids — nothing is written unless everything is (0088).';

revoke all on function record_stocktake(jsonb, jsonb) from public, anon;
grant execute on function record_stocktake(jsonb, jsonb) to authenticated, service_role;

notify pgrst, 'reload schema';
