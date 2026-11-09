# site_content gets an insert policy, asked of the website.content card (#ipf1z b, schema half)

**Decided in the stream, 2026-11-09.** `0344_site_content_insert_policy.sql` adds `admin_insert_site_content`
(`for insert to authenticated with check ((select has_permission('website.content')) and id)`).

- **Why a card and not a role:** the update policy already asks `website.content` (0163); the insert asks the same card, so
  whoever may edit the page may recreate its row. Admin passes through `has_permission()`'s bypass, unchanged.
- **Why `and id`:** the table's `check (id)` and primary key already keep it to one row; the policy repeats it so the
  refusal for a false id is a policy refusal rather than a constraint error. Not security by itself.
- **Grants:** 0077 already grants insert on `site_content` to `authenticated`; no grant change.
- **Proof:** `node scripts/check-site-content-insert.mjs` (rollback harness, dev only): no card refused (42501), `id=false`
  refused, card with `id=true` inserts, a second insert refused (23505). Nothing commits.
- **Not done here:** the server action and button (the feature PR that follows), and the read-only
  `select id from public_site_content` on production and UAT, still owed to the planner. Production gets this migration at
  the next release's apply.
