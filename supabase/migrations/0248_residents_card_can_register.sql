-- consumer: src/lib/enclosures/options.ts, src/app/residents/new/actions.ts
--
-- A login holding only the residents card could not register a resident. record_intake was security invoker, so
-- every insert it makes ran under the caller's own row-level security: zones/enclosures need facility.enclosures
-- (0145), resident_diets needs medical.diet, weight needs medical.weight, group_origins needs admin. The card holds
-- none of those. The same cause emptied the Arrival step's zone list.
--   record_intake  now security definer, search_path pinned, and refuses at the top unless the caller holds
--                  resident.register. It writes only the new resident and that resident's first placement, weight,
--                  diet and (optionally) origin. Otherwise the same function as 0242.
--   picker_zones / picker_enclosures  the columns a place picker needs (no notes, no map), for anyone who may
--                  register or move a resident, or who already reads enclosures. Lifecycle left out.
-- Re-runnable.

create or replace view picker_zones as
select z.id, z.name, z.name_th, z.sort_order, z.colour
  from zones z
 where z.name <> 'Lifecycle'
   and ((select has_permission('facility.enclosures', 'read'))
     or (select has_permission('resident.register'))
     or (select has_permission('placement.move')));

create or replace view picker_enclosures as
select e.id, e.name, e.name_th, e.zone_id, e.capacity, e.sort_order
  from enclosures e
  join zones z on z.id = e.zone_id
 where z.name <> 'Lifecycle'
   and ((select has_permission('facility.enclosures', 'read'))
     or (select has_permission('resident.register'))
     or (select has_permission('placement.move')));

revoke all on picker_zones, picker_enclosures from anon, authenticated, service_role;
grant select on picker_zones, picker_enclosures to authenticated, service_role;

drop function if exists record_intake(
  text, date, text, text, text, text, text, numeric, text, text, text, text, boolean, boolean, uuid, text,
  uuid, text, numeric, resident_size, uuid, compatibility, compatibility, compatibility, energy_level,
  text, boolean, integer);

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
  p_diet_id uuid default null,
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
security definer
set search_path = public
as $$
declare
  v_resident residents;
  v_enclosure_id uuid := p_enclosure_id;
  v_zone_id uuid;
  v_group_origin_id uuid := p_group_origin_id;
begin
  if not (select has_permission('resident.register')) then
    raise exception 'You do not have permission to register a resident.' using errcode = '42501';
  end if;

  if p_diet_id is null then
    raise exception 'Choose a diet for the new resident. The standard diet is the usual choice.';
  end if;

  select e.id, e.zone_id into v_enclosure_id, v_zone_id
    from enclosures e join zones z on z.id = e.zone_id
   where case when p_enclosure_id is null then z.name = 'Lifecycle' and e.name = 'Unassigned'
              else e.id = p_enclosure_id end;
  if v_enclosure_id is null then
    raise exception 'Unassigned pseudo-enclosure not found — check the Lifecycle zone seed data';
  end if;

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

  insert into resident_diets (resident_id, diet_id, start_date, created_by)
  values (v_resident.id, p_diet_id, p_intake_date, auth.uid());

  return v_resident;
end;
$$;

revoke all on function record_intake(
  text, date, text, text, text, text, text, numeric, text, text, text, text, boolean, boolean, uuid, text,
  uuid, text, numeric, resident_size, uuid, compatibility, compatibility, compatibility, energy_level,
  text, boolean, integer) from public, anon;
grant execute on function record_intake(
  text, date, text, text, text, text, text, numeric, text, text, text, text, boolean, boolean, uuid, text,
  uuid, text, numeric, resident_size, uuid, compatibility, compatibility, compatibility, energy_level,
  text, boolean, integer) to authenticated, service_role;

notify pgrst, 'reload schema';
