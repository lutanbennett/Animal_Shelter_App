-- Take is_known_drive_file() back from anon and authenticated (backlog,
-- "Take is_known_drive_file back from anon").
--
-- 0082 left anon EXECUTE on it because the photo proxy (/api/photos) called
-- it as a signed-out visitor. It is security definer and answers yes for
-- ANY Drive file id the app knows — internal attachments (blood tests,
-- procedures) included — so a signed-out caller with an id could confirm an
-- internal file exists.
--
-- Nothing needs it through the API any more. Since
-- claude/photo-proxy-session-check (#131, deployed in 0.5.0) the route asks
-- is_public_drive_file (0084) for a visitor, and for a signed-in viewer its
-- own RLS on the photo tables; route.ts mentions the function only in a
-- comment. Checked on dev on 2026-09-26: no function, RLS policy or view
-- calls it either. So authenticated goes too — no app code calls it, and a
-- public_viewer or archived login would get the same yes-for-anything
-- answer anon did.
--
-- Kept: service_role, and the owner. scripts/check-shelter-friends.mjs and
-- scripts/check-public-drive-file.mjs call it as the owner through the
-- Management API and are unaffected. The function itself is unchanged; it
-- is still the one place that knows every table holding a Drive file id.
--
-- Ordering: production had to be running the new route before this
-- applies there, or every public photo breaks. 0.5.0 carried it.
-- scripts/check-public-views.mjs drops it from its allow-list in the same
-- PR, so the check now requires anon to be refused.
--
-- Re-runnable: revoke and grant are idempotent.

revoke execute on function is_known_drive_file(text) from public, anon, authenticated;
grant execute on function is_known_drive_file(text) to service_role;

comment on function is_known_drive_file(text) is
  'True when any table the app keeps Drive files in (attachments, photos, site content, Shelter Friend logos) holds this id — public or internal. Not callable through the Data API by anon or authenticated since 0089; the photo proxy asks is_public_drive_file (0084) and RLS instead.';

notify pgrst, 'reload schema';
