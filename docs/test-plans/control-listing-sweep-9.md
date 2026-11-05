# Feature test plan

## Header

| | |
|---|---|
| Feature | control-listing-sweep-9 |
| Backlog item | `docs/backlog.md` → #79sqf (remainder narrowed, left open) |
| Branch / worktree | `claude/control-listing-sweep-9` @ `C:\Development\Animal_Shelter_control-listing-sweep-9` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-05 |
| Carries a migration? | no |
| Tested at SHA | a4d6e1a8 |

## 1. Scope and risk

- [x] Change is described in one sentence: audited the 23 /api handlers against their calling controls and traced the whole-page group, and fixed three controls drawn where the action refuses
- [x] Files/areas touched: MaintenanceForm and maintenance/new, projects/[id] PhotoSection/FolderView/page, photos/add page and AddPhotosFlow, decision file, this plan, `#79sqf` remainder
- [x] Activities affected: maintenance.photos and projects.photos (the controls now ask them); route choice on /photos/add
- [x] Out of scope: the hub Photos tab uploader (residents/** is another stream's), reported only

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged origin/main today, then gates run
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: typecheck exited 0 after 32s
=== gates: lint exited 0 after 454s
=== gates: test exited 0 after 50s
=== gates: build exited 0 after 139s
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

- [x] Happy path works end to end: Admin sees Add photos and Add a caption on a project folder page
- [ ] Data persists — n/a: no write path changed, only whether a control is drawn
- [ ] Create / edit / delete — n/a: no write path changed
- [x] Empty state: a project folder with no photos for a login without projects.photos shows Photos (0) and no Add control
- [ ] Invalid input — n/a: no input changed
- [ ] Boundary cases — n/a: single boolean gates

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| donations_receipts (reads project folders) | project folder page, Photos section | no Add, remove or caption control | pass |
| Admin (outside the card system) | same page | Add photos and Add a caption drawn | pass |

- [x] Every card above tested
- [ ] A login without access is blocked server-side — n/a: no server check changed or touched; upload routes still ask projects.photos and maintenance.photos

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new behaviour users read about
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: console not read; page loaded and rendered
- [ ] Network clean — n/a: network not read

## 6. Regression

- [x] Nearest pages still work: /projects and a folder page opened by clicking through
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates run after the merge

## 7. Documentation

- [x] Backlog: control-listing item remainder rewritten in place, left open
- [x] Decision file added: `docs/decisions/2026-11-05-control-listing-sweep-9.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: only Admin sees the changed controls today, no card grants these activities
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
| 1 | low | Hub Photos tab draws an uploader its route may refuse (another stream's file) | reported, for the planner |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | New-job form shows the photo picker only with maintenance.photos | /maintenance/new, Admin vs a login without it |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-05

### Manual verification

- [ ] The manual list above is empty — pending: new-job form picker check

Manual verification by: pending: someone to look at /maintenance/new
