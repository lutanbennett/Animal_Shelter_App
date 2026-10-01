-- is_public_drive_file reads the public views, not site_content's tables
-- (follow-up to 0122, same PR).
--
-- 0084 made this function security INVOKER on the grounds that everything it
-- reads, anon can read already, and listed site_content and
-- site_content_photos among them behind their `using (true)` policies. 0122
-- takes those two base tables away from anon (they are now read through
-- public_site_content and public_site_content_photos), so the invoker
-- function would fail with "permission denied for table site_content" for a
-- signed-out visitor and the photo proxy would refuse every public photo.
-- The body is 0084's with those two branches pointed at the views; it is
-- still invoker, still asks only what anon can read. Grants carry over with
-- `create or replace`.

create or replace function is_public_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public_site_content where hero_drive_file_id = p_drive_file_id
    union all
    select 1 from public_site_content_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_projects where cover_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_profiles where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_recent_adoptions where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_cards where profile_photo_drive_file_id = p_drive_file_id
  );
$$;

notify pgrst, 'reload schema';
