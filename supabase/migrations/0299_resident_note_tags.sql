-- consumer: src/app/residents/[id]/page.tsx, src/app/residents/[id]/move/MoveResidentForm.tsx
--
-- HASHTAGS IN A RESIDENT'S NOTES: THE LINK TABLE. A note that tags another resident (hash then a name) writes one row
-- here, so the tag works both ways: the note shows on the resident it was written on, and the tagged resident lists
-- it under Mentioned in. This file is the schema half only. The picker, the save that writes the rows and the
-- Mentioned in list are the next stream's. docs/decisions/2026-11-02-resident-tags-schema.md is the paper: it holds
-- the manifest of note boxes and the reasoning for the key below.
--
-- WHAT IDENTIFIES A NOTE. Notes are columns on rows, so a note is (source_table, source_row_id, source_column).
-- The pair (source_table, source_column) is a row in resident_note_sources, a small registry that also says which
-- column of the table holds the owning resident, which existing activity lets a login READ the note and which
-- existing activities let a login SAVE it. A new note box later is ONE insert into the registry, no schema change.
-- A named enum was weighed and rejected: a new box would need an alter type, and a policy would still need a second
-- mapping from each enum value to an activity.
--
-- THE POLICIES, all through has_permission() so Admin passes by is_admin() inside it as everywhere:
--   read   the login can read the note where the tag was written (the registry read activity) AND can read
--          residents (resident.record at read), so a link never shows a resident the login cannot already open.
--   write  the login may save that note (any of the registry write activities) AND can read residents.
-- A trigger refuses a row whose from_resident_id is not the resident that owns the note, so a link cannot claim a
-- note belongs to someone else. A row is archived with archived_at, or deleted when the tag is edited out.
--
-- WHAT THIS FILE DOES NOT DO: add an activity or a card (every activity named here already exists), give any role
-- a card, touch Admin (outside the card system), touch any src file, or enforce that the note row still exists
-- (the key spans many tables so no foreign key can, and the app half removes or archives links with the note).
-- No role key or role name decides anything here. Additive and re-runnable. String literals carry no semicolon or
-- double dash.

-- ---------------------------------------------------------------------------
-- 1. The registry of note boxes
-- ---------------------------------------------------------------------------
create table if not exists resident_note_sources (
  source_table      text not null,
  source_column     text not null,
  resident_column   text not null,
  read_activity     text not null,
  write_activities  text[] not null,
  label             text not null,
  primary key (source_table, source_column)
);

alter table resident_note_sources enable row level security;
drop policy if exists resident_note_sources_select on resident_note_sources;
create policy resident_note_sources_select on resident_note_sources for select to authenticated
  using ((select has_permission('resident.record', 'read')));
revoke all on resident_note_sources from anon, authenticated, service_role;
grant select on resident_note_sources to authenticated, service_role;

comment on table resident_note_sources is
  'Every free-text note box on a resident that takes a hashtag (0299). One row per table and column. read_activity is the activity that lets a login read the note and write_activities are those that let one save it. Adding a note box is one insert here.';

insert into resident_note_sources (source_table, source_column, resident_column, read_activity, write_activities, label) values
  ('residents', 'behaviour_notes', 'id', 'resident.record', array['resident.record'], 'Behaviour notes'),
  ('residents', 'temperament_notes', 'id', 'resident.record', array['resident.record'], 'Temperament notes'),
  ('residents', 'past_story_notes', 'id', 'resident.record', array['resident.record'], 'Past story notes'),
  ('placement_history', 'notes', 'resident_id', 'resident.record',
     array['placement.move', 'placement.hospital', 'placement.rehome', 'placement.death', 'placement.death_withdraw', 'resident.register', 'resident.record'], 'Placement and move notes'),
  ('clinic_visits', 'notes', 'resident_id', 'medical.visits', array['medical.visits'], 'Clinic visit notes'),
  ('immunization_records', 'notes', 'resident_id', 'medical.immunizations', array['medical.immunizations'], 'Immunization notes'),
  ('prescriptions', 'notes', 'resident_id', 'medical.prescriptions', array['medical.prescriptions'], 'Prescription notes'),
  ('procedures', 'notes', 'resident_id', 'medical.procedures', array['medical.procedures'], 'Procedure notes'),
  ('weight', 'notes', 'resident_id', 'medical.weight', array['medical.weight'], 'Weight notes'),
  ('resident_diets', 'notes', 'resident_id', 'medical.diet', array['medical.diet'], 'Diet notes'),
  ('adoption_updates', 'note', 'resident_id', 'resident.adoption_news', array['resident.adoption_news'], 'Adoption news notes')
on conflict (source_table, source_column) do update
  set resident_column = excluded.resident_column,
      read_activity = excluded.read_activity,
      write_activities = excluded.write_activities,
      label = excluded.label;

-- ---------------------------------------------------------------------------
-- 2. The two questions a policy asks
-- ---------------------------------------------------------------------------
create or replace function can_read_note_source(p_table text, p_column text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from resident_note_sources s
     where s.source_table = p_table and s.source_column = p_column
       and has_permission(s.read_activity, 'read')
  );
$$;

create or replace function can_write_note_source(p_table text, p_column text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from resident_note_sources s, unnest(s.write_activities) a
     where s.source_table = p_table and s.source_column = p_column
       and has_permission(a)
  );
$$;

revoke all on function can_read_note_source(text, text) from public, anon;
revoke all on function can_write_note_source(text, text) from public, anon;
grant execute on function can_read_note_source(text, text) to authenticated, service_role;
grant execute on function can_write_note_source(text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. The link table
-- ---------------------------------------------------------------------------
create table if not exists resident_note_tags (
  id               uuid primary key default gen_random_uuid(),
  source_table     text not null,
  source_row_id    uuid not null,
  source_column    text not null,
  from_resident_id uuid not null references residents (id),
  to_resident_id   uuid not null references residents (id),
  created_by       uuid default auth.uid() references auth.users (id),
  created_at       timestamptz not null default now(),
  archived_at      timestamptz,
  constraint resident_note_tags_source_fk
    foreign key (source_table, source_column) references resident_note_sources (source_table, source_column),
  constraint resident_note_tags_not_self check (from_resident_id <> to_resident_id),
  constraint resident_note_tags_one_per_tag unique (source_table, source_column, source_row_id, to_resident_id)
);

create index if not exists resident_note_tags_from_idx on resident_note_tags (from_resident_id);
create index if not exists resident_note_tags_to_idx on resident_note_tags (to_resident_id) where archived_at is null;

comment on table resident_note_tags is
  'One row per hashtag in a resident note (0299). The note is (source_table, source_row_id, source_column), the resident it was written on is from_resident_id and the tagged one is to_resident_id. Mentioned in reads by to_resident_id.';

create or replace function resident_note_tags_check_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_col text;
  v_owner uuid;
begin
  select s.resident_column into v_col from resident_note_sources s
   where s.source_table = new.source_table and s.source_column = new.source_column;
  execute format('select %I from %I where id = $1', v_col, new.source_table) into v_owner using new.source_row_id;
  if v_owner is distinct from new.from_resident_id then
    raise exception 'the note does not exist or does not belong to the resident it says' using errcode = '23514';
  end if;
  return new;
end
$$;

drop trigger if exists resident_note_tags_check_owner on resident_note_tags;
create trigger resident_note_tags_check_owner
  before insert or update of source_table, source_column, source_row_id, from_resident_id on resident_note_tags
  for each row execute function resident_note_tags_check_owner();

alter table resident_note_tags enable row level security;

drop policy if exists resident_note_tags_select_perm on resident_note_tags;
create policy resident_note_tags_select_perm on resident_note_tags for select to authenticated
  using ((select can_read_note_source(source_table, source_column)) and (select has_permission('resident.record', 'read')));

drop policy if exists resident_note_tags_insert_perm on resident_note_tags;
create policy resident_note_tags_insert_perm on resident_note_tags for insert to authenticated
  with check ((select can_write_note_source(source_table, source_column)) and (select has_permission('resident.record', 'read')));

drop policy if exists resident_note_tags_update_perm on resident_note_tags;
create policy resident_note_tags_update_perm on resident_note_tags for update to authenticated
  using ((select can_write_note_source(source_table, source_column)) and (select has_permission('resident.record', 'read')))
  with check ((select can_write_note_source(source_table, source_column)) and (select has_permission('resident.record', 'read')));

drop policy if exists resident_note_tags_delete_perm on resident_note_tags;
create policy resident_note_tags_delete_perm on resident_note_tags for delete to authenticated
  using ((select can_write_note_source(source_table, source_column)) and (select has_permission('resident.record', 'read')));

revoke all on resident_note_tags from anon, authenticated, service_role;
grant select, insert, update, delete on resident_note_tags to authenticated;
grant select on resident_note_tags to service_role;

do $report$
begin
  if (select count(*) from public.resident_note_sources) < 11 then
    raise exception '0299 the registry is missing note boxes';
  end if;
  if exists (select 1 from public.resident_note_sources s, unnest(array[s.read_activity] || s.write_activities) a
              where not exists (select 1 from public.permission_activities p where p.key = a)) then
    raise exception '0299 the registry names an activity that does not exist';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'resident_note_tags' and cmd = 'SELECT'
                  and qual like '%can_read_note_source%') then
    raise exception '0299 the read policy does not ask can_read_note_source';
  end if;
  if pg_get_functiondef('public.can_read_note_source(text, text)'::regprocedure) not like '%has_permission%' then
    raise exception '0299 can_read_note_source does not consult has_permission';
  end if;
  if pg_get_functiondef('public.can_write_note_source(text, text)'::regprocedure) not like '%has_permission%' then
    raise exception '0299 can_write_note_source does not consult has_permission';
  end if;
end
$report$;

notify pgrst, 'reload schema';
