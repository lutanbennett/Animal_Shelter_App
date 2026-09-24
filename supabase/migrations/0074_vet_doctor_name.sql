-- Optional doctor name on a vet appointment (customer request 2026-09-23).
--
-- vet_appointments records the clinic (vet_id) but no person; some clinics
-- put a particular doctor on a particular animal, and staff want the record
-- to say who actually saw the resident.
--
-- Free text, not a lookup table or a foreign key — Lutan's call on
-- 2026-09-24, with its cost recorded in docs/decisions.md: "Dr Somchai" and
-- "Somchai" stay two strings, so counting visits per doctor means grouping
-- by hand. Promoting it to a lookup is its own item if that is ever wanted.
--
-- The one tidy-up done now, because it is the part painful to retrofit:
-- surrounding whitespace is trimmed and blank is stored as NULL, by trigger,
-- so every writer (the app, the SQL editor, an import) gets the same rule.
-- The check constraint states the invariant the trigger maintains.
--
-- Additive and nullable: existing rows read NULL ("not recorded"), and code
-- that does not know the column is unaffected. No RLS change — the existing
-- row policies on vet_appointments cover the new column.
--
-- Re-runnable: every statement is guarded or `or replace`.

alter table vet_appointments add column if not exists doctor_name text;

comment on column vet_appointments.doctor_name is
  'The doctor who saw the resident, as typed. Optional free text; trimmed, blank stored as null.';

create or replace function vet_appointments_tidy_doctor_name()
returns trigger
language plpgsql
as $$
begin
  -- \s in a Postgres regex covers spaces, tabs and newlines; btrim() alone
  -- would only strip spaces.
  new.doctor_name := nullif(regexp_replace(new.doctor_name, '^\s+|\s+$', '', 'g'), '');
  return new;
end;
$$;

drop trigger if exists vet_appointments_tidy_doctor_name on vet_appointments;
create trigger vet_appointments_tidy_doctor_name
  before insert or update of doctor_name on vet_appointments
  for each row execute function vet_appointments_tidy_doctor_name();

alter table vet_appointments drop constraint if exists vet_appointments_doctor_name_tidy;
alter table vet_appointments add constraint vet_appointments_doctor_name_tidy
  check (doctor_name is null or (doctor_name <> '' and doctor_name !~ '^\s|\s$'));

notify pgrst, 'reload schema';
