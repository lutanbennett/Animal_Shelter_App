# Three more Worker stages report themselves (#rpwrt)

**Decided 2026-11-18.** `calendar-sweep`, `merch-supplier-emails` and `report-photo-retention` now record their runs in
`scheduled_writer_runs` (0408) through the reporter `#lblcr` built, so a failure shows on System status and in the alert mail.

## Where the string-to-summary conversion lives: shape (b), an adapter, in `worker/writer-runs.mjs`

Each stage returns a string that `finishHeartbeat` also reads. Options were (a) stages return summaries, (b) an adapter turns the
string into `{outcome, note}`, (c) `reportWriterRun` accepts strings. Chosen **(b)**:
- (a) rewrites three stages and the heartbeat's input for no gain; (c) changes the proven reporter. (b) leaves both untouched and
  adds two exports beside it: `summariseStage(line)` and `reportStage(env, job, line, stages)`. `reportWriterRun`'s posting logic is unchanged.
- **The adapter is not cosmetic.** A stage's string for an HTTP answer is `name: <status>` whatever the status, so reporting the
  string as "ok" would have recorded a 500 or a 401 from the endpoint as healthy. The adapter judges the status: 2xx is `ok`,
  anything else `failed`. `skipped…` is `skipped` (healthy, as `#lblcr` defined it); `failed…`/`threw…` is `failed`; anything it
  does not recognise is `failed`, so a new wording cannot hide a fault.
- **`not due` records nothing.** The two daily stages run on one tick in 96; recording the other 95 would stamp "ok" on a job that
  did not run and hide a day it did not.
- The tile treats the two daily stages as stale after 48 hours (as a nightly pg_cron job), the 15-minute calendar sweep after 3.
  A daily stage is red after two failed days in a row (`fail_runs >= 2`), not two failed ticks.

## Proof, on dev, by breaking one on purpose

Stage chosen: `calendar-sweep`, driven through the real `reportStage` against the dev database (the real endpoint was not called:
the stage's strings were fed in, so this proves the adapter, the RPC and the row, not the HTTP call):

```
fail 1 [{"job":"calendar-sweep","last_outcome":"failed","last_detail":"answered 500","fail_runs":1}]
fail 2 [{"job":"calendar-sweep","last_outcome":"failed","last_detail":"failed, boom","fail_runs":2}]
pass   [{"job":"calendar-sweep","last_outcome":"ok","last_detail":"200","fail_runs":0}]
cleaned []
```
`fail_runs 2` is the red threshold in `checkCronJobs`, and a passing run reset it to 0. **Not driven live:** the tile in a browser
and the alert mail; `#lblcr` showed both for the same table and the same reader, which this change did not touch.

## What this does not close

**A writer that dies before reporting is still invisible**, as `#lblcr` named. A crash before `reportStage` leaves no row; the tile
only goes amber when the row ages out.
