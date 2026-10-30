-- consumer: none
--
-- Schema half of "AFFILIATE LINKS GET THEIR OWN PUBLIC PAGE, AND STAFF CAN ADD A SHELTER FRIEND TO IT"
-- (docs/decisions/2026-10-30-affiliate-links-schema.md). Lutan, 2026-10-29: a separate public page ("Shop for the shelter")
-- AND the ability to add a Shelter Friend to it. Nothing in src/ reads any of this yet.
--
--   shop_links            one row per entry on the page. Two kinds, told apart by friend_id:
--                           friend_id null     a shop or product: title, photo, link, note, price hint.
--                           friend_id not null a Shelter Friend: ONLY its own referral link, note and price hint live here.
--                                              Its public name and logo are read from public_shelter_friends (0076/0164), so
--                                              a Friend's profile is never copied and cannot drift, and opting out of or
--                                              archiving the Friend removes it from this page with no second switch.
--   link_url              https:// only, shop_links_url_https, copied from donation_channels_url_https (0191).
--                         NOTE: the Friends' own links (0076) still allow http://; this is the stricter, newer shape.
--   shop.manage           NEW activity (level: read / edit), and the NEW card manage_shop_page that carries it. NOT friends.manage:
--                         that activity is held by Publish Shelter Friends and means "decide how a Friend is thanked"; a
--                         marketplace affiliate link is a different decision. Nobody holds the card until Admin gives it.
--   public_shop_links     what anon reads: shown entries only, named columns only.
--
-- Re-runnable. To undo: drop view public_shop_links, table shop_links, the card_grants / card_features rows for
-- manage_shop_page, the permission_activities row shop.manage, and restore is_public_drive_file() from 0191.

-- 1. The card's activity and the card ------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('shop.manage', 'level', 'settings', 73)
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

insert into card_grants (card, activity, level)
values ('manage_shop_page', 'shop.manage', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'manage_shop_page', f.id from features f where f.key = 'website_public_pages'
on conflict (card) do nothing;

-- 2. The table -------------------------------------------------------------------------------------------
create table if not exists shop_links (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid unique references shelter_friends (id) on delete cascade,
  title text,
  link_url text not null,
  note text,
  price_hint text,
  photo_drive_file_id text,
  sort_order int not null default 0,
  shown boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint shop_links_url_https check (link_url ~* '^https://[^\s]+$' and length(link_url) <= 2000),
  constraint shop_links_title_or_friend check (friend_id is not null or btrim(coalesce(title, '')) <> ''),
  constraint shop_links_friend_has_no_own_title check (friend_id is null or title is null)
);

create index if not exists shop_links_order_idx on shop_links (sort_order, created_at);

comment on table shop_links is
  'An entry on the public Shop for the shelter page (0285). A row with friend_id is a Shelter Friend: its name and logo come from public_shelter_friends, never from here. Written with shop.manage; anon reads public_shop_links only.';
comment on column shop_links.friend_id is
  'Set = this entry is a Shelter Friend (one entry per Friend). Its name and logo are NOT stored here.';
comment on column shop_links.link_url is
  'The affiliate or referral link. https:// only (shop_links_url_https).';
comment on column shop_links.shown is
  'false keeps the entry off the page: it is absent from public_shop_links, not filtered by the app. Default false.';

-- 3. Access: shop.manage, as donation_channels (0191) --------------------------------------------------
alter table shop_links enable row level security;

drop policy if exists shop_links_select_perm on shop_links;
create policy shop_links_select_perm on shop_links for select to authenticated
  using ((select has_permission('shop.manage', 'read')));
drop policy if exists shop_links_insert_perm on shop_links;
create policy shop_links_insert_perm on shop_links for insert to authenticated
  with check ((select has_permission('shop.manage')));
drop policy if exists shop_links_update_perm on shop_links;
create policy shop_links_update_perm on shop_links for update to authenticated
  using ((select has_permission('shop.manage')))
  with check ((select has_permission('shop.manage')));
drop policy if exists shop_links_delete_perm on shop_links;
create policy shop_links_delete_perm on shop_links for delete to authenticated
  using ((select has_permission('shop.manage')));

revoke all on shop_links from anon, authenticated, service_role;
grant select, insert, update, delete on shop_links to authenticated, service_role;

-- 4. Stamps from the session, never the request; audit --------------------------------------------------
create or replace function shop_links_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function shop_links_stamp() from public, anon, authenticated;

drop trigger if exists shop_links_stamp on shop_links;
create trigger shop_links_stamp
  before insert or update on shop_links
  for each row execute function shop_links_stamp();

drop trigger if exists audit_shop_links on shop_links;
create trigger audit_shop_links
  after insert or update or delete on shop_links
  for each row execute function record_audit();

-- 5. Thai through the translations queue ---------------------------------------------------------------
insert into translatable_fields (table_name, column_name, tier) values
  ('shop_links', 'title', 'reviewed'),
  ('shop_links', 'note', 'reviewed'),
  ('shop_links', 'price_hint', 'reviewed')
on conflict do nothing;

drop trigger if exists shop_links_queue_translations on shop_links;
create trigger shop_links_queue_translations
  after insert or update on shop_links
  for each row execute function queue_translations();
drop trigger if exists shop_links_drop_translations on shop_links;
create trigger shop_links_drop_translations
  after delete on shop_links
  for each row execute function drop_translations();

-- 6. What anon reads ---------------------------------------------------------------------------------------
-- EXPOSED: id, friend_id, name (the entry's title, or the Friend's public name), logo_drive_file_id (the Friend's, via
-- public_shelter_friends), photo_drive_file_id, link_url, note, price_hint, sort_order, translations.
-- NOT EXPOSED: created_by / updated_by / timestamps, shown (implied), and every Friend field beyond name and logo (blurb,
-- contact details, links). A Friend entry appears only while the Friend is itself published and its contact not archived.
create or replace view public_shop_links as
select s.id,
       s.friend_id,
       coalesce(pf.name, s.title) as name,
       pf.logo_drive_file_id,
       s.photo_drive_file_id,
       s.link_url,
       s.note,
       s.price_hint,
       s.sort_order,
       private.approved_translations('shop_links'::text, s.id) as translations
  from shop_links s
  left join public_shelter_friends pf on pf.id = s.friend_id
 where s.shown
   and (s.friend_id is null or pf.id is not null);

comment on view public_shop_links is
  'The Shop for the shelter entries the public page shows (0285). Owner-run: `where shown` and the Friend join are what keep a hidden or unpublished entry from anon.';

grant select on public_shop_links to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_shop_links from anon, authenticated;

-- 7. The photo proxy may serve a shown entry's photo (Friend logos are already served through public_shelter_friends) ---------
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
    union all
    select 1 from public_donation_channels where qr_drive_file_id = p_drive_file_id
    union all
    select 1 from public_shop_links where photo_drive_file_id = p_drive_file_id
  );
$$;

notify pgrst, 'reload schema';
