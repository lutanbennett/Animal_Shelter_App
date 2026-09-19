-- Editable public website content for the "/" landing page
-- (src/app/page.tsx), managed from /admin/website. Unlike the resident data
-- exposed through public_resident_profiles, none of this is sensitive —
-- it's marketing copy the shelter wants visible to everyone — so it's a
-- plain public-read policy rather than the narrow-view trick used there.
--
-- Singleton row (site_content) for the hero photo + story/contact text,
-- plus an ordered set of gallery photos (site_content_photos). Both are
-- admin-write only.

create table site_content (
  id boolean primary key default true,
  constraint site_content_singleton check (id),
  hero_drive_file_id text,
  hero_alt text not null default '',
  tagline text not null default '',
  story_heading text not null default 'Our story',
  story_body text not null default '',
  contact_email text,
  contact_address text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

-- Seeded with the current launch copy so the page keeps reading the same
-- on day one — from here on it's edited via /admin/website, not this file.
insert into site_content (id, tagline, story_heading, story_body, contact_email, contact_address) values (
  true,
  'A non-profit rescue foundation in Mae Wang, Chiang Mai, giving street dogs and cats a second chance — every day.',
  'Our story',
  E'Lanna Care for Animals Foundation started as a grassroots response to the number of dogs and cats living rough on the streets of Chiang Mai — sick, injured, or simply with nowhere else to go. Today we care for more than 300 dogs and cats at our shelter in Mae Wang, alongside community dogs we support at local temples and villages nearby.\n\nEvery animal that comes through our gate gets the same start: a vet check, a safe place to recover, and a carer who knows their story. Our team works with local veterinary clinics for everything from routine check-ups to emergency care, and we track every animal''s health, placement, and history so nothing falls through the cracks. Some of our residents move on to loving foster or adoptive homes; many others call the shelter home for good, and are cared for here for the rest of their lives.\n\nNone of this is possible without our staff, our volunteers, and the people who foster, adopt, and donate. If you''d like to see who''s currently in our care, take a look below — and if you''d like to help, get in touch.',
  'lannacareforanimals@gmail.com',
  'Mae Wang, Chiang Mai, Thailand'
);

create table site_content_photos (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index site_content_photos_sort_idx on site_content_photos (sort_order);

alter table site_content enable row level security;
alter table site_content_photos enable row level security;

create policy public_read_site_content on site_content for select using (true);
create policy admin_update_site_content on site_content for update
  using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

create policy public_read_site_content_photos on site_content_photos for select using (true);
create policy admin_write_site_content_photos on site_content_photos for all
  using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
