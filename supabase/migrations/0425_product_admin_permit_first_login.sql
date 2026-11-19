-- consumer: src/app/platform/actions.ts (createShelterAdminLogin)
-- #flogn. A product administrator could LINK an existing login to a new shelter's Admin role but could not make one, so a new shelter could not be
-- signed in to without a developer. DECIDED 2026-11-20 by Lutan: a narrow definer function gated on is_product_admin() and aal2 (like 0414/0415/0422),
-- NOT a card, and NOT a widening of the card security.createUser that a shelter's own Admin can grant (docs/decisions/2026-11-20-padmin-create-login.md).
-- A function in the database cannot create an auth user (that needs the service role), so this is the GATE the server action asks first: it answers only
-- when this is the FIRST login of a shelter that already has an Admin role (that role has nobody linked yet) and the address is not already a login,
-- and it records who was permitted to create which address for which shelter. The action then creates the login and links it with
-- product_admin_link_shelter_admin_by_email (0417). One narrow door, once per shelter: it cannot mint a second login for a shelter, or for any address that exists.
-- Grants nobody anything and reads no role key and no card. Admin is given no cards. Re-runnable.
-- TO UNDO: drop function public.product_admin_permit_first_login(uuid, text); drop table public.product_admin_login_grants.
create table if not exists public.product_admin_login_grants (
  id bigint generated always as identity primary key,
  actor uuid not null,
  for_shelter uuid not null,
  email text not null,
  at timestamptz not null default clock_timestamp()
);
create index if not exists product_admin_login_grants_at_idx on public.product_admin_login_grants (at desc);

alter table public.product_admin_login_grants enable row level security;
revoke all on public.product_admin_login_grants from anon, authenticated, service_role;
grant select on public.product_admin_login_grants to authenticated, service_role;
drop policy if exists product_admin_login_grants_select on public.product_admin_login_grants;
create policy product_admin_login_grants_select on public.product_admin_login_grants for select to authenticated using (public.is_product_admin());

create or replace function public.product_admin_login_grants_refuse_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'product_admin_login_grants is append-only: % is not allowed', tg_op using errcode = 'insufficient_privilege';
end;
$$;
revoke execute on function public.product_admin_login_grants_refuse_change() from public, anon, authenticated;
drop trigger if exists product_admin_login_grants_no_change on public.product_admin_login_grants;
create trigger product_admin_login_grants_no_change before update or delete on public.product_admin_login_grants
  for each row execute function public.product_admin_login_grants_refuse_change();
drop trigger if exists product_admin_login_grants_no_truncate on public.product_admin_login_grants;
create trigger product_admin_login_grants_no_truncate before truncate on public.product_admin_login_grants
  for each statement execute function public.product_admin_login_grants_refuse_change();

create or replace function public.product_admin_permit_first_login(p_shelter uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_role uuid; v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_email := lower(btrim(coalesce(p_email, '')));
  if p_email !~ '^[^@\s%_*]+@[^@\s%_*]+\.[^@\s%_*]+$' then raise exception 'not an email address' using errcode = '22023'; end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  select id into v_role from public.roles where shelter_id = p_shelter and is_admin;
  if v_role is null then raise exception 'shelter has no Admin role' using errcode = '22023'; end if;
  if exists (select 1 from public.user_roles where role_id = v_role) then raise exception 'shelter already has an Admin login' using errcode = '23505'; end if;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
  if exists (select 1 from auth.users u where lower(u.email) = p_email) then raise exception 'a login with that address already exists' using errcode = '23505'; end if;
  insert into public.product_admin_login_grants (actor, for_shelter, email) values ((select auth.uid()), p_shelter, p_email);
end;
$$;

revoke all on function public.product_admin_permit_first_login(uuid, text) from public, anon;
grant execute on function public.product_admin_permit_first_login(uuid, text) to authenticated, service_role;

-- OWNER: postgres, not rls_definer. The function reads auth.users, which rls_definer cannot (same as 0417's login_exists and by-email wrappers; precedent 0370).
