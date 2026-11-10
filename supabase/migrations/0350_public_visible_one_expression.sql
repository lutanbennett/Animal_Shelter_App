-- consumer: src/lib/residents/public.ts, src/lib/enclosures/public.ts, src/app/e/[id]/page.tsx, src/app/adopt/page.tsx, src/app/sitemap.ts
-- 0350: ONE definition of "this animal is on the website" (#w8k4p, #r9wtk). Lutan 2026-11-09: Ready for adoption = Show on website;
-- a running appeal keeps the animal public for its duration and overrides the flag.
-- private.on_website (view of resident ids) = adoption-ready OR a running, text-approved appeal.
-- public_enclosures (0347) and public_resident_profiles (0343) both ask it. public_resident_cards is NOT changed (kennel card always answers).
-- is_public_visible is no longer read by the views; both write paths still set it equal to ready_for_adoption.
-- Additive and re-runnable. Undo: re-run 0347's public_enclosures and 0343's public_resident_profiles definitions, then drop view private.on_website.

-- A view, not a function: a function would read appeals with the CALLER's rights (anon cannot), whereas a view's tables are read
-- with its owner's. Not granted to anyone: the public views below read it as their owner.
create or replace view private.on_website as
select r.id as resident_id
  from residents r
 where r.ready_for_adoption
    or exists (select 1 from appeals a
                where a.resident_id = r.id
                  and private.appeal_running(a.published, a.status)
                  and a.text_approval = 'public_ok');

create or replace view public_resident_profiles as
SELECT id,
    name,
    species,
    breed,
    sex,
    ready_for_adoption,
    bio,
    temperament_notes,
    past_story_notes,
        CASE
            WHEN ((EXISTS ( SELECT 1
               FROM attachments a
              WHERE ((a.owner_type = 'resident'::attachment_owner_type) AND (a.owner_id = r.id) AND (a.drive_file_id = r.profile_photo_drive_file_id) AND (lower(btrim(COALESCE(a.sub_folder, ''::text), E' \t\r\n\f\v')) <> 'medical'::text) AND (COALESCE(a.media_kind, 'photo'::text) = 'photo'::text) AND (COALESCE(a.file_name, ''::text) !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'::text) AND (a.approval = 'public_ok'::text)))) AND (NOT (EXISTS ( SELECT 1
               FROM attachments a
              WHERE ((a.owner_type = 'resident'::attachment_owner_type) AND (a.owner_id = r.id) AND (a.drive_file_id = r.profile_photo_drive_file_id) AND (lower(btrim(COALESCE(a.sub_folder, ''::text), E' \t\r\n\f\v')) = 'medical'::text)))))) THEN profile_photo_drive_file_id
            ELSE NULL::text
        END AS profile_photo_drive_file_id,
    estimated_age_years,
    intake_date,
    age_estimated_on,
    size,
    private.approved_translations('residents'::text, id) AS translations,
    good_with_dogs,
    good_with_cats,
    good_with_children,
    energy_level,
    colour,
    is_desexed,
    (EXISTS ( SELECT 1
           FROM immunization_records i
          WHERE ((i.resident_id = r.id) AND (i.archived_at IS NULL)))) AS is_vaccinated,
    hook_line,
    ideal_home,
    (microchip_number IS NOT NULL) AS is_microchipped,
    breed_th,
    colour_th
   FROM residents r
  WHERE (r.id IN (SELECT resident_id FROM private.on_website) AND (r.text_approval = 'public_ok'::text) AND (COALESCE(( SELECT s.current_status
           FROM private.resident_current_state s
          WHERE (s.resident_id = r.id)), 'Resident'::text) <> ALL (ARRAY['Deceased'::text, 'Adopted'::text])));

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_profiles from anon, authenticated;

create or replace view public_enclosures as
select
  e.id,
  e.name,
  e.name_th,
  z.name as zone_name,
  z.name_th as zone_name_th,
  coalesce(
    (select jsonb_agg(to_jsonb(c) order by c.name, c.resident_code)
       from private.resident_current_state s
       join public_resident_cards c on c.id = s.resident_id
       join residents r on r.id = s.resident_id
      where s.current_enclosure_id = e.id
        and r.id in (select resident_id from private.on_website)),
    '[]'::jsonb
  ) as residents
from enclosures e
join zones z on z.id = e.zone_id
where z.name <> 'Lifecycle';

grant select on public_enclosures to anon, authenticated, service_role;
revoke insert, update, delete, truncate, references, trigger on public_enclosures from anon, authenticated;

notify pgrst, 'reload schema';

-- Dev only: an earlier draft of this file defined a function of this name.
drop function if exists private.on_website(uuid, boolean);
