-- consumer: src/lib/site/content.ts, src/app/admin/website/, src/app/adopt/SitePageView.tsx
--
-- Schema half of "a photo per public page (Donate, Foster, Volunteer)". Nothing reads these
-- columns yet; the app half (public-page-photos-app) does. This file is not usable on its own.
--
-- Same shape as the hero (hero_drive_file_id 0018, hero_alt_th 0059): a Drive file id plus
-- English and Thai alt text, all nullable. Additive only: no defaults, no row rewrite, no
-- policy change. public_site_content (0122) lists its columns, so anon does not see these
-- until the app half adds them to that view.

alter table site_content add column if not exists donate_photo_drive_file_id text;
alter table site_content add column if not exists donate_photo_alt text;
alter table site_content add column if not exists donate_photo_alt_th text;

alter table site_content add column if not exists foster_photo_drive_file_id text;
alter table site_content add column if not exists foster_photo_alt text;
alter table site_content add column if not exists foster_photo_alt_th text;

alter table site_content add column if not exists volunteer_photo_drive_file_id text;
alter table site_content add column if not exists volunteer_photo_alt text;
alter table site_content add column if not exists volunteer_photo_alt_th text;
