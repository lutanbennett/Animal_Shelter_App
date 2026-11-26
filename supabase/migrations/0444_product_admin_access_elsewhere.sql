-- consumer: src/app/platform/access-actions.ts
--
-- #acwho, CONSOLE HALF (docs/decisions/2026-11-26-shelter-membership-console.md). Since 0443 one person may hold a main role in each of
-- several shelters. The console's Access list for a shelter marks a login that also works elsewhere with a COUNT of the other shelters,
-- never their names: Lutan's privacy line, and the 0443 specification's.
--
-- product_admin_access_elsewhere(p_shelter): for every login with any row in p_shelter, how many OTHER shelters it holds a live main role in.
-- Product administrator and aal2 inside the body, like its 0438 neighbours. Reads public.user_roles only (no auth.users), returns no shelter
-- id or name. Logins with no live main role elsewhere are not returned (the caller treats absence as zero).
--
-- Re-runnable. TO UNDO: drop function public.product_admin_access_elsewhere(uuid).

create or replace function public.product_admin_access_elsewhere(p_shelter uuid)
returns table (user_id uuid, other_shelters integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  return query
    select o.user_id, count(distinct o.shelter_id)::integer
    from public.user_roles o
    where o.is_main and o.archived_at is null and o.shelter_id <> p_shelter
      and o.user_id in (select h.user_id from public.user_roles h where h.shelter_id = p_shelter)
    group by o.user_id;
end;
$$;

revoke all on function public.product_admin_access_elsewhere(uuid) from public, anon;
grant execute on function public.product_admin_access_elsewhere(uuid) to authenticated, service_role;
