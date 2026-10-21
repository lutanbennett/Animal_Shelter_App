-- consumer: src/app/api/photos/[fileId]/route.ts
-- 0245: is_public_drive_file also answers for a published adoption story's photo.
-- 0210's body with a twelfth branch over public_adoption_updates (0214, approval added in 0217). Still invoker:
-- it reads only the public views. A story's animal is Adopted, so public_resident_photos can never say yes
-- to it; the photo proxy asked the view itself as a second route, which this replaces.
create or replace function is_public_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public_site_content where hero_drive_file_id = p_drive_file_id
      or donate_photo_drive_file_id = p_drive_file_id
      or foster_photo_drive_file_id = p_drive_file_id
      or volunteer_photo_drive_file_id = p_drive_file_id
      or about_photo_drive_file_id = p_drive_file_id
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
    union all
    select 1 from public_donation_channels where qr_drive_file_id = p_drive_file_id
    union all
    select 1 from public_appeal_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_adoption_updates where drive_file_id = p_drive_file_id
  );
$$;

comment on function is_public_drive_file(text) is
  'True when a public_* view or site_content(_photos) shows this Drive file id, i.e. the photo proxy may serve it to a signed-out visitor. Security invoker: reads only what anon can already read (0084, 0245).';

revoke execute on function is_public_drive_file(text) from public;
grant execute on function is_public_drive_file(text)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
