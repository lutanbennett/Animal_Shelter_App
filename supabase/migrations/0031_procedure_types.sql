-- Procedures (Section 4.4): a type list, staff write access, and files.
--
-- The 0001 `procedures` table stored the kind of procedure as free text.
-- In practice it's a short, repeating list — X-ray, ultrasound, teeth
-- cleaning, spay/neuter — that staff should pick from rather than retype
-- (and spell three ways), the same way immunizations and medications are
-- lookup tables. So:
--
--   1. `procedure_types`, seeded with the common ones and extendable from
--      the form (staff/vet insert) until an admin page exists.
--   2. `procedures.procedure_type_id` replaces `procedure_type`. Existing
--      rows are carried across by name before the text column goes.
--   3. Staff can log procedures. 0001 gave staff read-only access because
--      procedures are nearly always a vet's work, but nail clipping, ear
--      cleaning and grooming happen at the shelter and are worth a record.
--      Same insert/update shape as 0027 gave staff on prescriptions; a
--      procedure with no linked vet visit reads as "done at the shelter".
--   4. 'procedure' joins `attachment_owner_type` so X-rays, ultrasound
--      images and discharge notes can hang off the procedure the way lab
--      scans hang off a blood test (0020). The deceased-lock resolver that
--      needs the new value lives in 0032 — an enum value added in a
--      transaction can't be referenced in that same transaction.
--
-- Written to be safely re-runnable after a partial failure.

-- =========================================================================
-- 1. procedure_types
-- =========================================================================

create table if not exists procedure_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table procedure_types is
  'The kinds of procedure the shelter records (X-ray, ultrasound, teeth cleaning, ...). Picked from on the procedure form; new ones can be added inline.';

alter table procedure_types enable row level security;

drop policy if exists admin_all_procedure_types on procedure_types;
create policy admin_all_procedure_types on procedure_types
  for all using (current_user_role() = 'admin');

drop policy if exists staff_read_procedure_types on procedure_types;
create policy staff_read_procedure_types on procedure_types
  for select using (current_user_role() = 'staff');

drop policy if exists staff_insert_procedure_types on procedure_types;
create policy staff_insert_procedure_types on procedure_types
  for insert with check (current_user_role() = 'staff');

drop policy if exists vet_read_procedure_types on procedure_types;
create policy vet_read_procedure_types on procedure_types
  for select using (current_user_role() = 'vet');

drop policy if exists vet_insert_procedure_types on procedure_types;
create policy vet_insert_procedure_types on procedure_types
  for insert with check (current_user_role() = 'vet');

drop policy if exists volunteer_read_procedure_types on procedure_types;
create policy volunteer_read_procedure_types on procedure_types
  for select using (current_user_role() = 'volunteer');

insert into procedure_types (name) values
  ('X-ray'),
  ('Ultrasound'),
  ('Teeth cleaning'),
  ('Spay / neuter'),
  ('Microchipping'),
  ('Wound treatment'),
  ('Nail clipping'),
  ('Ear cleaning'),
  ('Grooming'),
  ('Surgery (other)')
on conflict (name) do nothing;

-- =========================================================================
-- 2. procedures.procedure_type_id, carrying over any free-text rows
-- =========================================================================

alter table procedures
  add column if not exists procedure_type_id uuid references procedure_types (id);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'procedures'
      and column_name = 'procedure_type'
  ) then
    insert into procedure_types (name)
    select distinct trim(procedure_type)
    from procedures
    where procedure_type is not null
      and trim(procedure_type) <> ''
    on conflict (name) do nothing;

    update procedures p
    set procedure_type_id = pt.id
    from procedure_types pt
    where p.procedure_type_id is null
      and pt.name = trim(p.procedure_type);

    -- A row whose text didn't resolve (blank) would fail the NOT NULL
    -- below; there's no sensible type to invent for it, so surface it.
    if exists (select 1 from procedures where procedure_type_id is null) then
      raise exception 'procedures has rows with no resolvable procedure_type; fix them before dropping the column.';
    end if;

    alter table procedures drop column procedure_type;
  end if;
end;
$$;

alter table procedures alter column procedure_type_id set not null;

create index if not exists procedures_procedure_type_id_idx
  on procedures (procedure_type_id);

create index if not exists procedures_vet_appointment_id_idx
  on procedures (vet_appointment_id);

comment on column procedures.vet_appointment_id is
  'The vet visit this procedure was done at, when it was; null for one done at the shelter (nail clipping, ear cleaning). No cascade — a deleted appointment leaves its procedures behind.';

-- =========================================================================
-- 3. Staff can log and correct procedures
-- =========================================================================

drop policy if exists staff_insert_procedures on procedures;
create policy staff_insert_procedures on procedures
  for insert with check (current_user_role() = 'staff');

drop policy if exists staff_update_procedures on procedures;
create policy staff_update_procedures on procedures
  for update using (current_user_role() = 'staff');

-- =========================================================================
-- 4. Files on a procedure
-- =========================================================================

alter type attachment_owner_type add value if not exists 'procedure';
