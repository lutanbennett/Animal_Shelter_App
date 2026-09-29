# 2026-09-27 — Status alerts: the schema (`0098_status_alerts.sql`)

- **The alert run remembers in the database, in two tables.** A Worker
  cron has no memory between runs; the Cache API is per data centre and a
  cron runs wherever Cloudflare puts it; KV would be a namespace created by
  hand per environment. The database is per environment by construction
  and already reached by every check. `status_alert_checks` holds one row
  per check (last state, scrubbed error, consecutive red runs, when the
  open outage was mailed); `status_alert_runs` one row per run, which is
  both the heartbeat the Alerts tile reads and the record of who was sent
  what and who was skipped. 30 days of runs are kept.
- **`check_key` is free text, not a CHECK list,** so a new tile is
  remembered without a migration.
- **Service role only**: RLS on, no policies, every grant revoked. The run
  and the admin page both read through the service-role client.
- The one thing this cannot do is remember through its own outage; the
  feature entry says what the run does when the database is the red tile.
