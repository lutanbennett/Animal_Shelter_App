# Feature test plan — medical-photos-app

## Header

| | |
|---|---|
| Feature | App half: the resident Photos page and uploader follow `photos.resident_medical` (`0276`) |
| Backlog item | `docs/backlog.md` → **MEDICAL PHOTOS ARE READABLE WITH THE VIEW RESIDENTS CARD**, part (2) |
| Branch / worktree | `claude/medical-photos-app` @ `C:\Development\Animal_Shelter_medical-photos-app` |
| Dev server | port 3001, not driven in the browser (see §4) |
| PR | see the PR that carries this file |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | `40d7ee19` |

## 1. Scope and risk

- [x] Change is described in one sentence — the Photos page drops Medical rows for a login without the read, and the uploader says "Saved to Medical (not shown to you)" instead of promising a thumbnail
- [x] Files/areas touched listed — `sections/photos.tsx`, `PhotoUploader.tsx`, both dictionaries, `check-permission-catalogue.mjs` (decides list), the gallery guard test, a decision file, this plan
- [x] Roles affected identified — logins without View medical / Manage medical (View residents, volunteer, 2IC, head of medical); Add medical photos holders see the new wording
- [x] Out of scope written down — migrations, `set_resident_profile_photo()`, Drive links, adoption-updates gallery

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged and pushed
- [x] `node scripts/gates.mjs` ends clean:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration; `0276` already applied
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in the browser, left for manual verification: sign in with `--cards view_medical` and confirm Medical photos show
- [ ] Data persists — n/a: no data written by this change
- [ ] Create / edit / delete all exercised — n/a: those controls are unchanged
- [ ] Empty state renders sensibly — n/a: not driven in the browser, left for manual verification: `--cards view_residents` on a resident with only Medical photos
- [ ] Invalid input is rejected — n/a: no input added
- [ ] Boundary cases checked — n/a: folder test is the existing `isMedicalFolder`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Medical photos | all | pending: manual |
| management | Medical photos | all | pending: manual |
| staff | retired | n/a | n/a: role retired |
| doctor | Medical photos | all | pending: manual |
| volunteer | Photos page | no Medical | pending: manual |
| signed out | nothing | nothing | n/a: page requires sign-in |

- [ ] Every role above tested — n/a: not driven in the browser, left for manual verification: manual, see list below
- [x] A role that should not have access is blocked server-side — unchanged; `0276` policy, proved by its harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new screen or button
- [x] Translatable strings go through the translation path — two new strings in en.ts and th.ts
- [ ] Mobile viewport (375px) — n/a: one line of text changed
- [ ] Browser console clean — n/a: not driven in the browser, left for manual verification: manual
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — build compiles; guard test passes
- [ ] Shared file touched checked from a second page — n/a: PhotoUploader has one caller
- [x] Nothing merged from `main` during `sync` was broken — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: left to the planner; the production apply of `0276` is still outstanding
- [x] Decision added — `2026-10-28-medical-photos-app-half.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: 0276 is not yet applied to production.
- [x] Commit messages say why
- [x] **Claims were measured, not reasoned** — gates and guard test were run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] **Timezone-sensitive behaviour** — n/a: no date logic
- [ ] **Boundary or banding change** — n/a: none
- [ ] **Evidence is unedited tool output** — deferred: release manager
- [ ] Public pages re-checked — n/a: no public view changed

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [x] Migration and reading code in one PR? — no migration here; `0276` is already on main
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — revert this PR; `0276` is independent

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The gallery has no Medical heading, so the brief's "empty heading" case did not exist; the filter is defensive | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | `--cards view_residents`: no Medical photos or folder label; `--cards view_medical`: Medical photos appear | /residents/<id> → Photos (click through from the hub) |
| 2 | `--cards add_medical_photos`: upload says "Saved to Medical (not shown to you)" and the folder note explains | same page |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above was checked by a person — n/a: not driven in the browser, left for manual verification: the two role checks above

Manual verification by: pending: a person to run the two dev-signin checks

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: not yet released

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
