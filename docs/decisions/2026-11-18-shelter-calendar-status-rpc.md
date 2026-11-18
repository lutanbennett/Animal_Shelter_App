# `shelter_calendar_status()`: what Admin may see of a shelter's calendar (backlog #calsh, schema half, piece 2)

Migration `0410_shelter_calendar_status_rpc.sql`, applied to dev 2026-11-18. It completes `0409`, whose header promised *"Admin sees status columns only, through an RPC the app half adds (as 0405 did for the Drive)."*

## Decision: `calendar_id` and `calendar_account_email` are returned

`calendar_id` is not a secret (it is the address of a calendar the account already owns, and the unique index of `0409` is on it). Admin needs it to notice that a shelter is connected to the wrong calendar, which is the very mistake this item exists to prevent, and a status panel that cannot show it forces Admin to take "connected" on trust. The function still never selects `oauth_client_id`, `oauth_client_secret_enc` or `refresh_token_enc`, ciphertext included. `connected` is true only when the calendar id and all three of those are present, so an incomplete row reads as not connected (the same test the sweep's reader applies).

## Owner set in the same file

`0405` needed `0406` because it was applied before the tenancy lint flagged its owner. `0410` runs the `alter function … owner to rls_definer` (guarded by `pg_roles`, as `0406`) in the same file.

## Lint result

`node scripts/check-tenancy-catalogue.mjs --tenant-role rls_definer --strict` after applying: 0 views, 0 functions flagged. The one remaining finding is `scheduled_writer_runs` (a table missing `definer_all`), which is not this change. Without `--tenant-role`, the default role flags `shelter_calendar_status` and `shelter_drive_status` identically (`owner=rls_definer`); that is the report-only default and the Drive function is the precedent.

## Proof, against the dev database, in a `begin`-less harness that always ends in a raise (rolled back; the table was empty before and after)

Two planted rows (shelter A with all secrets, shelter B dead with no secrets), then: Admin of A under A's shelter header got exactly one row, `planted-a`; the same Admin under B's header got **0 rows** (an Admin is Admin of the shelter their role row belongs to, through `0392`'s policy on `user_roles`, so they cannot read B's status, and B's row stays invisible); no shelter header gave 0 rows; a non-Admin login gave 0 rows. The result type is `token_status, last_checked_at, last_error, calendar_id, calendar_account_email, connected`: no secret column exists to be returned. With the table empty, which is how dev and production stand, an Admin call returns no row (the fallback shelter).

## Specification for the app half

- Signature: `public.shelter_calendar_status() returns table (token_status text, last_checked_at timestamptz, last_error text, calendar_id text, calendar_account_email text, connected boolean)`.
- Who may call it: `authenticated` and `service_role` (`public` and `anon` revoked). It answers only when `is_admin()` is true; it asks no card, because Admin sits outside the card system. A non-Admin gets no rows, not an error.
- Scope: the shelter being served (`current_shelter_id()`), so call it from a request carrying the shelter header. Without one it returns nothing.
- A shelter with no row (Lanna, still on environment variables) returns **no row**; the screen must show that as "using the shared setup", not "disconnected".
- `token_status` is `unchecked`, `ok` or `dead`. A row with `connected = false` is incomplete.
- The app half's reader goes in `src/lib/google/shelter-calendar-status.ts` and the screen in `src/app/admin/CalendarStatus.tsx`; neither exists yet. Not in this PR, which is schema only.

## Which piece of `#calsh` this closes

Piece (2) of the consolidated block: the Admin status RPC. `#calsh` stays open (the save screen, and the poll, import and tile check, remain).
