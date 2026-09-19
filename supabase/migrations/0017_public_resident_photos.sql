-- Backs the photo gallery on the public "/adopt/[id]" resident page
-- (src/app/adopt/[id]/PhotoGallery.tsx). public_resident_profiles
-- (0001_initial_schema.sql) only carries one photo per resident
-- (profile_photo_drive_file_id); this view exposes the rest of a public
-- resident's photos from `attachments` — file IDs only, same narrow shape
-- as public_resident_profiles, filtered the same way (is_public_visible,
-- not deceased). `attachments` itself stays admin/staff/volunteer-only via
-- its existing RLS policies; this view is owned by the migration-running
-- role the same way public_resident_profiles is, so it bypasses that RLS by
-- design rather than being subject to it — see the comment on
-- 0016_public_adopt_listing_access.sql for why that's safe here.
create view public_resident_photos as
select
  a.id,
  a.owner_id as resident_id,
  a.drive_file_id,
  a.uploaded_at
from attachments a
join residents r on r.id = a.owner_id
where a.owner_type = 'resident'
  and r.is_public_visible = true
  and not coalesce((select is_deceased from resident_current_state s where s.resident_id = r.id), false)
order by a.uploaded_at asc;

grant select on public_resident_photos to anon, authenticated;
