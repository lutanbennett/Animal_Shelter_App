-- consumer: none
--
-- #w4t9k. The two tables added after the re-own (0375) never got the definer_all policy that rule 3 of
-- scripts/check-tenancy-catalogue.mjs requires of every RLS table: donation_tax_ids (0381) and retention_runs (0385).
-- 0375 created definer_all in a one-off loop over the tables that existed then; nothing gives a LATER table one.
-- Why each needs it, not just the lint: purge_donation_tax_ids() (0385) is security definer, deletes from donation_tax_ids and
-- inserts into retention_runs. It is owned by postgres today (not API-executable, so out of the re-own's scope) and works. If it is
-- ever owned by rls_definer, a table without definer_all reads and deletes NOTHING: the thirteen-digit-ID retention would silently
-- stop purging while the cron job reports success. This policy is for rls_definer only; it widens nothing for any login.
-- Re-runnable: each policy is dropped and recreated.

drop policy if exists definer_all on public.donation_tax_ids;
create policy definer_all on public.donation_tax_ids for all to rls_definer using (true) with check (true);

drop policy if exists definer_all on public.retention_runs;
create policy definer_all on public.retention_runs for all to rls_definer using (true) with check (true);
