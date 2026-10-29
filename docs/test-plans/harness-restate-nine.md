# Test plan: harness-restate-nine

## Header

| | |
|---|---|
| Feature | Nine removed-mechanism harness rows restated by cell (all green), plus progress output and --no-public for check-phone-width |
| Backlog item | `docs/backlog.md` → the harness sweep item (UPDATE 2026-10-29, claude/harness-restate-nine) and the check-phone-width item (ticked), both on the backlog branch |
| Branch / worktree | `claude/harness-restate-nine` @ `C:\Development\Animal_Shelter_harness-restate-nine` |
| Dev server | `preview_start` name `dev`, port 3002 |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | 24f6f1cd |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: the nine named rows go green, restated by cell, and phone-width reports progress
- [x] Files/areas touched listed: nine `scripts/check-*.mjs` (one renamed to `check-medical-archive-card.mjs`), `scripts/check-phone-width.mjs`, one comment in `src/lib/medical-archive/kinds.ts`, decision file. No app behaviour
- [ ] Roles affected identified — n/a: scripts only; the fixtures hold exactly named cells
- [x] Out of scope written down: diet family, scripts/lib, menu-coverage, check-production, migrations

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: each of the nine checks was run against dev (server up, port 3002) and exits 0: unit-conversions, stocktake, resident-microchip, prescription-visit-not-future, placement-guards, audit-log, adoption-updates, medical-archive-card, donation-receipts-schema (82 held). They write nothing (each ends in a rollback). No dev row was removed
- [x] phone-width: `--roles=admin --locales=en --pages=/clinics,/enclosures,/residents,/home --no-public` printed the plan and four [n/4] lines and exited 0
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete — n/a: no app behaviour changed
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: scripts only |
| management | n/a | n/a | n/a: stated by cell |
| staff | n/a | n/a | n/a: retired |
| doctor | n/a | n/a | n/a: stated by cell |
| volunteer | n/a | n/a | n/a: stated by cell |
| signed out | n/a | n/a | n/a: nothing public changed |

- [ ] Every role above tested — n/a: the checks use throwaway roles holding exactly named cells
- [ ] A role that should not have access is blocked server-side — n/a: each restated check asserts the refusal for a login without the cell

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings — n/a: none changed
- [ ] Mobile viewport — n/a: no layout changed
- [ ] Console clean — n/a: scripts only
- [ ] Network clean — n/a: scripts only

## 6. Regression

- [x] Nearest checks still pass: `check-hard-coded-security.mjs` prints "no coded security outside the Admin bypass"
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog items updated on the backlog branch (harness item: nine superseded, phone-width ticked)
- [x] Decision file: `2026-10-29-harness-restate-nine.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: developer check scripts, no user-visible change
- [x] Commit messages say why
- [x] Claims measured, not reasoned: each outcome is from a run on dev (port 3002)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — n/a: scripts only
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: none changed
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line is pasted, unedited
- [ ] Public pages re-checked — n/a: none changed

### Deploy safety

- [ ] Production ref line read — n/a: nothing deployed by this PR
- [ ] strip-baked-env seen — n/a: nothing deployed by this PR
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: reverting the merge restores the old scripts

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | no app fault found; unit-conversions was a stale replay, not a dev duplicate | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | none | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [ ] The manual list above is empty, or checked by a person — n/a: scripts only, no UI surface

Manual verification by: n/a: scripts only, no UI surface

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
