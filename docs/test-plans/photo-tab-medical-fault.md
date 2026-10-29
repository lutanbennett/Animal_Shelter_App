# Test plan: photo-tab-medical-fault

## Header

| | |
|---|---|
| Feature | Resident Photos tab shows Medical photos to a login holding photos.resident_medical at read; /medical/photos wording follows the same activity |
| Backlog item | `docs/backlog.md` → Security, "PHOTO CARDS, THREE THINGS LEFT", parts (2) and (3) |
| Branch / worktree | `claude/photo-tab-medical-fault` @ `C:\Development\Animal_Shelter_photo-tab-medical-fault` |
| Dev server | `preview_start` name `dev`, port 3002 |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | 2717639e |

## 1. Scope and risk

- [x] Change is described in one sentence: the tab asked `photos.resident_medical` at the edit default, so a read-only grant saw no Medical photos; it now asks read
- [x] Files touched: `sections/photos.tsx`, `medical/photos/page.tsx`, both i18n dictionaries, `releases.ts`, `check-permission-catalogue.mjs` expectation, one test expectation
- [ ] Roles affected identified — n/a: stated by card (view_medical, add_medical_photos)
- [x] Out of scope: the per-card photo-table check (part 1), the gallery's action controls beyond the one line

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch is current with main as of its cut; the merge-in is done by the PR check
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
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: a login holding only view_medical, reached by clicking through, sees the Photos tab photos including the Medical folder for resident d238fc7f
- [ ] Data persists — n/a: read-only change
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: unchanged
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: one argument changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: unchanged, isAdmin short-circuit |
| management | n/a | n/a | n/a: stated by card |
| staff | n/a | n/a | n/a: retired |
| doctor | n/a | n/a | n/a: stated by card |
| volunteer | n/a | n/a | n/a: stated by card |
| signed out | n/a | n/a | n/a: page needs sign-in |

- [ ] Every role above tested — n/a: tested by card: view_medical sees Medical photos
- [ ] A role that should not have access is blocked server-side — n/a: the database policy (0276) is unchanged and still refuses; a login with neither card was not driven

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual updated — n/a: no feature change
- [x] Translatable strings go through both dictionaries (en and th noView reworded)
- [ ] Mobile viewport — n/a: no layout changed
- [ ] Console clean — n/a: not inspected beyond the page loading
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] Nearest pages checked: the resident Photos tab loads
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; part (1) belongs to another stream, clauses (2) and (3) struck through only
- [x] Decision file: `2026-10-29-photo-tab-medical-fault.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line for view_medical and add_medical_photos
- [x] Commit messages say why
- [x] Claims measured: the cause was read in code and confirmed by the tab showing photos after the change

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: none changed
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

- [ ] Rollback position stated — n/a: reverting the merge restores the old call; no schema touched

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Login with neither card not driven; gallery action controls not re-listed | accepted: recorded in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of `noView` on /medical/photos reads well | /medical/photos in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [ ] The manual list above is empty, or checked by a person — n/a: the one manual item is not yet checked by a person, see the pending signature below

Manual verification by: pending: Thai wording of the reworded line

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
