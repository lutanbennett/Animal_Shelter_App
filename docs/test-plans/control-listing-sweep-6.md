# Feature test plan

## Header

| | |
|---|---|
| Feature | control-listing-sweep-6 |
| Backlog item | `docs/backlog.md` → control-listing item, retitled and left open |
| Branch / worktree | `claude/control-listing-sweep-6` @ `C:DevelopmentAnimal_Shelter_control-listing-sweep-6` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | 2d3c99a6 |

## 1. Scope and risk

- [x] Change is described in one sentence: read setMaintenanceStatus to the line, read the /api handlers, drive two visit pages with one-card logins; no code change
- [x] Files/areas touched: decision file, this plan, one retitled line on docs/backlog.md
- [x] Activities affected: none changed; read only
- [x] Out of scope: the mechanical whole-page render-site trace (decision §3)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from current main today; no later merge to bring in
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: typecheck exited 0 after 130s
=== gates: lint exited 0 after 173s
=== gates: test exited 0 after 16s
=== gates: build exited 0 after 137s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no code changed; two visit pages driven read-only, see decision §4
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: unchanged
- [ ] Invalid input — n/a: no input changed
- [ ] Boundary cases — n/a: single boolean gate

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| view_medical | visit detail | refused (reads gate at edit) | found, not fixed, decision §4 |
| medical_records | visit detail and edit | controls match actions | ok |
| admin / signed out | not driven | - | not driven |

- [ ] Every role above tested — n/a: admin and signed-out not driven; two one-card logins driven
- [ ] A login without access is blocked server-side — n/a: no server check changed; no server check touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new behaviour users read about
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven in a browser
- [ ] Network clean — n/a: not driven in a browser

## 6. Regression

- [ ] Nearest pages still work — n/a: typecheck and build only; no page changed
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: branch is on current `main`

## 7. Documentation

- [x] Backlog: control-listing item retitled in place, left open, residue named
- [x] Decision file added: `docs/decisions/2026-11-03-control-listing-sweep-6.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: documentation only, no control changed
- [x] Commit messages say why
- [x] Claims in the decision file were read from the code or seen in the browser

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool's actual output — n/a: gates output above pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Production ref line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position stated — n/a: docs only, revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | visit detail and edit pages ask medical.visits at edit though the page comment says read; for the planner to file | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Save and uploads on visit edit not pressed | /clinic-visits/[id]/edit |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty — n/a: pending Lutan, see table above

Manual verification by: pending: Lutan to press Save on the visit edit page with a one-card login

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the repo
- [ ] Handed to the production release manager — n/a: nothing to hand over beyond the merge

Result: pass with accepted defects
