# Test plan: photo-card-check

## Header

| | |
|---|---|
| Feature | A per-card check of the resident photo table (`scripts/check-photo-cards.mjs`) and removal of three stale references to retired scripts |
| Backlog item | `docs/backlog.md` → Security, "PHOTO CARDS, ONE THING LEFT: part (1)" |
| Branch / worktree | `claude/photo-card-check` @ `C:\Development\Animal_Shelter_photo-card-check` |
| Dev server | `preview_start` name `dev`, port 3005 (not needed: the check is database-only) |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | 5972482e |

## 1. Scope and risk

- [x] Change is described in one sentence: a card-shaped check that a login holding exactly one photo card gets exactly the `attachments` access that card applies, plus three dead references removed
- [x] Files touched: `scripts/check-photo-cards.mjs` (new), `scripts/check-activity-lists.mjs`, `src/lib/permissions/jobs.ts` (comment), `docs/roles-and-permissions.md` §11, backlog tick, decision file
- [ ] Roles affected identified — n/a: stated by card; no app behaviour changes
- [x] Out of scope: other attachment owner types, `record_attachment`, any migration, other check scripts

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: `origin/main` was already an ancestor of the branch when checked
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
- [x] Constraints exercised against real rows: the new check itself is the rolled-back harness; it asserts eight one-card (or no-card) logins against read, insert and delete on resident photos and ran green on dev
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `node scripts/check-photo-cards.mjs` prints the per-card grid and `all photo-table card answers hold`
- [ ] Data persists — n/a: the harness rolls back; nothing is written
- [ ] Create / edit / delete — n/a: no app write path changed
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: the no-card login is the boundary and is asserted refused

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: outside the card system, not asked |
| management | n/a | n/a | n/a: stated by card |
| staff | n/a | n/a | n/a: retired |
| doctor | n/a | n/a | n/a: stated by card |
| volunteer | n/a | n/a | n/a: stated by card |
| signed out | n/a | n/a | n/a: no UI |

- [ ] Every role above tested — n/a: tested by card, not role; eight one-card logins in the check
- [x] A login without access is refused by the database: the no-card login reads and writes nothing

## 5. Cross-cutting

- [ ] Nav entry — n/a: none
- [ ] Manual updated — n/a: developer script
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest check re-run: `node scripts/check-activity-lists.mjs` still passes after the allow-list line was removed
- [ ] Shared file touched — n/a: none of the frequently shared files touched
- [x] Nothing merged from `main` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file: `2026-10-29-photo-card-check.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a developer check script, no user-visible change
- [x] Commit messages say why
- [x] Claims measured: the grid in the decision file is the script's own output on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
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

- [ ] Rollback position stated — n/a: reverting the merge removes a script and restores three references; nothing runtime

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | No single card can file a resident photo (resident_add without medical_add or resident_publish) | deferred to backlog: recorded in the decision file as found, not fixed |

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

Manual verification by: n/a: a developer check script with no surface to look at

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
