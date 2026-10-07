# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | One unlayered rule in `globals.css`: typed-text inputs, selects and textareas are 16 px below `md`; the 375 px check now measures all of them |
| Backlog item | `docs/backlog.md` → Mobile: "Single-line inputs and selects are 14 px (`text-sm`), so iPhone Safari zooms the page in when one is tapped" |
| Branch / worktree | `claude/inputs-16px` @ `C:DevelopmentAnimal_Shelter_inputs-16px` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | linked from the PR itself |
| Tested by / date | Claude (inputs-16px session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `TBD` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the ten Notes boxes that used `field-sizing-content` now share `src/components/textareaClass.ts` (16 px type below `md`, `w-full min-w-0`, `min-h-32` below `md`, `resize-y`), and `scripts/check-phone-width.mjs` focuses each field and fails any textarea under 16 px
- [x] Files/areas touched listed: the ten resident forms (`IntakeForm`, `EditResidentForm`, `MoveResidentForm`, `RehomeForm`, `ReturnToShelterForm`, `SendToHospitalForm`, `ReturnFromHospitalForm`, `RecordDeathForm`, `UndoDeathForm`, `AdoptionUpdateForm`), the new `textareaClass.ts`, `scripts/check-phone-width.mjs`, `src/lib/releases.ts`, docs. No `worker/`, no `supabase/`
- [x] Roles affected identified: everyone who opens these forms (admin, management, staff, vet where granted); signed-out public sees none of them
- [x] Out of scope written down: single-line inputs and selects have the same 14 px type and will zoom the same way; filed on the `backlog` branch, not widened here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed (the first run with a dev server and build competing for memory printed `typecheck=134`, a crash; `npm run typecheck` alone exited 0, and the rerun with the server stopped is below):

```
=== gates: build exited 0 after 37s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: class names only; no form logic, action or field name changed. The eight form pages were loaded by the check as staff and rendered; submitting each was not driven (see Left for manual verification)
- [ ] Data persists — n/a: no data path changed
- [ ] Create / edit / delete all exercised — n/a: no data path changed
- [ ] Empty state — n/a: no list changed
- [ ] Invalid input is rejected — n/a: no validation changed
- [x] Boundary cases: the check runs with the guard's long-named resident, and the zoom rule was proved red then green: with the old class it failed Rehome (`notes`) and Edit (`idealHome, bio, temperamentNotes, pastStoryNotes, behaviourNotes`); with the new class it passed Intake, Edit, Rehome, Move, Hospital, Return from hospital, Deceased and Adoption updates
- [ ] The sideways growth itself was reproduced — n/a: it did NOT reproduce in headless Edge at 375 px with the old class (focus check clean), so the cause is attributed to iPhone focus-zoom on type under 16 px and not measured; the decision file says so

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the ten forms | unchanged access | n/a: no access rule changed |
| management | the ten forms | unchanged access | n/a: no access rule changed |
| staff | Intake, Edit, Rehome, Move, Hospital, Return, Deceased, Adoption updates | no sideways scroll, no textarea under 16 px | pass (check run as staff, English) |
| vet | as before | unchanged | n/a: no access rule changed |
| volunteer | as before | unchanged | n/a: no access rule changed |
| signed out | none | unchanged | n/a: no access rule changed |

- [ ] Every role above tested — n/a: no role-dependent behaviour changed; one role was run through the layout check
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: no manual topic describes the box size
- [ ] Translatable strings — n/a: no strings changed; class names only
- [x] Mobile viewport (375px): measured by `scripts/check-phone-width.mjs` including focusing every field; whether the box now reads as somewhere to write is left for manual verification
- [ ] Browser console clean — n/a: not driven in the browser pane (the pane needs a login); class names only
- [ ] Network clean — n/a: not driven in the browser pane; no request changed

## 6. Regression

- [x] The pages nearest the change still work: the eight form pages above load and measure at 375 px
- [x] Shared files touched (`src/lib/releases.ts`, `docs/backlog.md`, `scripts/check-phone-width.mjs`) re-read after editing; the check's earlier behaviour (overflow, 44 px) still runs and was green on the same pages
- [x] Nothing merged from `main` during `sync` was broken by this branch: see the gates

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (both items; the follow-up went on the `backlog` branch)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-notes-box-phone.md`
- [ ] `README.md` still accurate — n/a: it does not describe these forms or the check's internals
- [x] **Release notes.** `unreleased` gained a line in `src/lib/releases.ts`, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The one unmeasured claim (iPhone focus-zoom as the cause) is labelled as such in the decision file; the Chromium result that the old class did not widen the page is stated

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — n/a: not deployed by this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: not a boundary change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys in this PR
- [ ] `strip-baked-env` seen — n/a: nothing deploys in this PR
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; class names and a dev script only, no schema or data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Single-line inputs and selects are also 14 px and will zoom on an iPhone | deferred to backlog (`backlog` branch, "16 px inputs and selects on phones") |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On your own iPhone, tap into the Notes box: the page does not zoom in or scroll sideways, and the box looks like somewhere to write a sentence | `/residents/{id}/rehome`, then the other nine forms |
| 2 | Each form still saves with a note typed in, including Record a death and Undo a death | the ten forms, dev or test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the two items are left for Lutan

Manual verification by: pending: Lutan to try the Notes box on his iPhone and save one form

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: deferred: release manager

Result: pass

Release manager acknowledgement: n/a  Date: 2026-10-07
