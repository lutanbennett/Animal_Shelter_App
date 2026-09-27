# Feature test plan

## Header

| | |
|---|---|
| Feature | Status alerts: a Worker cron runs the System status health checks every 15 minutes and mails the admins when one goes red (two runs in a row) and when it recovers; an Alerts tile with *Run the alert check now* and *Send a test alert* |
| Backlog item | `docs/backlog.md` → **System status: alert me when a tile goes red** (ticked on this branch) |
| Branch / worktree | `claude/status-alerts` @ `C:\Development\Animal_Shelter_status-alerts` |
| Dev server | `localhost:3006` (`next dev`); the Worker path under `wrangler dev --env test --test-scheduled` on the OpenNext build |
| PR | opened from this commit |
| Tested by / date | Claude (automated) / 2026-09-27 |
| Carries a migration? | no — reads and writes `0098_status_alerts.sql`, which lands first in its own PR (#161) |
| Tested at SHA | `9081d1b` (the merge of `origin/main` at `96ba160`; later commits touch only this plan) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — email to admins when a health check turns `fail`, and again when it recovers, alerting on `fail` only; the item's three open questions are settled in `docs/decisions.md` (2026-09-27)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/status/alerts.ts` (new: the run, the mail, the tile's check), `src/lib/status/health.ts` (`runHealthChecks` split out of the cached report), `src/app/api/status/alerts/route.ts` (new), `src/proxy.ts` (one POST path let through without a session), `worker/index.mjs` (`scheduled`), `wrangler.jsonc` (cron, `STATUS_ALERT_MAIL` binding and vars on test and production), `src/app/admin/status/` (Alerts tile, two actions, `AlertActions.tsx`), en/th dictionaries, manual, releases, README, decisions, backlog
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admins receive mail and see the tile; the page is admin-only (`requireAdminUser`) and both actions refuse a non-admin with a returned result; signed out, only the bearer-authenticated route is reachable, and it answers 401 without the key
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — LINE (the sender is one function to extend); alerting when the database itself is down (the run remembers in it — decisions.md says why, and it logs instead); the UAT Worker (no routes until the cutover, so no cron there yet)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in — `origin/main` at `96ba160` (53 commits, including release 0.7.0, #170, #171, #172); two conflicts, both resolved by hand: `docs/backlog.md` (kept this branch’s tick, dropped main’s interim “built but not finished” note) and `src/lib/releases.ts` (0.7.0 had moved the older lines into its release, so this line joins main’s three new ones)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

  ```
  === gates: build exited 0 after 241s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this branch; 0098 is #161
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration on this branch
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration on this branch
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration on this branch (0098 was applied to dev from #161's branch)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration on this branch
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no existing table is read differently
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration on this branch; #161's harness covers 0098, and the runs below write real rows through the service role
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration on this branch
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0098` (#161) to production **before** this deploys: from its first cron run this writes both tables

## 4. Functional checks

- [x] Happy path works end to end — on `localhost:3006` with `STATUS_ALERT_SIMULATE_FAIL=drive`, five runs of `POST /api/status/alerts` with the dev service-role key, as the cron sends it. Output unedited (the `drive row:` lines are a service-role read of `status_alert_checks` after each run):

  ```
  --- no auth
  401 {"error":"Not authorised."}
  --- run 1
  200 {"remembered":true,"failing":["drive"],"failed":[],"recovered":[],"sent":[],"skipped":[],"note":null}
  drive row: [{"state":"fail","fail_runs":1,"alerted_at":null}]
  --- run 2
  200 {"remembered":true,"failing":["drive"],"failed":["drive"],"recovered":[],"sent":["lutan.bennett2@gmail.com","claude@lutan.com"],"skipped":[],"note":"Local dev server: the mail was written to the server log, not sent."}
  drive row: [{"state":"fail","fail_runs":2,"alerted_at":"2026-09-26T17:50:23.23+00:00"}]
  --- run 3
  200 {"remembered":true,"failing":["drive","backup"],"failed":[],"recovered":[],"sent":[],"skipped":[],"note":null}
  drive row: [{"state":"fail","fail_runs":3,"alerted_at":"2026-09-26T17:50:23.23+00:00"}]
  ```

  then the simulation removed and the dev server restarted:

  ```
  --- run 4 (recovered)
  200 {"remembered":true,"failing":["drive","backup"],"failed":["backup"],"recovered":[],"sent":["lutan.bennett2@gmail.com","claude@lutan.com"],"skipped":[],"note":"Local dev server: the mail was written to the server log, not sent."}
  drive row: [{"state":"fail","fail_runs":4,"alerted_at":"2026-09-26T17:50:23.23+00:00"}]
  --- run 5
  200 {"remembered":true,"failing":[],"failed":[],"recovered":["drive","backup"],"sent":["lutan.bennett2@gmail.com","claude@lutan.com"],"skipped":[],"note":"Local dev server: the mail was written to the server log, not sent."}
  drive row: [{"state":"ok","fail_runs":0,"alerted_at":null}]
  ```

  So: red once → no mail; red twice → one mail; red a third time → quiet; recovered → one mail. Runs 3–4 add a real, unplanned case: the backup check timed out (8 s) on two runs in a row, just after the dev server started, and was mailed and then recovered by the same rule. The mails, from the server log:

  ```
  Subject: [localhost:3006] Not working: Photo storage (Google Drive)
  Not working (red on 2 checks in a row):
    - Photo storage (Google Drive): Simulated failure (STATUS_ALERT_SIMULATE_FAIL).
  ---
  Subject: [localhost:3006] Not working: Weekly backup
    - Weekly backup: No answer within 8 seconds.
  ---
  Subject: [localhost:3006] Working again: Photo storage (Google Drive), Weekly backup
    - Photo storage (Google Drive) (it was: No answer within 8 seconds.)
    - Weekly backup (it was: No answer within 8 seconds.)
  ```

  (The recovery line then said "it was", quoting the last error seen, which for Drive was the real timeout, not the simulated one it was alerted for; reworded to "last error:". Defect 1.)
- [x] Data persists — reload the page and the change is still there — state survives a dev-server restart (runs 4–5 read the `alerted_at` run 2 wrote)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no records are edited by people; the run's upsert, insert and 30-day prune are the writes
- [ ] Empty state renders sensibly (no rows yet) — n/a: the only empty state is the Alerts tile before any run, which needs an admin sign-in to see; covered by manual row 1 on a test deploy, where the tile starts empty
- [x] Invalid input is rejected with a readable message, not a crash — the route without the key: `401 {"error":"Not authorised."}`; the actions refuse a non-admin with a returned `adminAccessRequired` rather than a throw
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — exactly 1 red run (no mail) and exactly 2 (mail); red again after mailing (quiet); two checks changing in one run (one mail naming both)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/status`, both alert buttons | tile, buttons, mail | pending: Lutan — the page needs an admin sign-in |
| management / staff / vet / volunteer | nothing new | page redirects, actions refuse | n/a: unchanged `requireAdminUser` / `hasAdminRole` gates, not driven |
| signed out | `POST /api/status/alerts` | 401 without the key | 401 (above) |
| the cron | `POST /api/status/alerts` with the key | a run | not driven locally: the `scheduled` handler needs the OpenNext build under wrangler; the same request it builds was sent by hand (the runs above, and again after the sync: `401` without the key, a GET redirected to `/login`, and `200 {"remembered":true,"failing":[],…}` with it). Proved on deploy: manual row 5 |

- [x] Every role above tested — the non-admin rows rely on the existing gates, unchanged; the admin row is left for manual verification
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — 401 without the bearer key

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no new page; the tile is on the existing System status page
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the System status topic gains the Alerts steps and a note on verified addresses and the database-down gap; reading it at `/manual` is in the manual list below
- [x] Translatable strings go through the translation path, checked at `/management/translations` — the new strings are in both `en.ts` and `th.ts` (typecheck enforces the same shape); the Thai is Claude's and wants a native read, listed below
- [ ] Mobile viewport (375px) — n/a: not seen without an admin sign-in; listed for manual verification
- [ ] Browser console clean — n/a: not seen without an admin sign-in; listed for manual verification
- [ ] Network clean — n/a: not seen without an admin sign-in; listed for manual verification

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `getHealthReport` is now `cached("health", runHealthChecks)`, the same checks in the same order; the page was not loaded signed in (manual list). `src/proxy.ts` changes only for `POST /api/status/alerts`: a signed-out GET of `/admin/status` still redirected to `/login?next=%2Fadmin%2Fstatus`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `src/proxy.ts` runs for every page: the signed-out redirect above is the ordinary path; `worker/index.mjs`'s `fetch` is untouched, only `scheduled` added
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — where it runs (and what that means for LINE), two red runs, what it remembers and the database-down gap, the separate mail binding and verified addresses, the tile watching the path, the test hooks, secrets
- [x] `README.md` still accurate — a Status alerts paragraph beside System status: cron, route, binding, vars, and how to prove it on a dev server
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — yes: admins get mail they didn't before; one line added
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the dedupe, the recovery and the backup timeouts are the runs above; the 8–11 s run time was measured on dev (three timed runs: 8.8 s, 7.9 s, 11.4 s). Not measured: whether the free plan's CPU limit lets the cron finish on the deployed Worker, and whether every admin's address is verified in Cloudflare — both are stated as unknowns, with the tile as the way they show

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager — and this is the first real proof: on `test.lannacare.org`, within 45 minutes of the deploy the Alerts tile should show a cron run; *Send a test alert* should arrive in Lutan's inbox from `alerts@lannacare.org`
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: timestamps compared as instants; nothing derives a shelter date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — the two-run threshold: 1 red run (no mail), 2 (mail), 3 (quiet), then 0 (recovery)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the mail excerpts drop the repeated footer and blank lines; everything else is verbatim
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changes; the Worker's `fetch` is untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — no new secret: the cron reuses `SUPABASE_SERVICE_ROLE_KEY`; the new vars (`STATUS_ALERT_SITE`, `STATUS_ALERT_FROM`), the `STATUS_ALERT_MAIL` binding and the cron are all in `wrangler.jsonc` and deploy with the Worker

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no: the migration is #161, which must be on production first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan, for #161
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration here
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0098` to production before this deploys (§3)

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `wrangler rollback` to the previous version removes the cron and the binding with it; alert state in 0098 is left and harmless. It does not un-send a mail already sent

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A recovery line said "it was: …" quoting the last error seen, which can differ from the error that was alerted (Drive: alerted as simulated, last seen as a timeout) | fixed — worded "last error:" |
| 2 | low | First draft kept the site origin in a module variable shared by concurrent runs in one isolate | fixed before any run — passed as a parameter |
| 3 | note | The backup check runs close to its 8 s timeout on dev and timed out on two runs in a row after a dev-server restart | accepted — that is what the two-run rule is for; if it mails falsely on a deployed site, raise that check's timeout (a one-line change in `health.ts`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as admin, the System status page shows the Alerts section and its tile; *Run the alert check now* reports a result under the buttons; *Send a test alert* asks first, then reports reached / skipped | `localhost:3006/admin/status` (or `test.lannacare.org` after a test deploy) |
| 2 | The same page at 375 px, with the console clean | same |
| 3 | The Thai strings for the tile and buttons read naturally | same, language switched to ไทย |
| 4 | The System status topic in the manual reads correctly | `/manual` → Settings → System status |
| 5 | After a test deploy: a cron run appears on the tile within 45 minutes, and a test alert actually arrives from `alerts@lannacare.org` | `test.lannacare.org/admin/status`, Lutan's inbox |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — five items await Lutan

Manual verification by: pending: Lutan — the five items above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the key runs rather than duplicating it
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR merges

Result: pass

Release manager acknowledgement: pending: production release manager
