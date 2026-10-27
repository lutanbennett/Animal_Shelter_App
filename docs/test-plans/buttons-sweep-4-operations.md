# Test plan: buttons-sweep-4-operations

## Header

| | |
|---|---|
| Feature | Maintenance job photo controls follow the cards |
| Backlog item | `docs/backlog.md` → Resident operations, buttons follow cards (slice 4) |
| Branch / worktree | `claude/buttons-sweep-4-operations` @ `C:\Development\Animal_Shelter_buttons-sweep-4-operations` |
| Dev server | `http://localhost:3005` |
| PR | see PR |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | d2c69ce4 |

## 1. Scope and risk

- [x] Change is described in one sentence: the Add photo and Remove photo controls on `/maintenance/[id]` are drawn only for `maintenance.photos`, the activity the upload route and delete policy ask
- [x] Files touched: `maintenance/[id]/page.tsx`, `MaintenanceJobView.tsx`, a guard test, `src/lib/releases.ts`, a decision file (stocktake, deliveries, enclosures, purchasing audited, no change needed)
- [x] Roles affected: any login with `maintenance.jobs` or read access but not `maintenance.photos`
- [x] Out of scope: slice 5 surfaces, all server and database checks (unchanged)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends clean:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in the browser; see Left for manual verification
- [ ] Data persists — n/a: nothing is written, buttons hidden only
- [ ] Create / edit / delete exercised — n/a: no data change
- [ ] Empty state renders sensibly — n/a: no list changed
- [ ] Invalid input rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no input

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | job page | photo controls | not driven |
| management | job page | photo controls per cards | not driven |
| staff | n/a: retired role | none | n/a |
| doctor | job page | photo controls per cards | not driven |
| volunteer | job page | no photo controls | not driven |
| signed out | job page | refused | not driven |

- [ ] Every role above tested — n/a: the hidden side needs a login with maintenance.jobs but not maintenance.photos, a card edit on shared dev; left for manual
- [ ] A role without access is blocked server-side — n/a: server checks untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new behaviour to document
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [ ] Nearest pages still work — n/a: not driven; typecheck and build cover it
- [ ] Shared file touched checked from a second page — n/a: `releases.ts` is the only shared file, an added line
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: parent item has slice 4 left; note goes on the backlog branch
- [x] Decision added: `docs/decisions/2026-10-28-buttons-follow-cards-operations.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line tagged `do_maintenance`
- [x] Commit messages say why, not just what
- [x] Claims in commit messages were measured, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary/banding assertions — n/a: not a boundary change
- [ ] Evidence is the tool's actual output — n/a: only the gates block, pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Both migration and code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: pure UI gating; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open a job as a login with Maintenance jobs but without Maintenance photos: no Add photo or Remove, the rest stays | `/maintenance/<id>` on dev |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

- [ ] The manual list is empty or checked — n/a: not empty; item 1 awaits a person

Manual verification by: pending: item 1 above

### Result

- [ ] Open defects fixed or accepted — n/a: no defects
- [ ] Checklist pasted into the PR — n/a: PR does not exist yet
- [ ] Handed to the release manager — n/a: handed over on merge

Result: pass

Release manager acknowledgement: n/a: not yet
