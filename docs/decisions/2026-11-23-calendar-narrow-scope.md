# The calendar connection asks Google for the narrowest scope that works (#calsc)

**Lutan, 2026-11-22**, offered three routes (narrow the scope, submit for Google's verification, accept the red warning), chose
the first: the app creates its own calendar in the shelter's account, mirroring Drive, and touches nothing else. The other two
are recorded on the item and not chosen.

## What changed
- `SCOPES.calendar` is `calendar.app.created` + `userinfo.email` (was `calendar.events`). Test twin of the Drive pair added.
- `completeConnect` (calendar) creates a secondary calendar named `<shelter> vet visits (animal shelter app)` and stores **its** id
  in `shelter_calendar_credentials.calendar_id`; the account email stays in `calendar_account_email`. Two columns already existed
  (0410 onward), so **no migration**. The fallback-calendar guard and the `23505` unique-id guard still run on the created id.
- A reconnect keeps the calendar the app already made when it can still be read; otherwise it makes a new one.
- Connect screen text (English and Thai) and the manual say visits go to the new calendar, not the main one.

## `scripts/google-oauth-setup.mjs:79` is left as it is
Its `--calendar` token feeds `GOOGLE_CALENDAR_REFRESH_TOKEN` for the **shared fallback calendar** (`GOOGLE_CALENDAR_ID`), a
calendar a person made, which `calendar.app.created` cannot read. Narrowing it would break that path. It is not the shelter
connect path and never mints a shelter's token, so it cannot give a shelter more access than the app asked for.

## The existing shelter's connection: re-made deliberately
A stored `calendar_id` equal to the account email (the old primary-calendar connection) is **not** kept: the narrow token
cannot read it. Pressing **Connect again** makes the new calendar and repoints, and the success text says so. Nothing repoints
silently; until someone presses it the old token (`calendar.events`) keeps working. Visits already on the old calendar stay there.
`pending:` the shelter's Admin pressing Connect again (Lutan for the shelter he runs).

## Still open
Whether Google classes `calendar.app.created` non-sensitive (no unverified-app screen) is visible only in the Cloud console.
`pending:` Lutan's one look. If it is sensitive the three routes reopen. `#calsc` is **not** ticked: the real-connect proof is outstanding.
