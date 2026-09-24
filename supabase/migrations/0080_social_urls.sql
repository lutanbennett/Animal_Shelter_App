-- The shelter's own Facebook and Instagram pages on the public site
-- (customer request 2026-09-22: most supporters are on Facebook, and
-- nothing on the website points there).
--
-- This file is the schema half only. The app does not read these columns
-- yet; claude/facebook-link follows once this is on main, adding the
-- fields to /admin/website and a row of social icons to the public footer.
--
-- site_content is a singleton (0018: `id boolean primary key`, checked
-- true), so the columns simply appear on its one row as NULL — "not set",
-- and the footer shows no icon for it. Nothing is back-filled.
--
-- The checks are the same ones 0076 puts on shelter_friends.facebook_url,
-- and for the same reason: they are the last line against a `javascript:`
-- link reaching a public href, however it was written. They are
-- deliberately looser than the form — src/lib/links/validate.ts insists on
-- https and the right host — so the two can never disagree; the host rule
-- lives in one place, the validator.
--
-- Additive and nullable; no RLS or grant change — site_content's
-- public-read / admin-update policies (0018) and its table-level grants
-- (0077) cover new columns. Re-runnable: every statement is guarded.

alter table site_content add column if not exists facebook_url text
  check (facebook_url ~* '^https?://');
alter table site_content add column if not exists instagram_url text
  check (instagram_url ~* '^https?://');

comment on column site_content.facebook_url is
  'The shelter''s Facebook page, linked from the public footer and header. Null = not shown.';
comment on column site_content.instagram_url is
  'The shelter''s Instagram profile, linked from the public footer. Null = not shown.';

notify pgrst, 'reload schema';
