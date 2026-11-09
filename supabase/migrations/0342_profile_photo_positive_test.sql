-- consumer: src/app/api/photos, src/app/adopt/ResidentCard.tsx, src/app/adopt/[id]/page.tsx, src/app/adopt/HappyEndings.tsx, src/app/adopt/journey/[id]/page.tsx, src/app/page.tsx, src/app/r/[code]/page.tsx, scripts/check-public-views.mjs
--
-- Backlog #h8xqv: the PUBLIC profile photo failed OPEN. docs/decisions/2026-11-09-profile-photo-fails-open.md is the paper;
-- docs/decisions/2026-11-09-public-read-enumeration.md section 3.1 the finding.
--
-- BEFORE (0217, unchanged until now): public_resident_profiles, public_resident_cards and public_recent_adoptions each showed
--   case when exists (an attachment of this resident with this id that is Medical OR unapproved) then null else the id end
-- i.e. they asked for a BAD row. An id matching NO attachment row of the resident passed straight through, and
-- is_public_drive_file() (which reads these three views) then let the photo proxy serve that Drive file to anyone.
-- residents.profile_photo_drive_file_id is writable by any login whose cards grant resident.record at edit (residents_update_perm),
-- so any Drive file the service account can read could be put on the public site without review.
--
-- AFTER: the views ask the POSITIVE question, taken from 0319 (set_resident_profile_photo and delete_resident_photo's fallback):
--   an attachment OF THIS RESIDENT with THIS id that is not in the Medical folder, is a picture (not a video by kind or by name)
--   and has approval = 'public_ok'
-- and, as set_resident_profile_photo() also refuses, NO attachment of this resident with this id is in the Medical folder.
-- Anything else reads as no profile photo. Nothing about who may write the column changes here (see the decision file).
--
-- Every column, its name, type and order are exactly as 0217 left them; only the profile_photo_drive_file_id expression changes.
-- No policy, no function, no role key. Re-runnable (create or replace view). To undo: re-run 0217's three view definitions.

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
  case
    when exists (
      select 1 from attachments a
      where a.owner_type = 'resident'
        and a.owner_id = r.id
        and a.drive_file_id = r.profile_photo_drive_file_id
        and lower(btrim(coalesce(a.sub_folder, ''), E' \t\r\n\f\v')) <> 'medical'
        and coalesce(a.media_kind, 'photo') = 'photo'
        and coalesce(a.file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'
        and a.approval = 'public_ok'
    )
    and not exists (
      select 1 from attachments a
      where a.owner_type = 'resident'
        and a.owner_id = r.id
        and a.drive_file_id = r.profile_photo_drive_file_id
        and lower(btrim(coalesce(a.sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
    )
    then r.profile_photo_drive_file_id
    else null::text
  end as profile_photo_drive_file_id,
  r.ready_for_adoption,
  r.is_public_visible,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  private.approved_translations('residents'::text, r.id) as translations,
  case
    when s.current_status = any (array['Adopted'::text, 'Deceased'::text]) then s.current_status
    else 'Resident'::text
  end as status,
  r.breed_th,
  r.colour_th
from residents r
left join private.resident_current_state s on s.resident_id = r.id;

grant select on public_resident_cards to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_cards from anon, authenticated;

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
  case
    when exists (
      select 1 from attachments a
      where a.owner_type = 'resident'
        and a.owner_id = r.id
        and a.drive_file_id = r.profile_photo_drive_file_id
        and lower(btrim(coalesce(a.sub_folder, ''), E' \t\r\n\f\v')) <> 'medical'
        and coalesce(a.media_kind, 'photo') = 'photo'
        and coalesce(a.file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'
        and a.approval = 'public_ok'
    )
    and not exists (
      select 1 from attachments a
      where a.owner_type = 'resident'
        and a.owner_id = r.id
        and a.drive_file_id = r.profile_photo_drive_file_id
        and lower(btrim(coalesce(a.sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
    )
    then r.profile_photo_drive_file_id
    else null::text
  end as profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on,
  r.size,
  private.approved_translations('residents'::text, r.id) as translations,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  r.colour,
  r.is_desexed,
  (exists (
    select 1 from immunization_records i
    where i.resident_id = r.id and i.archived_at is null
  )) as is_vaccinated,
  r.hook_line,
  r.ideal_home,
  r.microchip_number is not null as is_microchipped,
  r.breed_th,
  r.colour_th
from residents r
where r.is_public_visible = true
  and coalesce((
    select s.current_status from private.resident_current_state s where s.resident_id = r.id
  ), 'Resident'::text) <> all (array['Deceased'::text, 'Adopted'::text]);

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_profiles from anon, authenticated;

create or replace view public_recent_adoptions as
select
  p.id,
  r.name,
  r.species,
  case
    when exists (
      select 1 from attachments a
      where a.owner_type = 'resident'
        and a.owner_id = r.id
        and a.drive_file_id = r.profile_photo_drive_file_id
        and lower(btrim(coalesce(a.sub_folder, ''), E' \t\r\n\f\v')) <> 'medical'
        and coalesce(a.media_kind, 'photo') = 'photo'
        and coalesce(a.file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'
        and a.approval = 'public_ok'
    )
    and not exists (
      select 1 from attachments a
      where a.owner_type = 'resident'
        and a.owner_id = r.id
        and a.drive_file_id = r.profile_photo_drive_file_id
        and lower(btrim(coalesce(a.sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
    )
    then r.profile_photo_drive_file_id
    else null::text
  end as profile_photo_drive_file_id,
  shelter_date(p.start_date) as adopted_on,
  r.id as resident_id
from placement_history p
join residents r on r.id = p.resident_id
where p.placement_type = 'Adopt'::placement_type
  and p.end_date is null
  and p.start_date >= (now() - '90 days'::interval)
  and r.is_public_visible = true
  and not exists (
    select 1 from private.resident_current_state s
    where s.resident_id = r.id and s.current_status = 'Deceased'::text
  );

grant select on public_recent_adoptions to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_recent_adoptions from anon, authenticated;

notify pgrst, 'reload schema';
