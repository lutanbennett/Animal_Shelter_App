# Per-shelter Google Drive: the app half (Part 9, #o2iyh)

**Built 2026-11-18, to the schema half's specification (`2026-11-17-per-shelter-drive-credentials.md`, migration 0404).**

## What it does
- `src/lib/google/shelter-drive-credentials.ts` is the one place every Drive call gets its credentials. A shelter with a complete
  `shelter_drive_credentials` row uses it; secrets are AES-256-GCM ciphertext (`drive-credentials-crypto.ts`), key `DRIVE_CREDENTIALS_KEY`.
- `drive.ts` keeps one cached access token **per Google account** (it was one global token, which would have served shelter B with
  shelter A's token the moment two accounts existed).
- **Fallback, loud rather than silent:** no request scope (cron, scripts) uses the environment variables; the shelter keyed `lanna`
  (`FALLBACK_SHELTER_KEY`) with no row uses them, so Lanna is unchanged; **any other shelter with no row is refused**
  ("has not connected a Google Drive account yet") and `driveRootFolderId()` returns null for it. Never Lanna's account or folder.
- **Admin sees status only:** `shelter_drive_status()` (0405, owner `rls_definer` by 0406) returns status columns for the shelter
  being served, Admin only through `is_admin()`. `DriveStatus` shows the connected account's email. No secret ever leaves the server.
- **Dead-token alerting:** `shelter-drive-tokens.ts`, called from the existing `POST /api/status/alerts` cron, probes each row's
  token every 15 minutes, records `ok`/`dead`, mails **that shelter's admins** once when it dies (`dead_alerted_at`) and once on
  recovery. A Google or network failure is `unknown` and changes nothing (not the token's fault). Only a mail that reached someone
  closes the loop, as the existing alerts do.

## Where the spec was wrong or silent
- **Migration 0406 exists because 0405 was applied to dev before the tenancy lint ran** and the lint wants security-definer
  functions owned by `rls_definer`. Applied files are not edited, so the owner change is its own file. Folding it into 0405 would have
  been tidier had the lint run first.
- The spec said the fallback shelter is "the fallback shelter" without naming it. It is the shelters row with `key = 'lanna'`, as
  `populate-shelter-settings.mjs` already assumes.
- The existing `adminEmails()` finds admins by role *key* and is not shelter-scoped, so the new check has its own lookup by the
  `roles.is_admin` flag and `user_roles.shelter_id`.

## NOT built (say so plainly)
- **No consent flow / screen that mints and stores a shelter's token.** Nothing writes a row yet except by hand; onboarding (#omt6u)
  needs a screen or script that calls `encryptSecret()` and inserts. Until then only Lanna (env fallback) works, other shelters are refused.
- The Drive tile on `/admin/status` and its health check still describe the serving shelter only; the new alert covers all shelters.
- Calendar sync (`src/lib/clinics/calendar-sync.ts`) still reads `GOOGLE_OAUTH_*` directly: it is a different Google API and
  account use, not Drive. Recorded as a follow-up, not changed here.
- Not proved against two real Google accounts (none exists). Proved: crypto round-trip tests, the tenancy lint (0 flagged, 0 stale),
  hard-coded-security (clean), card grants, shelter-settings check.

## Deploy note (his, not a question)
Set the secret `DRIVE_CREDENTIALS_KEY` (base64 of 32 random bytes: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
in **production, UAT and test** before any shelter other than Lanna is connected. Lanna needs nothing: the variable is read only
when a row exists. Dev already has one in `.env.local`. Migrations 0405 and 0406 must be applied to each environment (0405 then 0406).
