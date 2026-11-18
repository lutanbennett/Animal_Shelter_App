-- consumer: none yet (the app half of #shmgt, next batch)
--
-- 0411's two security definer functions must be owned by rls_definer, not postgres (the tenancy lint's rule 2, the 0375 convention; same as 0406 for
-- 0405 and 0410). rls_definer holds definer_all on product_admins (0411), shelters and shelter_hosts (0382), so both still answer. Its own file
-- because 0411 was applied to dev before the lint ran (applied files are never edited). Re-runnable. TO UNDO: alter function ... owner to postgres.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.is_product_admin() owner to rls_definer;
    alter function public.product_admin_shelters() owner to rls_definer;
  end if;
end $$;
