-- "Microchipped: yes" on /adopt/[id] (2026-09-30). The one database part of
-- "Microchip, second half": a boolean on public_resident_profiles, derived
-- from residents.microchip_number (0113).
--
--   public_resident_profiles.is_microchipped  boolean, never null
--
-- The number itself stays staff-only. 0113 and 0116 both held that line and
-- scripts/check-public-views.mjs asserts anon cannot select microchip_number
-- or microchip_implanted_on from residents or from any public object; that
-- check is unchanged and must still pass. This view gains the fact that a
-- chip exists, which is what 0060's Desexed / Vaccinated ticks were meant to
-- sit beside, and nothing that identifies it. is_vaccinated (0060) is the
-- precedent: a derived boolean, not the underlying rows.
--
-- Only public_resident_profiles, the view /adopt and /adopt/[id] read through
-- src/lib/residents/public.ts. NOT public_resident_cards (/r/<code>, 0068):
-- nothing asked for it there, and every public surface that carries a
-- microchip fact is one more place to keep the line.
--
-- Re-created from its LIVE definition (pg_get_viewdef on dev, 2026-09-30,
-- identical to 0103's text) with one column appended after ideal_home, the
-- one change `create or replace view` allows, so the existing columns keep
-- their order and types and the grants carry over. Private objects stay
-- schema-qualified: private.approved_translations (0082) and
-- private.resident_current_state (0086). Re-creating from older unqualified
-- text would bind the gated public view of that name and put adopted and
-- deceased residents back on /adopt (the trap 0094, 0101 and 0103 document).
--
-- Grants restated as every migration after 0077 must: SELECT to anon and
-- authenticated, everything else revoked. Re-runnable: `create or replace`
-- and idempotent grants. Down-migration: the same view without the last
-- column, which `create or replace` cannot do — drop and re-create with
-- 0103's text and grants.

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
  r.ideal_home,
  (r.microchip_number is not null) as is_microchipped
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_profiles from anon, authenticated;

notify pgrst, 'reload schema';
