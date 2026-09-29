-- Data API grants for fixed_outgoings (0114). Supabase no longer grants new
-- tables automatically (docs/decisions.md, 2026-09-24), and
-- scripts/check-migration-grants.mjs refuses a table created without one.
-- 0114 was applied to dev before the check ran; applied files are never
-- edited once shared, so the grant was first its own file. The lint wants the
-- grant in the creating file, so 0114 now carries it too; this file is the
-- same statement again (idempotent) and stays so dev and production apply
-- the same numbered list.
--
-- authenticated, not anon: RLS then limits authenticated to admin and
-- management (the only two policies). anon stays revoked.
--
-- Written to be safely re-runnable.

grant select, insert, update, delete on fixed_outgoings to authenticated, service_role;
revoke all on fixed_outgoings from anon;

notify pgrst, 'reload schema';
