-- consumer: src/lib/site/product-content.ts
--
-- #pcmsx SCHEMA HALF. The cooperjaidee.org product pages are prose in the dictionaries, so nobody can change a word without a pull request.
-- This is the storage, the public read and the one write. Shape and the rejected alternatives: docs/decisions/2026-11-25-product-page-content-storage.md.
--   1. platform_content       one row per (page, key): the English text, the Thai text and an optional Drive file id. NOT shelter-scoped, because the
--                             product site has no shelter; it is its own table so the shelter policies (0392) are never bent to admit a null shelter.
--                             page and key are free text (checked for shape only), so a NEW page or a new line on a page is rows, never a migration.
--   2. public_platform_content  what the public site reads. Every row of it is public by intent, so it is one owner-run view of the whole table.
--   3. product_admin_set_platform_content(jsonb) / product_admin_delete_platform_content(text, text)
--                             the only writes: a product administrator + aal2, as 0436. No table policy exists and no role is named.
--   4. is_public_drive_file / is_known_drive_file learn the column, so /api/photos/<id> serves a product photo to the public and the
--                             Worker's cleanup does not treat it as an orphan.
-- The Thai is stored beside the English, so it is approved by construction: there is no translation queue for it to wait in.
-- Additive and re-runnable. To undo, in a new file: restore 0429's two function bodies, drop function the two writes, drop view public_platform_content, drop table platform_content.

create table if not exists public.platform_content (
  page          text not null check (page ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  key           text not null check (key ~ '^[A-Za-z0-9._-]{1,200}$'),
  en            text not null default '',
  th            text not null default '',
  drive_file_id text,
  updated_at    timestamptz not null default now(),
  updated_by    uuid,
  primary key (page, key)
);

alter table public.platform_content enable row level security;
revoke all on public.platform_content from anon, authenticated;
grant select, insert, update, delete on public.platform_content to service_role;

create or replace view public.public_platform_content as
select page, key, en, th, drive_file_id, updated_at
from public.platform_content;

-- Owned by rls_definer like every public view since 0375 (scripts/check-view-owners.mjs): the view runs as that role, which obeys row-level
-- security, so the table's one policy below is the only way a row leaves it, and it names that role alone. anon and authenticated hold no
-- grant and no policy on the table itself.
alter view public.public_platform_content owner to rls_definer;
grant select on public.platform_content to rls_definer;
drop policy if exists platform_content_public_view on public.platform_content;
create policy platform_content_public_view on public.platform_content for select to rls_definer using (true);

grant select on public.public_platform_content to anon, authenticated, service_role;

-- p_rows: [{"page":"home","key":"heading","en":"…","th":"…","drive_file_id":"…"}]. A row's drive_file_id is changed only when the element
-- has that property (blank clears it); an element without it keeps the stored one. Atomic: one bad element writes nothing.
create or replace function public.product_admin_set_platform_content(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare r jsonb; n integer := 0;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then raise exception 'rows must be an array' using errcode = '22023'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.platform_content (page, key, en, th, drive_file_id, updated_at, updated_by)
    values (r ->> 'page', r ->> 'key', coalesce(r ->> 'en', ''), coalesce(r ->> 'th', ''),
            nullif(btrim(r ->> 'drive_file_id'), ''), now(), (select auth.uid()))
    on conflict (page, key) do update set
      en = excluded.en,
      th = excluded.th,
      drive_file_id = case when r ? 'drive_file_id' then excluded.drive_file_id else public.platform_content.drive_file_id end,
      updated_at = now(),
      updated_by = (select auth.uid());
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function public.product_admin_set_platform_content(jsonb) from public, anon;
grant execute on function public.product_admin_set_platform_content(jsonb) to authenticated, service_role;

create or replace function public.product_admin_delete_platform_content(p_page text, p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  delete from public.platform_content where page = p_page and key = p_key;
end;
$$;

revoke all on function public.product_admin_delete_platform_content(text, text) from public, anon;
grant execute on function public.product_admin_delete_platform_content(text, text) to authenticated, service_role;

-- 0429's body plus the product-page photos.
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
    union all
    select 1 from public_platform_content where drive_file_id = p_drive_file_id
  );
$$;
revoke execute on function is_public_drive_file(text) from public;
grant execute on function is_public_drive_file(text) to anon, authenticated, service_role;

-- 0429's body plus the product-page photos.
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
    union all
    select 1 from platform_content where drive_file_id = p_drive_file_id
  );
$$;
revoke execute on function is_known_drive_file(text) from public, anon, authenticated;
grant execute on function is_known_drive_file(text) to service_role;

notify pgrst, 'reload schema';
