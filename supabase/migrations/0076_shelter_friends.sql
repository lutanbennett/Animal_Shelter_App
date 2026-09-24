-- Shelter Friends: the businesses that help, thanked on the public site
-- (customer request 2026-09-24; backlog, Public website). See
-- docs/decisions.md, 2026-09-24.
--
-- Local companies donate goods (food, litter, medicine, building
-- materials) or give discounts (a vet clinic, a feed shop, a hardware
-- store). The shelter wants to name them publicly — as a thank-you, and so
-- supporters can give them custom.
--
-- A Friend is a contact with a public profile, not a second address book.
-- The business is already a row in `contacts` (usually a Vendor), with its
-- phone, email, LINE and address. The curated public face lives in its own
-- 1:1 table rather than more columns on `contacts`, so the boundary between
-- the private address book and what the website shows is a table, and
-- nothing private can reach the site by being added to `contacts` later.
--
-- This file is the schema half only. The app does not read any of it yet;
-- claude/shelter-friends follows once this is on main.
--
--   contact_id      unique, so a contact has at most one profile. Keyed on
--                   the contact, not its type: the type stays Vendor
--                   (decided 2026-09-24), and any contact type can become a
--                   Friend with no further schema work. Deleting the
--                   contact deletes its profile; archiving it (0075) only
--                   hides it — see the view.
--   blurb           what they do for the shelter. Public prose, so it goes
--                   through translatable_fields and the manager's queue like
--                   site_pages, not a paired _th column.
--   help_kind       free text ("Donates cat litter every month"), chosen
--                   over a fixed list on 2026-09-24. Translated like blurb.
--   discount_note   "10% off for adopters, show your adoption card".
--                   Translated like blurb.
--   website_url,    must be http(s) — they become links on a public page,
--   facebook_url    so a `javascript:` value is refused here, not only in
--                   the form.
--   logo_drive_file_id  Drive-hosted like the hero photo, and served
--                   through the photo proxy (is_known_drive_file, below).
--   show_phone … show_map  per-field opt-ins, all default false. A contact
--                   detail reaches the website only when someone ticked its
--                   box for this business; publishing a Friend publishes
--                   its name, blurb and links, never its contact details.
--
-- RLS: admin and management write (management owns /management/contacts);
-- staff, vet and volunteer read, as they read contacts. Anonymous visitors
-- read only public_shelter_friends. Re-runnable: every statement is guarded.

-- =========================================================================
-- 1. shelter_friends
-- =========================================================================

create table if not exists shelter_friends (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references contacts (id) on delete cascade,
  blurb text,
  help_kind text,
  discount_note text,
  website_url text check (website_url ~* '^https?://'),
  facebook_url text check (facebook_url ~* '^https?://'),
  logo_drive_file_id text,
  friend_since date,
  sort_order int not null default 0,
  published boolean not null default false,
  show_phone boolean not null default false,
  show_email boolean not null default false,
  show_line boolean not null default false,
  show_address boolean not null default false,
  show_map boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table shelter_friends is
  'Public profile of a contact that helps the shelter (a Shelter Friend). 1:1 with contacts; the website reads it only through public_shelter_friends.';
comment on column shelter_friends.published is
  'Shown on the public site only when true. Default false.';
comment on column shelter_friends.show_map is
  'Opt-in to a map of the contact''s address on the public site. Independent of show_address: a pin can be shown without printing the address text.';

alter table shelter_friends enable row level security;

drop policy if exists admin_all_shelter_friends on shelter_friends;
create policy admin_all_shelter_friends on shelter_friends
  for all using (current_user_role() = 'admin');
drop policy if exists management_rw_shelter_friends on shelter_friends;
create policy management_rw_shelter_friends on shelter_friends
  for all
  using (current_user_role() = 'management')
  with check (current_user_role() = 'management');
drop policy if exists staff_read_shelter_friends on shelter_friends;
create policy staff_read_shelter_friends on shelter_friends
  for select using (current_user_role() = 'staff');
drop policy if exists vet_read_shelter_friends on shelter_friends;
create policy vet_read_shelter_friends on shelter_friends
  for select using (current_user_role() = 'vet');
drop policy if exists volunteer_read_shelter_friends on shelter_friends;
create policy volunteer_read_shelter_friends on shelter_friends
  for select using (current_user_role() = 'volunteer');

-- RLS already gives anon nothing (no policy names it); take away the
-- default table grants too, so the view is the only way in.
revoke all on shelter_friends from anon;

-- =========================================================================
-- 2. Translations: blurb, help_kind, discount_note
-- =========================================================================

insert into translatable_fields (table_name, column_name, tier) values
  ('shelter_friends', 'blurb', 'reviewed'),
  ('shelter_friends', 'help_kind', 'reviewed'),
  ('shelter_friends', 'discount_note', 'reviewed')
on conflict do nothing;

drop trigger if exists shelter_friends_queue_translations on shelter_friends;
create trigger shelter_friends_queue_translations
  after insert or update on shelter_friends
  for each row execute function queue_translations();
drop trigger if exists shelter_friends_drop_translations on shelter_friends;
create trigger shelter_friends_drop_translations
  after delete on shelter_friends
  for each row execute function drop_translations();

-- 0059's queue, plus a label and link for a Friend. The link goes to the
-- contact's page, which exists today; the feature branch adds the
-- Friend card there.
create or replace view translation_queue as
select
  t.id,
  t.table_name,
  t.row_id,
  t.column_name,
  f.tier,
  t.source_lang,
  t.target_lang,
  t.source_text,
  t.reviewed_source_text,
  t.text,
  t.status,
  t.engine,
  t.reviewed_by,
  t.reviewed_at,
  t.created_at,
  t.updated_at,
  case t.table_name
    when 'residents' then
      (select r.name || coalesce(' (' || r.resident_code || ')', '') from residents r where r.id = t.row_id)
    when 'project_folders' then
      (select p.name from project_folders p where p.id = t.row_id)
    when 'attachments' then
      (select p.name || ' — ' || coalesce(a.file_name, a.drive_file_id)
         from attachments a join project_folders p on p.id = a.owner_id
        where a.id = t.row_id)
    when 'maintenance' then
      (select coalesce(m.job_code || ' · ', '') || m.title from maintenance m where m.id = t.row_id)
    when 'site_pages' then
      (select 'Website · ' || p.title from site_pages p where p.id = t.row_id)
    when 'shelter_friends' then
      (select 'Shelter Friend · ' || c.name
         from shelter_friends sf join contacts c on c.id = sf.contact_id
        where sf.id = t.row_id)
  end as record_label,
  case t.table_name
    when 'residents' then '/residents/' || t.row_id
    when 'project_folders' then '/projects/' || t.row_id
    when 'attachments' then
      (select '/projects/' || a.owner_id from attachments a where a.id = t.row_id)
    when 'maintenance' then '/maintenance/' || t.row_id
    when 'site_pages' then
      (select '/admin/website#page-' || p.slug from site_pages p where p.id = t.row_id)
    when 'shelter_friends' then
      (select '/contacts/' || sf.contact_id from shelter_friends sf where sf.id = t.row_id)
  end as record_path
from translations t
join translatable_fields f
  on f.table_name = t.table_name and f.column_name = t.column_name;

grant select on translation_queue to authenticated;
revoke all on translation_queue from anon;
revoke insert, update, delete, truncate, references, trigger
  on translation_queue from authenticated;

-- =========================================================================
-- 3. public_shelter_friends — what the website reads
--
-- Published profiles of live contacts only: a Friend whose contact is
-- archived (0075) drops out with no second switch to remember. Each
-- contact detail is null unless its show_* box is ticked, so the page
-- cannot print what nobody agreed to publish even by mistake.
-- map_location is the address again, gated by show_map instead: the app
-- turns it into a pin (src/lib/contacts/contacts.ts), and a Friend can
-- have a pin without the address printed, or the other way round.
-- Ordinary view (owner's rights, like the other public_* views), granted
-- SELECT only; checked by scripts/check-public-views.mjs.
-- =========================================================================

create or replace view public_shelter_friends as
select
  sf.id,
  c.name,
  sf.blurb,
  sf.help_kind,
  sf.discount_note,
  sf.website_url,
  sf.facebook_url,
  sf.logo_drive_file_id,
  sf.friend_since,
  sf.sort_order,
  case when sf.show_phone then c.phone end as phone,
  case when sf.show_email then c.email end as email,
  case when sf.show_line then c.line_id end as line_id,
  case when sf.show_address then c.address end as address,
  case when sf.show_map then c.address end as map_location,
  approved_translations('shelter_friends', sf.id) as translations
from shelter_friends sf
join contacts c on c.id = sf.contact_id
where sf.published
  and c.archived_at is null;

grant select on public_shelter_friends to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_shelter_friends from anon, authenticated;

-- =========================================================================
-- 4. The photo proxy serves Friend logos
--
-- 0019's list plus shelter_friends. Any profile's logo, published or not,
-- so the admin preview works before publishing — the same "known file"
-- test the proxy applies to everything else.
-- =========================================================================

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
    union all
    select 1 from shelter_friends where logo_drive_file_id = p_drive_file_id
  );
$$;

notify pgrst, 'reload schema';
