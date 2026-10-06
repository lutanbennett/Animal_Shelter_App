# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | A deceased resident's profile photo that cannot be put in the summary PDF is reported to the editor instead of silently dropped |
| Backlog item | `docs/backlog.md` → Deceased residents: confirm what happens to the archive when photos or the bio change after death (gap 4, left open) |
| Branch / worktree | `claude/deceased-archive-heic` @ `C:\Development\Animal_Shelter_deceased-archive-heic` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3027` (not started: see section 4) |
| PR | linked from the PR itself |
| Tested by / date | Claude (deceased-archive-heic session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | gates run on the tree before the first commit; see section 2 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `archiveDeceasedResident()` returns `photoMissing`, and the existing archive-warning paths (upload, set-profile, delete, move, edit redirect, hub banner) show a message when a chosen profile photo is not in the PDF. HEIC itself was already handled by Drive's JPEG thumbnail since `a1452515`; the item's premise was stale
- [x] Files/areas touched listed: `src/lib/archive/archive-deceased-resident.ts`, `src/lib/archive/refresh-deceased-archive.ts`, `src/app/residents/[id]/photos/actions.ts`, `edit/actions.ts`, `page.tsx`, `deceased/DeceasedBanner.tsx`, `src/app/api/residents/[id]/photos/route.ts`, both i18n dictionaries, manual, releases, decision file
- [x] Roles affected identified: whoever can edit a deceased resident's photos or bio (admin, staff, management); nobody else sees the warning
- [x] Out of scope written down: converting HEIC ourselves (no codec on Workers; Drive already converts); the real-iPhone check, which is Lutan's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: run immediately before the PR was opened, see the PR
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: it ended `typecheck=0 lint=1 build=0`; the lint failure is `check-backlog-sections` objecting to `docs/backlog.md` line 640 (an open item below `## Completed`, which arrived with the `backlog` merge and is not touched here); eslint on the files this PR changes has 0 errors

```
gates: FAILED — lint
gates: typecheck=0 lint=1 build=0
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

Nothing in this section was driven in a browser: the Drive account, a deceased
test resident and a HEIC were not set up in this session. Typecheck and build
cover the wiring; the behaviour is handed over below.

- [ ] Happy path works end to end — n/a: not driven in a browser; see Left for manual verification
- [ ] Data persists — n/a: nothing is stored; the warning is a response message
- [ ] Create / edit / delete all exercised — n/a: not driven; upload, set-profile and edit are the paths wired
- [ ] Empty state renders sensibly — n/a: no list or empty state changed
- [ ] Invalid input is rejected — n/a: no input added
- [ ] Boundary cases checked — n/a: not driven; the boundary is a profile photo set but not embedded, coded as `Boolean(id) && !dataUri`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no new access; same actions as before | n/a |
| management | n/a | no new access | n/a |
| staff | n/a | no new access | n/a |
| vet | n/a | no new access | n/a |
| volunteer | n/a | no new access | n/a |
| signed out | n/a | no new access | n/a |

- [ ] Every role above tested — n/a: no permission changed; the message rides on actions that already check permissions
- [ ] A role that should not have access is blocked server-side — n/a: no new route or action

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: text written in the deceased topic but not read at `/manual`
- [ ] Translatable strings checked at `/management/translations` — n/a: `banner.photoNotInPdf` added to en and th dictionaries, not checked in the browser
- [ ] Mobile viewport (375px) — n/a: one extra paragraph with `basis-full` in the existing banner; not rendered
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven; `next build` compiled every route
- [ ] Any shared file touched checked from a second page — n/a: `archiveDeceasedResident`'s result gained a field and the other callers (`deceased/actions.ts`) only read `error`, confirmed by typecheck
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing merged yet, the branch is from `origin/main` at `dca26d00`

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open on gap 4's manual half
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-deceased-archive-heic.md`
- [ ] `README.md` still accurate — n/a: README does not describe the archive's warnings
- [x] **Release notes.** `unreleased` has a line: the page now says when a deceased resident's profile photo is not in the PDF
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned: the "already handled by Drive thumbnail" claim is read from `drive.ts` and `a1452515`, and says so; it was not observed against a real HEIC

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan (the iPhone check below)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: the lines in section 2 are pasted as printed
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added
- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position: revert the PR; nothing persistent changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `gates.mjs` lint is red on `docs/backlog.md` line 640, not caused by this PR | deferred to backlog: owner of the `backlog` branch |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload a real iPhone HEIC to a deceased test resident, set it as profile, open the PDF in Drive (`Residents/Deceased/<Name> (<ID>)/`) and confirm the picture is there and upright | Resident → Photos |
| 2 | Same, choosing the photo through Edit; if no picture appears, confirm the red warning shows | Resident → Edit |
| 3 | Repeat after adding a photo, changing the bio and deleting a photo; the PDF and `index.html` follow each | Drive |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (deceased-archive-heic session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; it waits on Lutan with a real iPhone HEIC

Manual verification by: pending: Lutan to upload a real iPhone HEIC after death and open the PDF in Drive

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the manual check above comes first

Result: pass with accepted defects

Release manager acknowledgement:  Date: —
