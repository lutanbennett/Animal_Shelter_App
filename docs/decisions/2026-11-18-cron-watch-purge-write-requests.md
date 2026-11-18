# `purge-write-requests` is now watched (`#wr9qd`)

**2026-11-18.** `EXPECTED_CRON_JOBS` (`src/lib/status/health.ts`) gained `purge-write-requests`, so a failed or missing nightly run now shows on the
Scheduled jobs tile like the other two.

## The item's caveat was void

`#wr9qd` said adding the name "turns production red until it has `0292`". The planner read both live databases on 2026-11-18 and it is not so:

- `node scripts/check-scheduled-writers.mjs --env production`: 3 cron jobs, all active, including `purge-write-requests` (29 3 * * *). The same on dev.
- `apply-migrations.mjs --status --env production`: 408 applied, 2 pending (`0408`, `0409`). `0292` is far below that line, so production has it.

So the job exists in both environments and nothing goes red. The list's own comment now says what adding a name does (it must exist on every
database the page reads) so the reason lives on the list, not in this file. Dev check: `/admin/status`, reached by clicking through from `/admin`, lists
`purge-write-requests: last ran 18 Nov 2026, 10:29.` with no problem. (The tile's amber "Look at this" is `label-drafts` not having reported yet, unrelated.)

## Why `check-scheduled-writers.mjs` says `[UNKNOWN]` for it: answer (a), with a finding

`purge_write_requests()` (`0292`) is `SECURITY INVOKER` and only runs `delete from public.write_requests where created_at < now() - interval '7 days'`.
It inserts nothing, so it needs no shelter. The checker's 91 writing functions are the security-definer and trigger ones, and this function is neither,
so the checker has no body to classify. It is not a gap in what the checker protects. **For the planner to file (not done here):** the checker could
classify an invoker function that only deletes, so it stops printing `[UNKNOWN]` for a harmless job.
