-- Project work — a file-system-style tree of project folders (backlog:
-- "Project work (outreach projects) — file-system style").
--
-- `project_folders` (0001) already models a tree (parent_folder_id,
-- drive_folder_id, top_level_category) but carries no information: no
-- story, date, location or public flag, and nothing pins the category
-- level down. The user's shape for this feature is a folder browser:
--
--   /Projects/
--     <one of twelve fixed categories>/
--       <user-defined folders, to any depth>/
--
-- where every folder — at any depth — can hold photos and its own "info
-- card" (title in both languages, a short story, a date, a location, a
-- cover photo and whether it shows on the public site).
--
-- Design choices:
--
--  - The twelve categories are *rows*, not a virtual level. A category is a
--    project_folders row with parent_folder_id null whose name is the
--    category; every user folder hangs off one. That way one route
--    (/projects/[id]) and one breadcrumb mechanism serve every level, and
--    the category's Drive folder ID is cached on its row exactly like any
--    other folder's. Triggers stop the category rows being renamed, moved
--    or deleted, and stop anyone creating a new root.
--  - `name` stays the folder's (English) title — it already exists and the
--    Drive folder is named after it. `name_th` is added for the Thai title.
--  - Photos live on the polymorphic `attachments` table as owner_type
--    'project' (an owner type since 0001), the same decision 0033 made for
--    maintenance: attachments is what the photo proxy
--    (is_known_drive_file, 0015/0019), the uploaders and the Drive helpers
--    already know about. `project_photos` (0001) stays unused, like
--    `maintenance_photos`. Captions and an explicit order are added to
--    attachments as nullable columns that only project photos use — the
--    precedent is `phase` (0033), only meaningful for maintenance.
--  - Volunteers keep their existing rights: read folders, read/write
--    photos (volunteer_rw_attachments, 0001). Creating, renaming, moving,
--    publishing or deleting a folder needs the staff/admin `for all`
--    policies that already exist. No RLS change is needed.

-- =========================================================================
-- 1. Info-card columns on project_folders
-- =========================================================================

alter table project_folders add column if not exists name_th text;
alter table project_folders add column if not exists summary text;
alter table project_folders add column if not exists summary_th text;
alter table project_folders add column if not exists project_date date;
alter table project_folders add column if not exists location text;
alter table project_folders add column if not exists is_public boolean not null default false;
alter table project_folders add column if not exists cover_attachment_id uuid references attachments (id) on delete set null;
alter table project_folders add column if not exists updated_at timestamptz not null default now();
alter table project_folders add column if not exists created_by uuid references auth.users (id);

create index if not exists project_folders_parent_idx on project_folders (parent_folder_id);
create index if not exists project_folders_public_idx on project_folders (is_public) where is_public;

-- A folder's name doubles as its Drive folder name, and Drive lookups are
-- by exact name under a parent (findOrCreateFolder), so two siblings with
-- the same name would share one Drive folder. Case-insensitive, matching
-- how staff think about folder names. Roots are unique on their own.
create unique index if not exists project_folders_sibling_name_key
  on project_folders (parent_folder_id, lower(name))
  where parent_folder_id is not null;
create unique index if not exists project_folders_root_name_key
  on project_folders (lower(name))
  where parent_folder_id is null;

-- =========================================================================
-- 2. The fixed category level
-- =========================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'project_folders_category_check'
  ) then
    alter table project_folders add constraint project_folders_category_check
      check (top_level_category in (
        'Shelter Projects',
        'Community Projects',
        'Community Outreach',
        'Visitors and Volunteers',
        'Social Media',
        'Puppies',
        'Sterilisations',
        'Donations',
        'Fundraising Campaigns',
        'Events',
        'Rescues',
        'Miscellaneous'
      ));
  end if;
end;
$$;

-- A root row *is* a category, so its name and category agree.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'project_folders_root_is_category'
  ) then
    alter table project_folders add constraint project_folders_root_is_category
      check (parent_folder_id is not null or name = top_level_category);
  end if;
end;
$$;

insert into project_folders (top_level_category, name)
select c, c
from unnest(array[
  'Shelter Projects',
  'Community Projects',
  'Community Outreach',
  'Visitors and Volunteers',
  'Social Media',
  'Puppies',
  'Sterilisations',
  'Donations',
  'Fundraising Campaigns',
  'Events',
  'Rescues',
  'Miscellaneous'
]) as c
where not exists (
  select 1 from project_folders p where p.parent_folder_id is null and p.name = c
);

-- =========================================================================
-- 3. Tree bookkeeping
--
--  - top_level_category is inherited from the parent, so callers only ever
--    say which folder a new one goes in; the category can't disagree with
--    the ancestry.
--  - Category rows can't be renamed, re-parented or deleted, and no new
--    root can be created from the app — the twelve are fixed.
--  - A move can't create a cycle (a folder moved into its own subtree
--    would orphan the whole branch).
--  - updated_at, for "newest first" ordering of edited folders.
-- =========================================================================

create or replace function project_folders_before_write()
returns trigger
language plpgsql
as $$
declare
  parent_category text;
  cursor_id uuid;
begin
  if tg_op = 'INSERT' and new.parent_folder_id is null then
    -- Only the seed in this migration creates roots. It runs as the
    -- migration role before this trigger exists, so this never fires for it.
    raise exception 'New folders must be created inside a category.';
  end if;

  if tg_op = 'UPDATE' and old.parent_folder_id is null then
    if new.name is distinct from old.name
       or new.parent_folder_id is not null
       or new.top_level_category is distinct from old.top_level_category then
      raise exception 'Categories cannot be renamed or moved.';
    end if;
  end if;

  if new.parent_folder_id is not null then
    if new.parent_folder_id = new.id then
      raise exception 'A folder cannot be its own parent.';
    end if;

    select top_level_category into parent_category
    from project_folders where id = new.parent_folder_id;
    if parent_category is null then
      raise exception 'Parent folder does not exist.';
    end if;
    new.top_level_category := parent_category;

    -- Walk up from the new parent; meeting ourselves means a cycle.
    if tg_op = 'UPDATE' then
      cursor_id := new.parent_folder_id;
      while cursor_id is not null loop
        if cursor_id = new.id then
          raise exception 'A folder cannot be moved into its own subfolder.';
        end if;
        select parent_folder_id into cursor_id from project_folders where id = cursor_id;
      end loop;
    end if;
  end if;

  new.name := btrim(new.name);
  if new.name = '' then
    raise exception 'A folder needs a name.';
  end if;
  if position('/' in new.name) > 0 then
    raise exception 'A folder name cannot contain "/".';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists project_folders_before_write on project_folders;
create trigger project_folders_before_write
  before insert or update on project_folders
  for each row execute function project_folders_before_write();

create or replace function project_folders_before_delete()
returns trigger
language plpgsql
as $$
begin
  if old.parent_folder_id is null then
    raise exception 'Categories cannot be deleted.';
  end if;
  return old;
end;
$$;

drop trigger if exists project_folders_before_delete on project_folders;
create trigger project_folders_before_delete
  before delete on project_folders
  for each row execute function project_folders_before_delete();

-- When a folder's category changes (it was moved across categories), every
-- descendant follows. Runs after the row is written so the descendants see
-- the final value.
create or replace function project_folders_after_move()
returns trigger
language plpgsql
as $$
begin
  if new.top_level_category is distinct from old.top_level_category then
    update project_folders
    set top_level_category = new.top_level_category
    where parent_folder_id = new.id;
    -- The update above fires this trigger on each child in turn, so the
    -- whole subtree is covered without an explicit recursive walk.
  end if;
  return null;
end;
$$;

drop trigger if exists project_folders_after_move on project_folders;
create trigger project_folders_after_move
  after update of top_level_category on project_folders
  for each row execute function project_folders_after_move();

-- =========================================================================
-- 4. Captions and ordering on attachments
-- =========================================================================

alter table attachments add column if not exists caption text;
alter table attachments add column if not exists caption_th text;
alter table attachments add column if not exists sort_order integer;

-- =========================================================================
-- 5. Per-folder counts for the browser
--
-- The folder grid shows how many subfolders and photos each folder holds
-- and a thumbnail (the cover, else the newest photo). One view keeps that
-- to a single query per page. security_invoker so it respects the reader's
-- RLS (0005's reasoning).
-- =========================================================================

create or replace view project_folder_summary
with (security_invoker = on)
as
select
  f.id,
  f.parent_folder_id,
  f.top_level_category,
  f.name,
  f.name_th,
  f.summary,
  f.summary_th,
  f.project_date,
  f.location,
  f.is_public,
  f.cover_attachment_id,
  f.drive_folder_id,
  f.created_at,
  f.updated_at,
  (select count(*) from project_folders c where c.parent_folder_id = f.id)::int as child_count,
  (select count(*) from attachments a where a.owner_type = 'project' and a.owner_id = f.id)::int as photo_count,
  coalesce(
    (select a.drive_file_id from attachments a where a.id = f.cover_attachment_id),
    (select a.drive_file_id from attachments a
       where a.owner_type = 'project' and a.owner_id = f.id
       order by a.sort_order nulls last, a.uploaded_at desc
       limit 1)
  ) as thumbnail_drive_file_id
from project_folders f;
