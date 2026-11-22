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
