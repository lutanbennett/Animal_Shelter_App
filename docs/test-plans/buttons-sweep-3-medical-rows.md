# Test plan: buttons-sweep-3-medical-rows

## Header

| | |
|---|---|
| Feature | Clinic visit page log links follow the cards |
| Backlog item | `docs/backlog.md` → Resident operations, buttons follow cards (slice 3 of 4) |
| Branch / worktree | `claude/buttons-sweep-3-medical-rows` @ `C:\Development\Animal_Shelter_buttons-sweep-3-medical-rows` |
| Dev server | `http://localhost:3009` |
| PR | see PR |
| Tested by / date | Claude, 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence: four log links on `/clinic-visits/[id]` are drawn only for the card their own page asks
- [x] Files touched: `src/app/clinic-visits/[id]/page.tsx`, a guard test, `src/lib/releases.ts`, a decision file
- [x] Roles affected: any login with `medical.visits` edit but missing one of the four activities
- [x] Out of scope: slice 4, hub tab rows, all server checks (unchanged)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends clean:

```
GATES_HERE
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
- [ ] Data persists — n/a: nothing is written, links only
- [ ] Create / edit / delete exercised — n/a: no data change
- [ ] Empty state renders sensibly — n/a: no list changed
- [ ] Invalid input rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no input

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | visit page | all four links | not driven |
| management | visit page | links per cards | not driven |
| staff | n/a: retired role | none | n/a |
| doctor | visit page | links per cards | not driven |
| volunteer | visit page | no Actions block | not driven |
| signed out | visit page | refused | not driven |

- [ ] Every role above tested — n/a: dev-signin roles hold all four cards, so the hidden side needs a card edit on shared dev; left for manual
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
- [x] Decision added: `docs/decisions/2026-10-27-buttons-follow-cards-medical-rows.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line tagged `medical_records`
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
| 1 | Open a visit as a login with Book clinic visits manage but without Record weight (or another of the four): that link is absent, the others stay | `/clinic-visits/<id>` on dev |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

- [ ] The manual list is empty or checked — n/a: not empty; item 1 awaits a person

Manual verification by: pending: item 1 above

### Result

- [ ] Open defects fixed or accepted — n/a: no defects
- [ ] Checklist pasted into the PR — n/a: PR does not exist yet
- [ ] Handed to the release manager — n/a: handed over on merge

Result: pass

Release manager acknowledgement: n/a: not yet
