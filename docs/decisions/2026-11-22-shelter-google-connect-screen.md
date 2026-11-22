# A shelter Admin connects its own Google Drive and Calendar from Settings (#drvcl)

Written 2026-11-22. Branch `claude/shelter-drive-connect`.

## Step zero
`grep` for `admin/google/callback`, `connectShelterDrive`, `connectShelterCalendar` in `src/` and `scripts/` found nothing; `src/app/admin/page.tsx`
drew the two status lines with no control beside them. The gap was open, so this was built.

## What was built
- `GET /admin/google/start?kind=drive|calendar` (Admin only) sets a random-state cookie and sends the browser to Google's consent screen.
- `GET /admin/google/callback` (Admin only) checks the state, swaps the code for a token, **proves it against Google before storing**
  (`verifyWithGoogle` from the two connect scripts' libraries, called as they stand), then writes the encrypted credentials.
- `src/app/admin/GoogleConnect.tsx`: two buttons beside the status lines. Results come back as `/admin?google=<kind>-<ok|reason>`, worded in
  English and Thai (`admin.landing.googleConnect`).
- `src/lib/google/shelter-google-connect-decide.ts` holds the pure parts (consent URL, state check, scope check) with a test.
- The connect Web client is read from **`GOOGLE_CONNECT_CLIENT_ID` / `GOOGLE_CONNECT_CLIENT_SECRET`**, registered in `scripts/lib/runtime-config.mjs`
  (so the deploy carries them) and `.env.example`. They are not `SHELTER_GOOGLE_*`, which the scripts use for a shelter's *own* client.

## THE CARD QUESTION, answered: Admin only, no card, no migration
Two rules pull apart: *"no card for the activity? create one"* and *Admin sits outside the card system, all-or-nothing, not a precedent*.
Resolution: **the control is Admin alone, through the `perms.isAdmin` short-circuit, with no card.** Why the precedent applies:
1. Lutan's own item says **ADMIN ONLY** and records the reason: *"Admin already sits outside the card system, so an Admin-only control needs
   no new card and creates no new exception. A control reachable by anyone else WOULD need a card."* This is not widened: no other login can reach it.
2. The two status lines it sits beside are already `perms?.isAdmin`-only, and `check-hard-coded-security.mjs` passes (run: "no coded security
   outside the Admin bypass").
3. The thing a card would grant, the ability to point the shelter's data at a Google account, is the single ability CLAUDE.md names as
   Admin's own (it is the same as who can sign in, `requireAdminUser`).
What this is **not**: a precedent. If a shelter ever wants a non-Admin to connect Google, that is a new card, a migration and a new decision.
The new service-role file is recorded under `stillDecidesAccess`-adjacent **service-role files** in `docs/hard-coded-security-registry.json`
with its guard, and the two env names under `environment`.

## The three questions
1. **Scopes.** Drive: `drive.file` only (decision `2026-11-20-drive-scope-options-for-lutan.md`, option A, which Lutan chose): no yearly
   assessment, no "unverified app" wall. The app can therefore see only what it creates, so **the screen creates the shelter's folder itself**
   and asks nobody for an id (a folder the account can still open is reused on reconnect). Calendar: `calendar.events`, what the existing
   calendar code uses, plus `userinfo.email` to name the account; the calendar id stored is that account's email, its primary calendar.
   `calendar.events.owned` is narrower but was **not tested** against the existing read; not chosen. Whether `calendar.events` needs
   Google's ordinary verification is **not established** (see `2026-11-19-drive-scope.md`).
2. **One flow or two.** Two buttons, two consents. Each scope stays narrow, the Calendar may belong to a different Google account than the
   Drive, and a refusal in one cannot disturb the other.
3. **Half-success.** Because the flows are separate there is no "Drive written, Calendar refused". Inside the Drive flow the script writes
   credentials and folder in one SQL statement; the app cannot (supabase-js has no transaction), so it writes the credentials, then the folder,
   and if the folder write fails it deletes a credentials row **it just created** (a pre-existing row is left, with its old folder) and says nothing
   was changed. The screen always says "nothing was saved" or "connected"; never a mixed state.

## Not done, and why
- **The real consent round trip.** It needs the connect client's secret, which is not on this machine. Proved without it: the screen, the
  gating (a login with cards only sees nothing and is redirected), the unset state, the consent redirect (client id, redirect URI, scope,
  `access_type=offline`, `prompt=consent`, state) and the refusal of a bad state. **Unproven until Lutan's first consent:** the code exchange,
  the folder creation, the writes, and that the 19 registered redirect URIs include the one used.
- **No release note.** The flow cannot be completed without that secret, so the note ships in the PR that closes it (truth rule).
- `docs/google-cloud-inventory.md` is untouched. Nothing here makes a line in it wrong.
