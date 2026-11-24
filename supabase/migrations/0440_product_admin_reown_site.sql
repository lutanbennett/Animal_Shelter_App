-- consumer: none (ownership only; the console's website switch calls it unchanged)
--
-- #tnycl. Of the seven product-console definer functions 0436/0438 left owned by postgres (BYPASSRLS), exactly one can move to rls_definer:
-- product_admin_set_shelter_site reads and writes public.shelters only, and sets the shelter header itself, the same shape as
-- product_admin_set_shelter_archived (0428), which is already owned by rls_definer.
-- The other six stay postgres and are in ALLOWED (scripts/lib/tenancy-catalogue.mjs): two read auth.users, and four read public.roles / user_roles
-- with no shelter header set, so under rls_definer (a member of authenticated) the restrictive shelter_scope_select policy would hide every
-- shelter but the console's own. Measured on dev 2026-11-25: shelter_roles returned 0 rows (1 under postgres) and access_set_role failed with "no such role in this shelter".
-- Per-function table: docs/decisions/2026-11-25-tenancy-catalogue-seven.md. No body, gate or grant list is changed. Re-runnable.
-- TO UNDO: alter function public.product_admin_set_shelter_site(uuid, text) owner to postgres.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_set_shelter_site(uuid, text) owner to rls_definer;
  end if;
end $$;

revoke all on function public.product_admin_set_shelter_site(uuid, text) from public, anon;
grant execute on function public.product_admin_set_shelter_site(uuid, text) to authenticated, service_role;
