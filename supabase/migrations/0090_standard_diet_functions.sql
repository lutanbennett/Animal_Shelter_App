-- Standard diet, second schema half (backlog, "Standard diet: flag it, make
-- a diet mandatory at intake, and show special diets on enclosure cards").
-- 0087 added diet_types.is_standard; the feature needs two functions it
-- could not add then:
--
--   1. set_standard_diet(p_diet_type_id uuid) — makes that diet type the
--      standard. "Clear the old, set the new" as two statements in the
--      function's one transaction, in that order: the partial unique index
--      diet_types_one_standard is checked row by row, so a single
--      `set is_standard = (id = p)` can fail on whichever row it reaches
--      first. supabase-js cannot run two statements in one transaction,
--      hence an RPC. Setting the diet that is already the standard is a
--      no-op that succeeds. There is no "clear it" call: zero standards is
--      tolerated (0087) but nothing in the app aims for it.
--
--      Who: admin and management, the same as every other diet_types write
--      (0051 RLS). Security INVOKER so RLS still applies, with the explicit
--      null-safe role check 0088 uses — without it a staff caller would have
--      both updates filtered to nothing and get "not found" instead of "not
--      authorized". The update that sets the new row checks its row count,
--      so an unknown id (or one RLS hides) rolls back the clear too and the
--      old standard stays.
--
--   2. record_intake(...) refuses a null p_diet_type_id. A diet is now
--      mandatory at intake: the form preselects the standard and the server
--      action rejects a missing one, and this is the last line. The
--      signature is unchanged — p_diet_type_id keeps its `default null`
--      because it sits among defaulted parameters and removing the default
--      would mean reordering them — so `create or replace` keeps 0082's
--      grants. Body otherwise identical to 0064.
--
--      Ordering: until the feature branch merges, main's intake form still
--      offers "None yet" and passes null, so on dev that option now errors
--      with the message below. The feature PR follows this one the same
--      day; production gets both in the same release.
--
-- Re-runnable: `create or replace` throughout, idempotent grants.

create or replace function set_standard_diet(p_diet_type_id uuid)
returns diet_types
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row diet_types;
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management') then
    raise exception 'Not authorized to change the standard diet.';
  end if;

  if p_diet_type_id is null then
    raise exception 'Choose a diet type to make the standard.';
  end if;

  update diet_types set is_standard = false
   where is_standard and id <> p_diet_type_id;

  update diet_types set is_standard = true
   where id = p_diet_type_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'That diet type was not found. Reload the page and try again.';
  end if;

  return v_row;
end;
$$;

comment on function set_standard_diet(uuid) is
  'Makes the given diet type the shelter''s standard: clears is_standard on the old row, then sets it on the new one, in one transaction (the partial unique index is checked row by row, so the order matters). Admin and management only. Unknown id rolls back and leaves the old standard (0090).';

revoke all on function set_standard_diet(uuid) from public, anon;
grant execute on function set_standard_diet(uuid) to authenticated, service_role;

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
  if p_diet_type_id is null then
    raise exception 'Choose a diet for the new resident. The standard diet is the usual choice.';
  end if;

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

  insert into resident_diets (resident_id, diet_type_id, start_date, created_by)
  values (v_resident.id, p_diet_type_id, p_intake_date, auth.uid());

  return v_resident;
end;
$$;

notify pgrst, 'reload schema';
