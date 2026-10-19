# Status alert test relay: the feature half

2026-10-19, `claude/alert-test-relay`. Follows `2026-10-16-alert-tile-green-needs-delivery.md` (option 2) and `2026-10-19-status-alert-test-requests.md` (migration 0226).

## What

- On a Pi-drawn Status page, **Send a test alert** now works. It writes one row to `status_alert_test_requests` and says the test goes out on the next 15-minute run. Run the alert check now stays off there.
- The Worker's existing cron route (`/api/status/alerts`) runs `processTestRequests` after the normal alert run. For the one pending request it calls the same `sendTestAlert` the Worker-drawn button uses, then marks the request `sent` or `failed` with the `status_alert_runs` id it produced.
- The tile shows "Test mail waiting, up to 15 minutes" while a request is pending.

## Choices

- **Waiting is never green.** The tile's colour still comes only from the newest real mail with `sent` non-empty. The pending request is a line of text and changes no state.
- **One at a time** comes from the database (unique violation, code 23505), so two admins pressing together also queue one. The second press is told "already waiting".
- **Order in the route:** after the normal alert run, so a test can never delay a real alert. It never throws.
- **A failed test is marked `failed`, not retried.** If the mail reached nobody, the real `test` run is on the tile in red, and the admin can ask again.
- **Name** is copied from the account (full name, else email); no foreign key, as 0226 chose.
- Old requests are deleted after 30 days by the same cron.
- If the Pi were ever to run the processing it does nothing (it cannot mail), so a request is left waiting rather than lost.

## Not done here

Production still needs migration 0226 applied before the Worker deploy. Both are Lutan's. The Worker pickup itself was not run end to end (no Worker here); the database rules were proved on dev by `scripts/check-status-alert-test-requests.mjs`.
