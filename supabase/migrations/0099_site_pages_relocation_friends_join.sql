-- Two new public-site pages (backlog, Public website: "A 'Pet relocation'
-- information page on the public site" and "A 'Become a Shelter Friend'
-- page for businesses that want to help", 2026-09-26; schema half — the
-- feature halves add the routes, the /admin/website editors and the links).
--
-- Both are built the way /foster, /volunteer and /donate are (0059): a
-- site_pages row rendered by SitePageView, title and body typed on
-- /admin/website, Thai through the translation queue. The slugs are fixed
-- by the app, so site_pages.slug's check constraint lists them, and adding
-- a page means widening it:
--   relocation            the pet relocation service page
--   shelter-friends-join  what a Shelter Friend is and how a business joins;
--                         served at /friends/join or as a section at the top
--                         of /friends — the feature half decides which
--
-- The rows are seeded with a title and an empty body, the shape an admin
-- then fills in. Until the app knows the slugs nothing shows them:
-- /admin/website lists only SITE_PAGE_SLUGS (src/lib/site/pages.ts) and no
-- route reads them. The insert trigger queues each title for translation as
-- it does for every page, so the Thai titles are ready when the pages ship.
--
-- Written to be safely re-runnable.

alter table site_pages drop constraint if exists site_pages_slug_check;
alter table site_pages add constraint site_pages_slug_check
  check (slug in (
    'our-story', 'how-to-adopt', 'foster', 'volunteer', 'donate',
    'relocation', 'shelter-friends-join'
  ));

insert into site_pages (slug, title, body) values
  ('relocation', 'Pet relocation', ''),
  ('shelter-friends-join', 'Become a Shelter Friend', '')
on conflict (slug) do nothing;
