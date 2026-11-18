-- consumer: none
--
-- #swrun. scheduled_writer_runs (0408) is the one RLS table without the definer_all policy that rule 3 of
-- scripts/check-tenancy-catalogue.mjs requires of every public table; the strict lint read "1 flagged" because of it.
-- Same cause and same remedy as 0388 (donation_tax_ids, retention_runs): 0375 gave definer_all to the tables that existed
-- then, and nothing gives a LATER table one.
-- Oversight, not design: rule 3 is stated as "every RLS table", with no service-role-only carve-out, and the policy is
-- harmless here. It is for rls_definer only, so it widens nothing for any login (grants to anon/authenticated stay revoked).
-- No consumer: the Worker writes this table as service_role, which already holds the grants; a policy for another role
-- changes nothing it does. Re-runnable: dropped and recreated.

drop policy if exists definer_all on public.scheduled_writer_runs;
create policy definer_all on public.scheduled_writer_runs for all to rls_definer using (true) with check (true);
