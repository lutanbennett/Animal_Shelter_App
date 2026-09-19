-- Drops carer assignment from resident intake.
--
-- Carer only gets set on placement types that actually put an animal in
-- someone's care (Foster, later ChangeEnclosure/etc.) — never at Intake,
-- which is always the shelter receiving the animal. Signature change (one
-- fewer parameter), so drop-and-recreate rather than create-or-replace, same
-- reasoning as 0006/0007.

drop function if exists record_intake(
  text, date, text, text, text, text, text, date, numeric, text, text, text,
  text, boolean, boolean, uuid, uuid, text
);

create function record_intake(
  p_name text,
  p_intake_date date,
  p_thai_name text default null,
  p_other_names text default null,
  p_species text default null,
  p_breed text default null,
  p_sex text default null,
  p_date_of_birth date default null,
  p_estimated_age_years numeric default null,
  p_bio text default null,
  p_temperament_notes text default null,
  p_past_story_notes text default null,
  p_behaviour_notes text default null,
  p_ready_for_adoption boolean default false,
  p_is_public_visible boolean default false,
  p_enclosure_id uuid default null,
  p_notes text default null
)
returns residents
language plpgsql
security invoker
as $$
declare
  v_resident residents;
  v_enclosure_id uuid := p_enclosure_id;
  v_zone_id uuid;
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

  insert into residents (
    name, thai_name, other_names, species, breed, sex,
    date_of_birth, estimated_age_years, intake_date, bio,
    temperament_notes, past_story_notes, behaviour_notes,
    ready_for_adoption, is_public_visible, created_by
  )
  values (
    p_name, p_thai_name, p_other_names, p_species, p_breed, p_sex,
    p_date_of_birth, p_estimated_age_years, p_intake_date, p_bio,
    p_temperament_notes, p_past_story_notes, p_behaviour_notes,
    p_ready_for_adoption, p_is_public_visible, auth.uid()
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

notify pgrst, 'reload schema';
