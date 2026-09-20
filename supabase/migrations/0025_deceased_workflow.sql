-- Deceased workflow (Section 7.2 / 5.1).
--
-- Recording a death is the one placement that ends a resident's record
-- rather than moving it along: from that moment the whole file is an
-- archive. This migration adds the three structural pieces the app layer
-- builds on:
--
--   1. `cause_of_death` on the Deceased placement row, so the cause lives
--      with the event that recorded it (the event-sourced model in Section
--      4.1 — never a mutable column on `residents`).
--   2. A read-only lock: once a resident's active placement is the Deceased
--      pseudo-enclosure, every write to that resident and to the records
--      hanging off them is rejected by the database, not just hidden in the
--      UI. Which fields may be edited after death is still to be defined
--      (the user will specify), so the safe default is "none".
--   3. Somewhere to record the Drive archive (the summary PDF and the
--      offline HTML index generated into the resident's folder once it has
--      been moved under Residents/Deceased/).

-- =========================================================================
-- 1. Cause of death on the Deceased placement row
-- =========================================================================

alter table placement_history add column cause_of_death text;

-- Only meaningful on the row that records the death.
alter table placement_history add constraint cause_of_death_only_when_deceased
  check (cause_of_death is null or placement_type = 'Deceased');

-- Placement rows are immutable except `notes` (0001). `cause_of_death` is
-- part of the record of the event, so it belongs on the guarded list too.
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
  then
    raise exception 'placement_history rows are immutable except notes and end_date (end_date is only closed automatically)';
  end if;
  return new;
end;
$$;

-- =========================================================================
-- 2. Drive archive bookkeeping
--
-- The resident's Drive folder keeps its ID when it's moved under
-- Residents/Deceased/ (a Drive move re-parents the folder, it doesn't
-- recreate it), so `residents.drive_folder_id` stays correct and only the
-- two generated files need new columns. `deceased_archived_at` is set only
-- when both files are in place, so a partial archive (Drive down mid-run)
-- is visibly incomplete and can be retried.
-- =========================================================================

alter table residents add column deceased_summary_drive_file_id text;
alter table residents add column deceased_index_drive_file_id text;
alter table residents add column deceased_archived_at timestamptz;

-- =========================================================================
-- 3. current_status never actually said 'Deceased'
--
-- resident_current_state (0001) derived the status with
-- `when ez.name = 'Deceased' then 'Deceased'`, but `ez` is the *zone* and
-- the Deceased pseudo-enclosure lives in the Lifecycle zone (there is no
-- zone called Deceased) — so a deceased resident fell through to the ELSE
-- branch and read as a plain 'Resident'. It went unnoticed because nothing
-- could record a death yet, and because `is_deceased` on the same view is
-- computed correctly, so the app's is_deceased checks behaved.
--
-- Everything reading current_status was wrong for the dead: the status
-- badge on the hub and the residents list (both via resident_list_view),
-- and the `current_status.neq.Deceased` filters on the immunization and
-- vet-visit resident pickers, which would have offered a dead animal for a
-- vaccination. Fixed to test the same enclosure the `is_deceased` column
-- does. CREATE OR REPLACE keeps resident_list_view (which selects from
-- this view) working.
-- =========================================================================

create or replace view resident_current_state as
select
  r.id as resident_id,
  r.name,
  cp.id as current_placement_id,
  cp.enclosure_id as current_enclosure_id,
  e.zone_id as current_zone_id,
  cp.carer_id as current_carer_id,
  cp.previous_enclosure_id as active_hospital_previous_enclosure,
  case
    when ez.name = 'Lifecycle' and e.name = 'Deceased' then 'Deceased'
    when ez.name = 'Lifecycle' and e.name = 'Hospital' then 'Hospitalised'
    when ez.name = 'Lifecycle' and e.name = 'Fostered' then 'Fostered'
    when ez.name = 'Lifecycle' and e.name = 'Adopted' then 'Adopted'
    when ez.name = 'Lifecycle' and e.name = 'Unassigned' then 'Outreach'
    else 'Resident'
  end as current_status,
  (ez.name = 'Lifecycle' and e.name = 'Deceased') as is_deceased,
  case when (ez.name = 'Lifecycle' and e.name = 'Deceased') then cp.start_date end as date_of_death
from residents r
left join current_placement cp on cp.resident_id = r.id
left join enclosures e on e.id = cp.enclosure_id
left join zones ez on ez.id = e.zone_id;

-- =========================================================================
-- 4. The read-only lock
-- =========================================================================

-- Mirrors resident_current_state.is_deceased (0001) — "the active placement
-- is the Lifecycle/Deceased pseudo-enclosure" — as something a trigger can
-- call cheaply. security definer so the check is the same for every role
-- (a volunteer can read placement_history anyway; this keeps the lock from
-- depending on that staying true).
create or replace function resident_is_deceased(p_resident_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from placement_history ph
    join enclosures e on e.id = ph.enclosure_id
    join zones z on z.id = e.zone_id
    where ph.resident_id = p_resident_id
      and ph.end_date is null
      and z.name = 'Lifecycle'
      and e.name = 'Deceased'
  );
$$;

-- The lock has to allow the writes that are themselves part of recording a
-- death: the cascade in handle_deceased_placement() (cancel future
-- appointments, end prescriptions, clear ready_for_adoption) and the
-- archive bookkeeping above, both of which run when the resident is already
-- deceased. They announce themselves with a transaction-local setting
-- rather than being exempted by role, so the exemption can't leak into an
-- ordinary staff write.
create or replace function deceased_lock_bypassed()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('app.deceased_lock_bypass', true), '') = 'on';
$$;

-- Generic BEFORE trigger: TG_ARGV[0] names the column holding the resident
-- id on the table it's attached to (`id` on residents itself). Both OLD and
-- NEW are checked on UPDATE so a row can neither be changed while it
-- belongs to a deceased resident nor be re-pointed at one.
create or replace function enforce_deceased_lock()
returns trigger
language plpgsql
as $$
declare
  v_column text := tg_argv[0];
  v_new_id uuid;
  v_old_id uuid;
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
    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- `attachments` is polymorphic, so its resident is either the owner itself
-- or the owner of the blood test the file hangs off.
create or replace function attachment_resident_id(
  p_owner_type attachment_owner_type,
  p_owner_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_owner_type = 'resident' then p_owner_id
    when p_owner_type = 'blood_test' then
      (select bt.resident_id from blood_tests bt where bt.id = p_owner_id)
  end;
$$;

create or replace function enforce_deceased_lock_attachment()
returns trigger
language plpgsql
as $$
declare
  v_new_id uuid;
  v_old_id uuid;
begin
  if deceased_lock_bypassed() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op <> 'DELETE' then
    v_new_id := attachment_resident_id(new.owner_type, new.owner_id);
  end if;
  if tg_op <> 'INSERT' then
    v_old_id := attachment_resident_id(old.owner_type, old.owner_id);
  end if;

  if (v_new_id is not null and resident_is_deceased(v_new_id))
    or (v_old_id is not null and resident_is_deceased(v_old_id))
  then
    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- residents: update/delete only — a new resident can't already be deceased.
create trigger residents_deceased_lock
  before update or delete on residents
  for each row execute function enforce_deceased_lock('id');

-- placement_history: the Deceased insert itself passes (the resident isn't
-- deceased yet when the BEFORE trigger runs, and close_prior_placement()
-- ends the prior row before that), so this blocks every *subsequent*
-- placement — no moves, no hospital stays, no notes edits after death.
create trigger placement_history_deceased_lock
  before insert or update or delete on placement_history
  for each row execute function enforce_deceased_lock('resident_id');

create trigger vet_appointments_deceased_lock
  before insert or update or delete on vet_appointments
  for each row execute function enforce_deceased_lock('resident_id');

create trigger prescriptions_deceased_lock
  before insert or update or delete on prescriptions
  for each row execute function enforce_deceased_lock('resident_id');

create trigger immunization_records_deceased_lock
  before insert or update or delete on immunization_records
  for each row execute function enforce_deceased_lock('resident_id');

create trigger weight_deceased_lock
  before insert or update or delete on weight
  for each row execute function enforce_deceased_lock('resident_id');

create trigger procedures_deceased_lock
  before insert or update or delete on procedures
  for each row execute function enforce_deceased_lock('resident_id');

create trigger blood_tests_deceased_lock
  before insert or update or delete on blood_tests
  for each row execute function enforce_deceased_lock('resident_id');

create trigger attachments_deceased_lock
  before insert or update or delete on attachments
  for each row execute function enforce_deceased_lock_attachment();

-- =========================================================================
-- 5. The cascade, now that the lock exists
--
-- Two changes to handle_deceased_placement() (0002):
--
--   - It must bypass the lock. It runs AFTER the Deceased placement is
--     written, i.e. when the resident is already deceased, so every update
--     it makes would otherwise be rejected by the triggers above.
--   - security definer, for the same reason close_prior_placement() became
--     definer in 0024: it ran as the inserting user, and staff have only
--     SELECT policies on vet_appointments and prescriptions — so for the
--     role most likely to record a death, "cancel future appointments" and
--     "end active prescriptions" silently matched no rows. Cancelling them
--     is an internal consequence of a permitted insert, not a separate
--     permission.
-- =========================================================================

create or replace function handle_deceased_placement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.placement_type = 'Deceased' then
    perform set_config('app.deceased_lock_bypass', 'on', true);

    update vet_appointments
    set status = 'cancelled'
    where resident_id = new.resident_id
      and status = 'scheduled'
      and appointment_date > new.start_date;

    update prescriptions
    set end_date = new.start_date::date
    where resident_id = new.resident_id
      and (end_date is null or end_date > new.start_date::date);

    update residents
    set ready_for_adoption = false
    where id = new.resident_id;

    perform set_config('app.deceased_lock_bypass', 'off', true);

    -- PDF generation (Section 8.5) and the Drive folder archive move
    -- (Section 5.1) are triggered from the application layer after this
    -- insert commits, not from this trigger — they call external services
    -- (Drive API, PDF renderer) that don't belong in a DB transaction.
    -- record_deceased_archive() below stores what they produce.
  end if;

  return new;
end;
$$;

-- =========================================================================
-- 6. Archive bookkeeping RPC
--
-- Called by the app once the Drive work has succeeded. security definer for
-- the same reason as the cascade (it writes to a resident the lock now
-- protects), with its own role check — recording a death is admin/staff
-- work, so archiving it is too.
-- =========================================================================

create or replace function record_deceased_archive(
  p_resident_id uuid,
  p_drive_folder_id text default null,
  p_summary_drive_file_id text default null,
  p_index_drive_file_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_index text;
begin
  if current_user_role() not in ('admin', 'staff') then
    raise exception 'Not authorized to archive a deceased resident.';
  end if;

  if not resident_is_deceased(p_resident_id) then
    raise exception 'This resident is not recorded as deceased.';
  end if;

  perform set_config('app.deceased_lock_bypass', 'on', true);

  update residents
  set drive_folder_id = coalesce(p_drive_folder_id, drive_folder_id),
      deceased_summary_drive_file_id =
        coalesce(p_summary_drive_file_id, deceased_summary_drive_file_id),
      deceased_index_drive_file_id =
        coalesce(p_index_drive_file_id, deceased_index_drive_file_id)
  where id = p_resident_id
  returning deceased_summary_drive_file_id, deceased_index_drive_file_id
  into v_summary, v_index;

  -- Only a complete archive counts as archived; a partial one stays flagged
  -- for retry.
  if v_summary is not null and v_index is not null then
    update residents set deceased_archived_at = now() where id = p_resident_id;
  end if;

  perform set_config('app.deceased_lock_bypass', 'off', true);
end;
$$;
