-- consumer: src/app/admin/website/actions.ts
--
-- #shlog schema half, part 3: 0429's set_shelter_logo() was modelled on set_hero_photo() (0274) and copied its flaw. The function is
-- security definer, so it runs as the owner and the shelter_scope_update policy (0392) never applies; `where id = true` then matches EVERY
-- shelter's site_content row and one shelter's Admin would overwrite every other shelter's logo. Caught by supabase/harness/shelter_logo.sql
-- ("set touched the other shelter"). The update now also asks for the request's shelter, as the policy would; a trusted caller with no
-- header (null) matches nothing, deliberately: a logo is set by a person on their own shelter's site, never in bulk.
-- set_hero_photo() has the same flaw and is NOT changed here (not this item's file): see the decision file, for the planner to file.
-- Re-runnable. To undo: re-run 0429's body of the function.

create or replace function public.set_shelter_logo(p_drive_file_id text)
returns void
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not coalesce((select has_permission('website.gallery')), false) then
    raise exception 'photo.website_not_allowed' using errcode = '42501';
  end if;
  update site_content
     set logo_drive_file_id = nullif(btrim(p_drive_file_id), '')
   where id = true and shelter_id = (select current_shelter_id());
end;
$$;

revoke all on function public.set_shelter_logo(text) from public, anon;
grant execute on function public.set_shelter_logo(text) to authenticated, service_role;
