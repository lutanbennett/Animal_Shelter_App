-- Show age on the public "/adopt/[id]" resident page.
--
-- public_resident_profiles (0001_initial_schema.sql) deliberately exposes a
-- narrow column set; age wasn't in it. Adding estimated_age_years and
-- intake_date so the public page can render the same "~5 years old
-- (estimated)" line staff see on the resident hub — formatAge()
-- (src/lib/format.ts) needs both, since it anchors the intake-time estimate
-- to intake_date and keeps aging it from there. Neither is sensitive: the
-- estimate is a staff guess, and intake_date is only used for the
-- arithmetic (the page doesn't display it).
--
-- CREATE OR REPLACE VIEW only allows appending columns, so the existing
-- ones stay in the same order. The anon/authenticated grant from
-- 0016_public_adopt_listing_access.sql survives the replace.
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
  r.intake_date
from residents r
where r.is_public_visible = true
  and not coalesce((select is_deceased from resident_current_state s where s.resident_id = r.id), false);
