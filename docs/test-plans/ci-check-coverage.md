# Feature test plan

## Header

| | |
|---|---|
| Feature | Preflight reports any blocking ci.yml check red on the checkout |
| Backlog item | `docs/backlog.md` → #ckcia |
| Branch / worktree | `claude/ci-check-coverage` @ `C:\Development\Animal_Shelter_ci-check-coverage` |
| Dev server | n/a: scripts only |
| PR | see PR |
| Tested by / date | Claude, 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | branch tip |

## 1. Scope and risk

- [x] Change is described in one sentence: the planner preflight now runs every blocking `ci.yml` check on the checkout and fails if any is red
- [x] Files touched: `scripts/check-ci-checks-on-main.mjs` (new), `scripts/check-planner-preflight.mjs`, a decision file, backlog tick
- [ ] Cards affected — n/a: scripts only, no card or page changes; admin and public unaffected
- [x] Out of scope: PR-diff checks, `npm run` steps, wiring into CI itself

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: typecheck exited 0 after 188s
=== gates: lint exited 0 after 294s
=== gates: test exited 0 after 43s
=== gates: build exited 0 after 297s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `node scripts/check-ci-checks-on-main.mjs` ran on main-equivalent tree, 23 blocking checks pass, 6 PR-only skipped, exit 0
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state — n/a: no UI
- [x] Invalid input: first run's 120s kill printed `exit null`; timeout raised to 300s and a timeout now prints TIMED OUT
- [ ] Boundary cases — n/a: no user input

- [ ] Every login tested — n/a: no page or permission surface
- [ ] Blocked server-side — n/a: no page or permission surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: planner tooling, not user-facing
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Preflight still parses (`node --check`); `--skip-ci-checks` path left the existing probes untouched
- [ ] Shared file touched from a second page — n/a: no shared app file touched
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file `docs/decisions/2026-11-23-preflight-asks-whether-main-passes-ci.md`
- [ ] README — n/a: no user-facing change
- [ ] **Release notes.** n/a: planner script, nobody in the shelter or Admin would notice
- [x] Commit messages say why
- [x] Claims were measured: the 3m14s runtime and the 23/6 counts come from the run

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — n/a: scripts only, nothing deploys
- [ ] Smoke test — n/a: scripts only
- [ ] Timezone — n/a: no date logic
- [ ] Boundary/banding — n/a: no thresholds
- [ ] Evidence unedited — n/a: no pasted evidence beyond gates
- [ ] Public pages — n/a: not touched
- [ ] Deploy target line — n/a: scripts only
- [ ] strip-baked-env — n/a: scripts only
- [ ] New secrets — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: revert the commit; nothing deployed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | First run killed `check-script-integrity` at 120s and reported `exit null` | fixed: 300s timeout, TIMED OUT label |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: scripts only, no surface to look at

- [ ] Open defects fixed or accepted — n/a: the one defect is fixed
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch beside the PR
- [ ] Handed to release manager — pending: release manager reads it before the next deploy

Result: pass
