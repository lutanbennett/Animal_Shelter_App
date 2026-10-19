# Status alert test relay: the request table (schema half)

2026-10-19, `claude/alert-test-relay-schema`. Follows `2026-10-16-alert-tile-green-needs-delivery.md`, option 2, which Lutan approved today.

## What

`0226_status_alert_test_requests.sql`: one table, `status_alert_test_requests`. The Pi cannot send mail, so its Status page will write a row meaning "please send a test alert"; the Worker's 15-minute cron sends it and fills in `run_id` (the `status_alert_runs` row), `status` and `picked_up_at`. The tile still goes green only when that run's `sent` is non-empty.

## Choices

- **Same lock as `status_alert_runs`.** RLS on, no policies, service role only. The Pi's writer holds the service key too, so the database cannot tell the Pi from the Worker by role. Instead a before-insert trigger forces every new row to `pending` with no pickup time, run or note: an insert can only ask, never claim a result.
- **One pending request at a time** (partial unique index). A held-down button queues one mail, not forty. The feature should treat the resulting unique violation as "already asked".
- **No foreign key to users.** A deleted account must not block or erase the log; the name is copied in.
- **`run_id` is `on delete set null`**, because `status_alert_runs` is trimmed to 30 days.
- Pruning old requests is the feature's job (cron), not this migration's.

## Follow-on feature stream

Pi button writes the row; Worker cron picks up pending rows, sends the test, records the run and marks the request; tile shows "test requested, waiting for the next 15-minute run" and goes green only on delivery. Worker deploy is Lutan's. Production needs 0226 applied before that deploy.
