-- Anon keeps only what the public site reads (found 2026-09-24).
-- See docs/decisions.md, 2026-09-24, "Anon loses the internal views".
--
-- Why anon had anything to lose: until Supabase changes it on 2026-10-30,
-- every project's `alter default privileges` gives anon, authenticated and
-- service_role ALL on every table and view created in `public`. No
-- migration before 0077 granted anything, so every object here picked up
-- anon's full set: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES,
-- TRIGGER. 0077 wrote the grants the app needs down and deliberately did
-- not revoke; this file does the revoking.
--
-- What that exposed. For base tables, nothing readable: RLS is on
-- everywhere and no policy admits anon except the three public_read_*
-- ones. But four internal views run as their owner (no
-- security_invoker), so RLS on the tables under them never applies. With
-- only the public anon key, no sign-in, dev answered:
--
--   current_placement             81 rows: placements, notes, carer ids
--   resident_current_state        81 rows: names, status, deceased + date
--   immunization_compliance      220 rows: names, immunisation gaps
--   immunization_duplicate_check  200, empty today
--
-- The fix is by allow-list, not by naming the four: revoke everything
-- anon holds on every table, view and sequence in `public`, then grant
-- back SELECT on exactly what the public site reads with the anon key:
--
--   public_* views              /, /adopt, /our-work, /friends, /r/, /e/
--   site_content,
--   site_content_photos,
--   site_pages                  home page and footer; each has a
--                               public_read_* policy that says so
--
-- Everything else (base tables, internal views, schema_migrations) is
-- now refused outright ("permission denied", 401) instead of reaching
-- RLS. That includes TRUNCATE, which RLS does not govern. PostgREST has
-- no verb that issues TRUNCATE, so it was not reachable, but a grant nobody
-- can use is still a grant someone could reach one day.
--
-- The default privileges are closed for the postgres role too, so a view
-- a future migration creates does not start out anon-readable in the
-- weeks before Supabase's own change lands. A new public_* view grants
-- anon itself, as every migration since 0077 must
-- (scripts/check-migration-grants.mjs). Only postgres's defaults can be
-- changed from here; supabase_admin's belong to Supabase, and nothing in
-- our migrations runs as that role.
--
-- Deliberately not changed:
--   * security_invoker on the four views. It would make signed-in callers
--     see them through RLS, which changes what staff, vets and volunteers
--     see in the app. That is a behaviour change to be decided on its own;
--     this file closes the anonymous hole only.
--   * Function EXECUTE. The photo proxy (/api/photos) calls
--     is_known_drive_file as anon, and the RLS policies call
--     current_user_role. Functions are a separate review (backlog).
--
-- Re-runnable: revoke and grant are idempotent, and so is alter default
-- privileges.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select on
  public_enclosures,
  public_project_photos,
  public_projects,
  public_recent_adoptions,
  public_resident_cards,
  public_resident_photos,
  public_resident_profiles,
  public_shelter_friends,
  public_shelter_stats,
  public_site_pages,
  site_content,
  site_content_photos,
  site_pages
to anon;

alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
