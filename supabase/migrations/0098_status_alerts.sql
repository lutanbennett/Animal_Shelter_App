-- System status alerts (backlog, "System status: alert me when a tile goes
-- red", 2026-09-26; schema half — the feature half, claude/status-alerts,
-- adds the scheduled run, the mail and the Alerts tile).
--
-- Every few minutes a Worker cron trigger runs the System status checks
-- (src/lib/status/health.ts) and mails the admins when one turns red and
-- again when it recovers. To send ONE mail per outage rather than one per
-- run, and to notice the recovery at all, the run has to remember what it
-- saw last time. That is what these two tables are for.
--
-- Why a table rather than something already there: the run happens on a
-- Worker with no memory between invocations, the Cache API is per data
-- centre (a cron runs wherever Cloudflare puts it, so it would forget), and
-- KV would be a new namespace to create per environment by hand. The
-- database is already reached by every check, is per environment by
-- construction, and is where the Alerts tile reads from. The one thing it
-- cannot do is remember through its own outage — docs/decisions.md,
-- 2026-09-27, says what the run does then.
--
-- status_alert_checks — one row per check, upserted by every run.
--   check_key   the HealthReport key: 'database', 'drive', 'migrations',
--               'release', 'releaseMail', 'backup', 'origin'. Text, not a
--               CHECK list: a new tile must not need a migration to be
--               remembered.
--   state       what the check said last run: 'ok' | 'warn' | 'fail' | 'off'
--               (src/lib/status/run.ts's CheckState).
--   error       the check's error text, already scrubbed of secrets by
--               runCheck. Kept so a recovery mail can say what it was.
--   fail_runs   consecutive runs this check has been red. A mail goes out
--               at 2, so one slow answer from Google is not an outage.
--   alerted_at  when the "red" mail for the current outage went out; null
--               when there is no open outage. Cleared by the recovery mail.
--   updated_at  the run that last wrote the row.
--
-- status_alert_runs — one row per run: the heartbeat and the record.
--   trigger     'cron' (the Worker's schedule) | 'manual' (an admin's
--               "Run the alert check now") | 'test' (an admin's "Send a test
--               alert", which touches no check state).
--   failing     the checks that were red on this run.
--   mailed      what the run mailed about: null for nothing, else
--               { "failed": [...keys], "recovered": [...keys] }.
--   sent        addresses the mail was handed to.
--   skipped     [{ "address", "reason" }] — an unverified Cloudflare
--               destination, or mail being off in this environment. Kept
--               because an alert that silently reaches nobody is worse
--               than none: the tile shows these.
--   note        anything else the run wants an admin to see.
--   Kept for 30 days; each run deletes older rows.
--
-- Service role only. RLS on with no policies and every grant revoked: the
-- run and the admin page both use the service-role client, and nothing a
-- signed-in user holds should read or write alert state.
--
-- Re-runnable: if not exists throughout.

create table if not exists status_alert_checks (
  check_key text primary key,
  state text not null check (state in ('ok', 'warn', 'fail', 'off')),
  error text,
  fail_runs integer not null default 0 check (fail_runs >= 0),
  alerted_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists status_alert_runs (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  trigger text not null check (trigger in ('cron', 'manual', 'test')),
  failing text[] not null default '{}',
  mailed jsonb,
  sent text[] not null default '{}',
  skipped jsonb not null default '[]',
  note text
);

create index if not exists status_alert_runs_ran_at_idx on status_alert_runs (ran_at desc);

alter table status_alert_checks enable row level security;
alter table status_alert_runs enable row level security;

revoke all on status_alert_checks from public, anon, authenticated;
revoke all on status_alert_runs from public, anon, authenticated;
