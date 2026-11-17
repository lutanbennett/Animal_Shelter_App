-- consumer: none
--
-- 0405's shelter_drive_status() is security definer; the tenancy lint (rule 2, 0375's convention) wants every such function owned by
-- rls_definer, not postgres, so it does not bypass row security. rls_definer holds definer_all on shelter_drive_credentials (0404) and
-- execute on is_admin() and current_shelter_id(), so the function still answers. Written as its own file because 0405 had already been
-- applied to dev when the lint flagged it (applied files are never edited). Re-runnable. TO UNDO: alter function ... owner to postgres.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.shelter_drive_status() owner to rls_definer;
  end if;
end $$;
