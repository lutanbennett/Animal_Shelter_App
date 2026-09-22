-- The page behind a resident's RFID card, for visitors (backlog, Facility:
-- "Copyable links for enclosure QR codes and resident RFID cards";
-- docs/decisions.md 2026-09-22).
--
-- The card by a kennel carries /r/<R-code>. A signed-in user lands on the
-- hub; a visitor should see the resident, not a sign-in page — every
-- resident, not only the ones marked for the adoption listing, because
-- someone scanning card after card and hitting "sign in" each time will
-- stop scanning. public_resident_profiles (0025/0060) stays the curated
-- adoption listing behind /adopt; this is the smaller card-shaped slice
-- of *all* residents: what the card itself prints (photo, name, age, sex,
-- temperament) plus species, breed, size, colour, desexed, intake date,
-- bio and the adoption-fit fields, with the approved translations. No
-- past story (that is adoption-listing copy), no hospital / foster /
-- enclosure — `status` is coarse: Resident, Adopted or Deceased, so an
-- old card scanned after the animal has gone can say so and nothing
-- about where a current resident is. resident_code is included because
-- it is what the card carries and what an anonymous visitor arrives with.
-- is_public_visible lets the page link on to the fuller /adopt profile
-- when there is one.
--
-- Ordinary view (owner's rights, like public_resident_profiles), granted
-- SELECT only to anon / authenticated; checked by check-public-views.mjs.

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
  r.profile_photo_drive_file_id,
  r.ready_for_adoption,
  r.is_public_visible,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  approved_translations('residents', r.id) as translations,
  case
    when s.current_status in ('Adopted', 'Deceased') then s.current_status
    else 'Resident'
  end as status
from residents r
left join resident_current_state s on s.resident_id = r.id;

grant select on public_resident_cards to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_cards from anon, authenticated;

notify pgrst, 'reload schema';
