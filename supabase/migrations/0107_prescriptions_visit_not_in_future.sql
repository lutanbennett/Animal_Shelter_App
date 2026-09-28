-- A prescription is never linked to a vet visit that has not happened yet
-- (backlog, "A prescription should not be attachable to a future vet
-- visit", Lutan 2026-09-27, Pass 1 of the role walkthrough). A prescription
-- written against a visit that is still scheduled is either a mistake or a
-- plan, and the record cannot tell which afterwards.
--
-- The form hides future visits (loadLinkableVisits(…, { notInFuture })),
-- but, as 0106 put it for weight, a filter only covers the tab it was drawn
-- in. This is what holds for a second tab, a stale page, the assistant and
-- an import.
--
-- Why triggers and not a check constraint. The rule crosses two tables (the
-- date is on vet_appointments) and depends on today, and a CHECK can do
-- neither: it may only read its own row, and it must be immutable — Postgres
-- re-evaluates it on every later UPDATE of the row and on a restore, so a
-- `<= shelter_today()` check would mean "the visit is not in the future at
-- whatever moment the row is next touched", which is always true once the
-- visit has passed and says nothing about when the link was made. A
-- denormalised visit-date column on prescriptions would bring the date
-- across but not the "today", and would need a trigger to keep it in step
-- anyway. What the rule is actually about is the moment of linking, so it is
-- checked at that moment:
--
--   prescriptions_visit_not_in_future   BEFORE INSERT, and BEFORE UPDATE OF
--       vet_appointment_id when the link changes. The linked visit's
--       shelter calendar day must be on or before shelter_today() (0073).
--       Editing a prescription's dose or dates re-checks nothing, so an
--       existing link is never refused after the fact.
--   vet_appointments_linked_rx_not_future   BEFORE UPDATE OF
--       appointment_date. The other door: moving a visit that already has
--       prescriptions to a day after today would make the same record
--       through the visit instead. Refused while any prescription links to
--       it; unlink them first (or fix the visit's date to the day it
--       actually happened).
--
-- "Day" is the shelter's (shelter_date(), Asia/Bangkok), not UTC's: a visit
-- at 06:00 on the 29th is 23:00Z on the 28th, and is still tomorrow's visit
-- on the 28th. src/lib/vets/linkable.ts's visitDate() is changed to read
-- the same day (claude/prescription-no-future-visit), so the picker and this
-- trigger agree.
--
-- Existing rows, counted before writing this (2026-09-28): none on dev
-- (61 prescriptions, 55 linked; none linked to a visit after today, and
-- none linked to a visit dated after the day the prescription was written),
-- and none in the AppSheet snapshot the production import is built from
-- (64 prescriptions, 57 linked to a visit the export has; the latest visit
-- in it is 2020-12-11). Nothing to repair, and a trigger does not look at
-- rows it is not asked to write, so the file cannot fail over old data.
-- scripts/import-appsheet.mjs unlinks a prescription whose visit is after
-- the import day, with a note, so a later snapshot cannot fail the import.
--
-- The deceased cascade (0049/0073) and its undo write prescriptions'
-- end_date and vet_appointments' status, never vet_appointment_id or
-- appointment_date, so neither trigger fires for them.
--
-- security definer: the prescription trigger reads the visit's date, and
-- must see it whatever the writer's RLS lets them read.
--
-- Re-runnable: `create or replace` functions, `drop trigger if exists`.

create or replace function prescriptions_visit_not_in_future()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date;
begin
  if new.vet_appointment_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.vet_appointment_id is not distinct from old.vet_appointment_id then
    return new;
  end if;

  select shelter_date(appointment_date) into v_day
  from vet_appointments
  where id = new.vet_appointment_id;

  if v_day > shelter_today() then
    raise exception 'prescriptions_visit_not_in_future: the linked vet visit is on %, which has not happened yet (today is %).',
      v_day, shelter_today()
      using errcode = 'check_violation',
            hint = 'Link the prescription to a visit on or before today, or leave it unlinked.';
  end if;
  return new;
end;
$$;

comment on function prescriptions_visit_not_in_future() is
  'A prescription may only be linked to a vet visit on or before today at the shelter (0107). Checked when the link is made or changed.';

drop trigger if exists prescriptions_visit_not_in_future on prescriptions;
create trigger prescriptions_visit_not_in_future
  before insert or update of vet_appointment_id on prescriptions
  for each row execute function prescriptions_visit_not_in_future();

create or replace function vet_appointments_linked_rx_not_future()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if new.appointment_date is not distinct from old.appointment_date
    or shelter_date(new.appointment_date) <= shelter_today()
  then
    return new;
  end if;

  select count(*) into v_count from prescriptions where vet_appointment_id = new.id;
  if v_count > 0 then
    raise exception 'prescriptions_visit_not_in_future: this vet visit has % linked prescription(s), so it cannot be moved to %, after today (%).',
      v_count, shelter_date(new.appointment_date), shelter_today()
      using errcode = 'check_violation',
            hint = 'Unlink the prescriptions from this visit first, or keep the visit on the day it happened.';
  end if;
  return new;
end;
$$;

comment on function vet_appointments_linked_rx_not_future() is
  'A vet visit with linked prescriptions cannot be moved to a day after today (0107) — the other side of prescriptions_visit_not_in_future.';

drop trigger if exists vet_appointments_linked_rx_not_future on vet_appointments;
create trigger vet_appointments_linked_rx_not_future
  before update of appointment_date on vet_appointments
  for each row execute function vet_appointments_linked_rx_not_future();

-- Nobody calls these directly; EXECUTE is checked when a trigger is
-- created, not each time it fires, so revoking it (0082's allow-list
-- stance) costs the writers nothing.
revoke execute on function prescriptions_visit_not_in_future() from public, anon, authenticated;
revoke execute on function vet_appointments_linked_rx_not_future() from public, anon, authenticated;
