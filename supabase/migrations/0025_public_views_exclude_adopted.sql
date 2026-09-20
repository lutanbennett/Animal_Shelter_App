-- Adopted residents drop off the public adoption pages.
--
-- The public views (public_resident_profiles, public_resident_photos) only
-- excluded deceased residents, so an animal recorded as Adopted via the new
-- foster / adopt action stayed listed on /adopt as if still available until
-- someone unticked is_public_visible. Filter on current_status instead:
--
--   * Adopted  — hidden. The shelter's involvement has ended; a "recently
--                adopted" public page is a possible later feature and would
--                read placement_history directly, not these views.
--   * Deceased — hidden, as before.
--   * Fostered — still shown. Foster-to-adopt is common and a fostered
--                animal is still the shelter's to rehome.
--
-- Both are CREATE OR REPLACE with the same column lists, so the existing
-- grants to anon / authenticated (0016, 0017) carry over.

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
  r.profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

create or replace view public_resident_photos as
select
  a.id,
  a.owner_id as resident_id,
  a.drive_file_id,
  a.uploaded_at
from attachments a
join residents r on r.id = a.owner_id
where a.owner_type = 'resident'
  and r.is_public_visible = true
  and coalesce(
    (select s.current_status from resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted')
order by a.uploaded_at asc;

-- Found while checking the grants above: Supabase's default privileges hand
-- INSERT/UPDATE/DELETE on every new object in `public` to anon and
-- authenticated, and public_resident_profiles is simple enough for Postgres
-- to treat as auto-updatable. Because the view is owned by the
-- RLS-bypassing migration role, an anonymous `PATCH
-- /rest/v1/public_resident_profiles?id=eq.<id>` was accepted (verified:
-- HTTP 200 on a no-op filter). The public tier is read-only — take
-- everything but SELECT away. Any future view granted to anon needs the
-- same treatment.
revoke insert, update, delete, truncate, references, trigger
  on public_resident_profiles, public_resident_photos
  from anon, authenticated;

notify pgrst, 'reload schema';
