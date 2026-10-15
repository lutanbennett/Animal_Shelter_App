-- consumer: src/lib/site/pages.ts, src/lib/site/content.ts, src/app/adopt/SitePageView.tsx, src/app/admin/website/
--
-- Schema half of "An About / Visit us page". Nothing reads this yet; the app half
-- (about-visit-us-page) does. Additive and re-runnable.
--
--   1. site_pages.slug may now be 'about' (the check constraint in 0104 listed seven).
--   2. The row itself is seeded EMPTY: the app half owns the words, and the Director owns the
--      facts. An empty body shows the page's "coming soon" / starter text, never an invented fact.
--   3. The photo columns for About, same shape as 0200 (Drive file id + English and Thai alt),
--      made public the way 0201 did: appended to public_site_content and learned by
--      is_public_drive_file so a signed-out visitor can load the photo.

alter table site_pages drop constraint if exists site_pages_slug_check;
alter table site_pages add constraint site_pages_slug_check
  check (slug in (
    'our-story', 'how-to-adopt', 'foster', 'volunteer', 'donate',
    'international-adoption', 'shelter-friends-join', 'about'
  ));

insert into site_pages (slug, title, body) values ('about', 'About & visiting us', '')
on conflict (slug) do nothing;

alter table site_content add column if not exists about_photo_drive_file_id text;
alter table site_content add column if not exists about_photo_alt text;
alter table site_content add column if not exists about_photo_alt_th text;

create or replace view public_site_content as
select
  id,
  hero_drive_file_id,
  hero_alt,
  hero_alt_th,
  tagline,
  tagline_th,
  contact_email,
  contact_address,
  contact_phone,
  contact_line,
  contact_map_url,
  facebook_url,
  instagram_url,
  messenger_url,
  whatsapp_number,
  x_url,
  visiting_hours,
  visiting_hours_th,
  featured_resident_id,
  preferred_channels,
  donate_photo_drive_file_id,
  donate_photo_alt,
  donate_photo_alt_th,
  foster_photo_drive_file_id,
  foster_photo_alt,
  foster_photo_alt_th,
  volunteer_photo_drive_file_id,
  volunteer_photo_alt,
  volunteer_photo_alt_th,
  about_photo_drive_file_id,
  about_photo_alt,
  about_photo_alt_th
from site_content;

grant select on public_site_content to anon, authenticated, service_role;

-- 0201's body with the About photo added. Still invoker: it reads only the public views.
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
  );
$$;

notify pgrst, 'reload schema';
