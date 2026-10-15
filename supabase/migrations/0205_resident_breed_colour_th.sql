-- consumer: none
--
-- Schema half of "Thai for a resident's breed and colour". residents.breed and residents.colour are free
-- text a Thai reader sees on /adopt and /r/<code> with no Thai; these two columns hold it. Nothing writes
-- or reads them yet (screens, and registering them in translatable_labels, are the later item).
--
-- Public on purpose: the English breed and colour are already in both views, so the Thai ones add nothing
-- a visitor cannot already read. Exactly two columns are added, appended LAST to public_resident_cards and
-- public_resident_profiles; every other column, filter and expression is the live definition unchanged
-- (pg_get_viewdef on dev, 2026-10-15). See docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md.

alter table residents add column if not exists breed_th text;
alter table residents add column if not exists colour_th text;

comment on column residents.breed_th is 'Thai for breed, shown to Thai readers on the public site (0205). Null = fall back to English.';
comment on column residents.colour_th is 'Thai for colour, shown to Thai readers on the public site (0205). Null = fall back to English.';

create or replace view public_resident_cards as
select
  r.id,
  r.resident_code,
  r.name,
  r.thai_name,
  r.species,
  r.breed,
  r.sex,
  r.size,
  r.colour,
  r.is_desexed,
  r.estimated_age_years,
  r.age_estimated_on,
  r.intake_date,
  r.bio,
  r.temperament_notes,
  case when exists (
    select 1 from attachments a
     where a.owner_type = 'resident'
       and a.owner_id = r.id
       and a.drive_file_id = r.profile_photo_drive_file_id
       and lower(btrim(coalesce(a.sub_folder, ''))) = 'medical'
  ) then null else r.profile_photo_drive_file_id end as profile_photo_drive_file_id,
  r.ready_for_adoption,
  r.is_public_visible,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  private.approved_translations('residents', r.id) as translations,
  case
    when s.current_status in ('Adopted', 'Deceased') then s.current_status
    else 'Resident'
  end as status,
  r.breed_th,
  r.colour_th
from residents r
left join private.resident_current_state s on s.resident_id = r.id;

grant select on public_resident_cards to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_cards from anon, authenticated;

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
  case when exists (
    select 1 from attachments a
     where a.owner_type = 'resident'
       and a.owner_id = r.id
       and a.drive_file_id = r.profile_photo_drive_file_id
       and lower(btrim(coalesce(a.sub_folder, ''))) = 'medical'
  ) then null else r.profile_photo_drive_file_id end as profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on,
  r.size,
  private.approved_translations('residents', r.id) as translations,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  r.colour,
  r.is_desexed,
  exists (
    select 1 from immunization_records i
     where i.resident_id = r.id and i.archived_at is null
  ) as is_vaccinated,
  r.hook_line,
  r.ideal_home,
  (r.microchip_number is not null) as is_microchipped,
  r.breed_th,
  r.colour_th
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_profiles from anon, authenticated;

notify pgrst, 'reload schema';
