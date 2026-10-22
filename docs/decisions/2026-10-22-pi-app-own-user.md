# 2026-10-22 — The app runs as its own user on the Pi

## Decision

`next start` now runs as `lannacare-app` (production) and `lannacare-test` (test), system
accounts with no login, no home and no password, created by `setup.sh` / `setup-test.sh`
(`scripts/pi/service-lib.sh`). The backup cron still runs as the deploy user (`lutan`).
Closes the gap `2026-09-30-one-pi-hosting-and-backup.md` recorded as not done.

## Can the app's process still read the backup dumps? No.

The dumps are in `~/backups/lannacare` (0700, files 0600, owner `lutan`) and `~/backups`
is now set 0700 by `setup.sh`. The service user is not the owner, not in `lutan`'s group,
and the home folder is only traversable (`o+x`), not listable. Beyond permissions the unit
sets `ProtectHome=read-only` and `ReadWritePaths` for two folders only, so it could not
write there either. The dumps are also age-encrypted with a key that is not on the Pi.
Same for `.env.deploy.production` (0600, `lutan`), ssh keys and everything else in `~`.

## What it can still reach (said plainly, not hidden)

- Its own `.env.production.local` (0640, group = the service). Every variable the app needs to
  run is in it: the service-role database key, and the Drive token the backup borrows with
  `--shared-drive-token` (interim). A compromised app can therefore still reach the **Drive
  copy** of the dumps (encrypted) and the database as the app does. The token is shared until
  `BACKUP_GOOGLE_OAUTH_*` exists; that is the next step to close this, not part of this change.
- The built site and `node_modules` (public code), and its two caches.

## Shape, and why

- **Two users, not one.** A compromised test instance should not read production's env file.
- **`next start` called directly**, not `npm run start`: npm needs a writable home.
- **Group-readable env file.** `write-env.mjs` rewrites the file on every deploy, so it hands
  the group over each time (and keeps 0600 until the group exists).
- **Build cache handed over by `ExecStartPre=+`** (root, at every start), because each deploy
  swaps in a fresh `.next`. The deploy user joins the service group so `deploy-pi.sh` can still
  prune that cache; `UMask=0002` keeps what the app writes group-writable.
- **Photo cache** stays at `~/photo-cache[-test]`, handed to the service user (0700).
- **Safe to re-run, and does not strand the site.** Everything but the restart happens first;
  `install_unit` keeps the old unit file and restores it, then restarts, if the new one does not
  come up or answer. A refusal (production holding `.env.local`) happens before anything changes.

## Not proven here

Written without touching the Pi (by instruction). The first real run is Lutan's; the rollback
exists for exactly that. Another hardening gap found on the way: the Drive token sharing above.
