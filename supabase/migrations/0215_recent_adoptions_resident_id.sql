-- consumer: src/app/adopt/HappyEndings.tsx
--
-- The /adopt "Happy endings" pictures must link to a page showing that
-- animal's published success stories (public_adoption_updates), but the view
-- exposed only the placement id. Append the resident's id as the LAST column.
-- Nothing new is revealed: public_resident_cards already exposes resident ids,
-- and this view still requires is_public_visible and excludes Deceased.
--
-- Every existing column is restated exactly as live (pg_get_viewdef on dev,
-- 2026-10-17); create or replace view allows only appending columns.

create or replace view public_recent_adoptions as
select
  p.id,
  r.name,
  r.species,
  case
    when exists (
      select 1 from attachments a
       where a.owner_type = 'resident'::attachment_owner_type
         and a.owner_id = r.id
         and a.drive_file_id = r.profile_photo_drive_file_id
         and lower(btrim(coalesce(a.sub_folder, ''::text))) = 'medical'::text
    ) then null::text
    else r.profile_photo_drive_file_id
  end as profile_photo_drive_file_id,
  shelter_date(p.start_date) as adopted_on,
  r.id as resident_id
from placement_history p
join residents r on r.id = p.resident_id
where p.placement_type = 'Adopt'::placement_type
  and p.end_date is null
  and p.start_date >= (now() - interval '90 days')
  and r.is_public_visible = true
  and not exists (
    select 1 from private.resident_current_state s
     where s.resident_id = r.id and s.current_status = 'Deceased'::text
  );

grant select on public_recent_adoptions to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_recent_adoptions from anon, authenticated;

notify pgrst, 'reload schema';
