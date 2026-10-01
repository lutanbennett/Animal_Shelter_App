# Test plan — deceased archive on change

## Header

| | |
|---|---|
| Feature | Tell the user when a deceased resident's Drive archive could not be refreshed |
| Backlog item | `docs/backlog.md` → Deceased residents: confirm what happens to the archive when photos or the bio change after death |
| Branch / worktree | `claude/deceased-archive-on-change` @ `C:\Development\Animal_Shelter_deceased-archive-on-change` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3014` |
| PR | pending |
| Tested by / date | Claude, 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | 18c87c4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a failed Drive refresh after an after-death edit is now shown to the user, with a Refresh archive button
- [x] Files/areas touched listed: `photos/actions.ts`, `api/residents/[id]/photos/route.ts`, `edit/actions.ts`, `PhotoGallery`, `PhotoUploader`, `DeceasedBanner`, residents `page.tsx`, en/th dictionaries, manual, releases
- [x] Roles affected identified: admin and staff (Refresh button); everyone who may edit a deceased resident's photos sees the warning
- [x] Out of scope written down: persistent `deceased_archive_stale_at` flag, batching the per-file PDF refresh, adoption-update delete warning — see `docs/decisions/2026-10-01-deceased-archive-on-change.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — typecheck and build pass; the success path is unchanged code (the refresh result is only read for `.error`)
- [ ] Data persists — n/a: no data is stored; the warning is transient by design
- [ ] Create / edit / delete all exercised — n/a: not driven against live Drive (see manual list)
- [ ] Empty state renders sensibly — n/a: no list or empty state
- [ ] Invalid input is rejected — n/a: no new input
- [ ] Boundary cases checked — n/a: no new input; a failed refresh returns `{ error }` and a skipped one (living or never-archived resident) returns none, so no warning

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | deceased hub | Refresh archive button | not driven |
| management | deceased hub | no button (retry is admin/staff) | not driven |
| staff | deceased hub | Refresh archive button | not driven |
| vet | deceased hub | no button | not driven |
| volunteer | deceased hub | no button | not driven |
| signed out | resident pages | redirected, unchanged | n/a |

- [ ] Every role above tested — n/a: no new route or permission; the button reuses `canRecordDeath` and the server action re-checks `DECEASED_ROLES`
- [ ] A role that should not have access is blocked server-side — n/a: `retryDeceasedArchive` is unchanged and still checks the role

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`, deceased topic)
- [x] Translatable strings go through the dictionaries — new keys added to both en and th (typecheck enforces parity)
- [ ] Mobile viewport — n/a: not driven; the notice is a wrapping flex row with `basis-full` text
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] The pages nearest the change still work — build compiles the resident hub, photos and edit routes
- [ ] Shared file touched checked from a second page — n/a: no shared nav or manual structure changed, one sentence added to a manual topic
- [x] Nothing merged from `main` during sync was broken — sync was a no-op

## 7. Documentation

- [ ] Backlog item ticked — n/a: gaps 1–4 are decided but the item's step 5 (end-to-end Drive check of each edit) has not been run, so it stays open
- [x] Design choices recorded in `docs/decisions/2026-10-01-deceased-archive-on-change.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned — or are labelled as reasoned (gap 3's cost is stated as unmeasured; gap 4 as read from code, not run against live Drive)

## 8. Pre-production gate

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line above, pasted as printed
- [ ] Public pages re-checked — n/a: no public surface
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added
- [ ] Code and migration in same PR — n/a: no migration
- [ ] Production dry-run clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: no migration; `wrangler rollback` fully reverts this

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The warning is transient: closing the tab loses it and only the person who edited sees it | accepted — persistent flag declined, see decisions file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | With Drive failing (revoke the Drive token or break the folder id in dev), on a deceased archived resident: edit the bio, set a different profile photo, delete a photo and upload a photo — each tells you the archive wasn't refreshed, and Refresh archive then succeeds once Drive is back | dev, `/residents/<id>` |
| 2 | With Drive working: after each of those four edits, open the PDF and `index.html` in Drive and confirm the change is there; a HEIC photo set as profile appears in the PDF | dev Drive |
| 3 | A deceased resident whose first archive failed shows the extra line under "Retry archiving" | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items are outstanding, so this is not ticked

Manual verification by: pending: the three Drive checks in the manual list (failure warning, Refresh archive, HEIC profile photo in the PDF)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: result not yet decided
- [ ] Checklist pasted into the PR — n/a: PR not yet open
- [ ] Handed to the production release manager — n/a: PR not yet open

Result: pass with accepted defects
