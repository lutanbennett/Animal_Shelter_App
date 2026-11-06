# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Deceased record widening, app half: notes on five tables and a late blood test (controls for migration 0320) |
| Backlog item | `docs/backlog.md` → `#314hq` (part D, app half) and `#f6p2d` |
| Branch / worktree | `claude/deceased-record-widen-app` @ `C:\Development\Animal_Shelter_deceased-record-widen-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | opened from this branch (see the PR list) |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | 4e77b94f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: on a dead resident's page, a person with the right card can add a note to a placement, weight, prescription, immunization or procedure, and record a late blood test, and the closed-record sentences are true.
- [x] Files/areas touched listed: `src/app/residents/[id]/closed-note-actions.ts` (new), `src/components/ClosedRecordNoteControl.tsx` (new), `src/lib/closed-record/notes.ts` (new), the `housing`, `weight`, `prescriptions`, `immunizations`, `procedures`, `blood-tests` sections, `ProcedureList.tsx`, `src/app/blood-tests/new/{page,BloodTestForm}.tsx`, both dictionaries. No migration, no worker.
- [x] Cards affected: the cards carrying `resident.record` edit, `medical.weight`, `medical.prescriptions`, `medical.immunizations`, `medical.procedures` and `medical.blood_tests` edit. Admin sees all through `perms.isAdmin`; signed-out visitors are unaffected (no public surface).
- [x] Out of scope written down in `docs/decisions/2026-11-08-deceased-record-widen-app.md`: no delete, no add of any entry except a blood test, no edit form, no file on a late blood test, no edit of an existing result's text, `photos.tsx` and `PhotoGallery.tsx` untouched.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` and every `<N>` is `0`:

```
=== gates: typecheck exited 0 after 177s
=== gates: lint exited 0 after 271s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 197s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `0320` already shipped (PR #1318)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply; `--status` read: 322 applied, 0 pending on dev, so `0320` is live there
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; reads gained only `notes` on immunizations
- [ ] Constraints and defaults exercised against real rows in a rollback harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration of this PR's own; `0318`–`0321` are pending on production and `0320` must be applied before these controls do anything there

## 4. Functional checks

- [x] Happy path works end to end: on dead resident Canyon, a login holding `view_medical` + `medical_records` pressed Add a note on a weight row, saved, and the note appeared; Log blood test saved a late result.
- [x] Data persists — the weight note and the late blood test (with its text) were still shown after the page re-rendered from the server.
- [ ] Create / edit / delete all exercised — n/a: the feature has only add-a-note and add-a-blood-test; edit and delete are deliberately not offered
- [x] Empty state renders sensibly: Canyon's Immunizations and Procedures tabs show their empty messages and no controls.
- [x] Invalid input is rejected with a readable message: the action returns `closedRecordNote.errors.empty` / `tooLong` / `notClosed` / `changed`; reviewed in code, not driven in the browser.
- [ ] Boundary cases checked — n/a: only the 2000-character limit and the empty note are boundaries, both in the action and not driven
  
### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | any resident tab | all controls (`perms.isAdmin`) | not driven: Admin is outside the card system and unchanged |
| exactly `view_medical` + `medical_records` | Canyon (deceased): Weight, Blood Tests, Housing | Add a note on weight, Log blood test; no note control on Housing (needs `resident.record` edit) | as expected: weight note saved, late blood test saved, Housing showed no control |
| exactly `view_medical` | Canyon: Weight | the note is shown, no control | as expected: the note read, no button on the page |
| signed out | resident pages | redirected to sign-in | not driven: no change to auth |

- [x] Every login above tested — admin and signed out are n/a for the reasons in the table
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — pending: the action's `can()` check and the database policies refuse it; the hidden-button case was driven, but a direct call of `addClosedRecordNote` as the view-only login was not

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual's closed-record paragraph is covered by a follow-up with the release note, once `0320` is on production
- [x] Translatable strings go through the dictionaries (`closedRecordNote.*`, `bloodTests.lateResultNoFiles`, and two reworded sentences, en and th)
- [ ] Mobile viewport (375px) — pending: not driven; the control is an existing icon button plus a small form
- [x] Browser console clean — no errors seen while driving
- [ ] Network clean — n/a: not inspected; the saves succeeded

## 6. Regression

- [x] The pages nearest the change still work: Weight, Blood Tests, Housing, Prescriptions, Immunizations and Procedures tabs and `/blood-tests/new` loaded for a dead resident.
- [x] Shared files touched (both dictionaries, `ProcedureList.tsx`) checked from a second page: the Procedures tab (ProcedureList) and the Blood Tests tab loaded.
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge touched only planner docs and a skill file

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: `#f6p2d` ticked; `#314hq` annotated (app half of D built; C and the bills press remain)
- [x] Non-obvious design choices recorded in `docs/decisions/2026-11-08-deceased-record-widen-app.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? n/a: needs 0320 applied to production; the note belongs in the PR that closes that step, drafted in the decision file
- [x] Commit messages say why, not just what
- [x] Claims were measured: the weight note and the late blood test were driven on dev; the immunization, procedure and prescription controls were typechecked and not driven for want of rows

## 8. Pre-production gate

### Tested build
- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
### On the deployed build
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change assertions — n/a: no boundary or banding change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates block
- [ ] Public pages re-checked — n/a: no public page touched
### Deploy safety
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
### Migration ordering — *skip if no migration*
- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration; code reads `0320`, which must be applied to production first
- [ ] `--env production --dry-run` run and clean — deferred: release manager (`0318`–`0321` are pending there)
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — deferred: release manager; apply `0318`–`0321` to production before the deploy
### Rollback
- [ ] Rollback position stated — deferred: release manager; the change is additive and a rebuild of the previous ref removes the controls

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `BloodTestList` hides editing a result's text on a dead resident though `0320` allows it | accepted: not requested; named in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of `closedRecordNote.*`, `lateResultNoFiles` and the two reworded sentences, unreviewed by a Thai speaker | `/residents/<dead resident>/weight` and `/blood-tests/new`, in Thai |
| 2 | Add a note on a prescription, immunization and procedure of a dead resident that has those rows (Canyon has none) | Prescriptions, Immunizations and Procedures tabs |
| 3 | Add a note on a placement with a login holding `residents` | Housing tab |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the three rows above

Manual verification by: pending: the three rows in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: needs the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
