# Per-shelter Google Calendar credentials: the same shape as 0404, with a calendar id added (#calsh, schema half)

**Decided 2026-11-18 by the stream, as the item asked. Not Lutan's.**

**A faithful copy of `0404_shelter_drive_credentials.sql`, for the same reasons, with the calendar id added.** One departure, below.

## Where they live
`shelter_calendar_credentials` (migration 0409), one row per shelter, `shelter_id` primary key. Columns: `calendar_id`,
`oauth_client_id`, `oauth_client_secret_enc`, `refresh_token_enc`, `calendar_account_email`, and the status columns
`token_status` (`unchecked|ok|dead`), `last_checked_at`, `last_error`, `dead_alerted_at`. Table of its own rather than columns on
`shelters`, for 0404's reason: `shelters` is read on every request, this table only by the service role.

## Protection, in checkable terms
- anon and authenticated hold **no grant**: a login of any card, and Admin (whose bypass lives in `has_permission()` and does not
  reach a table with no grant), cannot read a row, **the ciphertext included**. Measured in a rolled-back harness: `set local role
  authenticated` and `anon` both get `insufficient_privilege` on select, and authenticated on insert.
- Read and write: `service_role`, and `rls_definer` through `definer_all` (0375).
- Secrets are **ciphertext**, encrypted by the app with **`DRIVE_CREDENTIALS_KEY`, reused, not a second key**. A second key would be
  a second thing to carry to dev, UAT and production, which is exactly how Part 9's decision file came to claim dev held a key it did
  not. The key already exists wherever the Drive credentials work. **Checked 2026-11-18:** it was absent from this worktree's
  `.env.local` (the brief said it was there), present in the main checkout's, and I copied that line in. Nothing in the schema half reads it.
- 0392-shaped restrictive policies `shelter_scope_select/update/delete`, written explicitly because 0392 has already run.
- Carries `shelter_id`, so `docs/tenancy-shared-tables-registry.json` is owed nothing (the check reports 114 scoped, 12 unscoped, 12 recorded).
- **Admin sees status columns only**, through an RPC the app half adds (as 0405 did for the Drive). No RPC here: the app half owns it.

## The one departure from 0404: `calendar_id` is unique across shelters
`create unique index … (calendar_id) where calendar_id is not null`. The leak this item closes is two shelters writing into one
calendar; the database now refuses a second shelter configured with a calendar another already holds, rather than leaving it to
whatever screen saves the row. Asserted in the harness (a duplicate is refused; two rows with no calendar id yet are accepted).
It cannot cover Lanna, who has no row (below), so the app half's save path must also refuse a calendar id equal to `GOOGLE_CALENDAR_ID`.

## Empty on purpose; Lanna has no row
Credentials differ per environment and a migration cannot know them. **Lanna keeps using the four environment variables** until it
chooses to move; that fallback is the app half's and must be exact, because the worst outcome here is a change that makes shelter #2
work and quietly re-routes Lanna's calendar. A shelter other than Lanna with no row is refused, never routed to Lanna's calendar.

## `calendar_sync_state` is already scoped
0396 gave it `shelter_id` and 0392's policies. It is keyed by `calendar_id` text, so two shelters on two calendars never collide, and
the new unique index means two shelters can never share one. The app half must write `shelter_id` explicitly when it upserts a cursor:
the column default is `current_shelter_id()`, which reads the request header, and the cron sweep has none.
