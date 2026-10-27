-- consumer: none
-- Card review 2 schema follow-ups (backlog item of that name). Two pieces, additive and re-runnable.
--   1. appeal_choices: a names-only view of the appeals still taking gifts, for whoever holds donation.receipt, so the donation
--      form can offer an appeal without the holder reading the appeals table (which asks appeal.run, a yes/no, and would hand over
--      write). Open = status <> 'closed', the same cut the donation form makes today. Columns are the five the picker draws;
--      nothing from the story, the deadline or the outcome note.
--   2. set_hero_photo(): the one way to change site_content.hero_drive_file_id for a login holding website.gallery. A column
--      policy is not possible (RLS is per row, column grants are per database role, neither can ask has_permission), so the
--      function is the only shape. Passing null clears the photo. website.content edit keeps its direct update unchanged.
-- Nothing is granted to Admin and no role is named. To undo, in a new file: drop view appeal_choices; drop function set_hero_photo(text).

create or replace view public.appeal_choices as
select
  a.id,
  a.title,
  r.name as resident_name,
  a.status,
  a.target_amount as target
from public.appeals a
join public.residents r on r.id = a.resident_id
where a.status <> 'closed'
  and (select public.has_permission('donation.receipt'));

comment on view public.appeal_choices is
  'Open appeals as names only (0274): id, title, resident name, status, target. Owner-run; the WHERE asks donation.receipt, so any other login reads no rows. The donation form reads this instead of appeals.';

revoke all on public.appeal_choices from public, anon, authenticated;
grant select on public.appeal_choices to authenticated;
grant all on public.appeal_choices to service_role;

create or replace function public.set_hero_photo(p_drive_file_id text)
returns void
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not coalesce((select has_permission('website.gallery')), false) then
    raise exception 'You do not have permission to change the website photo.' using errcode = '42501';
  end if;
  update site_content set hero_drive_file_id = nullif(btrim(p_drive_file_id), '') where id = true;
end;
$$;

revoke all on function public.set_hero_photo(text) from public, anon;
grant execute on function public.set_hero_photo(text) to authenticated, service_role;
