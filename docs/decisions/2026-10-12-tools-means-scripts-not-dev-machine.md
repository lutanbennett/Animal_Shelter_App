# 2026-10-12 — `tools` means "scripts, not the running app"; the Pi guard uses its own flag

**Context.** The runtime-config manifest (#555) defined `where: "tools"` as "read only by
dev-machine scripts (migrations, backup)". The weekly production backup runs from the Pi's
crontab, so that definition was wrong about the backup, and a guard written as "nothing
`tools` may be on the Pi" would have broken it (and the backup fails into a log nobody reads).

**Decision.** `tools` means "read by scripts, never by the running app". The Pi may hold the
backup's `tools` values (`SUPABASE_DB_URL`, `SUPABASE_DB_PASSWORD`, `BACKUP_AGE_RECIPIENT`).
What it must never hold is a separate per-row flag, `neverOnPi`, today only on
`SUPABASE_ACCESS_TOKEN`. `scripts/pi/check-no-forbidden.mjs` refuses on that flag in every env
file of either clone. `SUPABASE_DB_URL` was added to the manifest and `.env.example` as the
replacement for the token lookup. The table's shape is otherwise unchanged.

**Not done here.** Removing the token from the Pi and rotating it are Lutan's, in order
(`SUPABASE_DB_URL` first, backup run by hand, then delete, then rotate). The backlog item stays open.
