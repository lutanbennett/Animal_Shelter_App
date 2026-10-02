# 2026-10-02: Backup encryption goes live; what was rotated and when

Security assessment DB-1 (High). #243 landed the code; this is the operator
rollout, done in one guided session with Lutan at the keyboard.

## What was done

- **Key pair** made by Lutan on his own machine. The public key is the
  recipient (`age1fz65…y56v9sv3cxyp`); the private key is in his iPhone
  Passwords (iCloud Keychain) and on a hardware-encrypted USB stick, two copies
  and no more, never on the Pi or in chat. It
  was first stored without the `AGE-SECRET-KEY-` prefix; caught when the
  rehearsal's decrypt failed, which is what the rehearsal is for.
- **First encrypted production run** on the Pi, 2026-10-02 07:59 UTC: "encrypted
  for 1 recipient(s)", "link not logged", `.dump.age` 0.72 MB, SSD copy mode 0600.
  The Sunday 03:00 cron is the same command.
- **Decrypt rehearsal** on the laptop from the Pi's copy: valid `pg_dump`
  archive, 1,339 entries, `auth.users` 4. The session and MFA tables are
  absent. **Not a restore:** the laptop's PostgreSQL is client tools only, so
  DB-2 and the Deployment "Rehearse a restore" stay open.
- **Plaintext removed:** the old `.dump` files on the Pi and the five in Drive
  (trash emptied), `~/backups/backup.log` truncated.
- **Drive:** `Backups/` moved to `Admin/Backups` and shared with Lutan only, no
  link sharing. The app's root lookup no longer finds it, so
  `BACKUP_DRIVE_FOLDER_ID` (new, optional) names the folder directly for
  `backup.mjs` and the status tile.
- **Rotated, 2026-10-02:** every Supabase auth session and refresh token on
  production deleted (`delete from auth.refresh_tokens; delete from
  auth.sessions;`), run by Lutan in the SQL editor. Access tokens already issued
  last up to an hour. Row counts before and after were not recorded here.

## What is not done

- **MFA factors were not cleared.** Lutan is the only person with one, and his
  TOTP secret was in the exposed dumps. Recommended: `delete from
  auth.mfa_factors;` and re-enrol. Open.
- **Row 8** (the tile) reads the new folder only once a release carrying
  `BACKUP_DRIVE_FOLDER_ID` is on the Pi and the Worker.
- Earlier Drive links were treated as exposed; the folder is now restricted, but
  anything fetched while it was shared cannot be recalled.

## Why

- A **mistake worth keeping:** appending the key to `.env.deploy.production`
  with `echo >>` glued it onto the last line (no trailing newline) and corrupted
  `SUPABASE_DB_PASSWORD`. Add a newline first, as the commands here now do.
- Before **Sunday 2026-10-04 03:00** the Pi must `git pull --ff-only` this change
  (script only, no deploy), or the cron makes a new `Backups/` in the app root.
