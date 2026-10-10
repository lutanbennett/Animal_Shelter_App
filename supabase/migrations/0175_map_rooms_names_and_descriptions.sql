-- consumer: src/app/admin/facility-map/, src/app/enclosures/map/FacilityMap.tsx
--
-- Map rooms get a stored name and a description, and the fixed list of three goes (backlog: "Map rooms: add more
-- rooms, and give each a description of what it is for, shown when it is tapped on the map", Lutan 2026-10-09).
-- Schema half only: the Add room / Rename / Delete editor and the room card that read this are the next stream.
-- This supersedes 0157's "kind is a fixed list on purpose (no room editor was asked for)": a room editor now has
-- been asked for (docs/decisions/2026-10-10-map-rooms-names-and-descriptions.md).
--
-- The two new kinds of text take OPPOSITE routes, on purpose (the 2026-09-21 split, decisions.md):
--
--   name / name_th   a LABEL ("Medical room"), so a paired `_th` column, as zones and enclosures have, registered in
--                    translatable_labels (0166) so the Translations page lists it with the other place names.
--   description      PROSE ("Simple procedures; medication is stored here."), so ONE column whose Thai lives in the
--                    translations table, registered in translatable_fields with the queue triggers (0056).
--
-- Do not "tidy" one onto the other's route. A label is short, typed once and read in lists, so its Thai sits beside
-- it; prose is the machine-translated-then-reviewed queue's job.
--
-- kind stays, nullable, with its old one-per-kind unique rule, and only the value check goes:
--   * The live Settings → Facility map saves a room with `upsert ... on conflict (kind)`, which needs a unique
--     constraint on kind. Dropping it now would break that page until the editor lands. A unique constraint lets
--     any number of NULLs through, so a new room (kind null) is never limited by it; only the three legacy rows
--     are, and they are one each anyway. The editor stream drops map_rooms_one_per_kind once nothing upserts on it.
--   * The column itself is kept: a dropped column cannot be un-dropped in a hotfix, and the editor stream decides
--     whether anything still wants it.
--   * A room written by today's app (kind set, no name) is named from kind by a trigger, so nothing is ever
--     nameless while the old and new code overlap. The editor stream drops the trigger with the unique rule.
--
-- Additive and re-runnable throughout. Policies are unchanged (reads 0170, writes 0158).

-- ===================================================================================================================
-- 1. The columns
-- ===================================================================================================================
alter table map_rooms add column if not exists name text;
alter table map_rooms add column if not exists name_th text;
alter table map_rooms add column if not exists description text;

comment on column map_rooms.name is
  'The room''s name in English (0175), shown on its card when tapped. A label: its Thai is name_th, not a translations row.';
comment on column map_rooms.name_th is
  'The room''s name in Thai (0175). Null: not translated yet; the English shows.';
comment on column map_rooms.description is
  'What the room is for, shown under its name when tapped (0175). Staff-typed prose: its Thai is in translations (translatable_fields), not a paired column. Null: the card shows the generic line.';
comment on column map_rooms.kind is
  'Legacy (0157): medical / kitchen / storage for the three original rooms, null for any room added since 0175. Kept until the room editor no longer upserts on it.';

-- ===================================================================================================================
-- 2. The fixed list goes
-- ===================================================================================================================
alter table map_rooms drop constraint if exists map_rooms_kind_check;
alter table map_rooms alter column kind drop not null;

-- ===================================================================================================================
-- 3. Names for the rooms already drawn, and for any the current app still writes by kind
-- ===================================================================================================================
-- The words are today's dictionaries' (src/lib/i18n/dictionaries/{en,th}.ts, enclosures.map.roomKinds).
create or replace function map_room_kind_name(p_kind text, p_th boolean)
returns text
language sql
immutable
as $$
  select case p_kind
    when 'medical' then case when p_th then 'ห้องพยาบาล' else 'Medical room' end
    when 'kitchen' then case when p_th then 'ครัว' else 'Kitchen' end
    when 'storage' then case when p_th then 'ห้องเก็บของ' else 'Storage' end
  end
$$;

comment on function map_room_kind_name(text, boolean) is
  'The dictionary name of one of the three legacy room kinds (0175). Only for the back-fill and map_rooms_name_from_kind; drop with them.';

-- The trigger below runs as whoever edits the room, so a signed-in login needs to call this; anon never does.
revoke all on function map_room_kind_name(text, boolean) from public, anon;
grant execute on function map_room_kind_name(text, boolean) to authenticated, service_role;

update map_rooms
   set name = map_room_kind_name(kind, false)
 where name is null and kind is not null;
update map_rooms
   set name_th = map_room_kind_name(kind, true)
 where name_th is null and kind is not null;

create or replace function map_rooms_name_from_kind()
returns trigger
language plpgsql
as $$
begin
  if nullif(btrim(new.name), '') is null then
    new.name := map_room_kind_name(new.kind, false);
  end if;
  if nullif(btrim(new.name_th), '') is null and new.kind is not null then
    new.name_th := map_room_kind_name(new.kind, true);
  end if;
  return new;
end;
$$;

revoke all on function map_rooms_name_from_kind() from public, anon, authenticated;

drop trigger if exists map_rooms_name_from_kind on map_rooms;
create trigger map_rooms_name_from_kind
  before insert or update on map_rooms
  for each row execute function map_rooms_name_from_kind();

-- Every room has a name from now on. NOT NULL is checked after BEFORE triggers, so today's kind-only upsert still
-- passes; a room with neither a name nor a legacy kind is refused.
alter table map_rooms alter column name set not null;

-- ===================================================================================================================
-- 4. The name is a label: the Translations page lists it with the other places
-- ===================================================================================================================
insert into translatable_labels (table_name, column_name, th_column, label_group, optional) values
  ('map_rooms', 'name', 'name_th', 'places', false)
on conflict (table_name, column_name) do update
  set th_column = excluded.th_column, label_group = excluded.label_group, optional = excluded.optional;

drop trigger if exists map_rooms_label_sources on map_rooms;
create trigger map_rooms_label_sources
  after insert or update or delete on map_rooms
  for each row execute function record_label_sources();

-- The back-filled Thai counts as written against today's English, as 0166 did for every existing label.
insert into label_sources (table_name, row_id, column_name, source_text)
select 'map_rooms', r.id::text, 'name', r.name
  from map_rooms r
 where nullif(btrim(r.name_th), '') is not null
on conflict (table_name, row_id, column_name) do nothing;

-- ===================================================================================================================
-- 5. The description is prose: the translation queue
-- ===================================================================================================================
insert into translatable_fields (table_name, column_name, tier) values
  ('map_rooms', 'description', 'reviewed')
on conflict do nothing;

drop trigger if exists map_rooms_queue_translations on map_rooms;
create trigger map_rooms_queue_translations
  after insert or update on map_rooms
  for each row execute function queue_translations();
drop trigger if exists map_rooms_drop_translations on map_rooms;
create trigger map_rooms_drop_translations
  after delete on map_rooms
  for each row execute function drop_translations();

-- No back-fill: no room has a description yet.

-- The queue names and links a room. Same columns in the same order as 0166; only the two CASEs gain a branch.
create or replace view private.translation_queue as
select t.id,
       t.table_name,
       t.row_id,
       t.column_name,
       f.tier,
       t.source_lang,
       t.target_lang,
       t.source_text,
       t.reviewed_source_text,
       t.text,
       t.status,
       t.engine,
       t.reviewed_by,
       t.reviewed_at,
       t.created_at,
       t.updated_at,
       case t.table_name
         when 'residents' then (
           select r.name || coalesce(' (' || r.resident_code || ')', '')
             from residents r where r.id = t.row_id)
         when 'project_folders' then (
           select p.name from project_folders p where p.id = t.row_id)
         when 'attachments' then (
           select p.name || ' — ' || coalesce(a.file_name, a.drive_file_id)
             from attachments a join project_folders p on p.id = a.owner_id
            where a.id = t.row_id)
         when 'maintenance' then (
           select coalesce(m.job_code || ' · ', '') || m.title
             from maintenance m where m.id = t.row_id)
         when 'site_pages' then (
           select 'Website · ' || p.title from site_pages p where p.id = t.row_id)
         when 'shelter_friends' then (
           select 'Shelter Friend · ' || c.name
             from shelter_friends sf join contacts c on c.id = sf.contact_id
            where sf.id = t.row_id)
         when 'recurring_jobs' then (
           select 'Recurring job · ' || j.title from recurring_jobs j where j.id = t.row_id)
         when 'map_rooms' then (
           select 'Map room · ' || mr.name from map_rooms mr where mr.id = t.row_id)
         else null
       end as record_label,
       case t.table_name
         when 'residents' then '/residents/' || t.row_id
         when 'project_folders' then '/projects/' || t.row_id
         when 'attachments' then (
           select '/projects/' || a.owner_id from attachments a where a.id = t.row_id)
         when 'maintenance' then '/maintenance/' || t.row_id
         when 'site_pages' then (
           select '/admin/website#page-' || p.slug from site_pages p where p.id = t.row_id)
         when 'shelter_friends' then (
           select '/contacts/' || sf.contact_id from shelter_friends sf where sf.id = t.row_id)
         when 'recurring_jobs' then '/management/recurring-jobs'
         when 'map_rooms' then '/admin/facility-map'
         else null
       end as record_path
  from translations t
  join translatable_fields f on f.table_name = t.table_name and f.column_name = t.column_name;
