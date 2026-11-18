-- consumer: none yet. The app half of #shmgt (next batch) will read is_product_admin() and product_admin_shelters() from a screen it has not
-- built; nothing reads these objects today.
--
-- #shmgt SCHEMA HALF. PADMIN (Product Admin) is a LIST OF PEOPLE, no role, no card, no cell. Lutan, 2026-11-18: "for access control it should
-- just be a list of people with Product Admin (PADMIN)" and "doesnt need roles or cards". The THIRD named exception to the zero-exceptions rule
-- after Admin and the adopter website account (docs/decisions/2026-11-18-product-admin-list-schema.md). Not a precedent.
--
-- IDENTITY: auth.users.id, never a role name and never an email. An id survives an email change; a list keyed on email would silently
-- lose the person (or hand the seat to whoever next held that address). Nothing here reads a role.
--
-- THE LIST: product_admins. anon holds nothing; authenticated holds select, insert and delete only through policies that answer is_product_admin(); a shelter Admin is not
-- on the list, so they read zero rows and cannot put themselves on it. Writes (insert, delete only; no update) need a PADMIN AND an aal2
-- session: RESTRICTIVE policies AND-ed on, the 0100 pattern. Reads stay at aal1, as 0100 left them. The first row is placed with the
-- service role (which bypasses RLS); no real person is seeded here.
--
-- product_admin_shelters(): the cross-shelter read the management screen calls. DELIBERATELY NOT SCOPED BY current_shelter_id(), which
-- 0405's shelter_drive_status() IS: a management surface is the one place that must see EVERY shelter. The gate is is_product_admin(),
-- nothing else. Columns, each there for a reason: id (what a later write names), key and name (what the list shows), created_at (when it
-- was set up), hosts (the web addresses mapped to it, so the screen can show them). NEVER a client id, secret, token or credential.
-- Re-runnable. TO UNDO: drop function public.product_admin_shelters(); drop function public.is_product_admin(); drop table public.product_admins.

create table if not exists public.product_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  added_by   uuid references auth.users(id) on delete set null,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.product_admins enable row level security;
revoke all on public.product_admins from anon, authenticated;
grant select, insert, delete on public.product_admins to authenticated;
grant select, insert, update, delete on public.product_admins to service_role;

-- The one place "is the caller a PADMIN" is asked. Security definer so it can read a list no login may read directly.
create or replace function public.is_product_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.product_admins where user_id = (select auth.uid()));
$$;

revoke all on function public.is_product_admin() from public, anon;
grant execute on function public.is_product_admin() to authenticated, service_role;

drop policy if exists product_admins_select on public.product_admins;
create policy product_admins_select on public.product_admins for select to authenticated using (public.is_product_admin());
drop policy if exists product_admins_insert on public.product_admins;
create policy product_admins_insert on public.product_admins for insert to authenticated with check (public.is_product_admin());
drop policy if exists product_admins_delete on public.product_admins;
create policy product_admins_delete on public.product_admins for delete to authenticated using (public.is_product_admin());

drop policy if exists product_admins_insert_requires_aal2 on public.product_admins;
create policy product_admins_insert_requires_aal2 on public.product_admins
  as restrictive for insert to authenticated
  with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists product_admins_delete_requires_aal2 on public.product_admins;
create policy product_admins_delete_requires_aal2 on public.product_admins
  as restrictive for delete to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2');

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    drop policy if exists definer_all on public.product_admins;
    create policy definer_all on public.product_admins for all to rls_definer using (true) with check (true);
  end if;
end $$;

create or replace function public.product_admin_shelters()
returns table (id uuid, key text, name text, created_at timestamptz, hosts text[])
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.key, s.name, s.created_at,
         coalesce((select array_agg(h.host order by h.host) from public.shelter_hosts h where h.shelter_id = s.id), '{}')
  from public.shelters s
  where public.is_product_admin()
  order by s.created_at, s.key;
$$;

revoke all on function public.product_admin_shelters() from public, anon;
grant execute on function public.product_admin_shelters() to authenticated, service_role;
