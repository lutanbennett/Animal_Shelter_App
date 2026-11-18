# A scheduled writer that fails tells nobody: the label-draft cron, and where a scheduled failure surfaces (2026-11-18, #lblcr)

Follows `2026-11-17-pi-scheduled-writers.md`, finding 2 (recorded, not fixed there).

## 1. What was measured, and it differs from the item

The item says the cron "calls `propose_label_th` with no header, so since `0397` it fails at the insert". **Measured on dev, 2026-11-18, in a
`begin; … rollback;` harness as an admin login:**

```
NO HEADER   -> 42501 label.propose_not_allowed
WITH HEADER -> wrote a draft (draft shelter=ab3ecaac… row shelter=ab3ecaac…)
```

The call is refused **before the insert**, at `has_permission('translations.propose')`. `has_permission()` is owned by `rls_definer`, and
`user_roles`/`roles` have shelter-scoped policies keyed to `x-shelter-id`, so **a login with no header holds no card at all.** The
`NOT NULL` on `label_drafts.shelter_id` was never reached. Same symptom (no drafts, nothing mailed), different cause, and a different
cure: stamping the shelter in SQL alone could not have fixed the cron. **The Worker has to send the header.**

## 2. The cure, in two places

- **`worker/translations.mjs` `runLabelDrafts`**: after sign-in it reads the machine login's own `user_roles` shelters (service key; a
  headerless read by the login itself sees nothing, which is the fault) and makes every rpc with `x-shelter-id` for one of them. A login in
  two shelters is served in each in turn. **No default shelter id anywhere**: a single configured value would work today and be wrong the day
  there are two. A login with no role is reported as a failure, not guessed at.
- **`0408` `propose_label_th`**: the draft takes `shelter_id` from the row being labelled (every per-shelter label table carries it), and only a
  table with no such column (`features`, a code-defined catalogue) takes the request's shelter. Same shape as `record_label_sources()` in `0397`
  and the supplier-email fix in #1674. Proved on dev for `diet_types` (row shelter = draft shelter) and `features` (falls to the header).

## 3. Where should a scheduled failure surface? Chosen: the existing System status tile and its alert mail

The three candidates, weighed:

| Candidate | Would it have caught THIS fault? | Verdict |
|---|---|---|
| `0238` `scheduled_job_status` | **No.** It reads `cron.job`. The label cron is a Worker trigger, not a pg_cron job, so the database never knew it existed. | Extended, not used as is. |
| `0098` mailer | Yes, if something feeds it. It mails admins after two red runs and again on recovery. | **Used**: the sink. |
| Nightly `check-scheduled-writers.mjs --strict` | **No, and it would be red for a known reason.** It reads `cron.job` and `pg_proc`; this writer is in neither. And `--strict` exits 1 on *any* function that sends no shelter: 12 on dev today (11 after 0408), nearly all correctly leaning on a request header. That is `#shtci`'s shape: a nightly red nobody reads. | **Not scheduled.** No workflow added. |

**What was built (extension, not invention):** a Worker writer reports each run (`ok` / `skipped` / `failed`) through
`record_scheduled_writer_run()` into `scheduled_writer_runs` (`0408`, a platform table like `status_alert_checks`); `checkCronJobs()` in
`src/lib/status/health.ts` reads it for `EXPECTED_WORKER_WRITERS = ["label-drafts"]` and folds it into the **existing** `cronJobs` health check.
So the tile, the two-red-runs rule, the mail and the recovery mail all apply with no new tile or alert key. The tile is retitled **Scheduled
jobs** and its wording made generic (it said "old assistant requests are being kept", true of one job only). To watch the next Worker writer,
add its name to `EXPECTED_WORKER_WRITERS` and call `reportWriterRun(env, "<name>", summary)`.

**States:** red = two failed runs in a row (one is a blip); amber = never reported, or silent for 3 hours (the run is every 15 minutes);
`skipped` (deliberately not configured) is healthy. *Never reported is amber, not red*, so an environment where the Worker is not deployed or
has no label login does not sit red for ever. **That also means a Worker that is never deployed with this change reports nothing and stays
amber**, which is why amber needs a person who looks, and why `scripts/check-label-draft-cron.mjs` prints it as a warning.

`scripts/check-label-draft-cron.mjs --env test` asserts the rest: the live `propose_label_th` names `shelter_id`; the Worker sends the header on
every rpc and reports the run; the table and function exist and are unreachable by anon or a login; the last reported run is not a failure.

## 4. Proved by breaking it on purpose (dev, 2026-11-18)

Real `runLabelDrafts` with a wrong password, twice, reported as the Worker reports it; then two runs of the real alert route; then a real passing
run. `scheduled_writer_runs` went `failed`, `fail_runs 2`; the `cronJobs` check went `fail` ("label-drafts: last run failed (label login could
not sign in (400))") on run 1 and mailed on run 2 (`mailed: {"failed":["cronJobs"]}`, `sent` to three dev admin addresses); the passing run reset
`fail_runs` to 0 and the next alert run recovered (`mailed: {"recovered":["cronJobs"]}`). The rows, draft, throwaway login and role were removed
afterwards. **Fired once, in a test.** The mail is recorded as sent by the app; this stream did not read an inbox, so *delivery* is not proved
here, only that the 0098 path decided to send. It has not yet caught a real fault.

## 5. What this still cannot see

- **The Pi and production.** Nothing here reads either; `--env production` and the Pi procedure in `2026-11-17-pi-scheduled-writers.md` are
  Lutan's, under `#pirow`. Production does not have `0408`, so until it does its tile reads amber (table missing → "cannot read" is a *fail*
  there: apply `0408` before the Worker deploy, same ordering as `0238`).
- **Only the label writer reports.** The merch supplier email, calendar sweep and report-photo retention are Worker stages that log and swallow;
  they can adopt `reportWriterRun` one line each. Not done here: each is its own change and its own risk.
- **A writer that dies before it can report**, or a Worker whose trigger stops: the 15-minute heartbeat (`worker/heartbeat.mjs`) is what
  notices the trigger; a stalled reporter shows as amber after 3 hours, which does not mail.
- **Bodies are judged by pattern** in `check-scheduled-writers.mjs`; that was not changed.
- **`purge-write-requests`** (pg_cron, 03:29) is on `cron.job` but not in `EXPECTED_CRON_JOBS`, so a failure there is also silent. Adding it
  turns production red until it has `0292`; not done here (for the planner to file).
