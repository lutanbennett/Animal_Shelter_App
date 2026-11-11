-- consumer: src/app/admin/intake-date/actions.ts, src/app/admin/intake-date/page.tsx
-- #3nuwy, group 6: correct_intake_date raises KEYS (docs/decisions/2026-11-11-refusal-keys-group-6.md).
-- Body is 0307's, unchanged but for the eight raises. The blocker used to be built as an English phrase
-- ('a move to X on D'); it now travels as parameters (kind, place, when) and the app words it. Re-runnable.
-- undo: re-apply the body in 0307 in a new file.

create or replace function correct_intake_date(p_resident_id uuid, p_new_date date, p_preview boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res        residents;
  v_old        date;
  v_new_start  timestamptz;
  v_intake     placement_history;
  v_place      text;
  v_blocker    jsonb;
  v_lock       text;
  v_flag       text := coalesce(current_setting('app.intake_date_correction', true), '');
  v_diets      jsonb;
  v_weights    jsonb;
  v_records    jsonb;
begin
  if not (select has_permission('resident.correct_intake_date')) then
    raise exception 'intake.not_allowed' using errcode = '42501';
  end if;

  select * into v_res from residents where id = p_resident_id for update;
  if not found then
    raise exception 'intake.resident_not_found' using errcode = 'P0001';
  end if;
  v_old := v_res.intake_date;
  if v_old is null then
    raise exception 'intake.no_intake_date' using errcode = 'P0001', detail = json_build_object('name', v_res.name)::text;
  end if;

  select * into v_intake from placement_history
   where resident_id = p_resident_id and placement_type = 'Intake'
   order by start_date asc limit 1;
  select e.name into v_place from enclosures e where e.id = v_intake.enclosure_id;
  select coalesce(jsonb_agg(jsonb_build_object('name', d.name, 'start_date', rd.start_date) order by rd.created_at), '[]'::jsonb)
    into v_diets
    from resident_diets rd join diets d on d.id = rd.diet_id
   where rd.resident_id = p_resident_id and rd.start_date = v_old;
  select coalesce(jsonb_agg(jsonb_build_object('date', w.date, 'weight_kg', w.weight_kg) order by w.created_at), '[]'::jsonb)
    into v_weights
    from weight w
   where w.resident_id = p_resident_id and w.date = v_old;

  v_records := jsonb_build_object(
    'name', v_res.name, 'resident_code', v_res.resident_code, 'intake_date', v_old,
    'age_estimated_on', v_res.age_estimated_on,
    'age_moves', v_res.age_estimated_on is not distinct from v_old,
    'placement', case when v_intake.id is null then null
                      else jsonb_build_object('start_date', shelter_date(v_intake.start_date), 'place', v_place) end,
    'diets', v_diets, 'weights', v_weights);

  if p_new_date is null then
    if p_preview then
      return v_records;
    end if;
    raise exception 'intake.date_required' using errcode = 'P0001';
  end if;
  if p_new_date = v_old then
    raise exception 'intake.already_that_date' using errcode = 'P0001', detail = json_build_object('date', to_char(v_old, 'YYYY-MM-DD'))::text;
  end if;
  if p_new_date > shelter_today() then
    raise exception 'intake.date_in_future' using errcode = 'P0001';
  end if;
  v_new_start := p_new_date::timestamptz;

  -- Refusals: only a later date can fall after another record, and only a record that is NOT moving can be in the way.
  if p_new_date > v_old then
    select jsonb_build_object('kind', 'move', 'place', coalesce(e.name, ''), 'when', to_char(shelter_date(ph.start_date), 'YYYY-MM-DD'))
      into v_blocker
      from placement_history ph
      left join enclosures e on e.id = ph.enclosure_id
     where ph.resident_id = p_resident_id and ph.placement_type <> 'Intake'
       and shelter_date(ph.start_date) < p_new_date
     order by ph.start_date asc limit 1;
    if v_blocker is null then
      select jsonb_build_object('kind', 'diet', 'when', to_char(rd.start_date, 'YYYY-MM-DD')) into v_blocker
        from resident_diets rd
       where rd.resident_id = p_resident_id and rd.start_date <> v_old and rd.start_date < p_new_date
       order by rd.start_date asc limit 1;
    end if;
    if v_blocker is null then
      select jsonb_build_object('kind', 'weight', 'when', to_char(w.date, 'YYYY-MM-DD')) into v_blocker
        from weight w
       where w.resident_id = p_resident_id and w.archived_at is null and w.date <> v_old and w.date < p_new_date
       order by w.date asc limit 1;
    end if;
    if v_blocker is null then
      select jsonb_build_object('kind', 'visit', 'when', to_char(shelter_date(cv.appointment_date), 'YYYY-MM-DD')) into v_blocker
        from clinic_visits cv
       where cv.resident_id = p_resident_id and cv.archived_at is null and cv.status <> 'cancelled'
         and shelter_date(cv.appointment_date) < p_new_date
       order by cv.appointment_date asc limit 1;
    end if;
    if v_blocker is not null then
      raise exception 'intake.blocked_by_record' using errcode = 'P0001',
        detail = (v_blocker || jsonb_build_object('date', to_char(p_new_date, 'YYYY-MM-DD')))::text;
    end if;
    if v_intake.id is not null and v_intake.end_date is not null and v_intake.end_date <= v_new_start then
      raise exception 'intake.first_placement_ends' using errcode = 'P0001',
        detail = json_build_object('date', to_char(p_new_date, 'YYYY-MM-DD'), 'ends', to_char(shelter_date(v_intake.end_date), 'YYYY-MM-DD'))::text;
    end if;
  end if;

  if p_preview then
    return v_records || jsonb_build_object('new_date', p_new_date);
  end if;

  -- The move: all five values, one transaction.
  v_lock := coalesce(current_setting('app.intake_date_correction_lock', true), '');
  perform set_config('app.intake_date_correction_lock', 'on', true);
  update residents
     set intake_date = p_new_date,
         age_estimated_on = case when age_estimated_on = v_old then p_new_date else age_estimated_on end
   where id = p_resident_id;

  if v_intake.id is not null then
    perform set_config('app.intake_date_correction', 'on', true);
    update placement_history set start_date = v_new_start where id = v_intake.id;
    perform set_config('app.intake_date_correction', v_flag, true);
  end if;

  update resident_diets set start_date = p_new_date where resident_id = p_resident_id and start_date = v_old;
  update weight set date = p_new_date where resident_id = p_resident_id and date = v_old;
  perform set_config('app.intake_date_correction_lock', v_lock, true);

  return v_records || jsonb_build_object('new_date', p_new_date);
end;
$$;

notify pgrst, 'reload schema';
