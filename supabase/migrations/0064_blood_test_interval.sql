-- How often a resident should have blood taken, in months.
--
-- The AppSheet system carried a "Blood Test Priority" of Yearly / Quarterly
-- / Monthly on every resident: healthy animals are checked yearly, the old
-- and the ill more often. The data migration (scripts/import-appsheet.mjs)
-- needs somewhere to put it, and staff need to be able to raise it when a
-- resident falls ill — so it is a plain number of months, defaulting to 12
-- at intake and editable on the resident's details.
--
-- Re-runnable: the column add is guarded, record_intake is dropped by its
-- 0060 signature before being recreated with the new parameter.

alter table residents
  add column if not exists blood_test_interval_months integer not null default 12;

alter table residents drop constraint if exists residents_blood_test_interval_positive;
alter table residents add constraint residents_blood_test_interval_positive
  check (blood_test_interval_months > 0);

comment on column residents.blood_test_interval_months is
  'Months between routine blood tests: 12 for a healthy resident, shorter for the old or the ill. Set at intake, changed on the edit page.';

-- record_intake: same body as 0060 plus the interval, so intake sets it in
-- the same insert.
drop function if exists record_intake(
  text, date, text, text, text, text, text, numeric, text, text, text, text,
  boolean, boolean, uuid, text, uuid, text, numeric, resident_size, uuid,
  compatibility, compatibility, compatibility, energy_level, text, boolean
);

create function record_intake(
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
  p_new_origin_name text default null,
  p_weight_kg numeric default null,
  p_size resident_size default null,
  p_diet_type_id uuid default null,
  p_good_with_dogs compatibility default null,
  p_good_with_cats compatibility default null,
  p_good_with_children compatibility default null,
  p_energy_level energy_level default null,
  p_colour text default null,
  p_is_desexed boolean default null,
  p_blood_test_interval_months integer default 12
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
    name, thai_name, other_names, species, breed, sex, size,
    estimated_age_years, age_estimated_on, intake_date, bio,
    temperament_notes, past_story_notes, behaviour_notes,
    ready_for_adoption, is_public_visible, group_origin_id, created_by,
    good_with_dogs, good_with_cats, good_with_children, energy_level, colour, is_desexed,
    blood_test_interval_months
  )
  values (
    p_name, p_thai_name, p_other_names, p_species, p_breed, p_sex, p_size,
    p_estimated_age_years, p_intake_date, p_intake_date, p_bio,
    p_temperament_notes, p_past_story_notes, p_behaviour_notes,
    p_ready_for_adoption, p_is_public_visible, v_group_origin_id, auth.uid(),
    p_good_with_dogs, p_good_with_cats, p_good_with_children, p_energy_level, p_colour, p_is_desexed,
    coalesce(p_blood_test_interval_months, 12)
  )
  returning * into v_resident;

  insert into placement_history (
    resident_id, placement_type, start_date, zone_id, enclosure_id, notes, created_by
  )
  values (
    v_resident.id, 'Intake', p_intake_date::timestamptz, v_zone_id, v_enclosure_id,
    p_notes, auth.uid()
  );

  if p_weight_kg is not null then
    insert into weight (resident_id, date, weight_kg, created_by)
    values (v_resident.id, p_intake_date, p_weight_kg, auth.uid());
  end if;

  if p_diet_type_id is not null then
    insert into resident_diets (resident_id, diet_type_id, start_date, created_by)
    values (v_resident.id, p_diet_type_id, p_intake_date, auth.uid());
  end if;

  return v_resident;
end;
$$;

notify pgrst, 'reload schema';
