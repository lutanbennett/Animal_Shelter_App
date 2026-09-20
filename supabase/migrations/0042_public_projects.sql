-- "Our work" — project stories on the public site (backlog, Public website).
--
-- Two read-only views for anonymous visitors, following the resident pair
-- (0016/0017, tightened in 0025): a folder that staff have ticked "Show on
-- website" on /projects/[id] appears on /our-work with its story and its
-- captioned photos. Like public_resident_profiles, these are ordinary
-- views owned by the migration role, so they bypass the staff-only RLS on
-- project_folders and attachments by design — the column lists are the
-- whole point: no uploaded_by / created_by, no Drive folder IDs, no
-- attachment ids beyond what the gallery needs.
--
--  - Category rows (parent_folder_id null, 0034) are never stories: they
--    have no date or summary and can't be published from the UI. Filtered
--    out here too so a stray flag on one can't surface an empty card.
--  - `title` is the folder's name — the Drive folder is named after it, so
--    it is already the English title staff chose. name_th → title_th.
--  - `cover_drive_file_id` is the chosen cover, else the first photo by
--    sort order, the same fallback project_folder_summary uses for its
--    thumbnail — a story with photos always gets a card image.
--  - `sort_date` gives one ordering key for "most recent" when
--    project_date is unset: fall back to the day the folder was created.

create or replace view public_projects as
select
  f.id,
  f.top_level_category as category,
  f.name as title,
  f.name_th as title_th,
  f.summary,
  f.summary_th,
  f.project_date,
  f.location,
  coalesce(f.project_date, f.created_at::date) as sort_date,
  coalesce(
    (select a.drive_file_id from attachments a where a.id = f.cover_attachment_id),
    (select a.drive_file_id from attachments a
       where a.owner_type = 'project' and a.owner_id = f.id
       order by a.sort_order nulls last, a.uploaded_at asc
       limit 1)
  ) as cover_drive_file_id,
  (select count(*) from attachments a
     where a.owner_type = 'project' and a.owner_id = f.id)::int as photo_count
from project_folders f
where f.is_public = true
  and f.parent_folder_id is not null;

create or replace view public_project_photos as
select
  a.id,
  a.owner_id as project_id,
  a.drive_file_id,
  a.caption,
  a.caption_th,
  a.sort_order,
  a.date_taken,
  a.uploaded_at
from attachments a
join project_folders f on f.id = a.owner_id
where a.owner_type = 'project'
  and f.is_public = true
  and f.parent_folder_id is not null;

grant select on public_projects, public_project_photos to anon, authenticated;

-- Same treatment 0025 gave the resident views: Supabase's default
-- privileges hand anon INSERT/UPDATE/DELETE on every new object, and
-- public_project_photos is simple enough to be auto-updatable. Read only.
revoke insert, update, delete, truncate, references, trigger
  on public_projects, public_project_photos
  from anon, authenticated;

notify pgrst, 'reload schema';
