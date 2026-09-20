-- Anchor the age estimate to the date it was made, not to intake_date.
--
-- estimated_age_years has always been "age as guessed on the day it was
-- entered", and formatAge() (src/lib/format.ts) ages it forward from
-- intake_date. That's right at intake but wrong once staff revise the
-- estimate from the edit form years later: typing "5" (meaning "about 5
-- now") was still aged forward from intake, so the hub showed ~7.
--
-- age_estimated_on records when the current estimate was made. Intake sets
-- it to the intake date; the edit form sets it to today whenever the age
-- value itself changes (and leaves it alone for any other edit, so fixing a
-- typo in the bio doesn't quietly re-anchor the age).

alter table residents add column age_estimated_on date;

update residents set age_estimated_on = intake_date where age_estimated_on is null;

-- Same signature as 0011, so CREATE OR REPLACE swaps the body in place.
create or replace function record_intake(
  p_name text,
  p_intake_date date,
  p_thai_name text default null,
  p_other_names text default null,
  p_species text default null,
  p_breed text default null,
  p_sex text default null,
  p_estimated_age_years numeric default null,
  p_bio text default null,
  p_temperament_notes text default null,
  p_past_story_notes text default null,
  p_behaviour_notes text default null,
  p_ready_for_adoption boolean default false,
  p_is_public_visible boolean default false,
  p_enclosure_id uuid default null,
  p_notes text default null,
  p_group_origin_id uuid default null,
  p_new_origin_name text default null
)
returns residents
language plpgsql
security invoker
as $$
declare
  v_resident residents;
  v_enclosure_id uuid := p_enclosure_id;
  v_zone_id uuid;
  v_group_origin_id uuid := p_group_origin_id;
begin
  if v_enclosure_id is null then
    select e.id into v_enclosure_id
    from enclosures e
    join zones z on z.id = e.zone_id
    where z.name = 'Lifecycle' and e.name = 'Unassigned';

    if v_enclosure_id is null then
      raise exception 'Unassigned pseudo-enclosure not found — check the Lifecycle zone seed data';
    end if;
  end if;

  select e.zone_id into v_zone_id from enclosures e where e.id = v_enclosure_id;

  if p_new_origin_name is not null and length(trim(p_new_origin_name)) > 0 then
    insert into group_origins (name, date)
    values (trim(p_new_origin_name), p_intake_date)
    returning id into v_group_origin_id;
  end if;

  insert into residents (
    name, thai_name, other_names, species, breed, sex,
    estimated_age_years, age_estimated_on, intake_date, bio,
    temperament_notes, past_story_notes, behaviour_notes,
    ready_for_adoption, is_public_visible, group_origin_id, created_by
  )
  values (
    p_name, p_thai_name, p_other_names, p_species, p_breed, p_sex,
    p_estimated_age_years, p_intake_date, p_intake_date, p_bio,
    p_temperament_notes, p_past_story_notes, p_behaviour_notes,
    p_ready_for_adoption, p_is_public_visible, v_group_origin_id, auth.uid()
  )
  returning * into v_resident;

  insert into placement_history (
    resident_id, placement_type, start_date, zone_id, enclosure_id, notes, created_by
  )
  values (
    v_resident.id, 'Intake', p_intake_date::timestamptz, v_zone_id, v_enclosure_id,
    p_notes, auth.uid()
  );

  return v_resident;
end;
$$;

-- Public page ages the estimate the same way; append the anchor column
-- (CREATE OR REPLACE VIEW only allows appending). intake_date stays in the
-- view for compatibility but the page no longer needs it for age.
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
  and not coalesce((select is_deceased from resident_current_state s where s.resident_id = r.id), false);

notify pgrst, 'reload schema';
