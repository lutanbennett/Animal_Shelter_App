# A shelter connects its own Google account by a script, not a screen (#cn7gk, 2026-11-18)

## The decision: a script (`scripts/connect-shelter-drive.mjs`)
Weighed explicitly, as the brief asked:

- **An Admin screen** is a new surface people submit data through. It needs its own card, a server check, every control gated
  on that card's activity, and, decisive here, **a browser consent flow needs a redirect URI registered in Lutan's
  `lanna-care-dev` Google project**, which is his step and which this stream could not exercise on dev.
- **A script** matches every other operator task here, is run by whoever onboards a shelter, and **needs no redirect URI**.
  Found by reading `scripts/google-oauth-setup.mjs`: it uses a *Desktop-app* client and a loopback address
  (`http://127.0.0.1:8991/oauth2callback`), which Google accepts without registration. So a shelter's own client mints its
  token with the existing script, and the new script takes it from there.
- A screen can be added later for the day shelters onboard themselves; nothing here prevents it. It would call the same
  `verifyWithGoogle` / `buildConnectSql` logic (`scripts/lib/connect-shelter-drive.mjs`) through the service role.

## What it does
1. Validates every value strictly (nothing odd reaches the SQL).
2. **Proves the credentials with Google before storing anything**: the refresh token mints an access token, that token opens
   the folder, the folder is a folder and not in the trash, and Google says which account it is (stored as `drive_account_email`).
3. Encrypts the client secret and refresh token with the existing `encryptSecret()`. No second crypto path. A missing
   `DRIVE_CREDENTIALS_KEY` stops it before anything is written.
4. Writes the `shelter_drive_credentials` row **and** `shelters.drive_root_folder_id` in **one SQL statement** (data-modifying
   CTEs), so a half-written shelter (row but no folder, which is still refused) cannot exist. A mistyped shelter key matches
   nothing and says so. Re-running replaces the credentials (reconnect after a dead token) and resets `token_status` to `ok`.
5. Without `--apply` it only checks with Google and prints what it would do.

It writes through the Supabase Management API as `populate-shelter-settings.mjs` does, so it is a script, not a `src/` call
site: no service-role registry entry and no shelter header are involved (the 0397 guard is on PostgREST service-role writes).

## Refactor made to prove the refusal
The decisions (use the row / Lanna uses the environment / anyone else is refused, and the same for the folder) moved out of
`resolveDriveCredentials()` and `driveRootFolderId()` into the no-I/O `src/lib/google/shelter-drive-decide.ts`, so they run in
`npm test` without Next or a database. Behaviour is unchanged; the callers now pass what they read. Tests:
`scripts/connect-shelter-drive.test.mjs`.

## Calendar sync: NOT brought onto the per-shelter path, and why
`calendar-sync.ts` uses its own token (`GOOGLE_CALENDAR_REFRESH_TOKEN`, scope `calendar.events`), a calendar id
(`GOOGLE_CALENDAR_ID`) and the shared client, all environment-wide. `shelter_drive_credentials` (0404) has one Drive-scoped
refresh token and no calendar id, so per-shelter calendars need **a schema change** (calendar token and calendar id per
shelter) and a decision about a shelter with no calendar (skip, never Lanna's). The migration slot is held this batch.
**A real latent fault, for the planner to file:** the 15-minute sweep reads visits of every shelter and syncs each into the
one environment calendar, so a second shelter's vet visits would be written into Lanna's calendar. Harmless today (one live
shelter); must be closed before shelter #2 uses clinic visits.

## What is NOT proved
Nothing here has run against a real second Google account; creating one is Lutan's. The unit tests prove the logic with a
faked Google; the live check proves the database side on dev.
