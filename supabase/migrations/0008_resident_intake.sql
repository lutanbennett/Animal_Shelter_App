-- Resident intake (Section 4.1 / 7.1 — Intake is one of the 7 placement
-- actions, implemented as a single server-side transaction).
--
-- Intake is special among the placement actions: it's the only one that
-- also creates the resident row itself (every other placement action acts
-- on an existing resident). record_intake() does both inserts — residents,
-- then its opening placement_history row — inside one function call, so
-- they commit atomically and a partial intake (resident with no placement,
-- or vice versa) can never be observed.
--
-- Enclosure is optional at the call site: when p_enclosure_id is null, the
-- resident is placed in the 'Unassigned' pseudo-enclosure under the
-- 'Lifecycle' pseudo-zone (see 0001), exactly like the other lifecycle
-- states (Hospital/Fostered/Adopted/Deceased).
--
-- No new RLS policies needed: staff already has `for all` on residents
-- (0001) and `for insert` on placement_history with no placement_type
-- restriction (0001) — the same policies that let staff use every other
-- placement action already cover Intake. Volunteers are correctly excluded
-- (their placement_history insert policy only allows ChangeEnclosure).

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
  p_carer_id uuid default null,
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
    resident_id, placement_type, start_date, zone_id, enclosure_id,
    carer_id, notes, created_by
  )
  values (
    v_resident.id, 'Intake', p_intake_date::timestamptz, v_zone_id, v_enclosure_id,
    p_carer_id, p_notes, auth.uid()
  );

  return v_resident;
end;
$$;

notify pgrst, 'reload schema';
