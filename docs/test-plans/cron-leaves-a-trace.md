# Feature test plan — cron-leaves-a-trace

## Header

| | |
|---|---|
| Feature | A Worker heartbeat, loud skipped stages, and a `calendar-cron` check that reports a heartbeat and a real run separately |
| Backlog item | `docs/backlog.md` → **THE 15-MINUTE SCHEDULE HAS STOPPED ON BOTH TEST AND PRODUCTION** (not ticked: the cron is still dead) |
| Branch / worktree | `claude/cron-leaves-a-trace` @ `C:\Development\Animal_Shelter_cron-leaves-a-trace` |
| Dev server | not started — no UI surface |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | `45308188` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — diagnostics only; the cron is not fixed
- [x] Files/areas touched listed — `worker/index.mjs`, `worker/heartbeat.mjs`, `worker/heartbeat.test.mjs`, `scripts/lib/readonly-checks.mjs`, `docs/decisions/2026-10-27-cron-heartbeat.md`, this plan
- [x] Roles affected identified — none; no page or role sees a change
- [x] Anything explicitly **out of scope** written down — deploying the Worker, the Cloudflare trigger, any migration, `src/app/`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see the closing gates lines below; sync was run before the PR
- [x] `node scripts/gates.mjs` ends clean. Closing lines: `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; the heartbeat uses `trigger = 'cron'`, which the check constraint allows
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path — `worker/heartbeat.test.mjs` (3 tests) passes; `cronVerdict` run on five inputs gave the five expected verdicts; the new SQL ran against test and rendered both lines
- [ ] Data persists — n/a: no UI; the heartbeat row is only proved after the Worker is deployed (see Left for manual verification)
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: the check prints `never` when there is no heartbeat row
- [x] Invalid input — a heartbeat that cannot be written (network error, 401, missing variables) returns null and never throws (tested)
- [x] Boundary cases — a stale heartbeat, a stale real run and a missing heartbeat each give a different verdict (checked by hand-run)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing new | no page, route or permission changed | n/a |

- [ ] Every role above tested — n/a: no page or route changed
- [ ] A role that should not have access is blocked server-side — n/a: no new surface; the heartbeat writes with the service-role key the Worker already holds

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual updated — n/a: internal diagnostics
- [ ] Translatable strings — n/a: no user text
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — the Worker's `scheduled()` still runs the same three stages in the same order; only returns and logging changed
- [ ] Shared file touched, loaded from a second page — n/a: `readonly-checks.mjs` is read by the check scripts only; `calendar-cron` was run against test
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: the cron is still dead; the item was rewritten on the `backlog` branch instead
- [x] Non-obvious design choices added as `docs/decisions/2026-10-27-cron-heartbeat.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: internal diagnostics; the cron is still down and nothing a user sees has changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The `APP_HOST` conclusion is from the diff of `33ab9833` and `wrangler.jsonc`, and says what it could not see

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: the release manager at cut time
- [ ] Deployed SHA matches — deferred: the release manager at deploy time
- [ ] Deployed to test — deferred: Lutan (Worker deploys are his)
- [ ] Smoke-tested on test — deferred: Lutan; after one quarter-hour run `node scripts/check-production.mjs calendar-cron --env test`
- [ ] Timezone-sensitive behaviour — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: the 45-minute staleness window is the only threshold and both sides were run
- [ ] Evidence pasted is the tool's actual output — n/a: no table of results
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: Lutan at deploy time
- [ ] `strip-baked-env` line seen — deferred: Lutan at deploy time
- [ ] Any new secret/env var exists — n/a: none added; the heartbeat uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, already used by `worker/translations.mjs`
- [ ] Migration ordering — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager; the change is additive, and a revert needs only a Worker redeploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `scheduled()` itself has no test harness in the repo, so its wiring is untested | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the Worker is deployed to test and one quarter-hour passes, the `calendar-cron` output shows a heartbeat line and a verdict | `node scripts/check-production.mjs calendar-cron --env test` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: left pending; the item needs a Worker deploy that is Lutan's

Manual verification by: pending: the heartbeat can only be seen after Lutan deploys the Worker to test

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file
- [ ] Handed to the production release manager — n/a: not yet released

Result: pass with accepted defects
