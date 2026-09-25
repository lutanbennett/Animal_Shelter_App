-- is_public_drive_file: the photo proxy's question for a signed-out visitor
-- (backlog, "The photo proxy serves any known Drive file to a signed-out
-- visitor"; docs/decisions.md, 2026-09-25, "Public Drive files are the ones
-- the public views show").
--
-- /api/photos/<fileId> asks is_known_drive_file, which says yes for every
-- attachments row (blood-test and procedure files included), project and
-- maintenance photos, the site photos and Shelter Friend logos, and then
-- streams the file to anyone. This file adds only the companion question;
-- the route keeps calling is_known_drive_file until the feature half
-- (claude/photo-proxy-session-check) switches it, so nothing changes today.
--
-- "Public" is whatever the anon tier can already read a Drive id from, and
-- the function asks those objects rather than restating their filters (the
-- same reasoning as 0082's approved_translations: one definition of public,
-- in the views). Checked against every view and table anon may read
-- (check-public-views.mjs's list) on 2026-09-25:
--
--   public_resident_photos     drive_file_id            /adopt/<id> gallery
--   public_resident_profiles   profile_photo_drive_…    /adopt, home featured
--   public_recent_adoptions    profile_photo_drive_…    /adopt "recently home"
--   public_resident_cards      profile_photo_drive_…    /r/<code>, and /e/<id>
--                                                       through public_enclosures
--   public_projects            cover_drive_file_id      /our-work cards
--   public_project_photos      drive_file_id            /our-work/<id>
--   public_shelter_friends     logo_drive_file_id       /friends
--   site_content               hero_drive_file_id       home hero
--   site_content_photos        drive_file_id            home gallery
--
-- public_site_pages, public_enclosures (its residents are public_resident_
-- cards rows, covered above) and public_shelter_stats carry no Drive id.
-- The backlog item's "probably" list missed public_recent_adoptions and
-- public_resident_cards. The second is the wide one: 0068 publishes a card
-- for EVERY resident, so every resident's profile photo is public, including
-- residents not on the adoption listing and deceased ones. That is 0068's
-- decision, not this file's; the function only has to agree with what anon
-- can read already, or the /r/ pages lose their photos.
--
-- Not public, and the point of the exercise: blood_test, procedure and
-- maintenance attachments, a resident's non-profile photos while they are
-- hidden, adopted or deceased, photos of unpublished projects, maintenance_
-- photos, and the logo of an unpublished or archived Friend.
--
-- Security INVOKER, deliberately — not definer like is_known_drive_file.
-- Everything it reads anon can read already: the public_* views run as
-- their owner, and site_content / site_content_photos are behind
-- `using (true)` read policies. So the function can see nothing its caller
-- could not select for itself, there is no role to check because it
-- borrows no privilege, and it gives every caller the same answer: the
-- views ignore the caller, and the two tables' policies admit everyone.
-- A definer version would have to re-apply those filters by hand and
-- would answer from the owner's view of the tables, which is exactly the
-- mistake 0082 fixed.
--
-- The UNION ALL under exists() stops at the first branch that finds a
-- row, so the cheap single-table checks go first and the resident_cards
-- one (which joins resident_current_state) last.
--
-- Grants: new functions start closed (0082), so EXECUTE is granted
-- explicitly to anon (the proxy asks as a signed-out visitor),
-- authenticated (the proxy asks with the viewer's session) and
-- service_role. Re-runnable: `create or replace` and idempotent grants.

create or replace function is_public_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from site_content where hero_drive_file_id = p_drive_file_id
    union all
    select 1 from site_content_photos where drive_file_id = p_drive_file_id
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
  );
$$;

comment on function is_public_drive_file(text) is
  'True when a public_* view or site_content(_photos) shows this Drive file id, i.e. the photo proxy may serve it to a signed-out visitor. Security invoker: reads only what anon can already read (0084).';

revoke execute on function is_public_drive_file(text) from public;
grant execute on function is_public_drive_file(text)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
