-- Blood test types (2026-09-21).
--
-- A blood test has been a date, free-text results and its files (0001,
-- 0020). Which panel was run — a CBC, a chemistry panel, a heartworm test —
-- only ever lived in the results text, so it couldn't be filtered or
-- forecast and got spelled three ways. Same fix as 0031 gave procedures:
--
--   1. `blood_test_types`, seeded with the panels the shelter's vets run,
--      managed at /admin/blood-test-types. No inline add from the blood
--      test form (unlike procedure types): the list is short and stable,
--      and an admin page exists from day one, so there is nothing for
--      duplicates to collect from — but a merge helper is provided anyway,
--      same shape as 0047's, for the day one appears.
--   2. `blood_tests.blood_test_type_id`, NOT NULL. Every existing row is
--      backfilled to CBC (Complete Blood Count) — the routine panel and the
--      form's default — since nothing recorded which panel they were; a
--      row that was something else is corrected from the tab's Edit link
--      once that exists, and its results text still says what it was.
--   3. Read access for every role, write for admin only. Management gets
--      the staff twin per 0039's rule so the count check there stays true.
--
-- Written to be safely re-runnable after a partial failure.

-- =========================================================================
-- 1. blood_test_types
-- =========================================================================

create table if not exists blood_test_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table blood_test_types is
  'The panels a blood test can be (CBC, chemistry, thyroid, heartworm, ...). Picked from on the blood test form, defaulting to CBC; managed at /admin/blood-test-types.';

alter table blood_test_types enable row level security;

drop policy if exists admin_all_blood_test_types on blood_test_types;
create policy admin_all_blood_test_types on blood_test_types
  for all using (current_user_role() = 'admin');

drop policy if exists staff_read_blood_test_types on blood_test_types;
create policy staff_read_blood_test_types on blood_test_types
  for select using (current_user_role() = 'staff');

drop policy if exists management_read_blood_test_types on blood_test_types;
create policy management_read_blood_test_types on blood_test_types
  for select using (current_user_role() = 'management');

drop policy if exists vet_read_blood_test_types on blood_test_types;
create policy vet_read_blood_test_types on blood_test_types
  for select using (current_user_role() = 'vet');

drop policy if exists volunteer_read_blood_test_types on blood_test_types;
create policy volunteer_read_blood_test_types on blood_test_types
  for select using (current_user_role() = 'volunteer');

insert into blood_test_types (name) values
  ('CBC (Complete Blood Count)'),
  ('Blood Chemistry Panel'),
  ('Thyroid Panel'),
  ('Heartworm Test'),
  ('Tick Borne Disease Panel'),
  ('Cortisol Test'),
  ('Urinary Analysis')
on conflict (name) do nothing;

-- =========================================================================
-- 2. blood_tests.blood_test_type_id, backfilled to CBC
-- =========================================================================

alter table blood_tests
  add column if not exists blood_test_type_id uuid references blood_test_types (id);

-- A deceased resident's tests are locked (0026); the backfill is a
-- classification of existing rows, not a change to the record, so it goes
-- through with the same bypass the death cascade uses.
do $$
begin
  perform set_config('app.deceased_lock_bypass', 'on', true);
  update blood_tests
  set blood_test_type_id = (
    select id from blood_test_types where name = 'CBC (Complete Blood Count)'
  )
  where blood_test_type_id is null;
  perform set_config('app.deceased_lock_bypass', 'off', true);
end;
$$;

alter table blood_tests alter column blood_test_type_id set not null;

create index if not exists blood_tests_blood_test_type_id_idx
  on blood_tests (blood_test_type_id);

comment on column blood_tests.blood_test_type_id is
  'Which panel was run. No cascade — a type that has ever been logged is part of a resident''s medical record and cannot be deleted, only merged.';

-- =========================================================================
-- 3. Merge a duplicate type into the one to keep (same shape as 0047)
-- =========================================================================
--
-- SECURITY INVOKER, so RLS decides who may: the caller needs UPDATE on
-- blood_tests and DELETE on blood_test_types (only admin has the latter;
-- anyone else fails at the delete and the whole thing rolls back).

create or replace function merge_blood_test_type(p_from uuid, p_into uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_moved integer;
begin
  if p_from = p_into then
    raise exception 'Choose a different blood test type to merge into.';
  end if;
  if not exists (select 1 from blood_test_types where id = p_from)
     or not exists (select 1 from blood_test_types where id = p_into) then
    raise exception 'Blood test type not found.';
  end if;

  update blood_tests set blood_test_type_id = p_into where blood_test_type_id = p_from;
  get diagnostics v_moved = row_count;

  delete from blood_test_types where id = p_from;
  if not found then
    raise exception 'Not authorized to remove the duplicate blood test type.';
  end if;
  return v_moved;
end;
$$;

notify pgrst, 'reload schema';
