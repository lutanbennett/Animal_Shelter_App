# 2026-09-27 — Two page slugs and `aal2` on `user_roles` (`0099`, `0100`)

One schema PR for three batch-4 features, because only one stream may carry
a migration at a time.

- **`0099`: slugs `relocation` and `shelter-friends-join`.** The pet
  relocation page and the "Become a Shelter Friend" page are `site_pages`
  rows like `/foster`, so `site_pages_slug_check` is widened to seven slugs
  and both rows are seeded with a title ("Pet relocation", "Become a Shelter
  Friend") and an empty body. The feature halves add each slug to
  `SITE_PAGE_SLUGS` in `src/lib/site/pages.ts`; until then `/admin/website`
  filters the rows out and no route reads them. Whether the join page is
  `/friends/join` or a section of `/friends` is the feature half's call — the
  slug does not depend on it. The seed titles went through the insert
  trigger, so each has a Thai title waiting in the translation queue (one
  entry each, on dev as of this apply).
- **`0100`: restrictive policies require `auth.jwt()->>'aal' = 'aal2'` for
  insert, update and delete on `user_roles`.** Restrictive, so they AND with
  `admin_all_user_roles` — aal2 is an extra requirement, never a grant (a
  staff login at aal2 still cannot write). Reads are untouched, and
  `current_user_role()` is security definer, so every other policy resolves
  roles exactly as before.
- **Why it is safe to merge before 2-step verification exists, unconditionally
  rather than "only once a factor is enrolled":** nothing in the app writes
  `user_roles` with a user's JWT. Every write in
  `src/app/admin/security/actions.ts` (create a login, approve a request,
  change a role, archive, restore) uses `createAdminClient()`, the service
  role; the auth callback and login only read; no function or trigger writes
  it. `service_role` and `postgres` have `BYPASSRLS` (checked on dev), so the
  policies never apply to them. What they close today is exactly one path:
  an admin's aal1 access token used straight against the Data API to grant a
  role — which no one does legitimately, and which is what a stolen password
  would be used for. A conditional form ("aal2 once enrolled") would leave
  every never-enrolled admin open at aal1, i.e. the whole shelter until the
  feature ships and possibly after. `scripts/check-user-roles-aal2.mjs` is the
  proof, run on dev after the apply: an admin at aal1 still resolves as admin
  and reads every role row; the same admin at aal1 (or with no `aal` claim)
  is refused insert and touches 0 rows on update/delete; at aal2 the same
  writes succeed; staff at aal2 are still refused; the service role inserts,
  upserts, archives, restores and deletes as before.
- **So the policy is defence in depth, not the enforcement.** Because
  `/admin/security` writes with the service role, the policy does nothing to
  an aal1 session using the page. The feature half must check aal2 in each
  server action itself (the backlog item says so); do not read this policy as
  having done that.
- **Recovery is unchanged, and has a gap the feature half must fill.**
  `scripts/bootstrap-admin.mjs` writes with the service role and is
  unaffected by the policy. But it refuses to run once any `user_roles` row
  exists — it creates the *first* admin, it does not rescue an existing one.
  The backlog item's "bootstrap-admin can remove a factor as the last
  resort" is therefore new work for the feature half (a flag that deletes an
  `auth.mfa_factors` row for one user with the service role), not something
  this PR already provides. Until 2-step exists nobody can be locked out by a
  lost phone, because no action requires aal2 yet.
- **Rollback:** drop the three `user_roles_*_requires_aal2` policies. Nothing
  depends on them.
