-- A profile photo filed under Medical no longer reaches the public site
-- (backlog, "Public views show no profile photo when it is in Medical
-- (schema)", 2026-09-27 — the follow-up 0101's header left open and
-- claude/medical-photos-profile, #179, flagged rather than folded in).
--
-- This file is the fix for a live leak, not groundwork. 0101 took Medical
-- photos out of public_resident_photos, the /adopt/[id] gallery. The
-- profile photo reaches the public site another way: three views expose
-- residents.profile_photo_drive_file_id as-is —
--   public_resident_profiles  /adopt and /adopt/[id] (last defined 0094)
--   public_recent_adoptions   the home page's recent adoptions (0073)
--   public_resident_cards     /r/<code> (0068)
-- — and is_public_drive_file() (0084) asks all three, so the photo proxy
-- serves that file to a signed-out visitor too. #179 stopped anyone
-- CHOOSING a Medical photo as the profile photo, but a Medical photo still
-- BECOMES it: record_attachment makes a resident's first upload the profile
-- photo whatever its folder, and delete_resident_photo falls back to the
-- oldest. On dev 2026-09-27, 8 residents had a Medical profile photo, 7 of
-- them with no photo in any other folder, one (Markey) on the website.
--
-- Here each view reports the profile photo as null when that file is a
-- resident attachment filed under Medical — the test 0101 uses,
-- lower(btrim(coalesce(sub_folder, ''))) = 'medical', so case and padding
-- do not matter and a null folder stays public. The public site already
-- draws its no-photo placeholder for a null. Nothing else changes: same
-- rows, same columns in the same order and types, so `create or replace
-- view` is allowed and keeps the grants; the proxy follows because it reads
-- these views.
--
-- Deliberately NOT changed:
--   * residents.profile_photo_drive_file_id. Inside the app a Medical photo
--     is a fine profile photo (staff see who the animal is); only the public
--     face changes. A resident whose only photos are Medical shows the
--     placeholder on the website and its photo in the app.
--   * record_attachment / delete_resident_photo. Teaching them to skip
--     Medical when choosing automatically was considered. With this file it
--     no longer matters for the website, and skipping would leave a
--     Medical-only resident with no photo in the app, which is the opposite
--     of the line above. Where a resident has a photo in another folder,
--     staff choose it (node scripts/check-medical-photos.mjs lists them).
--
-- Each view is re-created from its LIVE definition (pg_get_viewdef on dev),
-- not from the migration that last wrote it, and every private object is
-- schema-qualified. 0082 moved approved_translations() to `private`; 0086
-- moved resident_current_state to `private` and left a gated view of the
-- same name in `public` that answers nothing to anon. The existing views
-- followed both moves by oid, but re-creating one from older text would
-- bind the unqualified names to the gates: for a visitor every status would
-- coalesce to 'Resident' and adopted and deceased residents would be back
-- (the trap 0094 and 0101 document).
--
-- Grants restated as every migration after 0077 must
-- (scripts/check-migration-grants.mjs): SELECT to anon and authenticated,
-- everything else revoked, as 0068, 0073 and 0094 did. Re-runnable:
-- `create or replace`, idempotent grants and revokes. Down-migration: each
-- view with r.profile_photo_drive_file_id in place of the case expression —
-- not written, since nobody should want the leak back.

create or replace view public_resident_profiles as
select
  r.id,
  r.name,
  r.species,
  r.breed,
  r.sex,
  r.ready_for_adoption,
  r.bio,
  r.temperament_notes,
  r.past_story_notes,
  case when exists (
    select 1 from attachments a
     where a.owner_type = 'resident'
       and a.owner_id = r.id
       and a.drive_file_id = r.profile_photo_drive_file_id
       and lower(btrim(coalesce(a.sub_folder, ''))) = 'medical'
  ) then null else r.profile_photo_drive_file_id end as profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on,
  r.size,
  private.approved_translations('residents', r.id) as translations,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  r.colour,
  r.is_desexed,
  exists (
    select 1 from immunization_records i where i.resident_id = r.id
  ) as is_vaccinated,
  r.hook_line,
  r.ideal_home
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_profiles from anon, authenticated;

create or replace view public_recent_adoptions as
select
  p.id,
  r.name,
  r.species,
  case when exists (
    select 1 from attachments a
     where a.owner_type = 'resident'
       and a.owner_id = r.id
       and a.drive_file_id = r.profile_photo_drive_file_id
       and lower(btrim(coalesce(a.sub_folder, ''))) = 'medical'
  ) then null else r.profile_photo_drive_file_id end as profile_photo_drive_file_id,
  shelter_date(p.start_date) as adopted_on
from placement_history p
join residents r on r.id = p.resident_id
where p.placement_type = 'Adopt'
  and p.end_date is null
  and p.start_date >= now() - interval '90 days'
  and r.is_public_visible = true
  and not exists (
    select 1 from private.resident_current_state s
     where s.resident_id = r.id and s.current_status = 'Deceased'
  );

grant select on public_recent_adoptions to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_recent_adoptions from anon, authenticated;

create or replace view public_resident_cards as
select
  r.id,
  r.resident_code,
  r.name,
  r.thai_name,
  r.species,
  r.breed,
  r.sex,
  r.size,
  r.colour,
  r.is_desexed,
  r.estimated_age_years,
  r.age_estimated_on,
  r.intake_date,
  r.bio,
  r.temperament_notes,
  case when exists (
    select 1 from attachments a
     where a.owner_type = 'resident'
       and a.owner_id = r.id
       and a.drive_file_id = r.profile_photo_drive_file_id
       and lower(btrim(coalesce(a.sub_folder, ''))) = 'medical'
  ) then null else r.profile_photo_drive_file_id end as profile_photo_drive_file_id,
  r.ready_for_adoption,
  r.is_public_visible,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  private.approved_translations('residents', r.id) as translations,
  case
    when s.current_status in ('Adopted', 'Deceased') then s.current_status
    else 'Resident'
  end as status
from residents r
left join private.resident_current_state s on s.resident_id = r.id;

grant select on public_resident_cards to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_cards from anon, authenticated;

notify pgrst, 'reload schema';
