# `#wrout`: one command says why a scheduled writer skipped or failed (2026-11-22)

**Built:** `node scripts/check-production.mjs scheduled-writers [--env test|production]` reports, for every job in
`EXPECTED_CRON_JOBS` and `EXPECTED_WORKER_WRITERS`, its last outcome, detail, last run and consecutive failures.
No migration. The production read is the planner's to run.

## What the System status page shows (read from `src/app/admin/status/page.tsx`, 2026-11-22)
Planner handover 771 ("nothing can read it") was too strong. `health.ts` already puts `last_detail` into `lastMessage`.
The Scheduled jobs tile prints **one sentence per job: name and last-run time only**. `lastMessage` is **not** drawn per
job. It appears only when a Worker writer is **red** (failed twice running), where it is appended to the tile's error
text. So a `skipped` writer's reason ("no label login configured") and an amber stale or never-run job's reason are
invisible on screen; that is why a command was still needed. Established by reading the component; not screenshotted.
Not changed here: showing the detail per job is a UI change (translations in both dictionaries), more than a line or two.

## Report only, or fail on red: fail, but only where the page is red
Against failing (`#3zr7o`): a check that exits 1 over a knowingly-skipped job gets ignored, and `skipped` is legitimate.
For failing: `health.ts` calls `failed` with `fail_runs >= 2` red, so a silent command would disagree with the page.
Chosen: exit 1 exactly on the page's red conditions (pg_cron job missing, off or last run failed; Worker writer failed
`WORKER_WRITER_RED_AFTER` runs in a row). Skipped, never-reported and stale are amber on the page and only reported.
The threshold is imported, not re-invented.

## One check, two sources
One check: the SQL calls `scheduled_job_status()` for the three pg_cron jobs and reads `scheduled_writer_runs` for the
four Worker writers in a single fixed SELECT (the Management API role can call the RPC). Rendering is in JS.

## Names are not retyped
The lists and thresholds moved to `src/lib/status/scheduled-jobs.ts` (pure data); `health.ts` imports and re-exports them,
and the check imports the same file (Node strips the types, as `apply-migrations.mjs` already does for `.ts`). Side effect:
Node prints a `MODULE_TYPELESS_PACKAGE_JSON` warning on stderr; harmless.

## Dev proof and its limit
Dev has a row for every job, so the never-reported branch is proven by a unit test (`check-production.test.mjs`) that also
covers one failure (not red), two failures (red) and skipped (not red). `check-label-draft-cron.mjs` is now partly
redundant (same columns, one job); left alone, for the planner to judge.
