-- consumer: src/app/adopt/PublicHeader.tsx, src/app/admin/website/actions.ts, src/lib/site/content.ts
--
-- #shlog schema half: each shelter's OWN logo for its own public website. PublicHeader serves one hard-coded file to every tenant.
-- Shape (docs/decisions/2026-11-20-shelter-logo-schema.md): the logo is a Drive file id on site_content, the same shape as the
-- hero photo (hero_drive_file_id, 0018). site_content is one row per shelter (0395) and already carries every per-shelter public
-- setting, the shelter-scoped policies (0392), the public view (public_site_content) and the public-file test (is_public_drive_file).
--   1. site_content.logo_drive_file_id   text, nullable. null = this shelter has uploaded no logo.
--   2. set_shelter_logo(text)            the one write for a login holding website.gallery (the hero's card), as set_hero_photo (0274).
--                                        null or blank clears it. No approval queue: a logo is not a gallery photo, exactly as the hero.
--   3. public_site_content               gains the column, APPENDED (never reordered), so anon reads its own shelter's logo id.
--   4. is_public_drive_file / is_known_drive_file   learn the column, so /api/photos/<id> serves the logo to the public and the
--                                        Worker's cleanup does not treat it as an orphan.
-- No card is added and no role named: website.gallery already exists and already governs the hero. Admin is untouched.
-- FALLBACK (enforced by the app half, stated in the decision file): a null logo never shows another shelter's logo.
-- Additive and re-runnable. To undo, in a new file: restore 0256's view and 0369's / 0218's function bodies, drop function
-- set_shelter_logo(text), alter table site_content drop column logo_drive_file_id.

alter table site_content add column if not exists logo_drive_file_id text;

create or replace function public.set_shelter_logo(p_drive_file_id text)
returns void
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not coalesce((select has_permission('website.gallery')), false) then
    raise exception 'photo.website_not_allowed' using errcode = '42501';
  end if;
  update site_content set logo_drive_file_id = nullif(btrim(p_drive_file_id), '') where id = true;
end;
$$;

revoke all on function public.set_shelter_logo(text) from public, anon;
grant execute on function public.set_shelter_logo(text) to authenticated, service_role;

-- 0256's view with one column appended.
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
from site_content;

grant select on public_site_content to anon, authenticated, service_role;

-- 0369's body plus the logo in the first branch.
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
      or logo_drive_file_id = p_drive_file_id
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
    union all
    select 1 from public_shop_links where photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_fundraising_event_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_merch_products where photo_drive_file_id = p_drive_file_id
  );
$$;
revoke execute on function is_public_drive_file(text) from public;
grant execute on function is_public_drive_file(text) to anon, authenticated, service_role;

-- 0218's body (the latest) plus the logo.
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
    select 1 from site_content where hero_drive_file_id = p_drive_file_id or logo_drive_file_id = p_drive_file_id
    union all
    select 1 from site_content_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from pending_photos where drive_file_id = p_drive_file_id
  );
$$;
revoke execute on function is_known_drive_file(text) from public, anon, authenticated;
grant execute on function is_known_drive_file(text) to service_role;

notify pgrst, 'reload schema';
