-- consumer: none
-- #tncy3: closes two of the three flags check-tenancy-catalogue.mjs raised at every release since 0.47.2.
--   (b) 0425 enabled row-level security on product_admin_login_grants and added no definer_all policy, so every view over it
--       reads 0 rows for the re-owned role (a blank page, not a leak; writes go through the definer function and still work).
--   (c) 0429 left set_shelter_logo() owned by postgres; 0428 and 0433 carry the owner line and set_hero_photo has it. The
--       function reads no auth.users, so nothing prevents the re-own, and 0431 already scopes its body to the shelter.
-- The third flag, product_admin_permit_first_login, is deliberately NOT touched: it reads auth.users (0425 line 67).
-- Re-runnable.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    if not exists (select 1 from pg_policy p where p.polrelid = 'public.product_admin_login_grants'::regclass and p.polname = 'definer_all') then
      create policy definer_all on public.product_admin_login_grants for all to rls_definer using (true) with check (true);
    end if;
    alter function public.set_shelter_logo(text) owner to rls_definer;
  end if;
end $$;
