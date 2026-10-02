# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Remove / Restore and Show removed (archive underneath) on weight, prescriptions, vet visits and immunizations |
| Backlog item | `docs/backlog.md` → DB-6 part (1), app side of soft delete (DB-6 itself stays open for part 3) |
| Branch / worktree | `claude/soft-delete-app-side` @ `C:\Development\Animal_Shelter_soft-delete-app-side` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | linked from the PR itself |
| Tested by / date | Claude (soft-delete-app-side session), 2026-10-02 |
| Carries a migration? | no (`0124` shipped the schema) |
| Tested at SHA | `edd9f23` plus the wording change to Remove, gates re-run after it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: staff can Remove (archive) and Restore a weight, prescription, vet visit or immunization from the resident's section pages, with Show removed as on contacts, a manual topic and a release line. The item's "swap the delete buttons" premise was wrong: none of the four ever had a delete action in the app (decision file)
- [x] Files/areas touched listed: `src/app/residents/[id]/[section]/page.tsx`, new `src/app/residents/[id]/archive-actions.ts`, `src/components/ArchiveRecordControl.tsx`, `ShowArchivedToggle.tsx`, `src/lib/medical-archive/kinds.ts`, both dictionaries, manual, releases, a new check script and decision file
- [x] Roles affected identified: admin, management, staff are offered it; vet and volunteer are not
- [x] Out of scope written down: attachments (deliberately not archived, `0124`); records linked to a removed visit are not removed with it; undo of edits and the recent-changes page are other DB-6 parts; contacts keep the word Archive

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (both streams added an `unreleased` line), resolved by keeping both
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed (before the wording change; re-run recorded in the PR):

```
=== gates: build exited 0 after 51s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, no column added
- [ ] Constraints and defaults exercised against real rows — n/a: no migration; the roles harness in section 4 exercises existing RLS against real rows instead
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration; `0124` is already applied

## 4. Functional checks

- [x] Happy path works end to end: signed in on dev, each of the four record types on one resident was removed, appeared under Show removed with Restore (and the reason where one was typed), and was restored
- [x] Data persists: after each remove the list, and for weight the chart and Latest tile, no longer had the row after a reload; after restore it was back. Immunizations: removing the only Heartworm dose put Heartworm into "Missing mandatory" and restoring it brought the next-due date back, so the readers behave
- [x] Create / edit / delete all exercised: remove and restore on all four; create and edit are not touched by this change
- [x] Empty state renders sensibly: immunizations with its only dose removed read "No immunizations recorded yet" with the removed one under Show removed
- [x] Invalid input is rejected with a readable message: a second remove of a removed row, and a role the database refuses, return a sentence (`cannotArchive`), asserted at the SQL level by the harness; a restore refused by the partial unique index maps 23505 to a sentence, not driven in the browser
- [x] Boundary cases checked: remove with no reason and with a reason; the toggle link appears only when something is removed and says how many; removing the newest weight moves Latest to the previous one

`scripts/check-medical-archive-roles.mjs` (dev, `begin … rollback`, real RLS, the exact UPDATE the action issues) asserted: staff removes and restores all four with one audit row per remove; a vet is refused (0 rows) on another clinic's visit and on a prescription on it; a vet's own-clinic remove is allowed but the restore is refused (it drops the visit from their scope), which is why vets are not offered it; a volunteer removes nothing; a second remove changes nothing. Output: `HARNESS-OK A: staff archives all four, restores, one audit row per archive | B: vet refused (0 rows) on the other clinic; own-clinic archive is one-way, so not offered | C: volunteer archives nothing | D: a second archive changes nothing`.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Remove / Restore on all four | offered | the signed-in dev session (admin or staff, not distinguished) used it on all four |
| management | same | offered (`management_*` policies mirror staff) | harness covers staff; not driven separately |
| staff | same | offered | harness: 1 row each, one audit row |
| vet | none | no button; action refuses | harness: other clinic 0 rows; no button by `canArchiveMedical`; not viewed in a vet session |
| volunteer | none | no button; database refuses | harness: 0 rows; not viewed in a volunteer session |
| signed out | none | pages already require sign-in | unchanged |

- [x] Every role above tested: at the database by the harness; the UI as one signed-in role only, see Left for manual verification
- [x] A role that should not have access is blocked server-side: `archiveMedicalRecord` refuses on role before touching the database, and the harness shows RLS refusing vets across clinics and volunteers

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page or nav entry
- [x] Manual updated (`src/lib/manual/en.ts`, topic "Removing a medical record" under Medical records); read as source, not yet opened at `/manual`
- [x] Translatable strings go through `t.recordArchive` in both dictionaries (Thai written by Claude, not reviewed by a Thai speaker); `/management/translations` not opened
- [x] Mobile viewport: the browser pane was phone width throughout; the reason form and buttons fit without overflow
- [x] Browser console clean: no errors read after the runs
- [ ] Network clean — n/a: server actions only; no 4xx/5xx surfaced in the UI

## 6. Regression

- [x] The pages nearest the change still work: all four section pages (weight, vet-appointments, prescriptions, immunizations) loaded with and without `?archived=1`, with Edit, End today, Log and Book links intact
- [x] Shared files touched (`manual/en.ts`, both dictionaries, `releases.ts`) checked from a second page: the section pages above render strings from the new dictionary key; `/manual` and `/releases` not opened
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the merged tree

## 7. Documentation

- [x] Backlog: DB-6 stays open (parts 2 and 3 remain), so it is not ticked; part (1) is marked done on the `backlog` branch as the brief said
- [x] Non-obvious design choices in `docs/decisions/2026-10-02-medical-archive-roles.md`
- [x] `README.md` still accurate — nothing it describes changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for admin, management and staff
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured: the vet one-way finding is from the harness, which first failed on exactly that

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic; the archive timestamp is set by the server
- [ ] Boundary assertions cover both edges — n/a: no threshold or banding
- [ ] Evidence pasted is the tool's actual output — n/a: the gates and harness lines above are as printed
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration; `0124` must already be on production before this deploys

### Rollback

- [x] Rollback position: `npx wrangler rollback --env production` reverts the Worker; nothing in this PR changes schema. Rows removed meanwhile stay removed (readers filter them) until restored, which only admin, management or staff can do from Show removed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A vet's archive of their own clinic's visit cannot be undone by them (0124 drops it from their scope) | fixed in this PR by not offering Remove to vets; making it reversible is a schema follow-up |
| 2 | low | Contacts say Archive, medical records say Remove | accepted: staff asked for plain wording; contacts to follow if it lands well |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as staff, vet and volunteer: staff see Remove on the four lists, a vet and a volunteer see none | `/residents/<id>/weight`, `…/prescriptions`, `…/vet-appointments`, `…/immunizations` |
| 2 | The Thai wording (นำออก, แสดงที่นำออก) reads naturally to a Thai speaker | the same pages with the language switched to ไทย |
| 3 | The manual topic reads correctly | `/manual` → Medical records → Removing a medical record |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: staff, vet and volunteer views and the Thai wording, three items above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — happens at release time, after merge

Result: pass with accepted defects

Release manager acknowledgement:
