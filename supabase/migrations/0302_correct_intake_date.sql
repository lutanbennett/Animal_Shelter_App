-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/app/admin/intake-date/page.tsx, src/app/admin/intake-date/actions.ts, src/lib/i18n/dictionaries/en.ts, src/lib/i18n/dictionaries/th.ts
--
-- CORRECT A RESIDENT'S INTAKE DATE, moving every date the intake stamped with it.
-- docs/decisions/2026-11-02-intake-date-correction.md is the paper for this file.
--
-- WHY. record_intake() (0248) writes the one date the person typed into FIVE values: residents.intake_date,
-- residents.age_estimated_on, the Intake placement's start_date, the first weight's date and the first diet's
-- start_date. A wrong date typed at the gate could be fixed in none of them without hand-editing five tables, and
-- fixing only the resident's date would show the resident living somewhere and eating something BEFORE it arrived.
-- Lutan, 2026-11-02, asked directly: all four of the other dates follow.
--
-- Both halves of the card land here, in one change, because scripts/check-cards-count.mjs and
-- scripts/check-card-grants.mjs would otherwise disagree with each other mid-way (the shape 0296 and 0298 follow).
--
-- WHAT THIS FILE DOES, and each omission is deliberate:
--   1  one row in permission_activities: resident.correct_intake_date, yesno, residents, sort 75.
--   2  one new card, correct_intake_date, holding that activity and including view_residents, because the page has
--      to find a resident by name or code and a card that cannot search is not usable.
--   3  one card_features row, filed under the same feature as the residents card.
--   4  correct_intake_date(resident, new date, preview), security definer, search_path pinned, refusing at the top unless
--      the caller holds resident.correct_intake_date. One transaction moves all five values together.
--   5  enforce_placement_history_immutability() recreated with ONE added exemption: start_date of the Intake row may
--      change while the transaction-local setting app.intake_date_correction is on, which only step 4 raises. It is
--      the same pattern 0119 uses for app.placement_close, a flag around one statement and not an exemption by role.
--      Everything else the trigger refuses it still refuses, and step 4 does not touch any other column.
--
-- WHAT IT MOVES: only the rows the intake made. The Intake placement row, and the diet and weight rows whose date
-- still equals the old intake date. age_estimated_on moves only if it still equals the old intake date too, so a
-- later re-estimate of the age is left alone. A later diet change, move or weighing is left exactly alone.
--
-- WHAT IT REFUSES, naming the record in the way: a new date later than a placement, diet, weight or clinic visit
-- that is not being moved, a date in the future, and a date that would not leave the Intake placement ending after it
-- starts. A corrected history that puts a move before the arrival is worse than the mistake.
--
-- WHAT IT DOES NOT DO: group_origins.date is NOT moved. An origin made at intake can be shared with other residents,
-- so moving its date would move it for them too, and the backlog item says explicitly not to decide that here.
--   - no role is given the new card. Who holds it is Lutan's step in Settings then Who does what.
--   - nothing is granted to Admin, which sits outside the card system and passes by is_admin() inside has_permission().
--   - no role key, no role name and no role column decides anything in this file.
--
-- THE STRING LITERALS BELOW CARRY NO SEMICOLON AND NO DOUBLE DASH, on purpose: scripts/check-migration-grants.mjs
-- splits on semicolons and strips double-dash comments without tracking literals (see 0296).
-- Additive and re-runnable.

-- ---------------------------------------------------------------------------
-- 1. The activity
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('resident.correct_intake_date', 'yesno', 'residents', 75)
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

-- ---------------------------------------------------------------------------
-- 2. The card. These rows must equal src/lib/permissions/cards.ts cell for cell.
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level)
values ('correct_intake_date', 'resident.correct_intake_date', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_includes (card, included_card)
values ('correct_intake_date', 'view_residents')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. The feature the new card is filed under: the residents card's, whatever it is
-- ---------------------------------------------------------------------------
insert into card_features (card, feature_id)
select 'correct_intake_date', cf.feature_id from card_features cf where cf.card = 'residents'
on conflict (card) do update set feature_id = excluded.feature_id;

-- ---------------------------------------------------------------------------
-- 5. The immutability trigger, with the one exemption (body of 0119 plus the flag)
-- ---------------------------------------------------------------------------
create or replace function enforce_placement_history_immutability()
returns trigger
language plpgsql
as $$
begin
  if new.resident_id is distinct from old.resident_id
    or new.placement_type is distinct from old.placement_type
    or (new.start_date is distinct from old.start_date
        and not (old.placement_type = 'Intake'
                 and coalesce(current_setting('app.intake_date_correction', true), '') = 'on'))
    or new.zone_id is distinct from old.zone_id
    or new.enclosure_id is distinct from old.enclosure_id
    or new.previous_enclosure_id is distinct from old.previous_enclosure_id
    or new.carer_id is distinct from old.carer_id
    or new.cause_of_death is distinct from old.cause_of_death
    or new.deceased_cascade is distinct from old.deceased_cascade
  then
    raise exception 'placement_history rows are immutable except notes and end_date (end_date is only closed automatically)';
  end if;

  if new.end_date is distinct from old.end_date
    and coalesce(current_setting('app.placement_close', true), '') <> 'on'
  then
    raise exception 'placement_history.end_date is only set by close_prior_placement() when the next placement is recorded';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. The function. p_preview = true does every check and writes nothing, returning what WOULD move, so the page can show
--    the records and any refusal before Save. With no date and p_preview it returns just the records as they stand.
-- ---------------------------------------------------------------------------
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

  return v_records || jsonb_build_object('new_date', p_new_date);
end;
$$;

comment on function correct_intake_date(uuid, date, boolean) is
  'Corrects a resident''s intake date (0302). Moves residents.intake_date, age_estimated_on if it still equals it, the Intake placement''s start, and the diet and weight rows still dated the old intake date, in one transaction. Refuses, naming the record, when the new date falls after a later placement, diet, weight or clinic visit. p_preview does every check and writes nothing. Leaves group_origins.date alone. Asks resident.correct_intake_date.';
revoke all on function correct_intake_date(uuid, date, boolean) from public, anon;
grant execute on function correct_intake_date(uuid, date, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- What this file must leave true, asserted rather than described
-- ---------------------------------------------------------------------------
do $report$
begin
  if not exists (select 1 from public.permission_activities where key = 'resident.correct_intake_date') then
    raise exception '0302 the activity is not in permission_activities after this file ran';
  end if;
  if not exists (select 1 from public.card_grants
                  where card = 'correct_intake_date' and activity = 'resident.correct_intake_date' and level = 2) then
    raise exception '0302 the new card does not grant the activity after this file ran';
  end if;
  if (select count(*) from public.card_grants where card = 'correct_intake_date') <> 1 then
    raise exception '0302 the new card grants something besides the one activity';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'correct_intake_date'
                    and pg_get_functiondef(p.oid) like '%has_permission(''resident.correct_intake_date'')%') then
    raise exception '0302 correct_intake_date does not ask resident.correct_intake_date after this file ran';
  end if;
end
$report$;

notify pgrst, 'reload schema';
