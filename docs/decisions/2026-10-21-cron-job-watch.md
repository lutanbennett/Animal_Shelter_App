# Watching the nightly database job (2026-10-21)

`purge-assistant-actions` (0227) is the only pg_cron job in the schema, and nothing reported whether it ran.
Both failure directions are silent: never installed or switched off keeps `assistant_actions.request_text`
forever, against the sentence on `/privacy`; installed but erroring every night does the same.

**Why pg_cron for the retention itself.** It runs inside the database, so it needs no key, no deploy and no
Worker. That stays. Retention periods are untouched (Lutan, 2026-10-10 and 2026-10-19).

**Why the signal lives in the Worker's sweep.** The Worker's quarter-hourly alert run already reads the
health checks, keeps state in `status_alert_checks`, mails admins after two red runs and again on recovery,
and has the test-alert button. `cronJobs` is one more health check in that list (`health.ts`), so none of
that was rebuilt. A watcher inside the database would have been a second thing that can fail silently.

**The read.** `0238_scheduled_job_status(text[])` is a security-definer function, executable by
`service_role` only, returning the job's state and its newest `cron.job_run_details` row. A name with no
job still returns a row (`job_exists = false`), so "never installed" is distinguishable from "no data".
`EXPECTED_CRON_JOBS` in `health.ts` is the list: the second pg_cron job is watched once its name is added.

**States.** Red: not installed, `active = false`, or the last run `failed`. Amber: installed but never run,
or the last run more than 48 hours ago (one missed night is not an incident, two is; the item fixed that
number). Green otherwise. Only the run's *status* is read, never its row count, so a quiet shelter that
deleted nothing is green. The 48-hour staleness is amber, as the item defines only never-run as amber; a
job that ran and failed is red because it has the same consequence as a missing one.

**Alert mail: yes, on red only.** Unlike Drive space and the calendar tile (which deliberately never mail),
this fault breaks a promise made to the public, and nobody opens the page to notice. Amber stays quiet, as
for every other check, so the rare slow night does not train people to filter it. Mail goes out after two
red runs (~30 minutes), which is also the existing behaviour.

**Production read, 2026-10-21 (read-only).** `check-cron-job.mjs --env production`: the job exists, is
active, `17 3 * * *`, and the function exists. Production is 2 migrations behind (0236, 0237); 0238 must be
applied there before the release deploy, or the tile reads red ("function not found") until it is. The
`/privacy` sentence matched the job as found.
