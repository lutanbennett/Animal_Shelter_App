-- "Pet of the Week" on the public home page (backlog, Public website).
--
-- One optional resident the shelter wants to spotlight on `/`, chosen on
-- /admin/website. It lives on the site_content singleton (0018) next to the
-- rest of the page's editable content, so the existing public-read /
-- admin-update policies cover it without changes.
--
-- The public page never trusts the id alone: it looks the resident up in
-- public_resident_profiles, so a featured animal that is later hidden,
-- adopted or deceased simply drops off the home page (the view already
-- applies those rules, 0025) rather than needing this column cleared.
-- `on delete set null` handles the resident row itself going away.

alter table site_content
  add column if not exists featured_resident_id uuid
    references residents (id) on delete set null;

notify pgrst, 'reload schema';
