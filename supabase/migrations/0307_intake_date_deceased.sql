-- consumer: src/app/admin/intake-date/page.tsx, src/app/admin/intake-date/actions.ts
--
-- A DECEASED RESIDENT'S INTAKE DATE CAN BE CORRECTED, under the existing correct_intake_date card.
-- docs/decisions/2026-11-03-intake-date-deceased.md is the paper for this file. Lutan, 2026-11-03, asked directly:
-- yes, and under the existing card, no new one.
--
-- WHERE THE REFUSAL COMES FROM: enforce_deceased_lock() (0026, last redefined in 0052), attached BEFORE
-- INSERT/UPDATE/DELETE to residents, placement_history, weight and resident_diets (and others). correct_intake_date()
-- (0302) writes four of those tables and the trigger refused each write on a resident whose Lifecycle placement is open.
--
-- WHAT THIS FILE DOES, and nothing else:
--   1  enforce_deceased_lock() gains ONE opening, beside the 0052 one: an UPDATE of exactly one column on one of four
--      tables, while the transaction-local setting app.intake_date_correction_lock is on. Compared by stripping that
--      column from both rows, so any other changed column is still refused. INSERT and DELETE are never opened.
--        residents.intake_date and residents.age_estimated_on, placement_history.start_date,
--        resident_diets.start_date, weight.date
--   2  correct_intake_date() is recreated unchanged except that it raises that setting around its own writes
--      and restores it after. Only that function sets it, and nothing keyed by a role decides anything.
-- Everything the lock refused before it still refuses. Admin is given nothing. Additive and re-runnable.

create or replace function enforce_deceased_lock()
returns trigger
language plpgsql
as $$
declare
  v_column text := tg_argv[0];
  v_new_id uuid;
  v_old_id uuid;
  -- residents.* that may change after death (0052). Kept here rather than
  -- in a table so the exemption is visible next to the rule it relaxes.
  v_open_columns text[] := array[
    'bio', 'temperament_notes', 'past_story_notes', 'behaviour_notes',
    'profile_photo_drive_file_id'
  ];
  -- The columns correct_intake_date() moves (0307), per table.
  v_intake_columns text[];
begin
  if deceased_lock_bypassed() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op <> 'DELETE' then
    v_new_id := (to_jsonb(new) ->> v_column)::uuid;
  end if;
  if tg_op <> 'INSERT' then
    v_old_id := (to_jsonb(old) ->> v_column)::uuid;
  end if;

  if (v_new_id is not null and resident_is_deceased(v_new_id))
    or (v_old_id is not null and resident_is_deceased(v_old_id))
  then
    if tg_table_name = 'residents' and tg_op = 'UPDATE'
      and (to_jsonb(new) - v_open_columns) = (to_jsonb(old) - v_open_columns)
    then
      return new;
    end if;

    -- 0307: the intake date correction, and only while correct_intake_date() has raised its flag.
    if tg_op = 'UPDATE' and coalesce(current_setting('app.intake_date_correction_lock', true), '') = 'on' then
      v_intake_columns := case tg_table_name
        when 'residents'      then array['intake_date', 'age_estimated_on']
        when 'placement_history' then array['start_date']
        when 'resident_diets' then array['start_date']
        when 'weight'         then array['date']
        else null end;
      if v_intake_columns is not null
        and (to_jsonb(new) - v_intake_columns) = (to_jsonb(old) - v_intake_columns)
      then
        return new;
      end if;
    end if;

    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop function if exists correct_intake_date(uuid, date);
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
  v_blocker    text;
  v_lock       text;
  v_flag       text := coalesce(current_setting('app.intake_date_correction', true), '');
  v_diets      jsonb;
  v_weights    jsonb;
  v_records    jsonb;
begin
  if not (select has_permission('resident.correct_intake_date')) then
    raise exception 'You do not have permission to correct an intake date.' using errcode = '42501';
  end if;

  select * into v_res from residents where id = p_resident_id for update;
  if not found then
    raise exception 'That resident was not found.';
  end if;
  v_old := v_res.intake_date;
  if v_old is null then
    raise exception '% has no intake date to correct.', v_res.name;
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
    raise exception 'Choose the corrected intake date.';
  end if;
  if p_new_date = v_old then
    raise exception 'The intake date is already %.', to_char(v_old, 'YYYY-MM-DD');
  end if;
  if p_new_date > shelter_today() then
    raise exception 'An intake date cannot be in the future.';
  end if;
  v_new_start := p_new_date::timestamptz;

  -- Refusals: only a later date can fall after another record, and only a record that is NOT moving can be in the way.
  if p_new_date > v_old then
    select 'a move to ' || coalesce(e.name, 'another place') || ' on ' || to_char(shelter_date(ph.start_date), 'YYYY-MM-DD')
      into v_blocker
      from placement_history ph
      left join enclosures e on e.id = ph.enclosure_id
     where ph.resident_id = p_resident_id and ph.placement_type <> 'Intake'
       and shelter_date(ph.start_date) < p_new_date
     order by ph.start_date asc limit 1;
    if v_blocker is null then
      select 'a diet that starts on ' || to_char(rd.start_date, 'YYYY-MM-DD') into v_blocker
        from resident_diets rd
       where rd.resident_id = p_resident_id and rd.start_date <> v_old and rd.start_date < p_new_date
       order by rd.start_date asc limit 1;
    end if;
    if v_blocker is null then
      select 'a weight recorded on ' || to_char(w.date, 'YYYY-MM-DD') into v_blocker
        from weight w
       where w.resident_id = p_resident_id and w.archived_at is null and w.date <> v_old and w.date < p_new_date
       order by w.date asc limit 1;
    end if;
    if v_blocker is null then
      select 'a clinic visit on ' || to_char(shelter_date(cv.appointment_date), 'YYYY-MM-DD') into v_blocker
        from clinic_visits cv
       where cv.resident_id = p_resident_id and cv.archived_at is null and cv.status <> 'cancelled'
         and shelter_date(cv.appointment_date) < p_new_date
       order by cv.appointment_date asc limit 1;
    end if;
    if v_blocker is not null then
      raise exception 'The intake date cannot be moved to % because of %. Correct or remove that record first.', to_char(p_new_date, 'YYYY-MM-DD'), v_blocker;
    end if;
    if v_intake.id is not null and v_intake.end_date is not null and v_intake.end_date <= v_new_start then
      raise exception 'The intake date cannot be moved to % because the first placement ends on % and would not start before it ends.', to_char(p_new_date, 'YYYY-MM-DD'), to_char(shelter_date(v_intake.end_date), 'YYYY-MM-DD');
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

comment on function correct_intake_date(uuid, date, boolean) is
  'Corrects a resident''s intake date (0302, opened to a deceased resident by 0307). Moves residents.intake_date, age_estimated_on if it still equals it, the Intake placement''s start, and the diet and weight rows still dated the old intake date, in one transaction. Refuses, naming the record, when the new date falls after a later placement, diet, weight or clinic visit. p_preview does every check and writes nothing. Leaves group_origins.date alone. Asks resident.correct_intake_date.';
revoke all on function correct_intake_date(uuid, date, boolean) from public, anon;
grant execute on function correct_intake_date(uuid, date, boolean) to authenticated, service_role;

do $report$
begin
  if not exists (select 1 from pg_proc where proname = 'enforce_deceased_lock'
                  and pg_get_functiondef(oid) like '%app.intake_date_correction_lock%') then
    raise exception '0307 the lock does not carry the intake date opening after this file ran';
  end if;
  if not exists (select 1 from pg_proc where proname = 'correct_intake_date'
                  and pg_get_functiondef(oid) like '%has_permission(''resident.correct_intake_date'')%'
                  and pg_get_functiondef(oid) like '%app.intake_date_correction_lock%') then
    raise exception '0307 correct_intake_date lost its card check or never raises the flag';
  end if;
end
$report$;

notify pgrst, 'reload schema';
