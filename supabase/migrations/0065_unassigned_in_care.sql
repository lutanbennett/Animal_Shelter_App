-- A resident in the Lifecycle 'Unassigned' pseudo-enclosure is in the
-- shelter's care.
--
-- 0001 named that state 'Outreach' and 0039/0062 left it out of the
-- public "in care" count, reading Unassigned as "somewhere we don't look
-- after". The migrated data (2026-09-22) showed what it really is: in
-- AppSheet, Unassigned was an on-site zone — the 27 residents there are
-- at the shelter, they just haven't been given an enclosure — so the home
-- page and the dashboard said 42 animals in care when there are 69.
--
-- The status is now called what it is, 'Unassigned', and counts as in
-- care and eligible for "in vet care" like any resident. Off-site animals
-- the shelter still looks after (the Temple, Village and Orchard
-- enclosures) were already 'Resident'. Nothing else about the pseudo-
-- enclosure changes: intake still defaults to it, and moving a resident
-- into a real enclosure is the way out.
--
-- Both views keep their column lists, so CREATE OR REPLACE is enough and
-- resident_list_view (which selects from resident_current_state) is
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
    else 'Resident'
  end as current_status,
  (ez.name = 'Lifecycle' and e.name = 'Deceased') as is_deceased,
  case when (ez.name = 'Lifecycle' and e.name = 'Deceased') then cp.start_date end as date_of_death
from residents r
left join current_placement cp on cp.resident_id = r.id
left join enclosures e on e.id = cp.enclosure_id
left join zones ez on ez.id = e.zone_id;

create or replace view public_shelter_stats as
select
  (select count(*) from resident_current_state
     where current_status in ('Resident', 'Unassigned', 'Hospitalised', 'Fostered'))::integer as in_care,
  (select count(*) from resident_current_state
     where current_status = 'Hospitalised')::integer as in_hospital,
  (select count(*) from resident_current_state
     where current_status = 'Fostered')::integer as in_foster,
  (select count(*) from resident_current_state s
     join residents r on r.id = s.resident_id
     where r.ready_for_adoption and r.is_public_visible
       and s.current_status not in ('Deceased', 'Adopted'))::integer as ready_for_adoption,
  (select count(*) from placement_history
     where placement_type = 'Adopt'
       and start_date >= now() - interval '7 days')::integer as adopted_last_7_days,
  (select count(*) from placement_history
     where placement_type = 'Adopt'
       and start_date >= date_trunc('year', now()))::integer as adopted_this_year,
  (select count(*) from placement_history
     where placement_type = 'Intake'
       and start_date >= date_trunc('year', now()))::integer as intakes_this_year,
  (select count(*) from resident_current_state s
     where s.current_status in ('Resident', 'Unassigned', 'Hospitalised', 'Fostered')
       and (
         s.current_status = 'Hospitalised'
         or exists (
           select 1 from prescriptions p
            where p.resident_id = s.resident_id
              and (p.end_date is null or p.end_date >= current_date)
         )
       ))::integer as in_treatment;

grant select on public_shelter_stats to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_shelter_stats
  from anon, authenticated;

notify pgrst, 'reload schema';
