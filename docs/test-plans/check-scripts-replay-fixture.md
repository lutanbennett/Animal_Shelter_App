# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Sweep of the check scripts that replay a migration: assert live where the replay is stale, fix stale data assumptions |
| Backlog item | `docs/backlog.md` → 26 check scripts replay a migration file to build their fixture |
| Branch / worktree | `claude/check-scripts-replay-fixture` @ `C:\Development\Animal_Shelter_check-scripts-replay-fixture` |
| Dev server | port 3010 (not used: scripts only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (check-scripts-replay-fixture session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | tip of the branch after the last script change; all 36 scripts run against dev |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every `check-*.mjs` that mentions `supabase/migrations` was run against dev and triaged, and the ones that failed or carried the replay trap were converted
- [x] Files/areas touched listed: 15 files in `scripts/check-*.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-02-replay-or-assert-live.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: dev check scripts, no app role sees them
- [x] Out of scope written down: twelve scripts that replay objects no later migration redefined were left on replay by the rule in the decision

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: run before the PR opens, output in the PR
- [ ] `node scripts/gates.mjs` — n/a: run before the PR opens, output in the PR
- [ ] CI green on the PR — n/a: the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: before the change 14 of the 36 scripts exited 1 on dev; after it all 36 exit 0 (each ends `HARNESS-OK` inside a rolled-back transaction)
- [ ] Data persists — n/a: every harness runs inside begin…rollback and writes nothing
- [ ] Create / edit / delete all exercised — n/a: no app data flow
- [ ] Empty state — n/a: no UI
- [ ] Invalid input is rejected — n/a: each script still refuses any project other than dev
- [ ] Boundary cases — n/a: the assertions of the converted scripts are unchanged except where a stale expectation was corrected and is named in the decision (vet scope in adoption-updates A7, the view in place of the table for anon reads)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | tooling, no app surface | n/a |
| management | n/a | tooling, no app surface | n/a |
| staff | n/a | tooling, no app surface | n/a |
| vet | n/a | tooling, no app surface | n/a |
| volunteer | n/a | tooling, no app surface | n/a |
| signed out | n/a | the harnesses' own anon steps pass against the live grants | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The nearest things still work — n/a: no code reads these scripts
- [ ] Shared file checked from a second page — n/a: no shared file touched
- [ ] Nothing merged from `main` during `sync` was broken — n/a: the merge brought in one backlog line

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices recorded in `docs/decisions/2026-10-02-replay-or-assert-live.md`
- [ ] `README.md` still accurate — n/a: README does not describe these scripts
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: development check scripts, no shelter user sees them
- [x] Commit messages say why, not just what
- [x] Claims are measured: the failing and passing runs are from the actual script exit codes

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: scripts are not part of the Worker bundle
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary assertions cover both edges — n/a: unchanged
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Dev check scripts only

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | 14 of 36 check scripts failed on dev: 6 replayed a stale shared object or read a table anon lost access to, 7 asserted pre-migration data state that no longer holds, 1 asserted pre-0108 vet access | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: the scripts' exit codes are the check.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (check-scripts-replay-fixture session)  Date: 2026-10-02

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; the scripts' exit codes are the check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet, PR does not exist
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a (tooling only)  Date: —
