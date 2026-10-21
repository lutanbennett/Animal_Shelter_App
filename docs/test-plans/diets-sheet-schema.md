# Feature test plan — diets-sheet-schema

## Header

| | |
|---|---|
| Feature | Feed Special Diets sheet and intake read recipes (migration 0242) |
| Backlog item | `docs/backlog.md` → Diets as recipes, cleanup migration only (parts 1 and 2 done here) |
| Branch / worktree | `claude/diets-sheet-schema` @ `C:\Development\Animal_Shelter_diets-sheet-schema` |
| Dev server | not started |
| PR | pending |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | yes — `0242_special_diets_and_intake_read_recipes.sql` |
| Tested at SHA | `08a2e480` |

## 1. Scope and risk

- [x] Change is described in one sentence: the Feed Special Diets sheet and intake now read recipes, so a diet made since recipes (Diabetic) appears and can be chosen
- [x] Files/areas touched: 0242, `src/lib/diets/special-list.ts`, `src/app/medical/diets/page.tsx`, `src/app/residents/new/`, `src/app/diets/actions.ts`, five check scripts, backlog, decision, releases
- [x] Roles affected: those with medical.diet read (sheet) and resident.register (intake)
- [x] Out of scope: the cleanup migration (bridge triggers, legacy columns); `dropBridgeRecipe` deliberately kept, see the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in, already up to date
- [x] `node scripts/gates.mjs` ends as below

```
=== gates: build exited 0 after 216s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number 0242 is one above the highest on main, no other schema PR open
- [x] `--status` reviewed before applying
- [x] `--dry-run` reviewed, ok
- [x] Applied to dev and recorded in schema_migrations
- [x] File is re-runnable (create or replace, drop function if exists)
- [x] Existing rows still read correctly — pre-recipe diets have same-named recipes from 0239
- [x] Harness: `node scripts/check-diets-sheet.mjs` (rolled back) asserts one sheet row per ingredient, quantity = Medium size x portion 0.5, Standard absent, picker lists the diet, intake without a diet refused. GREEN
- [ ] Down-migration — n/a: additive views; old record_intake overload dropped, restorable from 0090
- [ ] Production apply plan — n/a: release manager applies 0242 before deploy (code reads it); production is behind, run --status --env production first

## 4. Functional checks

- [x] Happy path works end to end — at database level via the harness
- [ ] Data persists — n/a: no new stored UI state
- [ ] Create / edit / delete — n/a: read paths plus intake insert, covered by harness
- [ ] Empty state — n/a: unchanged list empty state
- [ ] Invalid input — n/a: missing diet refused by record_intake (harness)
- [ ] Boundary cases — n/a: size unset falls back to Medium in the view, as the forecast does

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | sheet, intake | works | harness ran as admin |
| management | n/a | unchanged | not run |
| staff | n/a | retired role | n/a |
| doctor | n/a | unchanged | not run |
| volunteer | n/a | no access | unchanged |
| signed out | n/a | no access | unchanged |

- [ ] Every role above tested — n/a: view filters and grants unchanged from 0166
- [ ] Server-side block — n/a: grants identical to the view they replace

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new route
- [ ] Manual — n/a: Diets topic already describes the sheet showing recipes
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: see manual list
- [ ] Browser console — n/a: see manual list
- [ ] Network — n/a: see manual list

## 6. Regression

- [x] Nearest pages: build compiles all routes; check scripts moved to p_diet_id
- [ ] Shared file loaded from a second page — n/a: no shared file touched
- [x] Nothing merged from main during sync was broken (already up to date)

## 7. Documentation

- [x] Backlog items updated on this branch (titles say only the cleanup migration remains; not ticked because part 3 is open)
- [x] Decision file docs/decisions/2026-10-21-special-diets-read-recipes.md
- [x] README.md still accurate
- [x] **Release notes.** `unreleased` has a line for the sheet and intake
- [x] Commit messages say why
- [x] Claims were measured by the harness

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test — deferred: release manager
- [ ] Timezone-sensitive — n/a: no date logic changed
- [ ] Boundary assertions — n/a: no banding change
- [x] Evidence pasted is actual tool output
- [ ] Public pages — n/a: no public page touched
- [ ] deploy line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secrets — n/a: none
- [x] Migration plus reading code: yes, so production apply of 0242 comes before the deploy
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — n/a: additive views and a function, nothing destructive
- [x] Apply plan: 0242 to production before deploy
- [x] Rollback: leave schema; Pi redeploy of previous ref; old app would fail on record_intake name, so do not roll code back past this without redeploying

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | dropBridgeRecipe kept against the brief | accepted, explained in decision |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Make a Diabetic recipe, give a dog that diet, see every ingredient on the sheet; take in a new dog and choose Diabetic | Settings → Diets, /medical/diets, /residents/new |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-10-21

- [ ] Manual list — n/a: browser journey on dev

Manual verification by: pending: browser check of the Diabetic journey

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to release manager — n/a: happens after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
