# Connect a shelter's own calendar: a script, with a status component beside it (#calsh piece 1)

**Decided 2026-11-18, by the stream (the brief handed it over as a design judgement, not Lutan's).**

**The item said "a screen". I built a script**, `scripts/connect-shelter-calendar.mjs` (testable half in `scripts/lib/connect-shelter-calendar.mjs`), following
`connect-shelter-drive.mjs`. Reasons:

- A screen means typing an OAuth client secret and a refresh token into a browser form. The script takes the three secrets from the
  environment (never the command line, which ends up in history), verifies them with Google first, and encrypts them with
  `encryptSecret()` before anything reaches the database. A form would have to do the same inside a server action, and the secrets
  would pass through the app's request logs and the browser.
- The person and key are the same as the Drive's onboarding: one operator, `DRIVE_CREDENTIALS_KEY` in hand, minting a refresh token for a
  second Google account. Two onboarding routes for the same job would drift.
- Without `--apply` it checks Google and prints what it would write; nothing is stored.

**Status is a component**, as the Drive's is: `src/lib/google/shelter-calendar-status.ts` (calls `shelter_calendar_status()`, 0410) and
`src/app/admin/CalendarStatus.tsx`, drawn on Settings for Admin. Status columns only; a shelter with no row (the fallback shelter) draws nothing, not an error.
Admin-only is enforced by `is_admin()` in the function; the page gate is courtesy.

**The guard the database cannot make:** `0409`'s unique index is on `calendar_id`, but the fallback shelter has no row. `refuseFallbackCalendar()` compares
the requested id (case and spacing folded) with the environment's `GOOGLE_CALENDAR_ID` and refuses a match for any shelter except the fallback
shelter itself. It runs before Google is called or anything is encrypted. Proven by `scripts/connect-shelter-calendar.test.mjs`. A second shelter's duplicate of another
*row* is caught by the unique index, and the script says so in words.

**Limits, stated:** `calendar_account_email` is optional (`SHELTER_GOOGLE_ACCOUNT_EMAIL`), because the `calendar.events` scope cannot look the account up.
The guard reads the environment file of the target environment; a production shelter checked against a mismatched env file is not covered.
Piece 3 (poll, import, `checkCalendar()`) is untouched: connecting a calendar does not yet make visits flow to it.
