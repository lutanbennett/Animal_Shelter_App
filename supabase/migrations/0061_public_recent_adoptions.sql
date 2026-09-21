-- "Happy endings" on the public adoption listing (backlog, Public
-- website: the "Recently adopted" strip under Foster / Volunteer / Donate).
--
-- Adopted residents leave public_resident_profiles (0025) — their page
-- would be a dead end — but the adoptions themselves are the best news a
-- shelter has. This view lists the Adopt placements of the last 90 days
-- that are still open (a returned animal drops off) for residents the
-- shelter had marked public, as name, photo, species and the month they
-- went home: no carer, no id that leads anywhere, nothing about why they
-- were here. is_public_visible is kept as the consent flag — a resident
-- never shown on the site isn't shown leaving it either.
--
-- Ordinary view (owner's rights, like public_shelter_stats) granted
-- SELECT only to anon / authenticated; checked by check-public-views.mjs.

create or replace view public_recent_adoptions as
select
  p.id,
  r.name,
  r.species,
  r.profile_photo_drive_file_id,
  p.start_date::date as adopted_on
from placement_history p
join residents r on r.id = p.resident_id
where p.placement_type = 'Adopt'
  and p.end_date is null
  and p.start_date >= now() - interval '90 days'
  and r.is_public_visible = true
  and not exists (
    select 1 from resident_current_state s
     where s.resident_id = r.id and s.current_status = 'Deceased'
  );

grant select on public_recent_adoptions to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_recent_adoptions from anon, authenticated;

notify pgrst, 'reload schema';
