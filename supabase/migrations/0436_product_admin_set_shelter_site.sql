-- consumer: none (the console control that calls it is the next PR, claude/shelter-website-unlock)
--
-- #wbopn SCHEMA HALF. The console could only DISPLAY a shelter's website state (shelters.public_site, 0426); nothing could set it.
-- This is the one write: a product administrator + aal2 sets it to open, locked or off. A shelter is born 'locked' (0426's column default),
-- so this is what unlocks it. The deployment floor (PUBLIC_SITE) still wins when more closed: the shelter's value can only close further.
-- Same shape and shelter-header handling as product_admin_set_shelter_archived (0428). Re-runnable.

create or replace function public.product_admin_set_shelter_site(p_shelter uuid, p_site text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if p_site is null or p_site not in ('open', 'locked', 'off') then raise exception 'site must be open, locked or off' using errcode = '22023'; end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  update public.shelters set public_site = p_site where id = p_shelter;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

revoke all on function public.product_admin_set_shelter_site(uuid, text) from public, anon;
grant execute on function public.product_admin_set_shelter_site(uuid, text) to authenticated, service_role;
