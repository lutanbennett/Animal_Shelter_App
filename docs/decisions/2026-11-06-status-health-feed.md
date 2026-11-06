# 2026-11-06 — `GET /api/status/health`, the feed for Home Assistant

Backlog `#mzu7v`, app side.

- **Own token, `STATUS_READ_TOKEN`.** The alerts route is guarded by the service-role key, which must never go
  to Home Assistant. This token reads one read-only feed; rotating it touches nothing else. Declared in
  `scripts/lib/runtime-config.mjs` (Worker secret, scrubbed from error text, both machines) and recorded in the
  hard-coded-security registry as gating nothing a role may do.
- **Unset or short token refuses everyone** (under 16 characters), so a forgotten secret cannot open the feed.
- **Whitelist, not scrubbing.** The payload copies states, times and eight numbers; a check's `error` text is never
  read. The check script feeds in error text, a host and a file name and asserts none come out.
- **Rate limit is per server instance** (in memory): 10 bad and 30 good requests a minute. Cheap and enough to blunt
  guessing; a Cloudflare rate-limiting rule could add a shared limit later.
- **Size judged against 500 MB** (warn 80%, fail 95%). Size and connections come from `database_health()` (`0324`,
  security invoker, service_role only). If it cannot be read the numbers are `null`, never invented.
- The page's one-minute cache (`getHealthReport`) serves the checks, so polling cannot hammer Drive or the database.
- **Noticed, not fixed:** two migrations are numbered `0324` on `main` (`0324_database_health.sql` and
  `0324_can_see_drive_file_lists_reels.sql`); a stream merged the second while the first was in review. The runner
  records by file name so both apply, but one should be renumbered by whoever owns it.
