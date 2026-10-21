-- consumer: src/lib/diets/special-list.ts, src/app/medical/diets/page.tsx, src/app/residents/new/page.tsx, src/app/residents/new/actions.ts, src/app/residents/new/IntakeForm.tsx
--
-- Moves the last two readers of the legacy resident_diets.diet_type_id onto recipes (0239):
--   special_diet_list  one row per INGREDIENT of each non-standard diet a resident is on, at the resident's size
--                      times portion_factor (diets.is_standard decides what is "special"). Existing columns keep
--                      their names and order; diet_name is now the recipe's name, diet_type_id the ingredient's.
--                      Appended: diet_id, ingredient_name, ingredient_name_th.
--   picker_diets       the diet picker for intake: id, name, name_th, is_standard.
--   record_intake      takes p_diet_id (the recipe) instead of p_diet_type_id.
-- Nothing is dropped here; the bridge triggers and legacy columns go in the cleanup migration. Re-runnable.

create or replace view picker_diets as
select d.id, d.name, d.name_th, d.is_standard
  from diets d
 where (select has_permission('stock.diets', 'read'))
    or (select has_permission('resident.register'))
    or (select has_permission('medical.diet', 'read'));

revoke all on picker_diets from anon, authenticated, service_role;
grant select on picker_diets to authenticated, service_role;

create or replace view special_diet_list as
select rd.id as resident_diet_id,
       r.id as resident_id,
       r.name,
       r.thai_name,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.name as zone_name,
       z.name_th as zone_name_th,
       t.id as diet_type_id,
       dd.name as diet_name,
       coalesce(nullif(btrim(di.serving_unit), ''), t.unit) as diet_unit,
       rd.meals_per_day,
       case coalesce(r.size, 'Medium'::resident_size)
         when 'Small' then di.qty_small
         when 'Large' then di.qty_large
         else di.qty_medium
       end * coalesce(rd.portion_factor, 1) as daily_quantity,
       rd.notes,
       coalesce((select array_agg(ro.key order by ro.sort_order)
                   from resident_diet_rounds x
                   join rounds ro on ro.id = x.round_id
                  where x.resident_diet_id = rd.id), array[]::text[]) as round_keys,
       z.colour as zone_colour,
       dd.name_th as diet_name_th,
       dd.id as diet_id,
       t.name as ingredient_name,
       t.name_th as ingredient_name_th
  from resident_diets rd
  join diets dd on dd.id = rd.diet_id
  join diet_ingredients di on di.diet_id = dd.id
  join diet_types t on t.id = di.diet_type_id
  join residents r on r.id = rd.resident_id
  left join private.resident_current_state s on s.resident_id = r.id
  left join enclosures e on e.id = s.current_enclosure_id
  left join zones z on z.id = e.zone_id
 where dd.is_standard = false
   and rd.start_date <= shelter_today()
   and (rd.end_date is null or rd.end_date >= shelter_today())
   and (select has_permission('medical.diet', 'read'))
   and (select sees_all_clinical());

revoke all on special_diet_list from anon, authenticated, service_role;
grant select on special_diet_list to authenticated, service_role;

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
security invoker
as $$
declare
  v_resident residents;
  v_enclosure_id uuid := p_enclosure_id;
  v_zone_id uuid;
  v_group_origin_id uuid := p_group_origin_id;
begin
  if p_diet_id is null then
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
