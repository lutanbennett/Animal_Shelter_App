# Feature test plan — red-harnesses

## Header

| | |
|---|---|
| Feature | Repair the dev check harnesses that do not need a ruling |
| Backlog item | `docs/backlog.md` → Security → *Thirteen dev check harnesses still red…* (status note added; item stays open) |
| Branch / worktree | `claude/red-harnesses` @ `C:\Development\Animal_Shelter_red-harnesses` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | pending: filled in once opened |
| Tested by / date | Claude / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | 719db642 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — twelve dev check scripts corrected or retired in part, each reason in `docs/decisions/2026-10-13-red-harnesses.md`; the rulings were not made
- [x] Files/areas touched listed — `scripts/check-*.mjs`, `docs/roles-and-permissions.md` (one cell), `docs/decisions/`, `docs/backlog.md`
- [ ] Roles affected identified — n/a: dev scripts only; no role's access changes
- [x] Anything explicitly **out of scope** written down — `check-2ic-role`, `check-maintenance-role`, `check-medical-jobs` and the doctor's cells are left red for Lutan

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 317s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration (the scripts themselves were each run against dev and end in a rollback)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — each repaired script was run against dev and printed its OK/GREEN result: fixed-outgoings, facility-maps, safety-stock, medication-label, lifecycle-guards, role-write-policies, impact-baselines
- [ ] Data persists — n/a: nothing is written; every script ends in a rollback, and dev's real impact figures were re-read afterwards unchanged
- [ ] Create / edit / delete exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no UI
- [x] Boundary cases checked — `check-role-write-policies` part 1 was fed two bogus rows and failed on both, so it still catches a missing policy

### Role access matrix

n/a: no app surface changes, so no role sees anything different.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a |

- [ ] Every role above tested — n/a: no UI or access change
- [ ] A role that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: none added
- [ ] Manual updated — n/a: dev scripts are not in the manual
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — the build in `gates.mjs` covers the app; the only non-script file touched is a docs table
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: its done-when is not met (five harnesses stay red for rulings); a precise status note was added instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-13-red-harnesses.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: dev check scripts and a docs table; no shelter user can reach any of it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured — every green was a run against dev

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts only, nothing deployed
- [ ] Timezone-sensitive behaviour proved — n/a: none
- [ ] Boundary or banding assertions — n/a: no banding change
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates lines are pasted, unedited
- [ ] Public pages re-checked — n/a: no public change
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none
- [ ] Migration and code ordering — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: nothing ships to production from this PR; revert the commits

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `docs/roles-and-permissions.md` §4 gave `maintenance.bills` no Management cell, against its own note and `0189` | fixed |
| 2 | info | Five harnesses remain red for rulings (doctor cells; 2IC, maintenance and medical bundles) | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Rulings: the doctor's cells; the 2IC, Head of Maintenance and Head of Medical bundles against `jobs.ts` | `docs/decisions/2026-10-13-red-harnesses.md`, "Left red" |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one row is a decision for Lutan, not something to look at on this PR

Manual verification by: pending: Lutan's rulings on the five harnesses left red

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing here deploys

Result: pass with accepted defects
