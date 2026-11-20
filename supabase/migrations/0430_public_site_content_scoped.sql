-- consumer: src/lib/site/content.ts, src/app/adopt/PublicHeader.tsx
--
-- #shlog schema half, part 2: public_site_content ANSWERED EVERY SHELTER'S ROW TO EVERYONE. Measured on dev 2026-11-20 inside 0429's
-- harness: the view is owner-run (no security_invoker), so the restrictive shelter_scope_select policy of 0392 never applies to it, and
-- anon got all 6 rows both WITH an x-shelter-id header and WITHOUT one. readSiteContent() takes .limit(1), so a second shelter's public
-- site would show an arbitrary shelter's content, including its logo. A logo column is worthless on a view that leaks it.
-- Fix: the view asks the same question the policy asks (0392): the caller is trusted (service role, scripts, the Worker's own jobs), or
-- the row is the request's shelter. No header means no rows for anon, as for every other table. Columns, names and order unchanged.
-- Other public_* views were NOT measured here: see the decision file (for the planner to file).
-- Re-runnable. To undo: re-run 0429's definition of the view.

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
  gift_split_running,
  hidden_public_pages,
  logo_drive_file_id
from site_content
where (select is_trusted_caller()) or shelter_id = (select current_shelter_id());

grant select on public_site_content to anon, authenticated, service_role;

notify pgrst, 'reload schema';
