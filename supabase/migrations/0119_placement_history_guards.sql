-- Two guards on placement_history (backlog DB-3, DB-4). No UI change: every
-- refusal below is unreachable through the app, which only ever closes a
-- placement by inserting the next one, and only ever targets a Lifecycle
-- pseudo-enclosure with the placement type that owns it.
--
-- DB-3. enforce_placement_history_immutability() (0001, 0026, 0049) listed
-- every column but left end_date writable, and staff and management hold an
-- unrestricted UPDATE policy (0001, 0039), so a placement could be closed or
-- reopened by hand. end_date now changes only while close_prior_placement()
-- is running, announced the way the deceased lock's exemption is (0026): a
-- transaction-local setting, not an exemption by role.
--
--   app.placement_close = 'on'   set around close_prior_placement()'s UPDATE,
--                                put back to what it was straight after
--
-- DB-4. A ChangeEnclosure placement (volunteers may create one,
-- volunteer_insert_change_enclosure) could target the Deceased or Adopted
-- pseudo-enclosure. That skips handle_deceased_placement(), so no cascade
-- snapshot is taken, engages every deceased lock, and leaves
-- undo_deceased_placement() with nothing to restore. A BEFORE INSERT trigger
-- now refuses a Lifecycle-zone target unless the placement type is the one
-- that owns that pseudo-enclosure:
--
--   Unassigned  Intake, DeceasedInError (back to where they were)
--   Hospital    SendToHospital, DeceasedInError
--   Fostered    Foster, DeceasedInError
--   Adopted     Adopt, DeceasedInError
--   Deceased    Deceased
--
-- ChangeEnclosure, ReturnFromHospital and ReturnToShelter go to physical
-- enclosures only. It checks INSERT only: rows already there (the AppSheet
-- import has a Foster into Unassigned) are history and are left alone.

-- =========================================================================
-- DB-3
-- =========================================================================

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

  if new.end_date is distinct from old.end_date
    and coalesce(current_setting('app.placement_close', true), '') <> 'on'
  then
    raise exception 'placement_history.end_date is only set by close_prior_placement() when the next placement is recorded';
  end if;
  return new;
end;
$$;

-- 0001 body, 0024 attributes (before insert, security definer), now raising
-- the flag around the one UPDATE that is allowed to set end_date.
create or replace function close_prior_placement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag text := coalesce(current_setting('app.placement_close', true), '');
begin
  if new.placement_type <> 'Intake' then
    perform set_config('app.placement_close', 'on', true);
    update placement_history
    set end_date = new.start_date
    where resident_id = new.resident_id
      and end_date is null
      and id <> new.id;
    perform set_config('app.placement_close', v_flag, true);
  end if;
  return new;
end;
$$;

-- =========================================================================
-- DB-4
-- =========================================================================

create or replace function check_placement_lifecycle_target()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_zone text;
  v_enclosure text;
  v_allowed text[];
begin
  select z.name, e.name into v_zone, v_enclosure
  from enclosures e
  join zones z on z.id = e.zone_id
  where e.id = new.enclosure_id;

  -- A row that only names the Lifecycle zone is held to the same rule.
  if v_zone is distinct from 'Lifecycle' then
    if new.enclosure_id is null
      and new.zone_id is not null
      and exists (select 1 from zones where id = new.zone_id and name = 'Lifecycle')
    then
      v_zone := 'Lifecycle';
    else
      return new;
    end if;
  end if;

  v_allowed := case v_enclosure
    when 'Unassigned' then array['Intake', 'DeceasedInError']
    when 'Hospital'   then array['SendToHospital', 'DeceasedInError']
    when 'Fostered'   then array['Foster', 'DeceasedInError']
    when 'Adopted'    then array['Adopt', 'DeceasedInError']
    when 'Deceased'   then array['Deceased']
    else array[]::text[]
  end;

  if not (new.placement_type::text = any (v_allowed)) then
    raise exception '% placement cannot target the Lifecycle pseudo-enclosure "%": use the workflow that owns it',
      new.placement_type, coalesce(v_enclosure, '(none)');
  end if;
  return new;
end;
$$;

-- Named to sort before placement_history_close_prior and the deceased
-- cascade, so a refused row has changed nothing by the time it is refused.
drop trigger if exists placement_history_check_lifecycle_target on placement_history;
create trigger placement_history_check_lifecycle_target
  before insert on placement_history
  for each row execute function check_placement_lifecycle_target();
