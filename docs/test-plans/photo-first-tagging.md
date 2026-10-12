# Feature test plan

## Header

| | |
|---|---|
| Feature | Add photos: take or choose photos first, then tag each to a resident (`/photos/add`) |
| Backlog item | `docs/backlog.md` → "Photo first, then the resident" |
| Branch / worktree | `claude/photo-first-tagging` @ `C:\Development\Animal_Shelter_photo-first-tagging` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | `2d41df30` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a home-screen Add photos page where photos are taken or chosen first and each is then tagged to a resident (one at a time, all to one resident, or two residents for one photo), through the existing upload routes
- [x] Files/areas touched listed: `src/app/photos/add/` (new), `src/app/medical/ResidentPicker.tsx` (generalised), `src/lib/medical/residents.ts`, `src/components/PhotoUploader.tsx` (optional route argument), `src/lib/permissions/routes.ts`, `src/lib/home/tiles.ts`, both dictionaries, manual, releases
- [x] Roles affected identified: every role holding `photos.resident_add` (admin, management, 2IC, doctor, volunteer, Head of Medical); a role without it gets no tile and the URL refuses
- [x] Anything explicitly **out of scope** written down: no migration, no NFC Scan card (a seam only, `ScanCardSeam.tsx`), no date-taken field (today's date is used), no change to the hub or Add Medical Photos paths

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought 0188/0189 and the backup-prune scripts); gates rerun after
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 62s
gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one. n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying. n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed. n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations`. n/a: no migration
- [ ] File is re-runnable. n/a: no migration
- [ ] Existing rows still read correctly after the change. n/a: no migration
- [ ] Constraints and defaults exercised against real rows. n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated. n/a: no migration, nothing to undo
- [ ] Production apply plan stated for the release manager. n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: as Admin at 375 px, two generated photos added, "0 of 2 tagged", tapped Kame (saved, "1 of 2 tagged"), then GiGi from the quick choices: "All photos are tagged and saved."
- [ ] Data persists — reload the page and the change is still there. n/a: the photos themselves were not looked at on the residents' hubs; listed in Left for manual verification row 1
- [ ] Create / edit / delete all exercised. n/a: create only, and the feature has no edit or delete
- [x] Empty state renders sensibly: "No photos yet. Tap a button above." shown before any photo is added
- [ ] Invalid input is rejected with a readable message, not a crash. n/a: a failed upload was not provoked; the code shows the route's message and a Try again button
- [ ] Boundary cases checked. n/a: five-at-once and two-dogs were not driven; listed in Left for manual verification row 2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| signed out | `/photos/add` | sent to sign-in | redirected to `/login?next=%2Fphotos%2Fadd` on the dev server |
| admin | `/photos/add` | page opens, folders Shelter/Medical/Foster/Adoption | driven at 375 px: opened, all four folders offered, uploads saved |
| other signed-in roles | `/photos/add` | only with `photos.resident_add`; the page calls `requirePermission` | not driven; read from code |

- [ ] Every role above tested. n/a: only signed out and admin were driven; the other roles are in Left for manual verification row 4
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): signed-out request to `/photos/add` went to the sign-in page. The page guard `requirePermission("photos.resident_add")` and both upload routes still check the activity

## 5. Cross-cutting

- [x] Nav entry correct: no sidebar entry; the home tile comes from the route registry (and `homeTilesFor` for roles with jobs); build and catalogue types pass
- [x] Manual updated (`src/lib/manual/en.ts`, topic "Adding photos: the quick way"); not read at `/manual` in a browser
- [x] Translatable strings go through both dictionaries (`addPhotos` in `en.ts` and `th.ts`); typecheck enforces matching shapes
- [x] Mobile viewport (375px): driven as Admin at 375 px, one column, buttons and chips full width; no sideways scroll seen in the screenshots
- [ ] Browser console clean. n/a: console was not read while signed in on the page itself
- [ ] Network clean. n/a: network was not read; both uploads returned success in the page

## 6. Regression

- [x] The pages nearest the change still work: /residents loaded after leaving the page; /medical/weight rendered its picker (empty for Admin, as before this change)
- [ ] Any shared file touched checked from a second page. n/a: the shared picker was loaded on /medical/weight only as Admin, where it was empty before and after; see Left for manual verification row 4
- [ ] Nothing merged from `main` during `sync` was broken by this branch. n/a: branch was cut from current `main` this session, and nothing has merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-12-photo-first-tagging.md`
- [ ] `README.md` still accurate. n/a: it does not describe individual pages
- [x] **Release notes.** `unreleased` gained a line for the new Add photos button; nothing is outstanding before a user could use it
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured by reading the code and routes named there, not reasoned from names

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time. deferred: release manager
- [ ] Deployed SHA matches the tested SHA. deferred: release manager

### On the deployed build

- [ ] Deployed to test. deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org`. deferred: release manager
- [ ] Timezone-sensitive behaviour proved. n/a: the only date is today's, as Add Medical Photos already does
- [ ] Boundary or banding change covers both edges. n/a: no boundary or banding change
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked. n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read. deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output. deferred: release manager
- [ ] Any new secret/env var exists in production. n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? n/a: no migration
- [ ] `--env production --dry-run` run and clean. n/a: no migration
- [ ] Destructive migration backup. n/a: no migration
- [ ] Apply plan stated. n/a: no migration

### Rollback

- [ ] Rollback position stated. n/a: code only; revert the PR, nothing touches data or schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | found and fixed | The picker was empty for Admin and Management: `resident_who_and_where` only has rows for a login that borrows the volunteer role. Fixed in `loadPickableResidents` (reads the tables directly when the view is empty) | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As the 2IC (not Admin): take two photos, tag one each to two residents in different enclosures, and see each on the right resident's Photos tab. Also look at Kame's and GiGi's Photos tab for the two test photos from this check | `/photos/add`, hub Photos |
| 2 | Choose five photos and tap All to the same resident, then one dog: all five land on that hub. Tag one photo to a second dog too | `/photos/add` |
| 3 | On a real phone: Take a photo with the camera button works. (The leave prompt and the no-prompt-when-saved case were driven in the pane.) | `/photos/add` |
| 4 | Role checks: a role without `photos.resident_add` has no tile and the URL refuses; the Head of Medical sees Medical only and her photo is in Medical; Add Medical Photos and Record Weight pickers still work | home, `/medical/photos`, `/medical/weight` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. n/a: rows 1 to 4 are open and signed as pending below

Manual verification by: pending: rows 1 to 4 of Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager. n/a: not yet, waits on the PR and the manual rows

Result: pass

Release manager acknowledgement: n/a: not yet reached the release manager
