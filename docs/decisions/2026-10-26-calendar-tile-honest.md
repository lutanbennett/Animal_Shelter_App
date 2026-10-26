# The calendar tile counted six waiting visits; the cron that sends them had stopped

2026-10-26, `claude/calendar-pending-tile`. Backlog item: System status → Shelter calendar "6 vet visit(s) still waiting".

## The cause, from production rows (read 2026-10-26 05:03 UTC with `calendar-pending` and `calendar-cron`)

**It was candidate (b): the Worker's 15-minute cron stopped running on production.** `calendar_sync_state.last_run_at`
and the status-alert runs' last `cron` run are both 2026-10-23 10:00 UTC, to the second. Nothing has run for about 2.8 days.
Visits saved in the app sync straight away, so only rows changed outside the app, or after the cron died, wait for the sweep.

Ruled out, with how:

- **(a) failing every sweep:** 0 of 6 rows carry a `calendar_error`, and a failing sweep writes one.
- **(c) re-dirtied after each sync:** five rows share one `calendar_out_of_date_at` (2026-10-23 10:13:28.869), a single bulk edit, never stamped again. The `0207` trigger was read: it ignores writes that touch only calendar columns.
- **(e) clock skew or an in-flight re-stamp:** the gap between `out_of_date` and `synced` is about 94,390 s (26 h) on every row, not seconds.
- **(d) correct in Google, never re-synced:** this is what the six are, but it is a consequence of (b), not a cause.
- **"the sweep skips past visits"** (the doc comment's claim) is false: its `stale` query has no date filter. Not the explanation.

What stays open and is not code: **why the cron stopped** (the repo's `wrangler.jsonc` still has `*/15 * * * *` for production). That needs Cloudflare's trigger list and Worker logs, and the production deploy is Lutan's. The same trigger carries the status-alert mail and the translation drafts, so those are likely down too.

## The tile's new states

`CalendarStatus` keeps its three states; `unsynced: number` became `visits: PendingVisit[]` (id, date, resident, past, error) plus `lastSweepAt`. Only the status page reads it.

- **ok** (green): no visit waiting and the sweep ran in the last 45 minutes.
- **warn** (amber): visits waiting, none with an error.
- **fail** (red): any visit with `calendar_error` ("failing", the last error shown under it), or the sweep quiet, or Google unreachable. Reused the existing `fail` state rather than a new one: the tile already styles and reports it, and a new state would change `CheckState` for every tile.
- Each visit is listed by date and resident, linked to its visit page; past ones are marked "(past)".
- "Quiet" = no poll recorded for 45 minutes (three missed runs); `isSweepQuiet` in `src/lib/clinics/calendar-quiet.ts`, tested.

## Past visits

**Still counted, and labelled.** The sweep itself processes past visits (it deletes the event of a visit no longer wanted), so a past row that stays dirty means the sweep is not doing its job, which is exactly what this tile should show. Dropping them would have hidden today's fault: four of the six are past. Revisit once the cron runs and the count is zero.

## Checks added

`calendar-pending` (what the tile counts, ids and dates only) and `calendar-cron` (when the poll and alerts last ran; migrations of the last 3 days) in `scripts/lib/readonly-checks.mjs`. Both are single SELECTs under the existing read-only wrapper; no SQL comes from argv.
Run against production from the main checkout by `node ../Animal_Shelter_calendar-pending-tile/scripts/check-production.mjs <check> --env production` (this worktree has no `.env.deploy.production`).
