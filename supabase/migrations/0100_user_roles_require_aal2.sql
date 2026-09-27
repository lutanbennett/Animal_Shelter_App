-- Writes to user_roles need a 2-step-verified session (backlog, "Settings →
-- Security requires 2-step verification", 2026-09-26; schema half — the
-- feature half adds the enrolment / step-up page and the aal2 check in
-- every server action in src/app/admin/security/).
--
-- A session that has passed Supabase Auth's authenticator-app (TOTP) factor
-- carries `aal: "aal2"` in its JWT. These RESTRICTIVE policies are AND-ed
-- with admin_all_user_roles (0001), so an insert, update or delete on
-- user_roles made with a user's JWT must now be both an admin's AND aal2.
-- Reads are untouched: select stays admin-only at aal1, and
-- current_user_role() is security definer, so every other policy in the
-- database still resolves roles exactly as before.
--
-- Why this is safe to apply before 2-step verification exists
-- (docs/decisions.md, 2026-09-27):
--   - Nothing in the app writes user_roles with a user's JWT. Every write —
--     create a login, approve an access request, change a role, archive,
--     restore — goes through createAdminClient() (the service role) in
--     src/app/admin/security/actions.ts; the auth callback and login only
--     read. No database function or trigger writes it either. The service
--     role and postgres have BYPASSRLS, so these policies never apply to
--     them: /admin/security works exactly as it did, and so does
--     scripts/bootstrap-admin.mjs, the recovery route.
--   - What it does close today is the one path that bypasses the app: an
--     admin's aal1 access token used directly against the Data API
--     (PostgREST) to grant a role. Nobody legitimately does that.
--   - It is deliberately unconditional — not "only once a factor is
--     enrolled". A conditional rule would leave an admin who has never
--     enrolled writable at aal1, which is precisely the account a stolen
--     password would target.
-- Because the service role bypasses RLS, this policy is defence in depth,
-- not the enforcement: the feature half must check aal2 in each action.
--
-- Written to be safely re-runnable.

drop policy if exists user_roles_insert_requires_aal2 on user_roles;
create policy user_roles_insert_requires_aal2 on user_roles
  as restrictive for insert
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists user_roles_update_requires_aal2 on user_roles;
create policy user_roles_update_requires_aal2 on user_roles
  as restrictive for update
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists user_roles_delete_requires_aal2 on user_roles;
create policy user_roles_delete_requires_aal2 on user_roles
  as restrictive for delete
  using ((select auth.jwt() ->> 'aal') = 'aal2');
