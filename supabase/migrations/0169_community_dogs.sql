-- consumer: src/app/outreach/, src/app/admin/website/, src/app/page.tsx
--
-- Temple and community dogs helped, the schema half (backlog, "Record community and temple dogs helped"; the
-- Director's eight answers of 2026-10-08 are on the item and in docs/decisions/2026-10-09-community-dogs-unit.md).
-- SCHEMA HALF ONLY: the phone form, the Settings control and the public figure on the page are `community-dogs`,
-- built from main once this is applied to dev. Nothing reads these tables yet.
--
--   community_places          id, name, kind (temple | village), archived_at, created_by, created_at
--   community_dog_outings     id, outing_on, place_id, dog_count, fed, treated, sterilised, sterilised_count,
--                             vaccinated, rehomed, note, recorded_by, recorded_at, updated_by, updated_at
--   community_outing_photos   id, outing_id, drive_file_id, file_name, is_public, uploaded_by, uploaded_at
--   activity community.outings   Edit / Read / None. Management Edit, nobody else (Admin implicit)
--   impact_baselines row community_dogs, empty; public_impact_figures counts it and villages_sterilised
--
-- THE UNIT (her q1, q4). Option 2: one note per outing, and the dog count is "dogs helped at that outing". The
-- same dog helped again on a later outing is counted again. There is no dog identity here on purpose, so the live
-- figure is sum(dog_count), never a count of distinct dogs. The public wording must say "dogs helped at our
-- outreach visits", which is what the baseline row's label says.
--
-- TEMPLE OR VILLAGE (q2). One public number, but every note can be split: the note names a place, and the place
-- is a temple or a village. The kind lives on the place, not copied onto each note, so a place entered with the
-- wrong kind is corrected once and every note follows. A note cannot exist without a place (place_id not null).
-- The list grows from the form: whoever may write a note may add a place. A place is retired with archived_at,
-- never deleted (its notes still point at it); there is no delete grant.
--
-- WHAT WE DID (q3). Five ticks, all counting: fed, treated, sterilised, vaccinated, rehomed. At least one is
-- required, because a note that helped nobody is not a note.
--
-- STERILISED IS A COUNT AS WELL AS A TICK (q3, q8). She ruled that sterilisations count towards the web totals,
-- temple ones in BOTH figures. A tick alone cannot feed a sterilisations figure: an outing that feeds twenty dogs
-- and sterilises three would count twenty. So a ticked note also says how many were sterilised
-- (sterilised_count, 1..dog_count), and an unticked one has none. public_impact_figures reads it for
-- villages_sterilised, which until now was baseline-only because nothing recorded a sterilisation (0156).
--
-- WHO MAY WRITE A NOTE IS A SETTING, NOT A ROLE (q5). "Management for now — can this be an option to change later
-- in Settings." So no policy names Management: every policy asks has_permission('community.outings'), and today's
-- answer is one cell, role_permissions (management, community.outings, 2). Giving staff the same is one cell
-- written by Admin in Settings, never a migration. Edit is write, correct and remove (A8); Read is see the notes.
-- New activities start at None for every role but Admin (§6 rule 8); the Management cell is her answer, not a
-- widening.
--
-- PHOTOS (q6). Optional, any number, and never public unless someone ticks it: is_public defaults false. Nothing
-- public reads this table: anon has no grant, and is_public_drive_file() (0084), which decides what the photo
-- proxy serves, does not know it. A feature that shows outing photos publicly extends that function and adds a
-- public view; until then a ticked photo is a recorded wish, not a published one. Same shape as
-- maintenance_photos and project_photos: its own small table rather than a new attachment_owner_type, which would
-- need an enum value in its own file (two migration files, and the add-value cannot share the runner's transaction).
--
-- THE BASELINE (q7). Already a solved mechanism: impact_baselines (0156). The community_dogs row starts empty
-- (count and date null), so it is not public until someone enters both in Settings. Her number and date are still
-- owed. The live count is outings strictly AFTER baseline_date, as animals_rehomed counts placements, so a note
-- dated on the baseline day is inside the baseline, never counted twice. outing_on is already a shelter day (a
-- date, default today in Asia/Bangkok), so no shelter_date() conversion is needed.
--
-- WHAT THIS CHANGES PUBLICLY. Nothing today: the community_dogs row is empty, and no outing exists. Once outings
-- are recorded, villages_sterilised (if its baseline is entered) grows by their sterilised_count after its date.
-- That is her q8 answer, not a side effect.
--
-- Stamps (recorded_by, updated_by, created_by, uploaded_by and their times) come from auth.uid() and now() in
-- triggers, never from the request. Every change reaches audit_log through record_audit() (0121).
--
-- Written to be safely re-runnable. To undo: re-create public_impact_figures from 0156, delete the community_dogs
-- baseline row, drop the three tables (cascade removes their triggers and policies), drop the three stamp
-- functions, delete the community.outings cells and activity.

-- ---------------------------------------------------------------------------
-- 1. The activity, and today's answer: Management
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('community.outings', 'level', 'projects', 59)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into role_permissions (role_id, activity, level)
select r.id, v.activity, v.level
  from roles r
  join (values ('management', 'community.outings', 2)) as v(rkey, activity, level) on v.rkey = r.key
on conflict (role_id, activity) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Places: the list of temples and villages, growing from the form
-- ---------------------------------------------------------------------------
create table if not exists community_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  archived_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  constraint community_places_kind check (kind in ('temple', 'village')),
  constraint community_places_name_present check (btrim(name) <> '')
);

create unique index if not exists community_places_live_name_unique
  on community_places (lower(btrim(name))) where archived_at is null;

comment on table community_places is
  'Temples and villages the shelter visits to help dogs it does not take in (0169). The kind splits the community_dogs figure into temple and village. Retired with archived_at, never deleted.';
comment on column community_places.kind is
  'temple or village. Lives here, not on each outing, so correcting a place corrects every note at it.';

-- ---------------------------------------------------------------------------
-- 3. Outings: one note per outing
-- ---------------------------------------------------------------------------
create table if not exists community_dog_outings (
  id uuid primary key default gen_random_uuid(),
  outing_on date not null default shelter_date(now()),
  place_id uuid not null references community_places (id),
  dog_count integer not null,
  fed boolean not null default false,
  treated boolean not null default false,
  sterilised boolean not null default false,
  sterilised_count integer,
  vaccinated boolean not null default false,
  rehomed boolean not null default false,
  note text,
  recorded_by uuid references auth.users (id),
  recorded_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint community_dog_outings_dog_count_positive check (dog_count >= 1),
  constraint community_dog_outings_some_help check (fed or treated or sterilised or vaccinated or rehomed),
  constraint community_dog_outings_sterilised_count check (
    (sterilised and sterilised_count between 1 and dog_count)
    or (not sterilised and sterilised_count is null)
  )
);

create index if not exists community_dog_outings_outing_on_idx on community_dog_outings (outing_on);
create index if not exists community_dog_outings_place_idx on community_dog_outings (place_id);

comment on table community_dog_outings is
  'One note per outreach visit to a temple or village (0169, the Director''s option 2). dog_count is dogs helped at that visit; the same dog on a later visit counts again. Feeds public_impact_figures: community_dogs = sum(dog_count), villages_sterilised = sum(sterilised_count), both after the baseline date.';
comment on column community_dog_outings.outing_on is
  'The shelter day of the visit (Asia/Bangkok). Counted publicly when strictly after the figure''s baseline_date.';
comment on column community_dog_outings.dog_count is
  'Dogs helped at this visit. Not distinct dogs: there is no dog identity (q4).';
comment on column community_dog_outings.sterilised_count is
  'How many of dog_count were sterilised: 1..dog_count when sterilised is ticked, null otherwise. Read by the villages_sterilised figure (q8).';

-- ---------------------------------------------------------------------------
-- 4. Photos: optional, never public unless ticked
-- ---------------------------------------------------------------------------
create table if not exists community_outing_photos (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references community_dog_outings (id) on delete cascade,
  drive_file_id text not null,
  file_name text,
  is_public boolean not null default false,
  uploaded_by uuid references auth.users (id),
  uploaded_at timestamptz not null default now()
);

create index if not exists community_outing_photos_outing_idx on community_outing_photos (outing_id);

comment on table community_outing_photos is
  'Photos from an outreach visit (0169), Drive file references. Optional. Not public: anon has no grant and is_public_drive_file() does not serve them; is_public records that someone ticked "show on the website" for a later public view.';

-- ---------------------------------------------------------------------------
-- 5. Stamps from the session, never the request
-- ---------------------------------------------------------------------------
create or replace function community_places_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create or replace function community_dog_outings_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.recorded_by := auth.uid();
    new.recorded_at := now();
  else
    new.recorded_by := old.recorded_by;
    new.recorded_at := old.recorded_at;
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

create or replace function community_outing_photos_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.uploaded_by := auth.uid();
    new.uploaded_at := now();
  else
    new.uploaded_by := old.uploaded_by;
    new.uploaded_at := old.uploaded_at;
  end if;
  return new;
end;
$$;

revoke execute on function community_places_stamp() from public, anon, authenticated;
revoke execute on function community_dog_outings_stamp() from public, anon, authenticated;
revoke execute on function community_outing_photos_stamp() from public, anon, authenticated;

drop trigger if exists community_places_stamp on community_places;
create trigger community_places_stamp
  before insert or update on community_places
  for each row execute function community_places_stamp();

drop trigger if exists community_dog_outings_stamp on community_dog_outings;
create trigger community_dog_outings_stamp
  before insert or update on community_dog_outings
  for each row execute function community_dog_outings_stamp();

drop trigger if exists community_outing_photos_stamp on community_outing_photos;
create trigger community_outing_photos_stamp
  before insert or update on community_outing_photos
  for each row execute function community_outing_photos_stamp();

drop trigger if exists audit_community_places on community_places;
create trigger audit_community_places
  after insert or update or delete on community_places
  for each row execute function record_audit();

drop trigger if exists audit_community_dog_outings on community_dog_outings;
create trigger audit_community_dog_outings
  after insert or update or delete on community_dog_outings
  for each row execute function record_audit();

drop trigger if exists audit_community_outing_photos on community_outing_photos;
create trigger audit_community_outing_photos
  after insert or update or delete on community_outing_photos
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- 6. RLS: the cell, never a role name
-- ---------------------------------------------------------------------------
alter table community_places enable row level security;
alter table community_dog_outings enable row level security;
alter table community_outing_photos enable row level security;

drop policy if exists community_places_select_perm on community_places;
create policy community_places_select_perm on community_places for select to authenticated
  using ((select has_permission('community.outings', 'read')));

drop policy if exists community_places_insert_perm on community_places;
create policy community_places_insert_perm on community_places for insert to authenticated
  with check ((select has_permission('community.outings')));

drop policy if exists community_places_update_perm on community_places;
create policy community_places_update_perm on community_places for update to authenticated
  using ((select has_permission('community.outings')))
  with check ((select has_permission('community.outings')));

drop policy if exists community_dog_outings_select_perm on community_dog_outings;
create policy community_dog_outings_select_perm on community_dog_outings for select to authenticated
  using ((select has_permission('community.outings', 'read')));

drop policy if exists community_dog_outings_insert_perm on community_dog_outings;
create policy community_dog_outings_insert_perm on community_dog_outings for insert to authenticated
  with check ((select has_permission('community.outings')));

drop policy if exists community_dog_outings_update_perm on community_dog_outings;
create policy community_dog_outings_update_perm on community_dog_outings for update to authenticated
  using ((select has_permission('community.outings')))
  with check ((select has_permission('community.outings')));

drop policy if exists community_dog_outings_delete_perm on community_dog_outings;
create policy community_dog_outings_delete_perm on community_dog_outings for delete to authenticated
  using ((select has_permission('community.outings')));

drop policy if exists community_outing_photos_select_perm on community_outing_photos;
create policy community_outing_photos_select_perm on community_outing_photos for select to authenticated
  using ((select has_permission('community.outings', 'read')));

drop policy if exists community_outing_photos_insert_perm on community_outing_photos;
create policy community_outing_photos_insert_perm on community_outing_photos for insert to authenticated
  with check ((select has_permission('community.outings')));

drop policy if exists community_outing_photos_update_perm on community_outing_photos;
create policy community_outing_photos_update_perm on community_outing_photos for update to authenticated
  using ((select has_permission('community.outings')))
  with check ((select has_permission('community.outings')));

drop policy if exists community_outing_photos_delete_perm on community_outing_photos;
create policy community_outing_photos_delete_perm on community_outing_photos for delete to authenticated
  using ((select has_permission('community.outings')));

revoke all on community_places, community_dog_outings, community_outing_photos from anon, authenticated, service_role;
grant select, insert, update on community_places to authenticated, service_role;
grant select, insert, update, delete on community_dog_outings to authenticated, service_role;
grant select, insert, update, delete on community_outing_photos to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. The public figure: an empty baseline row, and two more `when`s
-- ---------------------------------------------------------------------------
insert into impact_baselines (key, label, label_th)
values ('community_dogs', 'Dogs helped at our outreach visits', 'สุนัขที่ได้รับความช่วยเหลือจากการออกพื้นที่ของเรา')
on conflict (key) do nothing;

-- Same columns as 0156, so `or replace` keeps every reader. Still owner-run: anon reads the totals, never the
-- outings.
create or replace view public_impact_figures as
select b.key,
       b.label,
       b.label_th,
       b.baseline_count,
       b.baseline_date,
       l.live_count,
       b.baseline_count + l.live_count as total
  from impact_baselines b
 cross join lateral (
   select case b.key
     when 'animals_rehomed' then (
       select count(*)::integer
         from placement_history p
        where p.placement_type = 'Adopt'
          and shelter_date(p.start_date) > b.baseline_date
     )
     when 'community_dogs' then (
       select coalesce(sum(o.dog_count), 0)::integer
         from community_dog_outings o
        where o.outing_on > b.baseline_date
     )
     when 'villages_sterilised' then (
       select coalesce(sum(o.sterilised_count), 0)::integer
         from community_dog_outings o
        where o.sterilised
          and o.outing_on > b.baseline_date
     )
     else 0
   end as live_count
 ) l
 where b.baseline_count is not null
   and b.baseline_date is not null;

comment on view public_impact_figures is
  'Public impact figures (0156, 0169): baseline + live count since the baseline date, computed on read. Only figures with a baseline entered. animals_rehomed counts Adopt placements, community_dogs sums outing dog counts, villages_sterilised sums outing sterilised counts, all after baseline_date; every other key is baseline-only.';

grant select on public_impact_figures to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_impact_figures
  from anon, authenticated;

notify pgrst, 'reload schema';
