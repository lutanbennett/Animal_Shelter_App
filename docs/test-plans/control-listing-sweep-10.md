# Feature test plan

## Header

| | |
|---|---|
| Feature | control-listing-sweep-10 |
| Backlog item | `docs/backlog.md` → #79sqf (browser drive done for three groups, left open) |
| Branch / worktree | `claude/control-listing-sweep-10` @ `C:\Development\Animal_Shelter_control-listing-sweep-10` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | ad70f727 |

## 1. Scope and risk

- [x] Change is described in one sentence: drove the maintenance photo controls, /photos/add and the project_folders card in a browser as one-card logins; nothing found, no code changed
- [x] Files/areas touched: `docs/card-access-faults.md`, `docs/decisions/2026-11-06-control-listing-sweep-10.md`, this plan; no code, no migration
- [x] Cards affected: do_maintenance (maintenance.photos), add_photos (photos.shelter_add), project_folders (projects.folders); none changed, only driven
- [x] Out of scope: facility.enclosures edit and placement.death_withdraw (Admin-only by ruling, not drivable by one card); hub Photos tab uploader (another stream)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged origin/main today, then gates run
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: typecheck exited 0 after 143s
=== gates: lint exited 0 after 545s
=== gates: test exited 0 after 92s
=== gates: build exited 0 after 453s
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

- [x] Happy path works end to end: new job with photo, add/remove after photo, /photos/add tag and save, New folder create, all as one-card logins
- [x] Data persists: the saved job and the created folder opened on their own pages after the action
- [x] Create and delete exercised: job and folder created, a job photo removed
- [x] Empty state: the new folder shows Photos (0) and no Add control for a login without projects.photos
- [ ] Invalid input — n/a: no input changed
- [ ] Boundary cases — n/a: single boolean gates

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| exactly do_maintenance | /maintenance/new, a job page | photo picker, Add after photos and Remove drawn and accepted | pass |
| exactly add_photos | /photos/add | picker drawn, upload accepted | pass |
| exactly project_folders | /projects category | New folder drawn, create accepted; no photo controls | pass |

- [x] Every card above tested
- [ ] A login without access is blocked server-side — n/a: no server check changed or touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new behaviour users read about
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: console not read; page loaded and rendered
- [ ] Network clean — n/a: network not read

## 6. Regression

- [x] Nearest pages still work: /maintenance, /home, /projects opened by clicking through
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates run after the merge

## 7. Documentation

- [x] Backlog: #79sqf deliberately not ticked, remainder is for the planner to rewrite (in PR body)
- [x] Decision file added: `docs/decisions/2026-11-06-control-listing-sweep-10.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: no user-visible change, only a drive and records
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
- [ ] Rollback position stated — n/a: revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| none | | Nothing found: every control drawn was accepted when pressed | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| none | Nothing a person must look at | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: the drive was the verification and there is no surface left to look at

### Result

Result: pass
