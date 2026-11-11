-- consumer: src/app/stocktake/actions.ts, src/app/management/diets/actions.ts, src/app/management/medications/actions.ts
-- #3nuwy, group 5: record_stocktake and record_stock_correction raise KEYS
-- (docs/decisions/2026-11-11-refusal-keys-group-5.md). Bodies are 0178's, unchanged but for the 12 raises (11 keys; the negative-count sentence is shared). Re-runnable.
-- undo: re-apply the two bodies in 0178 in a new file.

create or replace function public.record_stocktake(p_medication jsonb DEFAULT NULL::jsonb, p_diet_types jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(medication_updated integer, diet_types_updated integer, counted_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_lists jsonb := jsonb_build_object(
    'medication', coalesce(p_medication, '[]'::jsonb),
    'diet_types', coalesce(p_diet_types, '[]'::jsonb)
  );
  v_kind text;
  v_bad integer;
  v_repeated integer;
  v_med integer := 0;
  v_diet integer := 0;
  v_stocktake uuid := gen_random_uuid();
begin
  -- 0178: the stocktake page's own cell, not a role name.
  if not coalesce((select has_permission('stock.count')), false) then
    raise exception 'stock.count_not_allowed' using errcode = 'P0001';
  end if;

  foreach v_kind in array array['medication', 'diet_types'] loop
    if jsonb_typeof(v_lists -> v_kind) <> 'array' then
      raise exception 'stock.list_invalid' using errcode = 'P0001',
        detail = json_build_object('kind', v_kind)::text;
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_lists -> v_kind) e
       where jsonb_typeof(e) <> 'object'
          or jsonb_typeof(e -> 'id') is distinct from 'string'
          or (e ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          or jsonb_typeof(e -> 'count') is distinct from 'number'
    ) then
      raise exception 'stock.count_row_invalid' using errcode = 'P0001',
        detail = json_build_object('kind', v_kind)::text;
    end if;
    select count(*) filter (where (e ->> 'count')::numeric < 0),
           count(*) - count(distinct (e ->> 'id')::uuid)
      into v_bad, v_repeated
      from jsonb_array_elements(v_lists -> v_kind) e;
    if v_bad > 0 then
      raise exception 'stock.count_negative' using errcode = 'P0001';
    end if;
    if v_repeated > 0 then
      raise exception 'stock.listed_twice' using errcode = 'P0001',
        detail = json_build_object('kind', v_kind)::text;
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
      raise exception 'stock.units_do_not_add_up' using errcode = 'P0001',
        detail = json_build_object('kind', v_kind)::text;
    end if;
  end loop;

  update medication m
     set stock_on_hand = x.count
    from jsonb_to_recordset(v_lists -> 'medication') as x(id uuid, count numeric)
   where m.id = x.id;
  get diagnostics v_med = row_count;
  if v_med <> jsonb_array_length(v_lists -> 'medication') then
    raise exception 'stock.medications_not_found' using errcode = 'P0001',
      detail = json_build_object('found', v_med, 'total', jsonb_array_length(v_lists -> 'medication'))::text;
  end if;

  update diet_types d
     set stock_on_hand = x.count
    from jsonb_to_recordset(v_lists -> 'diet_types') as x(id uuid, count numeric)
   where d.id = x.id;
  get diagnostics v_diet = row_count;
  if v_diet <> jsonb_array_length(v_lists -> 'diet_types') then
    raise exception 'stock.diet_types_not_found' using errcode = 'P0001',
      detail = json_build_object('found', v_diet, 'total', jsonb_array_length(v_lists -> 'diet_types'))::text;
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
$function$;

create or replace function public.record_stock_correction(p_kind text, p_id uuid, p_count numeric)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_at timestamptz;
  v_unit text;
  v_found integer;
begin
  -- 0178: correcting a figure is stock.correct, on the list it belongs to (the paper's manage-medications /
  -- manage-diets, and what the two pages ask). Both, so a role with stock.correct alone (the 2IC) is not
  -- let in to a list it cannot open.
  if not (coalesce((select has_permission('stock.correct')), false)
          and coalesce(case p_kind when 'medication' then (select has_permission('stock.medications'))
                                   when 'diet_type' then (select has_permission('stock.diets')) end, false)) then
    raise exception 'stock.correct_not_allowed' using errcode = 'P0001';
  end if;
  if p_kind not in ('medication', 'diet_type') then
    raise exception 'stock.unknown_kind' using errcode = 'P0001';
  end if;
  if p_count is not null and p_count < 0 then
    raise exception 'stock.count_negative' using errcode = 'P0001';
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
    raise exception 'stock.item_not_found' using errcode = 'P0001';
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
$function$;
