# Test plan: harness-repair-removed-mechanism

## Header

| | |
|---|---|
| Feature | Removed-mechanism harness rows: 17 run, 8 resolved (3 retired, 3 repaired or restated, 1 green, 1 app fault filed) |
| Backlog item | `docs/backlog.md` → the harness sweep item (UPDATE 2026-10-29, claude/harness-repair-removed-mechanism, on the backlog branch) |
| Branch / worktree | `claude/harness-repair-removed-mechanism` @ `C:\Development\Animal_Shelter_harness-repair-removed-mechanism` |
| Dev server | `preview_start` name `dev`, port 3006 |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | 27b598f7 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: each row reaches green, repaired, restated or retired with a reason, or is filed; rest named
- [x] Files/areas touched listed: three scripts removed, three repaired, decision file. No app code
- [ ] Roles affected identified — n/a: scripts only; the restated checks sign in by card, not by role
- [x] Out of scope written down: six diet harnesses, phone-width, menu-coverage, check-production, migrations, card-access-faults.md; nine fixtures left red and named

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

- [x] Happy path: features-schema, home-cards, assistant-refused-client and dead-schema-drop were run against dev (server up, port 3006) and end green; the three retired scripts no longer exist
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete — n/a: no app behaviour changed
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: scripts only; Admin used only as Admin |
| management | n/a | n/a | n/a: stated by card |
| staff | n/a | n/a | n/a: retired |
| doctor | n/a | n/a | n/a: stated by card |
| volunteer | n/a | n/a | n/a: stated by card |
| signed out | n/a | n/a | n/a: nothing public changed |

- [ ] Every role above tested — n/a: the restated checks use logins holding exactly named cards
- [ ] A role that should not have access is blocked server-side — n/a: the restated checks assert this by card (upcoming-visits-page, page-guards-live, residents-export)

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings — n/a: none changed
- [ ] Mobile viewport — n/a: no layout changed; phone-width sampled (see defects)
- [ ] Console clean — n/a: scripts only
- [ ] Network clean — n/a: scripts only

## 6. Regression

- [x] Nearest checks still pass: `check-hard-coded-security.mjs` run after the sync
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item updated on the backlog branch (UPDATE line; umbrella stays open; card-grants drift filed as its own item)
- [x] Decision file: `2026-10-29-harness-repair-removed-mechanism.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: internal check scripts; nothing a shelter user would notice
- [x] Commit messages say why
- [x] Claims measured, not reasoned: each outcome is from a run on dev (port 3006)

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
| 1 | low | `check-card-grants` red: four photo grants in `card_grants` are absent from `cards.ts` (0276/0279) | deferred to backlog: filed as its own item |
| 2 | low | nine fixtures (unit-conversions, stocktake, resident-microchip, prescription-visit-not-future, placement-guards, audit-log, adoption-updates, medical-archive-roles, donation-receipts-schema) still red | deferred to backlog: named on the umbrella item |

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

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
