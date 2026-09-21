-- Undo a death recorded in error, part 2 of 2 (needs 0048 committed first).
--
-- Three pieces:
--
--   1. The Deceased placement row records what its cascade did
--      (`deceased_cascade`), so the reversal can put back exactly those
--      rows — an appointment cancelled by hand the week before the death
--      stays cancelled, a prescription that already had an end date gets
--      that date back rather than null.
--   2. The cascade moves from AFTER INSERT to BEFORE INSERT so it can fill
--      that column on the row being written. As a side effect it no longer
--      needs the lock bypass: when a BEFORE trigger runs the Deceased row
--      doesn't exist yet, so the resident isn't deceased and the lock
--      triggers on the tables it updates let it through.
--   3. `undo_deceased_placement()`, the reversal itself: a 'DeceasedInError'
--      placement back into whatever the death closed (enclosure, or carer
--      for a fostered/adopted resident), which ends the Deceased row the
--      same way any placement ends the one before it, plus the restore of
--      the cascade. Admin only — a staff member who recorded a death asks
--      an admin to withdraw it, which is the friction wanted around a
--      correction of this size.
--
-- What is deliberately *not* reversed: the reversal is dated when it is
-- made, not backdated, so the resident's history shows they were recorded
-- as deceased between the two dates. A death that did happen but was
-- recorded with the wrong date is a different problem (the "editable after
-- death" backlog item), not this one. The Drive side (folder back under
-- Residents/, generated summary and index removed) is the app's job after
-- this commits, as archiving was — see restoreDeceasedResident().

-- =========================================================================
-- 1. What the cascade touched, on the Deceased row
-- =========================================================================

alter table placement_history add column if not exists deceased_cascade jsonb;

comment on column placement_history.deceased_cascade is
  'Set on a Deceased row by handle_deceased_placement(): {"vet_appointments": [id, ...] (were scheduled, now cancelled), "prescriptions": [{"id", "end_date"}, ...] (end_date as it was before the death), "ready_for_adoption": bool (as it was)}. Read by undo_deceased_placement().';

alter table placement_history drop constraint if exists deceased_cascade_only_when_deceased;
alter table placement_history add constraint deceased_cascade_only_when_deceased
  check (deceased_cascade is null or placement_type = 'Deceased');

-- Part of the record of the event, like cause_of_death (0026): guarded.
create or replace function enforce_placement_history_immutability()
returns trigger
language plpgsql
as $$
begin
  if new.resident_id is distinct from old.resident_id
    or new.placement_type is distinct from old.placement_type
    or new.start_date is distinct from old.start_date
    or new.zone_id is distinct from old.zone_id
    or new.enclosure_id is distinct from old.enclosure_id
    or new.previous_enclosure_id is distinct from old.previous_enclosure_id
    or new.carer_id is distinct from old.carer_id
    or new.cause_of_death is distinct from old.cause_of_death
    or new.deceased_cascade is distinct from old.deceased_cascade
  then
    raise exception 'placement_history rows are immutable except notes and end_date (end_date is only closed automatically)';
  end if;
  return new;
end;
$$;

-- =========================================================================
-- 2. The cascade, now BEFORE INSERT and recording what it did
--
-- Same three effects as 0027's version (cancel scheduled appointments after
-- the death, end open prescriptions on the date of death — or on their own
-- start date if that's later — and clear ready_for_adoption), but the rows
-- are chosen first, written into new.deceased_cascade, and then updated by
-- id, so the snapshot and the update can't disagree. Still security
-- definer: staff have only SELECT on vet_appointments and prescriptions.
-- =========================================================================

create or replace function handle_deceased_placement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointments jsonb;
  v_prescriptions jsonb;
  v_ready boolean;
begin
  if new.placement_type = 'Deceased' then
    select coalesce(jsonb_agg(id), '[]'::jsonb)
    into v_appointments
    from vet_appointments
    where resident_id = new.resident_id
      and status = 'scheduled'
      and appointment_date > new.start_date;

    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'end_date', end_date)), '[]'::jsonb)
    into v_prescriptions
    from prescriptions
    where resident_id = new.resident_id
      and (end_date is null or end_date > new.start_date::date);

    select ready_for_adoption into v_ready
    from residents
    where id = new.resident_id;

    new.deceased_cascade := jsonb_build_object(
      'vet_appointments', v_appointments,
      'prescriptions', v_prescriptions,
      'ready_for_adoption', coalesce(v_ready, false)
    );

    update vet_appointments va
    set status = 'cancelled'
    from jsonb_array_elements_text(v_appointments) as s(id)
    where va.id = s.id::uuid;

    update prescriptions p
    set end_date = greatest(new.start_date::date, p.start_date)
    from jsonb_array_elements(v_prescriptions) as s(item)
    where p.id = (s.item ->> 'id')::uuid;

    update residents
    set ready_for_adoption = false
    where id = new.resident_id;

    -- PDF generation (Section 8.5) and the Drive folder archive move
    -- (Section 5.1) are triggered from the application layer after this
    -- insert commits, not from this trigger — they call external services
    -- (Drive API, PDF renderer) that don't belong in a DB transaction.
    -- record_deceased_archive() (0026) stores what they produce.
  end if;

  return new;
end;
$$;

drop trigger if exists placement_history_deceased_cascade on placement_history;
create trigger placement_history_deceased_cascade
  before insert on placement_history
  for each row execute function handle_deceased_placement();

-- =========================================================================
-- 3. The reversal
-- =========================================================================

create or replace function undo_deceased_placement(p_resident_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_death placement_history%rowtype;
  v_prior placement_history%rowtype;
  v_cascade jsonb;
  v_id uuid;
begin
  if current_user_role() is distinct from 'admin' then
    raise exception 'Only an admin can withdraw a recorded death.';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Say why the death was recorded in error.';
  end if;

  select * into v_death
  from placement_history
  where resident_id = p_resident_id
    and placement_type = 'Deceased'
    and end_date is null
  limit 1;
  if not found then
    raise exception 'This resident is not recorded as deceased.';
  end if;

  -- The placement the death closed: where they were, and with whom.
  select * into v_prior
  from placement_history
  where resident_id = p_resident_id
    and start_date < v_death.start_date
  order by start_date desc
  limit 1;
  if not found then
    raise exception 'There is no earlier placement to return this resident to.';
  end if;

  -- close_prior_placement() ends the Deceased row as part of this insert,
  -- and its UPDATE runs while the resident still counts as deceased, so
  -- the lock has to stand aside for it. Off again straight after: from
  -- then on the resident is alive and the ordinary rules apply.
  perform set_config('app.deceased_lock_bypass', 'on', true);

  insert into placement_history (
    resident_id, placement_type, start_date, zone_id, enclosure_id,
    previous_enclosure_id, carer_id, notes, created_by
  ) values (
    p_resident_id, 'DeceasedInError', now(), v_prior.zone_id, v_prior.enclosure_id,
    -- "Deceased → Kennel 3" in the housing history; but a resident sent
    -- back into hospital keeps the kennel they'd return to, which is what
    -- the hub reads previous_enclosure_id as while they're hospitalised.
    case
      when v_prior.placement_type = 'SendToHospital' then v_prior.previous_enclosure_id
      else v_death.enclosure_id
    end,
    v_prior.carer_id, btrim(p_reason), auth.uid()
  )
  returning id into v_id;

  perform set_config('app.deceased_lock_bypass', 'off', true);

  -- Put back what the cascade did, and only that. Deaths recorded before
  -- this migration have no snapshot; their cascade stays as it is.
  v_cascade := coalesce(v_death.deceased_cascade, '{}'::jsonb);

  update vet_appointments va
  set status = 'scheduled'
  from jsonb_array_elements_text(coalesce(v_cascade -> 'vet_appointments', '[]'::jsonb)) as s(id)
  where va.id = s.id::uuid
    and va.status = 'cancelled';

  update prescriptions p
  set end_date = (s.item ->> 'end_date')::date
  from jsonb_array_elements(coalesce(v_cascade -> 'prescriptions', '[]'::jsonb)) as s(item)
  where p.id = (s.item ->> 'id')::uuid;

  if coalesce((v_cascade ->> 'ready_for_adoption')::boolean, false) then
    update residents set ready_for_adoption = true where id = p_resident_id;
  end if;

  return v_id;
end;
$$;

notify pgrst, 'reload schema';
