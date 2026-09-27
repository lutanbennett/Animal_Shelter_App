-- Medical-folder photos come off the public site (backlog, "Keep
-- Medical-folder photos off the public website", 2026-09-27; schema half —
-- the feature half, claude/medical-photos-profile, deals with profile
-- photos, the manual and the release note).
--
-- This file is the fix, not groundwork. public_resident_photos (0017, last
-- redefined in 0025) took every `attachments` row with owner_type =
-- 'resident' for a publicly visible resident, whatever folder it was filed
-- in, so /adopt/[id]'s gallery showed operation, teeth and wound photos
-- next to the rest. The same view is one of the objects
-- is_public_drive_file() (0084) asks, so the photo proxy also served those
-- files to a signed-out visitor who had the link. Filtering here closes
-- both at once: the gallery and the proxy read one definition of public.
--
-- The folder is attachments.sub_folder. The upload route
-- (src/app/api/residents/[id]/photos/route.ts) writes one of
-- PHOTO_CATEGORIES (Shelter / Medical / Foster / Adoption) there, or an
-- adoption update's <YYYYMMDD>; the AppSheet import wrote the sheet's
-- Sub_Folder, or 'Shelter' where it was blank. Counted on dev 2026-09-27:
-- Foster 46, Medical 44, Shelter 22, a date 2, Adoption 1, no nulls — so
-- the folder is recorded for every resident photo, and a deny-list on
-- 'Medical' removes exactly what was filed as medical. It cannot catch a
-- medical photo filed in the wrong folder; that is for staff to refile.
-- The comparison ignores case and surrounding spaces, and a null folder
-- stays public (it is not a medical filing), as before.
--
-- Not covered here, deliberately: a Medical photo chosen as the resident's
-- PROFILE photo still reaches the public site through
-- public_resident_profiles, public_recent_adoptions and
-- public_resident_cards (profile_photo_drive_file_id), and so through the
-- proxy. That is the feature half's decision (block the choice, or have
-- the views fall back); on dev 8 residents have one today.
--
-- The status subquery names private.resident_current_state. 0086 moved
-- that view to `private` and left a gated view of the same name in
-- `public` that answers nothing to anon; re-creating this view from 0025's
-- text would bind the unqualified name to the gate, every status would
-- coalesce to 'Resident' for a visitor, and adopted and deceased residents'
-- photos would come back (the same trap 0094 documents).
--
-- Same column list, names and types as 0025, so `create or replace view`
-- keeps the existing grants; they are restated anyway, as every migration
-- after 0077 must (scripts/check-migration-grants.mjs), with 0025's revoke
-- of everything but SELECT. Re-runnable: `create or replace`, idempotent
-- grants and revokes. Down-migration: 0025's view body with
-- private.resident_current_state — not written, since nobody should want
-- medical photos back on the website.

create or replace view public_resident_photos as
select
  a.id,
  a.owner_id as resident_id,
  a.drive_file_id,
  a.uploaded_at
from attachments a
join residents r on r.id = a.owner_id
where a.owner_type = 'resident'
  and lower(btrim(coalesce(a.sub_folder, ''))) <> 'medical'
  and r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted')
order by a.uploaded_at asc;

grant select on public_resident_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_photos
  from anon, authenticated;

notify pgrst, 'reload schema';
