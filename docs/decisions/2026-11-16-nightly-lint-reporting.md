# 2026-11-16: the nightly tenancy lint is watched by a planner-run script (#n4rpt)

**The 2026-11-15 failure, read:** run `43716500145` (schedule, 12:57Z) exited 1 with `1 tables missing definer_all`
(`donation_tax_ids`). Fixed by `0388` (`#w4t9k`); the next scheduled run, `43881407598` (2026-11-16 14:01Z), is green.
That closes the half of `#n4rpt` about an unread failure. The cron is right: GitHub delays scheduled runs 7-9 hours.

**Chosen:** `scripts/check-scheduled-runs.mjs`. For each scheduled workflow in its list (tenancy-catalogue, tenancy-canary,
advisories) the newest `schedule` run must be `success` and under 36 hours old. It reads with `gh run list`, so it needs no
secret and no new permission; `/plan-day` can run it the way it runs `check-stale-titles.mjs`.

**It catches both faults separately:** RED (a run failed; today only an email to whoever last edited the cron line) and STALE
(no run, or the newest is too old; today nothing notices at all).

**Rejected:**
- *Workflow opens an issue on failure:* needs `issues: write` on a scheduled workflow, and cannot see a run that never happens
  (a workflow that does not run cannot report that it did not).
- *`EXPECTED_CRON_JOBS` / `/status` tile:* wrong substrate (PR #1626, `2026-11-16-definer-all-two-tables.md`): it watches pg_cron
  inside the database, and would need the app to hold a catalogue-reading credential.

**Proof, both ways:** green on today's `43881407598`; red on the historical `43716500145` (`--run`); STALE with `--as-of 2026-11-20`.

**Does not catch:** a failure nobody runs the script to see (it is pulled, not pushed, so it is only as regular as `/plan-day`);
a run that succeeds while the lint it ran is wrong. First real run also reported `advisories.yml` RED (the known `glob`
advisory noise, run `43721762497`) and `tenancy-canary.yml` with no scheduled run yet (the workflow was added 2026-11-16, so
that clears after its first 06:11Z run); neither is caused by this change. Cron, lint and every `continue-on-error` untouched.
