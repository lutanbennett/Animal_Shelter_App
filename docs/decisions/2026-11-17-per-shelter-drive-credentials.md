# Per-shelter Google Drive credentials: a table of its own, service-role only, ciphertext (Part 9, #o2iyh, schema half)

**Decided 2026-11-17 by the stream, as the item asked. Not Lutan's.**

## Where they live
`shelter_drive_credentials` (migration 0404), one row per shelter, `shelter_id` primary key. Columns: `oauth_client_id`,
`oauth_client_secret_enc`, `refresh_token_enc`, `drive_account_email`, and status columns `token_status` (`unchecked|ok|dead`),
`last_checked_at`, `last_error`, `dead_alerted_at`. Worker secrets do not scale to seven shelters; the database does.

## Why not columns on `shelters` (the 0398 precedent)
0398 put a folder id there, which is not a secret. `shelters` is read by the host lookup on every request, so a token on it would
ride in rows existing readers already fetch. A table nobody reads by accident keeps the secret out of all of them.
0392's loop does exclude `shelters` (`relname <> 'shelters'`), but that was not the deciding fact: `shelters` has no grant to
anon/authenticated (0382) and only `definer_all`, so it is equally closed to logins. The deciding fact is blast radius.

## How protected, in checkable terms
- anon and authenticated hold **no grant**: a login with no card, or any card, reads nothing. Admin's bypass is in `has_permission()`
  and does not reach a table with no grant; Admin gets a status-only RPC from the app half.
- Read and write: `service_role` only (and `rls_definer` via `definer_all`, 0375 convention).
- Secrets stored as **ciphertext**; the key is one Worker secret (`DRIVE_CREDENTIALS_KEY`), not in the database, so a dump yields nothing usable.
- 0392-shaped restrictive policies (`shelter_scope_select/update/delete`) written explicitly, because 0392 already ran.
- Carries `shelter_id`, so `docs/tenancy-shared-tables-registry.json` is owed nothing.

## Empty on purpose
Credentials differ per environment. Until a shelter has a row, the reader falls back to the env variables (Lanna unchanged).
No populate step: tokens are minted by the shelter's own consent flow (app half), not copied from env, so
`populate-shelter-settings.mjs` is the wrong home (it copies env values; this value must be encrypted by the app).

## `driveRootFolderId()` falling back (deliverable 9)
Make it loud in the app half's credentials reader, not onboarding's screen: the reader is the one place every Drive call passes.
Rule: a shelter other than the fallback shelter with no row, or no folder id, **refuses** rather than falling back.
Onboarding (#omt6u) then only needs to create the row.
