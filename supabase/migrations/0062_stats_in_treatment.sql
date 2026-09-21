-- "In vet care" on the public home page counts treatment, not beds
-- (2026-09-21, reviewing the public site).
--
-- 0039's strip showed the number of residents in hospital, which for a
-- shelter that treats most things on site is usually zero and undersells
-- the work. The tile now counts residents under treatment: everyone with
-- an active prescription (no end date, or one still to come — the hub's
-- rule) plus everyone hospitalised, each resident once. Deceased and
-- adopted residents are out, and so is anything the shelter doesn't care
-- for (Outreach), as with `in_care`.
--
-- `in_hospital` stays as it was for anything else reading it; the new
-- column is appended, which is what CREATE OR REPLACE on a view allows.

create or replace view public_shelter_stats as
select
  (select count(*) from resident_current_state
     where current_status in ('Resident', 'Hospitalised', 'Fostered'))::integer as in_care,
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
     where s.current_status in ('Resident', 'Hospitalised', 'Fostered')
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
