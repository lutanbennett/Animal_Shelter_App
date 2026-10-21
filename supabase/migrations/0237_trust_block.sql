-- consumer: src/lib/site/content.ts, src/app/admin/website/, src/app/adopt/PublicFooter.tsx, src/app/about/page.tsx, src/app/donate/page.tsx
--
-- Trust block and the Thai address. Additive, nullable, re-runnable.
--   registration_text / _th : "Registered foundation no. … since …", footer + About.
--   contact_address_th      : Thai address line, read through pairedText().
--   gift_split_*            : the Donate page's "Where your gift goes" block. Four shares
--                             (food, vet care, sterilisation, running the shelter) in
--                             gift_split_unit ('percent' or 'baht') for gift_split_year.
-- The public view is appended to, never reordered.

alter table site_content add column if not exists registration_text text;
alter table site_content add column if not exists registration_text_th text;
alter table site_content add column if not exists contact_address_th text;
alter table site_content add column if not exists gift_split_year smallint;
alter table site_content add column if not exists gift_split_unit text;
alter table site_content add column if not exists gift_split_food numeric(12, 2);
alter table site_content add column if not exists gift_split_vet numeric(12, 2);
alter table site_content add column if not exists gift_split_sterilisation numeric(12, 2);
alter table site_content add column if not exists gift_split_running numeric(12, 2);

alter table site_content drop constraint if exists site_content_gift_split_unit_check;
alter table site_content add constraint site_content_gift_split_unit_check
  check (gift_split_unit is null or gift_split_unit in ('percent', 'baht'));

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
  about_photo_alt_th,
  registration_text,
  registration_text_th,
  contact_address_th,
  gift_split_year,
  gift_split_unit,
  gift_split_food,
  gift_split_vet,
  gift_split_sterilisation,
  gift_split_running
from site_content;

grant select on public_site_content to anon, authenticated, service_role;
