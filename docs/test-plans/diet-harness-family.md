# Test plan: diet-harness-family

## Header

| | |
|---|---|
| Feature | Seven diet-model check scripts made to tell the truth about recipes (`diets-app`, `diets-recipes-schema`, `medical-jobs`, `medication-rounds`, `order-and-units`, `price-free-pickers`, `diets-servings-app`) |
| Backlog item | `docs/backlog.md` → Security, the harness item (updated, not ticked) |
| Branch / worktree | `claude/diet-harness-family` @ `C:\Development\Animal_Shelter_diet-harness-family` |
| Dev server | `preview_start` name `dev`, port 3001 (needed only to give a fair count; the checks are database-only) |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | db51f26e |

## 1. Scope and risk

- [x] Change is described in one sentence: seven `scripts/check-*.mjs` files restated or repaired against diets-as-recipes, with retirements and reasons in `docs/decisions/2026-10-29-diet-harness-family.md`
- [x] Files touched: the seven scripts, the decision file, this plan; the backlog item on the `backlog` branch
- [ ] Roles affected identified — n/a: stated by card; no application behaviour changes
- [x] Out of scope: any schema change, `scripts/lib/`, the nine `harness-restate-nine` rows, `check-phone-width`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends clean. Closing line as printed:

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
- [x] Constraints exercised against real rows: each of the seven is itself a rolled-back dev harness and all seven ran green at the end (diets-app GREEN, diets-recipes-schema 5 held, medical-jobs 94 held, medication-rounds 75 held, order-and-units GREEN, price-free-pickers 45 held, diets-servings-app forecast delta 1531.25 g)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: each of the seven scripts run with `timeout 60` ends green
- [ ] Data persists — n/a: every harness rolls back
- [ ] Create / edit / delete — n/a: no application write path changed
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: the unknown-unit refusal and the no-card login are asserted inside the harnesses

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: outside the card system, not asked |
| management | n/a | n/a | n/a: stated by card |
| staff | n/a | n/a | n/a: retired |
| doctor | n/a | n/a | n/a: stated by card |
| volunteer | n/a | n/a | n/a: stated by card |
| signed out | n/a | n/a | n/a: no UI |

- [ ] Every role above tested — n/a: tested by card, not role: logins holding exactly the four medical-job cards, medical_records, view_residents, and nothing
- [x] A login without access is refused by the database: the no-card and view_residents-only logins are asserted refused on rounds, prescription rounds and the medical probes

## 5. Cross-cutting

- [ ] Nav entry — n/a: none
- [ ] Manual updated — n/a: developer scripts
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest checks re-run: all seven; no commit on `origin/main` since 2026-10-28 touched any of them
- [ ] Shared file touched — n/a: none of the frequently shared files touched
- [x] Nothing merged from `main` was broken by this branch

## 7. Documentation

- [x] Harness item updated (not ticked) on the `backlog` branch: fair count, closed rows struck, remainder left legible
- [x] Decision file: `2026-10-29-diet-harness-family.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: developer check scripts, no user-visible change
- [x] Commit messages say why
- [x] Claims measured: the servings gap (350 g = the Small dog's week) was established from the numbers and confirmed by the fixed run printing 1531.25 g

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic changed
- [ ] Boundary or banding assertions — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line, unedited
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

- [ ] Rollback position stated — n/a: reverting the merge restores seven scripts; nothing runtime

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `price-free-pickers` med_add probe stops at the units trigger for a login that cannot read units, so it no longer isolates the insert policy | accepted: recorded in the decision file as found, not fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: developer check scripts with no surface to look at

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
