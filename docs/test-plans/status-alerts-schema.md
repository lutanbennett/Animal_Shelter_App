# Feature test plan

## Header

| | |
|---|---|
| Feature | `status_alert_checks` + `status_alert_runs` (0098) — schema half only |
| Backlog item | `docs/backlog.md` → **System status: alert me when a tile goes red** (ticked on the feature PR, `claude/status-alerts`, not this one) |
| Branch / worktree | `claude/status-alerts-schema` @ `C:\Development\Animal_Shelter_status-alerts-schema` |
| Dev server | not started — this change ships no runtime code |
| PR | opened from this commit |
| Tested by / date | Claude (automated) / 2026-09-27 |
| Carries a migration? | yes — `0098_status_alerts.sql` |
| Tested at SHA | branch on `main` @ `d10acc6`; the migration, its harness, a `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two additive, service-role-only tables that let the scheduled alert run remember each check's last state (so one outage is one mail, and a recovery can be noticed) and record every run
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0098_status_alerts.sql`; `scripts/check-status-alerts.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — none: nothing is granted to `anon` or `authenticated`; only `service_role` reads and writes (harness S3)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the cron, the route, the mail and the Alerts tile are the feature PR; the backlog item is not ticked here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — branch created from `origin/main` `d10acc6` today and `main` has not moved
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

  ```
  === gates: build exited 0 after 235s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `main` tops out at `0097_adoption_updates.sql`; `gh pr list --state open` was empty; the pre-commit hook printed `migration numbers: ok — 0098_status_alerts.sql (against origin/main d10acc6, highest 0097_adoption_updates.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `This checkout: 97 applied, 1 pending.` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0098_status_alerts.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0098_status_alerts.sql … ok`; `--status` afterwards: `Applied here, no file on origin/main: 1 — 0098_status_alerts.sql`, as expected before merge
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — the harness executes the file twice in one transaction on top of the real apply
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: two new tables; nothing existing is altered
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `node scripts/check-status-alerts.mjs`, output unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0098 twice | S1 upsert counts consecutive fails, run rows default empty | S2 unknown state, negative fail_runs, unknown trigger refused | S3 authenticated and anon refused by the grant, service_role reads, inserts, updates, deletes
  CONTEXT:  PL/pgSQL function inline_code_block line 74 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit, and exits 0 only on `HARNESS-OK`.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive; undo is `drop table status_alert_runs, status_alert_checks;`, and nothing depends on either until the feature ships
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0098` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--env production --dry-run` then without, **before** the status-alerts feature deploys (its cron writes these tables from its first run)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no code reads these yet; S1 exercises the exact upsert and insert shapes the feature's run makes
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert, update and delete exercised as the service role in S3
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash — the CHECKs refuse an unknown state, a negative `fail_runs` and an unknown trigger (S2)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — negative `fail_runs` refused; a run row with every optional column omitted takes its empty defaults (S1)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: an admin's own session is `authenticated` — the admin page reads through the service-role client | refused directly | refused, as `authenticated` (S3) |
| management / staff / vet / volunteer | nothing | refused | refused, as `authenticated` (S3) |
| signed out | nothing | refused | refused, as `anon` (S3) |
| service role | both tables | read + write | reads, inserts, updates, deletes (S3) |

- [x] Every role above tested — `authenticated` stands for every signed-in role, since no policy or grant distinguishes them
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — refused at the grant, which is what PostgREST checks first

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible; the feature PR documents the alerts
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: nothing existing reads or writes these tables, and no existing object is altered
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing to merge; gates green on the tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: ticked on the feature PR, when alerts actually go out
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — why a table rather than the Cache API or KV, free-text `check_key`, service role only, and the one thing it cannot do
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: two tables nothing reads yet; the feature PR adds the line when admins start getting mail
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the grants, checks and re-runnability are the harness's; "the Cache API is per data centre" and "KV needs a namespace per environment" are Cloudflare's documented behaviour, not measured here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy — SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: timestamps only; nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band or boundary in the schema; the two-red-runs rule is the feature's and is proved there
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing public reads these tables, and anon is granted nothing

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added by this PR

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no; the feature PR will, so production needs 0098 **before** it deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive — two new tables
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. Additive and safe to leave; dropping the tables once the feature ships loses the alert history and makes the next run treat every red check as new

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | First version granted nothing to `service_role`, relying on project defaults that new Supabase projects no longer add; the grants lint (`check-migration-grants.mjs`) failed the gates | fixed — explicit grants added, harness S3 now writes as the service role too |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no UI surface, and every behaviour of the tables is in the harness | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty; the tables have no surface a person could look at

Manual verification by: n/a: schema only, no surface to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness result rather than duplicating it
- [x] Handed to the production release manager — the PR states the production apply as Lutan's, before the feature deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
