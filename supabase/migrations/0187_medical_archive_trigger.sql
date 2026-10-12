-- consumer: none
-- Archiving a weight, prescription, vaccination or visit is an UPDATE of archived_at. The row policies let anyone with the
-- table's Edit do it, and a policy cannot tell one column from another, so the screens asked medical.archive and a
-- hand-built request to the REST API did not. This adds the check in the database, same pattern as maintenance_before_write
-- (0182): a change to archived_at needs medical.archive. Restoring changes the same column, so it needs it too, as the app does.
-- Defence in depth, not a live hole: every screen already asks the permission. A caller with no login (the service role, the
-- backup, the migration runner) has no role to ask and is let through, as in 0182.
-- Only archived_at; archived_by and archive_reason are written together with it by the app and are not checked on their own.
-- Release order: nothing in the app reads this, so it may reach a database before or after any code.
-- Written to be re-runnable. To undo: drop the four triggers and the function.

create or replace function public.medical_archive_guard()
returns trigger
language plpgsql
as $$
begin
  if new.archived_at is distinct from old.archived_at
     and (select auth.uid()) is not null
     and not (select has_permission('medical.archive')) then
    raise exception 'Archiving or restoring a medical record needs the Archive medical records permission.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists weight_archive_guard on weight;
create trigger weight_archive_guard before update of archived_at on weight
  for each row execute function public.medical_archive_guard();
drop trigger if exists prescriptions_archive_guard on prescriptions;
create trigger prescriptions_archive_guard before update of archived_at on prescriptions
  for each row execute function public.medical_archive_guard();
drop trigger if exists immunization_records_archive_guard on immunization_records;
create trigger immunization_records_archive_guard before update of archived_at on immunization_records
  for each row execute function public.medical_archive_guard();
drop trigger if exists clinic_visits_archive_guard on clinic_visits;
create trigger clinic_visits_archive_guard before update of archived_at on clinic_visits
  for each row execute function public.medical_archive_guard();
