# The backup script and the backup tile now share one folder rule (2026-10-13)

**What was wrong.** From 2 October the Daily backup tile read "no backup" (`fail_runs` 171) while the Pi's
backups ran and uploaded fine. The code on both sides already preferred `BACKUP_DRIVE_FOLDER_ID` and fell
back to `Backups/` under `GOOGLE_DRIVE_ROOT_FOLDER_ID`. The *settings* differed: the id was added by hand to
the Pi's `.env.deploy.production` on 2026-10-12, so the script uploaded to that folder, while the tile
(checked from the Worker, which gets secrets from the PC's file at deploy) had no such id and looked under the
root, where there is nothing newer.

**What was changed.** `scripts/lib/backup-folder.mjs` is the one rule; `backup.mjs` and `checkBackup()` both
call it. `backup.mjs` now logs which setting it used, and the tile's failure text names the setting this
machine used and says `BACKUP_DRIVE_FOLDER_ID` may be missing here. `scripts/check-backup-folder.mjs`
pins the rule, that both sides use it, and that the id is declared for Worker and Pi.
The check was **not** pointed at whatever makes it green.

**Still to do (not provable from a branch).** The id must be in the PC's `.env.deploy.production` and the
Worker redeployed (and the Pi's tile, if it renders it, must have it too) before production can go green and
`fail_runs` return to 0. Filed as its own backlog item. Also note the tile will not mail again until it recovers
once (`alerted_at` 2026-10-02).
