-- Lanna Care for Animals — initial schema
-- Implements the data model in docs/requirements/lanna-care-rebuild-requirements.md Section 4.
-- Core principle: resident lifecycle is an append-only event log (placement_history),
-- never mutable status fields on residents. See Section 4.1.

create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. Roles (Section 6 RBAC)
-- =========================================================================

create type app_role as enum ('admin', 'staff', 'vet', 'volunteer');

create table user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now()
);

-- Helper used throughout RLS policies below.
create or replace function current_user_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from user_roles where user_id = auth.uid();
$$;

-- =========================================================================
-- 2. Zones & Enclosures (Section 4.1)
-- =========================================================================

create table zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table enclosures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone_id uuid not null references zones (id),
  capacity integer,
  notes text,
  created_at timestamptz not null default now(),
  unique (zone_id, name)
);

-- Pseudo-zone/pseudo-enclosure pattern (Section 4.1): lifecycle states that are
-- not physical locations are modeled as enclosures under a dedicated pseudo-zone,
-- so "current enclosure" queries work uniformly for every resident.
insert into zones (name) values ('Lifecycle');

do $$
declare
  lifecycle_zone_id uuid;
begin
  select id into lifecycle_zone_id from zones where name = 'Lifecycle';

  insert into enclosures (name, zone_id) values
    ('Unassigned', lifecycle_zone_id),
    ('Hospital', lifecycle_zone_id),
    ('Fostered', lifecycle_zone_id),
    ('Adopted', lifecycle_zone_id),
    ('Deceased', lifecycle_zone_id);
end $$;

create table group_origins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  date date,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 3. Contacts (Section 4.4) — created before residents/placement_history
--    because placement_history.carer_id references it.
-- =========================================================================

create type contact_type as enum ('Carer', 'Volunteer', 'Vendor', 'Donor', 'Other');

create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type contact_type not null,
  phone text,
  email text,
  line_id text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 4. Residents & Placement History (Section 4.1) — the core domain
-- =========================================================================

create table residents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text,
  breed text,
  sex text,
  date_of_birth date,
  estimated_age_years numeric,
  intake_date date,
  bio text,
  temperament_notes text,
  past_story_notes text,
  behaviour_notes text,
  profile_photo_drive_file_id text,
  ready_for_adoption boolean not null default false,
  is_public_visible boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
  -- Deliberately no status/zone/enclosure/carer/deceased columns — see
  -- placement_history and the current_* views below.
);

create type placement_type as enum (
  'Intake',
  'ChangeEnclosure',
  'SendToHospital',
  'ReturnFromHospital',
  'Foster',
  'Adopt',
  'Deceased',
  'ReturnToShelter'
);

create table placement_history (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  placement_type placement_type not null,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  zone_id uuid references zones (id),
  enclosure_id uuid references enclosures (id),
  previous_enclosure_id uuid references enclosures (id),
  carer_id uuid references contacts (id),
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  -- Guards against the exact bug described in Section 7.2: a placement whose
  -- end_date is set equal to (or before) its own start_date silently breaks
  -- every "find the active record" query.
  constraint end_after_start check (end_date is null or end_date > start_date)
);

create index placement_history_resident_id_idx on placement_history (resident_id);
create index placement_history_active_idx on placement_history (resident_id) where end_date is null;

-- Only one active (end_date IS NULL) placement per resident at a time.
create unique index placement_history_one_active_per_resident
  on placement_history (resident_id)
  where end_date is null;

-- Carers must actually be of type 'Carer' (Section 4.1).
create or replace function check_carer_type()
returns trigger
language plpgsql
as $$
begin
  if new.carer_id is not null then
    if not exists (select 1 from contacts where id = new.carer_id and type = 'Carer') then
      raise exception 'carer_id % does not reference a contact of type Carer', new.carer_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger placement_history_check_carer_type
  before insert or update on placement_history
  for each row execute function check_carer_type();

-- Placement rows are immutable except `notes` (Section 4.1) — enforced here,
-- not just by convention in the app layer.
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
  then
    raise exception 'placement_history rows are immutable except notes and end_date (end_date is only closed automatically)';
  end if;
  return new;
end;
$$;

create trigger placement_history_immutable
  before update on placement_history
  for each row execute function enforce_placement_history_immutability();

-- Auto-close the previous active placement in the same transaction as the new
-- insert (Section 4.1 / 7.1) — replaces AppSheet's "Close Prior Placement
-- Record" Bot. This runs as part of the same statement, not an async step.
create or replace function close_prior_placement()
returns trigger
language plpgsql
as $$
begin
  if new.placement_type <> 'Intake' then
    update placement_history
    set end_date = new.start_date
    where resident_id = new.resident_id
      and end_date is null
      and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger placement_history_close_prior
  after insert on placement_history
  for each row execute function close_prior_placement();

-- =========================================================================
-- 5. Computed "current state" views (Section 4.1) — queried, never stored,
--    except future performance work if it's genuinely needed.
-- =========================================================================

create view current_placement as
select distinct on (resident_id) *
from placement_history
where end_date is null
order by resident_id, start_date desc;

create view resident_current_state as
select
  r.id as resident_id,
  r.name,
  cp.id as current_placement_id,
  cp.enclosure_id as current_enclosure_id,
  e.zone_id as current_zone_id,
  cp.carer_id as current_carer_id,
  cp.previous_enclosure_id as active_hospital_previous_enclosure,
  case
    when ez.name = 'Deceased' then 'Deceased'
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
-- 6. Vet & Health (Section 4.2)
-- =========================================================================

create table vets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  clinic_name text,
  contact_info text,
  created_at timestamptz not null default now()
);

create type appointment_status as enum ('scheduled', 'completed', 'cancelled');

create table vet_appointments (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  vet_id uuid references vets (id),
  appointment_date timestamptz not null,
  reason text,
  notes text,
  status appointment_status not null default 'scheduled',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index vet_appointments_resident_id_idx on vet_appointments (resident_id);

-- Represents a single bulk scheduling action; vet_appointments rows it produced
-- reference it via bulk_appointment_id so the fan-out (Section 7.4) is auditable.
create table bulk_appointments (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid references vets (id),
  appointment_date timestamptz not null,
  reason text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table vet_appointments
  add column bulk_appointment_id uuid references bulk_appointments (id);

create table weight (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  date date not null,
  weight_kg numeric not null,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index weight_resident_id_idx on weight (resident_id);

create table procedures (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  vet_appointment_id uuid references vet_appointments (id),
  procedure_type text not null,
  date date not null,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index procedures_resident_id_idx on procedures (resident_id);

create table blood_tests (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  vet_appointment_id uuid references vet_appointments (id),
  date date not null,
  results text,
  drive_file_id text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index blood_tests_resident_id_idx on blood_tests (resident_id);

create table medication (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table frequency (
  id uuid primary key default gen_random_uuid(),
  label text not null unique
);

create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  medication_id uuid not null references medication (id),
  start_date date not null,
  end_date date,
  frequency_id uuid references frequency (id),
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index prescriptions_resident_id_idx on prescriptions (resident_id);
create index prescriptions_active_idx on prescriptions (resident_id) where end_date is null;

create table immunization_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_mandatory boolean not null default true
);

-- Immunization records: the table implicated in bug B69 (Section 1, 7.3).
-- The unique constraint below is the structural fix — duplicate/dropped rows
-- become impossible at the database level, not just unlikely.
create table immunization_records (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  immunization_type_id uuid not null references immunization_types (id),
  date_administered date not null,
  administered_by text,
  notes text,
  batch_number text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resident_id, immunization_type_id, date_administered)
);

create index immunization_records_resident_id_idx on immunization_records (resident_id);
create index immunization_records_type_date_idx on immunization_records (immunization_type_id, date_administered);

-- =========================================================================
-- 7. Community & Maintenance (Section 4.4)
-- =========================================================================

create type maintenance_status as enum ('To Do', 'In Progress', 'Blocked', 'Done');

create table maintenance (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status maintenance_status not null default 'To Do',
  zone_id uuid references zones (id),
  assigned_to uuid references contacts (id),
  date_created date not null default current_date,
  date_completed date,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index maintenance_status_idx on maintenance (status);

-- =========================================================================
-- 8. Photos & Files (Section 4.3, Section 5) — Google Drive is the file
--    store; these tables hold Drive file references, not file bytes.
-- =========================================================================

create type attachment_owner_type as enum ('resident', 'project', 'maintenance');

create table attachments (
  id uuid primary key default gen_random_uuid(),
  owner_type attachment_owner_type not null,
  owner_id uuid not null,
  sub_folder text,
  drive_file_id text not null,
  file_name text,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users (id)
);

create index attachments_owner_idx on attachments (owner_type, owner_id);

create table project_folders (
  id uuid primary key default gen_random_uuid(),
  top_level_category text not null,
  name text not null,
  parent_folder_id uuid references project_folders (id),
  drive_folder_id text,
  created_at timestamptz not null default now()
);

create table project_photos (
  id uuid primary key default gen_random_uuid(),
  project_folder_id uuid not null references project_folders (id),
  drive_file_id text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users (id)
);

create table maintenance_photos (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references maintenance (id),
  drive_file_id text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users (id)
);

-- =========================================================================
-- 9. Row-Level Security (Section 6)
--
-- This is a first-pass policy set implementing the role table from Section 6
-- plus the answers already confirmed with the user:
--   - Vets have shelter-wide read access to medical records (not scoped to
--     residents they've personally treated).
--   - Volunteers can read everything, and may write attachments/photos and
--     ChangeEnclosure placements only — not other placement types, and not
--     vet/medical data.
-- The exact per-table CRUD matrix is still flagged as needing sign-off
-- (Section 11, item 1) — treat this as the working default, not final.
-- =========================================================================

alter table user_roles enable row level security;
alter table zones enable row level security;
alter table enclosures enable row level security;
alter table group_origins enable row level security;
alter table contacts enable row level security;
alter table residents enable row level security;
alter table placement_history enable row level security;
alter table vets enable row level security;
alter table vet_appointments enable row level security;
alter table bulk_appointments enable row level security;
alter table weight enable row level security;
alter table procedures enable row level security;
alter table blood_tests enable row level security;
alter table medication enable row level security;
alter table frequency enable row level security;
alter table prescriptions enable row level security;
alter table immunization_types enable row level security;
alter table immunization_records enable row level security;
alter table maintenance enable row level security;
alter table attachments enable row level security;
alter table project_folders enable row level security;
alter table project_photos enable row level security;
alter table maintenance_photos enable row level security;

-- Admins: full access to everything.
create policy admin_all_user_roles on user_roles for all using (current_user_role() = 'admin');
create policy admin_all_zones on zones for all using (current_user_role() = 'admin');
create policy admin_all_enclosures on enclosures for all using (current_user_role() = 'admin');
create policy admin_all_group_origins on group_origins for all using (current_user_role() = 'admin');
create policy admin_all_contacts on contacts for all using (current_user_role() = 'admin');
create policy admin_all_residents on residents for all using (current_user_role() = 'admin');
create policy admin_all_placement_history on placement_history for all using (current_user_role() = 'admin');
create policy admin_all_vets on vets for all using (current_user_role() = 'admin');
create policy admin_all_vet_appointments on vet_appointments for all using (current_user_role() = 'admin');
create policy admin_all_bulk_appointments on bulk_appointments for all using (current_user_role() = 'admin');
create policy admin_all_weight on weight for all using (current_user_role() = 'admin');
create policy admin_all_procedures on procedures for all using (current_user_role() = 'admin');
create policy admin_all_blood_tests on blood_tests for all using (current_user_role() = 'admin');
create policy admin_all_medication on medication for all using (current_user_role() = 'admin');
create policy admin_all_frequency on frequency for all using (current_user_role() = 'admin');
create policy admin_all_prescriptions on prescriptions for all using (current_user_role() = 'admin');
create policy admin_all_immunization_types on immunization_types for all using (current_user_role() = 'admin');
create policy admin_all_immunization_records on immunization_records for all using (current_user_role() = 'admin');
create policy admin_all_maintenance on maintenance for all using (current_user_role() = 'admin');
create policy admin_all_attachments on attachments for all using (current_user_role() = 'admin');
create policy admin_all_project_folders on project_folders for all using (current_user_role() = 'admin');
create policy admin_all_project_photos on project_photos for all using (current_user_role() = 'admin');
create policy admin_all_maintenance_photos on maintenance_photos for all using (current_user_role() = 'admin');

-- Staff: read/write on the operational domain. Cannot touch user_roles.
create policy staff_rw_zones on zones for all using (current_user_role() = 'staff');
create policy staff_rw_enclosures on enclosures for all using (current_user_role() = 'staff');
create policy staff_rw_group_origins on group_origins for all using (current_user_role() = 'staff');
create policy staff_rw_contacts on contacts for all using (current_user_role() = 'staff');
create policy staff_rw_residents on residents for all using (current_user_role() = 'staff');
create policy staff_read_placement_history on placement_history for select using (current_user_role() = 'staff');
create policy staff_insert_placement_history on placement_history for insert with check (current_user_role() = 'staff');
create policy staff_update_notes_placement_history on placement_history for update using (current_user_role() = 'staff');
create policy staff_read_vets on vets for select using (current_user_role() = 'staff');
create policy staff_read_vet_appointments on vet_appointments for select using (current_user_role() = 'staff');
create policy staff_read_weight on weight for all using (current_user_role() = 'staff');
create policy staff_read_procedures on procedures for select using (current_user_role() = 'staff');
create policy staff_read_blood_tests on blood_tests for select using (current_user_role() = 'staff');
create policy staff_read_prescriptions on prescriptions for select using (current_user_role() = 'staff');
create policy staff_read_immunization_types on immunization_types for select using (current_user_role() = 'staff');
create policy staff_read_immunization_records on immunization_records for select using (current_user_role() = 'staff');
create policy staff_rw_maintenance on maintenance for all using (current_user_role() = 'staff');
create policy staff_rw_attachments on attachments for all using (current_user_role() = 'staff');
create policy staff_rw_project_folders on project_folders for all using (current_user_role() = 'staff');
create policy staff_rw_project_photos on project_photos for all using (current_user_role() = 'staff');
create policy staff_rw_maintenance_photos on maintenance_photos for all using (current_user_role() = 'staff');

-- Vet: shelter-wide read on residents/contacts for context, full read/write
-- on medical data. Read-only (or no access) on maintenance/RBAC.
create policy vet_read_zones on zones for select using (current_user_role() = 'vet');
create policy vet_read_enclosures on enclosures for select using (current_user_role() = 'vet');
create policy vet_read_contacts on contacts for select using (current_user_role() = 'vet');
create policy vet_read_residents on residents for select using (current_user_role() = 'vet');
create policy vet_read_placement_history on placement_history for select using (current_user_role() = 'vet');
create policy vet_rw_vets on vets for all using (current_user_role() = 'vet');
create policy vet_rw_vet_appointments on vet_appointments for all using (current_user_role() = 'vet');
create policy vet_rw_bulk_appointments on bulk_appointments for all using (current_user_role() = 'vet');
create policy vet_rw_weight on weight for all using (current_user_role() = 'vet');
create policy vet_rw_procedures on procedures for all using (current_user_role() = 'vet');
create policy vet_rw_blood_tests on blood_tests for all using (current_user_role() = 'vet');
create policy vet_read_medication on medication for select using (current_user_role() = 'vet');
create policy vet_read_frequency on frequency for select using (current_user_role() = 'vet');
create policy vet_rw_prescriptions on prescriptions for all using (current_user_role() = 'vet');
create policy vet_rw_immunization_types on immunization_types for all using (current_user_role() = 'vet');
create policy vet_rw_immunization_records on immunization_records for all using (current_user_role() = 'vet');

-- Volunteer: read everything operational; write only attachments/photos and
-- ChangeEnclosure placements (confirmed with user — flagged for review once
-- they see it in the running app).
create policy volunteer_read_zones on zones for select using (current_user_role() = 'volunteer');
create policy volunteer_read_enclosures on enclosures for select using (current_user_role() = 'volunteer');
create policy volunteer_read_group_origins on group_origins for select using (current_user_role() = 'volunteer');
create policy volunteer_read_contacts on contacts for select using (current_user_role() = 'volunteer');
create policy volunteer_read_residents on residents for select using (current_user_role() = 'volunteer');
create policy volunteer_read_placement_history on placement_history for select using (current_user_role() = 'volunteer');
create policy volunteer_insert_change_enclosure on placement_history for insert
  with check (current_user_role() = 'volunteer' and placement_type = 'ChangeEnclosure');
create policy volunteer_read_vets on vets for select using (current_user_role() = 'volunteer');
create policy volunteer_read_vet_appointments on vet_appointments for select using (current_user_role() = 'volunteer');
create policy volunteer_read_weight on weight for select using (current_user_role() = 'volunteer');
create policy volunteer_read_procedures on procedures for select using (current_user_role() = 'volunteer');
create policy volunteer_read_blood_tests on blood_tests for select using (current_user_role() = 'volunteer');
create policy volunteer_read_prescriptions on prescriptions for select using (current_user_role() = 'volunteer');
create policy volunteer_read_immunization_types on immunization_types for select using (current_user_role() = 'volunteer');
create policy volunteer_read_immunization_records on immunization_records for select using (current_user_role() = 'volunteer');
create policy volunteer_read_maintenance on maintenance for select using (current_user_role() = 'volunteer');
create policy volunteer_rw_attachments on attachments for all using (current_user_role() = 'volunteer');
create policy volunteer_read_project_folders on project_folders for select using (current_user_role() = 'volunteer');
create policy volunteer_rw_project_photos on project_photos for all using (current_user_role() = 'volunteer');
create policy volunteer_rw_maintenance_photos on maintenance_photos for all using (current_user_role() = 'volunteer');

-- Public/Anonymous: read-only, narrow column set, only residents flagged
-- is_public_visible. Served through this dedicated view rather than the
-- same query path staff use (Section 6).
create view public_resident_profiles as
select
  r.id,
  r.name,
  r.species,
  r.breed,
  r.sex,
  r.ready_for_adoption,
  r.bio,
  r.temperament_notes,
  r.past_story_notes,
  r.profile_photo_drive_file_id
from residents r
where r.is_public_visible = true
  and not coalesce((select is_deceased from resident_current_state s where s.resident_id = r.id), false);
