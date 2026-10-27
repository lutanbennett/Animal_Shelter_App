# The cron now leaves a trace, and the instrument can tell a heartbeat from a run (2026-10-27)

Stream `cron-leaves-a-trace`. **This does not fix the cron.** The production Worker deploy and the
Cloudflare trigger are Lutan's (2026-10-02). It makes the fault diagnosable.

## What was found before building (step zero)

- Test is dead too: `last cron run 2026-10-23T09:45:42Z`, read 2026-10-27 13:33 UTC. Production
  was `2026-10-23T10:00:13Z` when the planner read it on 2026-10-27 (I could not re-read it: this
  worktree has no `.env.deploy.production`). Consecutive quarter-hour slots on one day.
- The early returns in `worker/index.mjs` were all still there: `runStatusAlerts` logged only to the
  console, `runCalendarSweep` returned with no output at all.
- Nothing in `docs/decisions/` or `git log -S STATUS_ALERT_SITE` says this was already built.

## What was built

1. `worker/heartbeat.mjs`: first thing `scheduled()` does, in its own try/catch, writes a
   `status_alert_runs` row straight to Supabase REST with the service-role key (not through the app,
   which is one of the things being diagnosed). After the stages it patches the note with what each
   one did. Row: `trigger = 'cron'`, `failing = '{}'`, `note` beginning `heartbeat:`. **No migration**,
   because the check constraint already allows `'cron'`.
2. **The trap, closed in the same commit.** The `calendar-cron` check used to read
   `max(ran_at) where trigger = 'cron'`; a heartbeat would have made a dead cron look fixed. It now
   excludes `heartbeat:` rows and prints two lines (last REAL run, last heartbeat) plus a verdict:
   no heartbeat yet / trigger stopped / a stage skipped / a stage failed / fired but no real run
   written / healthy. `cronVerdict` is exported; the SQL was read-run against test.
3. Both early returns now `console.error` the **name** of each missing variable (never a value) and
   put it in the heartbeat note.

## (5) The APP_HOST hypothesis: NOT SUPPORTED, not proven impossible

Commit `33ab9833` (2026-10-20). Evidence:

- `STATUS_ALERT_SITE` is a plain `var` in `wrangler.jsonc`, both the test block (line 58) and the
  production block (line 142). The commit did not edit those lines; it added `APP_HOST`/`PUBLIC_HOST`
  beside them. `git log -- wrangler.jsonc` shows no change to them since 2026-09-27.
- The commit's only edit to `worker/index.mjs` is a comment on line 1.
- Its `src/proxy.ts` redirect runs only for `GET`/`HEAD`; the cron sends `POST`, and the two cron
  paths are let through by the next `if`. The `same-origin.ts` change is a comment. The sweep route
  only changes where event links point.
- What I could not rule out: the **deployed** Worker's variables and secrets (`GOOGLE_CALENDAR_REFRESH_TOKEN`
  and the service-role key are secrets, invisible from the repo) and the Cloudflare trigger. Patterns
  searched: `STATUS_ALERT_SITE|APP_HOST|PUBLIC_HOST` over `wrangler.jsonc worker scripts/deploy.mjs`;
  these cannot see anything set in the dashboard.

So: the repo as committed does not explain it, and the "repo is innocent" claim is still not
established, because the deployed state is unreadable from here.

## What this cannot detect

There is no Worker harness in the repo, so the `scheduled()` wiring itself is untested; only
`heartbeat.mjs` has unit tests (stubbed `fetch`). Whether the heartbeat row really lands is proved
only after Lutan deploys the Worker and the next quarter-hour passes.

## Found, not fixed

Nothing under `src/app/` was touched. If a stage turns out to be skipped, the heartbeat note names
the variable; setting it is Lutan's.
