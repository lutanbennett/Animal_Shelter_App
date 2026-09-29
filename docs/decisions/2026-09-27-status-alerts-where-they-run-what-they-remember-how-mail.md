# 2026-09-27 — Status alerts: where they run, what they remember, how mail gets out

The backlog item's three open questions, settled.

- **Where it runs: a Worker cron trigger that calls the app inside the
  same Worker.** `scheduled` in `worker/index.mjs` builds
  `POST <STATUS_ALERT_SITE>/api/status/alerts` and hands it straight to the
  OpenNext handler (`openNext.fetch`), not over the network, not to the
  Pi, not through the edge cache. So the checks in
  `src/lib/status/health.ts` run exactly as the page runs them, with the
  Worker's bindings, and there is no second copy of them. Moving the checks
  into the Worker would have duplicated them, and bundled Drive and
  Supabase clients twice. The route is bearer-authenticated with the
  service-role key, as the release relay is, and `src/proxy.ts` lets that
  one path through without a session, for POST only. **For the LINE
  follow-up:** the sender is one function (`send` in
  `src/lib/status/alerts.ts`) that the run calls with a subject and body.
  LINE is a second way out beside the mail binding, not a new home for the
  run. Because the route is plain HTTP with a bearer token, the Pi (or
  anything else with the key) can trigger the same run if the Worker ever
  stops being the right home.
- **Every 15 minutes, and red twice in a row before anyone is mailed.** On
  dev a whole run takes 8–11 s, and the backup check (Drive listing, 8 s
  timeout) timed out on single runs while this was being built. One slow
  answer from Google is not an outage. Recovery is mailed on the first run
  that isn't red. Only `fail` counts; `warn` is working and `off` is
  deliberate. One mail per run covers everything that changed, so two
  tiles going red together make one mail.
- **Remembering: two tables (0098), in the database.** The reasons (no
  Worker memory, the Cache API is per data centre, KV would be hand-made
  per environment) are in the schema entry above. A check's `alerted_at`
  is set only when the mail reached at least one address. A mail that
  reached nobody is tried again next run, rather than being marked as
  told. **The known gap:** when the database itself is down, the run can't
  read what it has already said or who the admins are, so it sends nothing
  and logs why in the Worker's logs. Sending anyway would mean a mail
  every 15 minutes, to a fallback address that doesn't exist. Staff notice
  a dead database within minutes anyway. The Alerts tile shows the gap in
  runs once the database is back.
- **Mail: a new `STATUS_ALERT_MAIL` send_email binding, not
  `RELEASE_MAIL`.** It is the same Cloudflare mechanism, so it has the same
  limit: it only delivers to addresses verified under Email Routing →
  Destination addresses. Release mail's guard (`RELEASE_MAIL_ENV`) stays
  exactly as it was, and the test Worker, which deliberately never sends
  release mail, can send alerts. That is where the path gets proved before
  production relies on it. From `alerts@lannacare.org`, whose replies reach
  Lutan through the catch-all. **Whether every admin is verified can't be
  confirmed from here** (production reads are refused in worktrees, and
  the verified list is in the Cloudflare dashboard). So instead of
  assuming, every address is reported sent or skipped with Cloudflare's
  reason, stored on the run, and shown on the tile. The tile goes red when
  the last mail reached nobody, and amber when it skipped someone. *Send a
  test alert* is how to find out on purpose. LINE isn't needed first: mail
  is enough once the addresses are verified, and the tile says when they
  aren't.
- **The alert path watches itself only through the page.** The Alerts
  tile is red when no cron run has been recorded for three intervals (the
  schedule stopped, or the Worker hit its CPU limit on the free plan:
  untested until deployed) or the last mail reached nobody. It is not one
  of the checks the run alerts on, because a stopped schedule or an
  unreachable inbox can't mail about itself.
- **Testable on purpose:** *Run the alert check now* is one real run
  (it counts toward the two), and *Send a test alert* changes no state.
  `STATUS_ALERT_SIMULATE_FAIL=<keys>` turns named checks red in the alert
  run only, and only on the dev database. A local dev server has no mail
  binding, so there the mail is printed to the server log and counted as
  sent. That is what lets the one-mail-per-outage rule be proved locally.
- **No secret in a mail:** every error was already scrubbed by
  `runCheck`, and the mail and the skipped reasons go through
  `redactSecrets` again on the way out.
