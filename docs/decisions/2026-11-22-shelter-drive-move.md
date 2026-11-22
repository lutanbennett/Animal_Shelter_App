# Moving a shelter's Drive into its own Google account (#rqv5c): consent stages, the move makes it live

**Decided 2026-11-22 by the stream, as the brief asked ("yours to decide"). The production run is not the stream's: see the last section.**

## The hazard, measured
`resolveDriveCredentials()` says a shelter with a complete `shelter_drive_credentials` row uses it. The connect flow
(`completeConnect`) writes that row at consent. With the `drive.file` scope the new account cannot see a file it did not create,
so from the moment of consent every stored Drive id (photos, documents) stops loading until the files are copied and the ids
remapped. It was hit live on the shared dev database on 2026-11-22 within the hour.

## The order
**consent (staged) -> copy -> remap -> make live**, where "make live" is one statement together with the remap.

## Design
- Migration `0435`: `shelter_drive_credentials.staged boolean not null default false`.
- The connect flow stores the row **staged** when the shelter already has a Drive working: it has a live row, or it is the
  fallback shelter running on the environment's account. A shelter with no Drive yet (a new shelter) is stored live and gets a
  new folder, exactly as before.
- The reader treats a staged row as **no row**. For the fallback shelter that means the environment account it is already on;
  for any other shelter it refuses. It never borrows another shelter's account, so `2026-11-17-per-shelter-drive-credentials.md`
  is kept. (A staged row is the shelter's own consent not yet in force, not a fallback.)
- `scripts/drive-move-to-shelter-account.mjs` (new) moves the bytes: **download with the OLD credentials, upload with the NEW**,
  because a `drive.file` token cannot copy a file it did not create. Dry run by default, resumable through a jsonl map, and it
  only ever reads the source (never update, move, trash or delete there). It then remaps ids with the existing
  `drive-remap-ids.mjs` logic and, in the same statement, sets `shelters.drive_root_folder_id` and clears `staged`.

## Rejected
- **Row goes live at consent, move afterwards.** Photos dark for the whole copy, at unmeasured production volume.
- **A flag in the connect flow only (no column).** Nowhere to hold the proven token meanwhile.
- **Making the reader fall back to the old account while a move runs.** Forbidden by the 2026-11-17 decision.
- **Copy inside the old account then transfer ownership.** Needs the old account's consent to hand files over; the point of
  this route is that the Director never gives Lutan access to the old account.

## Production still needs (not the stream's)
The Director's consent in her own browser, and Lutan's run of the move. `drive-remap-ids.mjs` refuses `--env production` and
is not changed. Production lacks `DRIVE_CREDENTIALS_KEY` (`#83137`). The production tree has never been measured.

## What was built (PR 2) and what the dev run showed
- Reader: a staged row is read as no row, **and the shelter's key is still looked up**, because the first version passed a null key
  when any row existed, so the fallback shelter was refused while staged (the Settings banner went red). Fixed and tested.
- Connect flow: stages for the fallback shelter with no row yet, and a row already staged stays staged on a reconnect, so a
  second consent cannot repoint the folder. It makes no folder and changes no `drive_root_folder_id` while staged.
- `scripts/drive-move-to-shelter-account.mjs`: dry run / `--apply` (copy) / `--go-live` (remap + root + unstage in ONE request;
  a multi-statement request runs as one implicit transaction). Refuses production, refuses a live connection, refuses go-live
  while the old tree holds anything unmapped. Streams bytes, retries dropped connections per call and per file.
- **Dev run (2026-11-22, `--env test`, shelter `lanna`, old account to a personal Google account):** dry run 41 folders, 36
  files, 0.64 GB, 0 Google-native skipped; copy completed to 78 map entries (root + 41 + 36), 0 failed after retries. The first
  runs lost files to `ENOTFOUND` / `ECONNRESET` (network blips, one large video); the retries fixed it and the map made each
  re-run pick up only what was missing. `--go-live` was NOT run on dev: it rewrites ids in the database every stream shares.
- **Not done:** the UAT rehearsal (needs a consent given on UAT, which is Lutan's Google sign-in), so `--go-live` and
  `check-drive-leftovers.mjs` have not yet run against real volume. Residual race: a file uploaded between the last copy and
  `--go-live` is refused by go-live's check, so run `--apply` then `--go-live` back to back in a quiet hour.
- Production's tree is unmeasured; the script reports its own count and size in the dry run.
- A new `process.env` read: none added (`DRIVE_CREDENTIALS_KEY`, `GOOGLE_CONNECT_*` already registered).
