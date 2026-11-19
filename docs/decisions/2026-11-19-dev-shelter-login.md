# 2026-11-19 — a dev login that holds a role on a second shelter (#dvshl), and its first use (#stcnt)

**Shape (deliverable 1).** Roles are rows in `roles` keyed `(shelter_id, key)` (0387), so a role on another shelter is a row, not a schema
change. `scripts/dev-signin.mjs --shelter <key|id>`:

- **Table / key:** `roles`, with `shelter_id` set explicitly. Key = the existing `dev_signin_cards_<hash>_<port>` plus `_s<first 6 of the
  shelter id>`, so two streams (port) and two shelters never collide. A positional role (`admin`) is looked up on that shelter; a bare shelter
  has no Admin, so a throwaway one (`dev_signin_admin_<port>_s<id6>`, `is_admin`) is made, only when none exists.
- **Link:** `user_roles` (the shelter and main-role columns take their values from the `x-shelter-id` header the script now sends for the
  target shelter). The login email carries the same tag.
- **Removal:** `--remove <role|--cards a,b> --shelter X --port N` removes that key and that login only. `--remove` with no argument is unchanged.
- **The browser's shelter comes from the dev server, not the login** (`DEV_SHELTER_ID`, `src/lib/supabase/shelter-header.ts`). The script says so.

**Deliverable 6: a migration was needed, `0422`.** `user_roles_keep_an_admin` (0132) found Admin by `key = 'admin'`. With two shelters holding an
Admin role that subquery returns two rows, and **every delete or update on `user_roles` failed** ("more than one row returned by a
subquery"), for every role on every shelter, so no stream could re-sign-in or remove a login. It now asks the row's own role (`is_admin`).
Applied to dev. Same intent: never drop a shelter's last live Admin link.

**Last-Admin guard vs `--remove`.** The guard (deferred to commit) refuses to drop a sole Admin link row by row, even for the service role.
The throwaway Admin is removed role and link in one SQL block through the Management API, which commits with the role already gone. A
re-sign-in of an existing throwaway Admin keeps its link instead of delete-and-reinsert.

**Use (deliverable 5).** Signed in as the throwaway Admin on `test-shelter-2` at aal2, dev server on `DEV_SHELTER_ID=test-shelter-2`'s id,
`/admin/stocktaking`: Food "Switch off" pressed, the page re-rendered showing Food Off; "Switch on" pressed, both back to On. **Outcome: the
switch saves on a second shelter** (its `site_content` row exists). The `errors.noRow` refusal was not seen, because that shelter has a row.
Throwaway role and login removed; nothing left on `test-shelter-2` (its two roles from another stream untouched).
