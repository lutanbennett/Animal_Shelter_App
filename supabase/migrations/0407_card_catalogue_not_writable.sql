-- consumer: scripts/check-card-catalogue-writes.mjs
--
-- #ctlg8. card_grants and card_includes are the card catalogue itself and are SHARED by every shelter (Part 10 decided that on reasons).
-- 0257 gave each one `for all ... is_admin()`, and is_admin() has no shelter condition, so a second shelter's Admin could rewrite what a
-- card grants for everybody. No screen writes these tables (migrations and the service role populate them), so writes come off every login.
--
-- AFTER THIS FILE:
--   select : unchanged. The only policy left is `for select using (is_admin())`, exactly the read access 0257 gave. (The app itself
--            reads through the service-role client in src/lib/permissions/card-grants.ts, which bypasses row security.)
--   insert, update, delete : NO permissive policy, so row security denies them to every login (anon and authenticated), Admin included.
--            The table privileges are also revoked from authenticated, so the refusal is "permission denied" before a policy is asked.
--   service role and migrations: unchanged; both bypass row security and the service role keeps its grants.
-- The restrictive *_requires_aal2 policies from 0257 are LEFT in place: with no permissive write policy they never decide anything,
-- but they are a second lock if a permissive write policy is ever added by mistake. Row security stays enabled. Nothing granted to anon.
-- Admin sitting outside the card system (can.ts, roles.is_admin) is untouched. Re-runnable.
drop policy if exists card_grants_admin_all on card_grants;
drop policy if exists card_includes_admin_all on card_includes;

drop policy if exists card_grants_admin_read on card_grants;
create policy card_grants_admin_read on card_grants for select using ((select public.is_admin()));
drop policy if exists card_includes_admin_read on card_includes;
create policy card_includes_admin_read on card_includes for select using ((select public.is_admin()));

revoke insert, update, delete on card_grants, card_includes from authenticated, anon;
