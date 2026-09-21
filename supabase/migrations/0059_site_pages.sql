-- Public website pages and their Thai (backlog, Public website: "Thai
-- translation of home page content", "Visiting hours + adoption process",
-- "Foster, Volunteer and Donate public pages"). See docs/decisions.md.
--
-- Long-form copy for the public site — the home page story and the new
-- Foster / Volunteer / Donate / How-to-adopt pages — moves into one small
-- `site_pages` table keyed by slug. Two reasons it is not more columns on
-- `site_content`:
--   - translations (0056) key on a uuid row id, and site_content is a
--     boolean singleton. A page row has a real id, so a page's title and
--     body join `translatable_fields` and the manager's queue like a bio
--     or a project story, with nothing special-cased in the trigger.
--   - the pages are the same shape (a heading and some paragraphs), so
--     one editor on /admin/website serves all of them.
-- The slugs are fixed by the app (each has its own route or section);
-- admins edit the text, not the set of pages.
--
-- Short labels on site_content — the tagline, the hero photo's alt text
-- and the visiting hours — get the paired `_th` column treatment instead
-- (the `name_th` decision): a second value typed by the admin, picked by
-- locale with the English as fallback. The contact block gains a phone
-- number, a LINE id and a map link for the "Where to meet {name}" block
-- on /adopt/[id].

-- =========================================================================
-- 1. site_pages
-- =========================================================================

create table if not exists site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug in ('our-story', 'how-to-adopt', 'foster', 'volunteer', 'donate')),
  title text not null,
  -- Paragraphs separated by a blank line; a line starting "## " is a
  -- sub-heading and one starting "- " a bullet. Rendered by
  -- src/lib/site/body.ts — deliberately not full markdown.
  body text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

alter table site_pages enable row level security;

drop policy if exists public_read_site_pages on site_pages;
create policy public_read_site_pages on site_pages for select using (true);
drop policy if exists admin_update_site_pages on site_pages;
create policy admin_update_site_pages on site_pages for update
  using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- The story moves across from site_content as it is today, so the home
-- page reads the same the moment this applies. The other pages start with
-- placeholder copy shaped like RSPCA ACT's equivalents — what fostering
-- achieves, what we need from you, what we supply, how to get in touch —
-- for the shelter to rewrite on /admin/website. Guarded so re-running
-- after the story columns are gone is a no-op.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'site_content' and column_name = 'story_body'
  ) then
    insert into site_pages (slug, title, body)
    select 'our-story', coalesce(nullif(story_heading, ''), 'Our story'), story_body
      from site_content where id = true
    on conflict (slug) do nothing;
  end if;
end $$;

insert into site_pages (slug, title, body) values
  ('our-story', 'Our story', ''),
  ('how-to-adopt', 'How adoption works',
   E'Adopting from us is simple, and we''ll help you every step of the way.\n\n'
   '- Browse the residents on this page and read their profiles. Every animal marked "Available for adoption" is ready to go to a new home.\n'
   '- Get in touch by email or LINE to tell us who you''re interested in and a little about your home — other pets, children, how much time you have.\n'
   '- Come and meet them at the shelter during visiting hours. Bring the whole family, and any dog you already have, so everyone can meet.\n'
   '- If it''s a match, we complete a short adoption form and agreement. Every animal leaves us vaccinated, sterilised where old enough, and treated for parasites.\n'
   '- We stay in touch. If things don''t work out, the animal can always come back to us.\n\n'
   'Please note that we can''t hold an animal over the phone or by message — residents are adopted on a first-come basis by the family they meet, so someone you''ve seen online may already have found a home by the time you visit. We''ll always help you find another friend.'),
  ('foster', 'Foster with us',
   E'Fostering gives an animal a break from shelter life — a quiet home to recover from surgery, a place for puppies and kittens too young for the shelter, or somewhere to learn what living with a family is like before adoption. Every foster home frees a space for the next rescue.\n\n'
   '## What we need from you\n'
   '- A safe, secure home where the animal can''t wander onto the road.\n'
   '- Time — a few weeks to a few months, depending on the animal.\n'
   '- Patience with animals that may be shy, unwell or new to living indoors.\n'
   '- Updates now and then, and a visit back to the shelter or vet when needed.\n\n'
   '## What we supply\n'
   '- Food, bedding and any medication the animal needs.\n'
   '- All veterinary care, arranged and paid for by the shelter.\n'
   '- Advice and support whenever you need it — you''re never on your own.\n\n'
   'If you''d like to foster, email us or message us on LINE and tell us a little about your home and the kind of animal you could take.'),
  ('volunteer', 'Volunteer with us',
   E'Our volunteers walk dogs, socialise cats, help at sterilisation days, take photos for adoption profiles, fix fences and much more. Whether you have a morning a week or a month to spare, there''s a job for you.\n\n'
   '## Ways to help\n'
   '- Walking, playing and socialising — the residents love visitors.\n'
   '- Cleaning and feeding alongside our staff.\n'
   '- Photography and writing for adoption profiles and social media.\n'
   '- Building and repairs around the shelter.\n'
   '- Transport to and from the vet.\n\n'
   '## Good to know\n'
   '- Volunteers should be 18 or over, or accompanied by an adult.\n'
   '- Wear closed shoes and clothes you don''t mind getting dirty.\n'
   '- We''ll show you around and pair you with a member of staff on your first visit.\n\n'
   'To volunteer, email us or message us on LINE with the days you''re free and what you''d like to do.'),
  ('donate', 'Donate',
   E'Every animal in our care is fed, sheltered and treated thanks to donations. Your gift buys food, pays vet bills, funds sterilisation drives in the villages around us and keeps the shelter''s gates open.\n\n'
   '## What your donation funds\n'
   '- 500 baht feeds a dog for a month.\n'
   '- 1,500 baht sterilises and vaccinates one animal.\n'
   '- 5,000 baht covers an emergency vet visit and surgery.\n\n'
   '## How to give\n'
   '- Bank transfer: (bank name), account name Lanna Care for Animals Foundation, account number (number).\n'
   '- PromptPay: (PromptPay id).\n'
   '- From outside Thailand: (Wise / PayPal / other details).\n\n'
   'Please email us a note with your transfer so we can thank you and send a receipt.')
on conflict (slug) do nothing;

-- =========================================================================
-- 2. site_content: paired Thai labels, visiting hours, more contact ways
-- =========================================================================

alter table site_content add column if not exists tagline_th text;
alter table site_content add column if not exists hero_alt_th text;
-- Free text, one line per day or range ("Every day 9:00–16:00"); shown
-- in the "Where to meet" block and the footer.
alter table site_content add column if not exists visiting_hours text;
alter table site_content add column if not exists visiting_hours_th text;
alter table site_content add column if not exists contact_phone text;
-- A LINE id ("@lannacare") or an add-friend link; the app turns an id
-- into a line.me link.
alter table site_content add column if not exists contact_line text;
-- A Google Maps (or similar) link for the shelter's location.
alter table site_content add column if not exists contact_map_url text;

alter table site_content drop column if exists story_heading;
alter table site_content drop column if exists story_body;

-- =========================================================================
-- 3. Translations: title and body of every page
-- =========================================================================

insert into translatable_fields (table_name, column_name, tier) values
  ('site_pages', 'title', 'reviewed'),
  ('site_pages', 'body', 'reviewed')
on conflict do nothing;

drop trigger if exists site_pages_queue_translations on site_pages;
create trigger site_pages_queue_translations
  after insert or update on site_pages
  for each row execute function queue_translations();
drop trigger if exists site_pages_drop_translations on site_pages;
create trigger site_pages_drop_translations
  after delete on site_pages
  for each row execute function drop_translations();

-- The inserts above ran before the trigger existed, so queue them by hand.
insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text)
select 'site_pages', p.id, f.column_name,
       detect_language(v.txt), other_language(detect_language(v.txt)), btrim(v.txt)
  from site_pages p
  join translatable_fields f on f.table_name = 'site_pages'
  cross join lateral (select to_jsonb(p) ->> f.column_name as txt) v
 where nullif(btrim(v.txt), '') is not null
on conflict (table_name, row_id, column_name) do nothing;

-- What the public pages read: the page plus its approved translations,
-- the same shape as public_projects. The table's own public-read policy
-- would do for the text, but approved_translations() is only reachable
-- from a view.
create or replace view public_site_pages as
select
  p.id,
  p.slug,
  p.title,
  p.body,
  approved_translations('site_pages', p.id) as translations
from site_pages p;

grant select on public_site_pages to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_site_pages from anon, authenticated;

-- =========================================================================
-- 4. The queue labels a page and links to the Website admin page
-- =========================================================================

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
  end as record_label,
  case t.table_name
    when 'residents' then '/residents/' || t.row_id
    when 'project_folders' then '/projects/' || t.row_id
    when 'attachments' then
      (select '/projects/' || a.owner_id from attachments a where a.id = t.row_id)
    when 'maintenance' then '/maintenance/' || t.row_id
    when 'site_pages' then
      (select '/admin/website#page-' || p.slug from site_pages p where p.id = t.row_id)
  end as record_path
from translations t
join translatable_fields f
  on f.table_name = t.table_name and f.column_name = t.column_name;

grant select on translation_queue to authenticated;
revoke all on translation_queue from anon;
revoke insert, update, delete, truncate, references, trigger
  on translation_queue from authenticated;

notify pgrst, 'reload schema';
