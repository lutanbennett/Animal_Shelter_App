# Keep the shared Drive token for the backup, for now

Date: 2026-10-13. Follows 2026-10-13-backup-own-drive-token.md.

Lutan declined to put the backups in a personal account, and the shelter's own account does not
exist yet. So the Pi's cron line runs `backup.mjs --shared-drive-token` and S4 stays **open**: the
app's token can still delete backups. Separation is an account, not a folder (a token sees all of
its account's Drive), and it must reuse the existing Desktop client (a new project starts in
Testing; tokens expire in 7 days). It happens when production gets its own account.
Correction: the earlier doc said to create a new OAuth client; that was wrong and is removed.
