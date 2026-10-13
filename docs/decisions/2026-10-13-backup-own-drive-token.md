# The backup gets its own Drive token (S4)

Date: 2026-10-13. From architecture review §2.1 S4.

`backup.mjs` now reads `BACKUP_GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN`. Before, it used the
app's token, which sits on the Worker, the Pi and the laptop and could therefore delete every backup.
Moving the folder (`BACKUP_DRIVE_FOLDER_ID`) moves the folder, not the identity.

- **Fallback behind `--shared-drive-token`, not a hard break.** The token does not exist yet (Lutan
  mints it), and the nightly job must keep producing a backup in the meantime. A flag, not an
  automatic fallback, because an automatic one would hide a missing variable and the shared identity
  would be used by accident forever. The flag prints a warning each run.
- **Checked before the dump.** A missing token stops the run before pg_dump, not after.
- **Registry:** the three variables are `where: "tools"` (Pi/laptop scripts, never the Worker). Not
  `neverOnPi`: the Pi is exactly where they belong.
- **Outstanding:** minting the token and installing it on the Pi (docs/pi-hosting.md). Until then
  the Pi's backup fails, or needs `--shared-drive-token` in its cron line.
