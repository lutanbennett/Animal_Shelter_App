-- consumer: src/lib/residents/public.ts, src/lib/enclosures/public.ts, src/app/e/[id]/page.tsx, src/app/adopt/page.tsx, src/app/sitemap.ts, src/lib/site/impact.ts
--
-- Multi-tenancy programme (#vleak): the two public views the canary parked in KNOWN_TODAY now filter by shelter. 0390 stamped every residents,
-- placement_history and prescriptions row with Lanna and gave the column a default, so there is a value to filter on.
--
--   public_resident_cards  (0342's definition, column for column) gains  where r.shelter_id = current_shelter_id().
--   public_shelter_stats   (0328's definition, column for column) counts only rows whose shelter is current_shelter_id().
--
-- WHAT CHANGES, ON PURPOSE. 0350 said the kennel card "always answers" (it ignores is_public_visible). That promise is kept FOR THE CALLER'S OWN
-- SHELTER: every resident of the shelter the request's x-shelter-id names still answers. What goes is the answer for ANOTHER shelter's residents,
-- and for a request with NO header: current_shelter_id() is null there, so `shelter_id = null` is never true and an anonymous caller with no header
-- reads zero rows (cards) and counts of 0 (stats). Counts stay 0, not null, so the website's tiles read "nothing to show", as before.
-- Dev has no Worker, so a localhost session sends no header and sees these empty until tenancy-localhost-shelter lands (no Lanna fallback here).
-- public_enclosures (0350) joins this view, so it now scopes too. Both views keep owner rights, and current_setting('request.headers') is a
-- request setting, not a role setting, so the header still reaches current_shelter_id() through the view.
-- Grants restated exactly as 0342 / 0328 left them (anon and authenticated select, nothing else). No policy, no role key.
--
-- Re-runnable. To undo: re-run 0342's public_resident_cards and 0328's public_shelter_stats definitions.

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
left join private.resident_current_state s on s.resident_id = r.id
where r.shelter_id = current_shelter_id();

grant select on public_resident_cards to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_cards from anon, authenticated;

create or replace view public_shelter_stats as
select
  case when coalesce((select show_on_website from public_stat_switches where key = 'in_care'), true) then
    (select count(*) from private.resident_current_state c join residents r on r.id = c.resident_id
       where r.shelter_id = current_shelter_id()
         and c.current_status in ('Resident', 'Unassigned', 'Hospitalised', 'Fostered'))::integer
  end as in_care,
  (select count(*) from private.resident_current_state c join residents r on r.id = c.resident_id
     where r.shelter_id = current_shelter_id() and c.current_status = 'Hospitalised')::integer as in_hospital,
  case when coalesce((select show_on_website from public_stat_switches where key = 'in_foster'), true) then
    (select count(*) from private.resident_current_state c join residents r on r.id = c.resident_id
       where r.shelter_id = current_shelter_id() and c.current_status = 'Fostered')::integer
  end as in_foster,
  (select count(*) from private.resident_current_state s
     join residents r on r.id = s.resident_id
     where r.shelter_id = current_shelter_id()
       and r.ready_for_adoption and r.is_public_visible
       and s.current_status not in ('Deceased', 'Adopted'))::integer as ready_for_adoption,
  (select count(*) from placement_history
     where shelter_id = current_shelter_id()
       and placement_type = 'Adopt'
       and start_date >= now() - interval '7 days')::integer as adopted_last_7_days,
  case when coalesce((select show_on_website from public_stat_switches where key = 'adopted_this_year'), true) then
    (select count(*) from placement_history
       where shelter_id = current_shelter_id()
         and placement_type = 'Adopt'
         and shelter_date(start_date) >= make_date(extract(year from shelter_today())::integer, 1, 1))::integer
  end as adopted_this_year,
  (select count(*) from placement_history
     where shelter_id = current_shelter_id()
       and placement_type = 'Intake'
       and shelter_date(start_date) >= make_date(extract(year from shelter_today())::integer, 1, 1)
  )::integer as intakes_this_year,
  case when coalesce((select show_on_website from public_stat_switches where key = 'in_treatment'), true) then
    (select count(*) from private.resident_current_state s join residents r on r.id = s.resident_id
       where r.shelter_id = current_shelter_id()
         and s.current_status in ('Resident', 'Unassigned', 'Hospitalised', 'Fostered')
         and (
           s.current_status = 'Hospitalised'
           or exists (
             select 1 from prescriptions p
              where p.resident_id = s.resident_id
                and p.archived_at is null
                and (p.end_date is null or p.end_date >= shelter_today())
           )
         ))::integer
  end as in_treatment;

grant select on public_shelter_stats to anon, authenticated;
