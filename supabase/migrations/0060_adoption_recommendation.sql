-- Adoption recommendation fields (backlog, Public website). See
-- docs/decisions.md, 2026-09-21.
--
-- RSPCA ACT's pet profiles carry an "Adoption Recommendation" block —
-- good with dogs / cats / children, energy level — beside the size and
-- colour, and the adopter uses it to answer "is this animal right for
-- us?" before they ask. The same fields go on residents, are typed at
-- intake or on the edit form, and show on /adopt/[id] as "Is {name}
-- right for you?".
--
-- Two facts adopters ask about come from elsewhere:
--   - vaccinated: derived on the public view from immunization_records —
--     the vaccination history is already the record, so it isn't typed
--     twice;
--   - desexed: its own yes / no / unknown on the resident. It could be
--     read from a 'Spay / neuter' procedure, but procedure types are
--     admin-editable names and most residents' surgery predates the
--     app, so the flag is set by whoever knows.
-- Microchipping isn't done here, so there is no field for it.
--
-- The three "good with" columns are a tri-state rather than a boolean:
-- 'Unknown' is an answer ("not yet tested with cats") and shows as one;
-- null is "nobody has said", and shows nothing.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'compatibility') then
    create type compatibility as enum ('Yes', 'No', 'Unknown');
  end if;
  if not exists (select 1 from pg_type where typname = 'energy_level') then
    create type energy_level as enum ('Low', 'Medium', 'High');
  end if;
end;
$$;

alter table residents add column if not exists good_with_dogs compatibility;
alter table residents add column if not exists good_with_cats compatibility;
alter table residents add column if not exists good_with_children compatibility;
alter table residents add column if not exists energy_level energy_level;
alter table residents add column if not exists colour text;
-- null = not known; shown on the public profile only when set.
alter table residents add column if not exists is_desexed boolean;

comment on column residents.is_desexed is
  'Spayed / neutered. Null = not known. Set by staff; not derived from procedures because the surgery usually predates the app.';

-- The public profile view gains the six fields and the derived
-- vaccinated flag. CREATE OR REPLACE keeps the grants (0025) — columns
-- are appended after 0056's `translations`, the one shape of change a
-- view replace allows.
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
  r.age_estimated_on,
  r.size,
  approved_translations('residents', r.id) as translations,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  r.colour,
  r.is_desexed,
  exists (
    select 1 from immunization_records i where i.resident_id = r.id
  ) as is_vaccinated
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_profiles from anon, authenticated;

-- =========================================================================
-- record_intake: the new fields, so intake sets them in the same insert.
-- New parameters, so the 0051 signature is dropped and re-created.
-- =========================================================================

drop function if exists record_intake(
  text, date, text, text, text, text, text, numeric, text, text, text,
  text, boolean, boolean, uuid, text, uuid, text, numeric, resident_size, uuid
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
  p_is_desexed boolean default null
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
    good_with_dogs, good_with_cats, good_with_children, energy_level, colour, is_desexed
  )
  values (
    p_name, p_thai_name, p_other_names, p_species, p_breed, p_sex, p_size,
    p_estimated_age_years, p_intake_date, p_intake_date, p_bio,
    p_temperament_notes, p_past_story_notes, p_behaviour_notes,
    p_ready_for_adoption, p_is_public_visible, v_group_origin_id, auth.uid(),
    p_good_with_dogs, p_good_with_cats, p_good_with_children, p_energy_level, p_colour, p_is_desexed
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
