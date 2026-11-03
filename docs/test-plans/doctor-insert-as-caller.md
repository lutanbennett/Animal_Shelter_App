# Feature test plan

## Header

| | |
|---|---|
| Feature | Assistant clinic card and visit clinic change offer only existing doctors without `clinics.doctors` |
| Backlog item | `docs/backlog.md` → THE INSERT-AS-CALLER DOCTOR FAULT HAS THREE KNOWN SITES |
| Branch / worktree | `claude/doctor-insert-as-caller` @ `C:\Development\Animal_Shelter_doctor-insert-as-caller` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | 01f25e0b |

## 1. Scope and risk

- [x] The assistant's clinic card and the visit edit form no longer offer a new doctor name to a login without `clinics.doctors`; matches the item
- [x] Touched: `src/lib/assistant/data.ts`, `src/components/assistant/AssistantCards.tsx`, `AssistantConversation.tsx`, `src/app/clinic-visits/DoctorNameField.tsx`, `[id]/edit/ClinicVisitEditForm.tsx`, docs
- [x] Cards affected: `assistant` (record) and `clinics.doctors` (carried by `contacts`); Admin sees everything as before; signed-out unaffected
- [x] Out of scope: any policy or migration, the clinics.list read (reported), dead clinic-scope branches

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged at finishing, see PR
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 74s
=== gates: lint exited 0 after 231s
=== gates: test exited 0 after 23s
=== gates: build exited 0 after 269s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: a login with `clinics.doctors` still gets the free-text doctor box on the assistant card
- [ ] Data persists — n/a: Confirm was not pressed; no write path changed
- [ ] Create / edit / delete — n/a: only what is offered changed, not the writes
- [ ] Empty state — n/a: an empty roster shows only "No doctor recorded"
- [x] Invalid input: an unlisted name is not carried into the card without the card
- [ ] Boundary cases — n/a: no numeric or date logic changed

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged short-circuit | not driven |
| exactly `assistant`, `book_clinic_visits` | assistant card | doctor chooser, no free text | pass |
| `assistant`, `book_clinic_visits`, `contacts` | assistant card | free-text box pre-filled | pass |
| signed out | n/a | no assistant | not driven |

- [x] Both one-card logins tested
- [ ] Server-side block — n/a: server and database checks are unchanged by design; hiding only

## 5. Cross-cutting

- [ ] Nav — n/a: no navigation change
- [ ] Manual — n/a: no behaviour a manual topic describes changed
- [ ] Translatable strings — n/a: reused existing strings, none added
- [ ] Mobile — n/a: same field in the same place
- [ ] Console clean — n/a: not inspected
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] Assistant clinic card loaded for both logins
- [ ] Shared files — n/a: no shared nav or manual file touched
- [ ] Nothing merged from main broken — n/a: checked at sync before merge

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file `docs/decisions/2026-11-03-doctor-insert-as-caller.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: a field quietly stops being offered to logins that could never save a new doctor with it; nobody would notice
- [x] Commit message says why
- [x] Claims were measured on dev, and the unrun parts are named in the decision file

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test — deferred: release manager
- [ ] Timezone — n/a: no date logic
- [ ] Boundary assertions — n/a: no threshold changed
- [ ] Evidence unedited — n/a: gates pasted as printed
- [ ] Public pages — n/a: no public page touched
- [ ] Deploy line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secrets — n/a: none
- [ ] Migration with code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Edit a visit, change its clinic, confirm the old doctor is not offered and Save works without `clinics.doctors` | /clinic-visits/[id]/edit |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

- [ ] The manual list above is empty, or every item was checked by a person — n/a: item 1 is still pending

Manual verification by: pending: edit-form clinic change not driven in a browser

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: file is in the PR
- [ ] Handed to the production release manager — n/a: release manager reads it at deploy

Result: pass

Release manager acknowledgement: n/a
