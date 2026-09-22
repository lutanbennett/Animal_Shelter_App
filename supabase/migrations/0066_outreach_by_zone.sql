-- Outreach is a resident housed in an external zone.
--
-- The user's rule (2026-09-22, right after 0065): zones.internal (0004)
-- says where an animal is. Internal → a shelter resident. External →
-- outreach — an animal the shelter looks after in the community (the
-- Temple, the Village shops, the Orchard) — except for the Lifecycle
-- states, which are their own thing: Hospitalised, Fostered, Adopted,
-- Deceased, and Unassigned (on site, no enclosure yet — 0065).
--
-- Until now current_status only knew the Lifecycle pseudo-enclosures and
-- called everything else 'Resident', so a dog placed at the Temple would
-- have counted as living at the shelter. Outreach stays out of the public
-- "in care" count, as 0039 intended when it first named the status.
-- Column list unchanged, so CREATE OR REPLACE and resident_list_view is
-- untouched.

create or replace view resident_current_state as
select
  r.id as resident_id,
  r.name,
  cp.id as current_placement_id,
  cp.enclosure_id as current_enclosure_id,
  e.zone_id as current_zone_id,
  cp.carer_id as current_carer_id,
  cp.previous_enclosure_id as active_hospital_previous_enclosure,
  case
    when ez.name = 'Lifecycle' and e.name = 'Deceased' then 'Deceased'
    when ez.name = 'Lifecycle' and e.name = 'Hospital' then 'Hospitalised'
    when ez.name = 'Lifecycle' and e.name = 'Fostered' then 'Fostered'
    when ez.name = 'Lifecycle' and e.name = 'Adopted' then 'Adopted'
    when ez.name = 'Lifecycle' and e.name = 'Unassigned' then 'Unassigned'
    when ez.internal = false then 'Outreach'
    else 'Resident'
  end as current_status,
  (ez.name = 'Lifecycle' and e.name = 'Deceased') as is_deceased,
  case when (ez.name = 'Lifecycle' and e.name = 'Deceased') then cp.start_date end as date_of_death
from residents r
left join current_placement cp on cp.resident_id = r.id
left join enclosures e on e.id = cp.enclosure_id
left join zones ez on ez.id = e.zone_id;

notify pgrst, 'reload schema';
