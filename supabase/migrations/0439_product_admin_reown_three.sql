-- consumer: none (ownership only; src/app/platform/actions.ts and ShelterAccess.tsx call these unchanged)
--
-- #tnycl. Five of the seven product-console definer functions that 0436/0438 left owned by postgres (BYPASSRLS) read no auth.users, so they
-- are re-owned to rls_definer, as product_admin_set_shelter_archived (0428) and product_admin_shelters (0412) already are:
--   product_admin_set_shelter_site        reads and writes public.shelters only
--   product_admin_shelter_roles           reads public.roles only
--   product_admin_access_would_lock_out   reads public.user_roles and public.roles only
--   product_admin_access_set_role         reads public.roles and user_roles, writes user_roles; calls would_lock_out
--   product_admin_access_remove           reads user_roles, writes user_roles; calls would_lock_out
-- product_admin_shelter_access (joins auth.users) and product_admin_access_add (looks an email up in auth.users) stay postgres and are in
-- ALLOWED in scripts/lib/tenancy-catalogue.mjs. Per-function table: docs/decisions/2026-11-25-tenancy-catalogue-seven.md.
-- No body, gate or grant list is changed. postgres is granted execute on would_lock_out explicitly because the postgres-owned access_add calls it.
-- Re-runnable. TO UNDO: alter function ... owner to postgres.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_set_shelter_site(uuid, text) owner to rls_definer;
    alter function public.product_admin_shelter_roles(uuid) owner to rls_definer;
    alter function public.product_admin_access_would_lock_out(uuid, uuid) owner to rls_definer;
    alter function public.product_admin_access_set_role(uuid, uuid, text) owner to rls_definer;
    alter function public.product_admin_access_remove(uuid, uuid) owner to rls_definer;
  end if;
end $$;

revoke all on function public.product_admin_set_shelter_site(uuid, text), public.product_admin_shelter_roles(uuid),
  public.product_admin_access_set_role(uuid, uuid, text), public.product_admin_access_remove(uuid, uuid) from public, anon;
grant execute on function public.product_admin_set_shelter_site(uuid, text), public.product_admin_shelter_roles(uuid),
  public.product_admin_access_set_role(uuid, uuid, text), public.product_admin_access_remove(uuid, uuid) to authenticated, service_role;
revoke all on function public.product_admin_access_would_lock_out(uuid, uuid) from public, anon;
grant execute on function public.product_admin_access_would_lock_out(uuid, uuid) to postgres;
