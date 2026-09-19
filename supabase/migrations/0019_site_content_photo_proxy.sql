-- is_known_drive_file() (0015_photo_proxy_lookup.sql) backs the
-- unauthenticated image proxy and only checked attachments/project_photos/
-- maintenance_photos — the site_content and site_content_photos tables
-- added in 0018_site_content.sql weren't in that list yet, so hero/gallery
-- photos on the public welcome page 404'd through the proxy. Add them.
create or replace function is_known_drive_file(p_drive_file_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from attachments where drive_file_id = p_drive_file_id
    union all
    select 1 from project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from maintenance_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from site_content where hero_drive_file_id = p_drive_file_id
    union all
    select 1 from site_content_photos where drive_file_id = p_drive_file_id
  );
$$;
