# Test plan: adoption-video-app

## Header

| | |
|---|---|
| Feature | Adoption updates take videos, and a shared update's video plays on the public pages |
| Backlog item | `docs/backlog.md` → AN ADOPTION UPDATE CANNOT TAKE A VIDEO (app half; now ticked) |
| Branch / worktree | `claude/adoption-video-app` @ `C:\Development\Animal_Shelter_adoption-video-app` |
| Dev server | `http://localhost:3002` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-03 |
| Carries a migration? | no (0303 landed in #1229) |
| Tested at SHA | @@SHA@@ |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: *Add adoption update* takes videos through the resumable upload with the update's id, lists any refused file with a reason, and a shared update's video plays on the success-story and journey pages
- [x] Files/areas touched listed: `AdoptionUpdateForm.tsx`, `AdoptionUpdatePage.tsx`, `resumable-video.ts`, `/api/residents/[id]/videos/start` and `finish`, `src/lib/adoption-updates/public.ts`, new `PublicVideo.tsx`, `adopt/stories/[id]`, `adopt/journey/[id]`, `src/lib/public-paths.ts` (+ test), both dictionaries, manual, releases
- [x] Cards affected: `adoption_news` (saves the update); attaching a file is `photos.resident_add` plus `photos.resident_publish`, which no dev card holds today; admin sees the picker; the signed-out public now streams listed videos through `/api/videos/`
- [x] Out of scope: any migration; the auto-approval trigger (reported, not changed); the manual screenshots; `PhotoUploader.tsx`'s own silent drop

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merged by hand in the worktree before the gates run)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` is `0`:

```
@@GATES@@
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR (0303 is #1229's)

## 4. Functional checks

- [x] Happy path works end to end: as Admin on dev, an update with one photo and one video saved both (`attachments`: `adv-photo.png` photo, `adv-clip.mp4` video, same `20260927` folder as the update's earlier photos); a signed-out request to `/adopt/stories/<id>` and `/adopt/journey/<id>` returns a `<video ... poster=... controls preload="none">` with no `autoplay`; `/api/videos/<id>` with a Range header answered 206
- [x] Data persists — the saved attachments and the public view rows were read back from the database after the form navigated away
- [ ] Create / edit / delete all exercised — n/a: only attaching to an existing update was exercised; delete of an update with a video was not driven
- [ ] Empty state renders sensibly — n/a: the picker with nothing chosen is unchanged, and an update with no files already rendered
- [x] Invalid input is rejected with a readable message: a `.txt`, a `.avi` and a 16 MB jpeg were each listed with a reason and not sent
- [x] Boundary cases checked: 15 MB photo limit and 500 MB video limit by constant (a 500 MB file was not created); wrong type; unsupported video type
- [ ] Phone-sized video over the resumable path with visible progress — n/a: test clips were 2–3 MB, one chunk, so progress jumped to done; real-phone upload is listed under manual verification

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | edit update page | picker drawn, photo and video upload and save | pass |
| exactly `residents` (holds `adoption_news`) | edit update page | picker NOT drawn (no `photos.resident_publish`), rest of form works | pass: `#photos` absent |
| `residents` + `add_medical_photos` (before the gate was corrected) | edit update page | picker was drawn, database refused: *"Shelter folder only"* | defect found and fixed: gate now asks `photos.resident_publish` |
| signed out | `/adopt/stories/<id>`, `/adopt/journey/<id>`, `/api/videos/<id>` | shared update's video plays; unshared update's video 404; staff-only id 404; malformed id 400 | pass: 206 / 404 / 404 / 400 |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side: a signed-out request for an unshared update's video id returned 404, and for an id on no update 404 (after the profile-picture fix, below)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`, adoption updates topic) — the text was edited and read in the file; `/manual` was not opened
- [x] Translatable strings go through the dictionaries: both `en.ts` and `th.ts` carry every new key (the typecheck and `check-thai-dictionary` shape enforce parity); Thai is new and unread by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: not driven; the new markup reuses the existing list and a full-width video
- [x] Browser console clean on the edit page during the uploads (no errors read; the pane's rAF never fires on a direct load, so every page was reached by client-side navigation)
- [x] Network clean — the only unexpected status was the `/login` redirect on `/api/videos/`, which was the fault fixed here

## 6. Regression

- [x] The pages nearest the change still work: `/adopt/stories/<id>` and `/adopt/journey/<id>` load signed out with photos and the video; `/api/photos/<id>` still serves signed out
- [x] Shared file touched (`public-paths.ts`, both dictionaries, `manual/en.ts`) checked from a second page: `src/lib/public-paths.test.mjs` and `site-hosts.test.mjs` pass (14 tests), and the public pages above load
- [x] Nothing merged from `main` during `sync` was broken by this branch (merge was backlog-only)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, retitled as done; the *Videos of residents* item's "Left" list annotated
- [x] Non-obvious design choices added: `docs/decisions/2026-11-03-adoption-video-app.md`
- [x] `README.md` still accurate (no change needed)
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line, tagged `adoption_news`; the decision file records no outstanding manual step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The two faults (the `/login` redirect and the video becoming the profile picture) were each measured with curl against the running server before and after the fix; the auto-approval was read at `0217_photo_approval.sql:78-85` and seen on `approved_at` in the database

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date from the clock (the update's own received-on date names the folder)
- [ ] Boundary or banding change assertions — n/a: no threshold changed (the existing 15 MB and 500 MB limits are kept as they were)
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates output, which is verbatim
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager (the two story pages are edge-cached; a video on a just-shared update may take up to the cache time to appear)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in the same PR — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR and redeploy (`./scripts/pi/deploy-pi.sh --ref <sha>`); no schema change, so nothing to undo in the database. Files already uploaded to Drive and attached to updates stay attached; a profile picture the old code set from a video is not repaired by a rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `/api/videos/` was not a public path: a signed-out visitor was redirected to `/login`, so no public video could play | fixed in this PR (`public-paths.ts`) |
| 2 | high | A video recorded as a resident's first file became their profile picture, which is public, so an unshared update's video streamed to a signed-out visitor (206) | fixed in this PR (`videos/finish`); the database should refuse it too: for the planner to file |
| 3 | medium | The picker was drawn for a login the database refuses (adopter files need `photos.resident_publish`), after the upload to Drive | fixed in this PR; no dev card holds `photos.resident_publish`, so only Admin can attach: for the planner to file |
| 4 | info | Insert trigger auto-approves adoption-update files (`0217:78-85`), so sharing publishes the video with no approval step | reported, not changed: for the planner to put to Lutan |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Record a real phone video, add it to an update that is shared, and watch it play with a poster picture on both public pages, on an iPhone and an Android | `/residents/<id>/adoption-updates`, then `/adopt/stories/<id>` and `/adopt/journey/<id>` |
| 2 | A Thai speaker reads the new form wording and the video label | Add adoption update, Thai |
| 3 | A weak connection while a large clip uploads shows *Connection lost. Trying again…* and carries on | Add adoption update on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are listed above and only the person who looked may tick this

Manual verification by: pending: a person watching a real phone video play on the public pages, and a Thai reading of the new wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries its own body, which links this file
- [ ] Handed to the production release manager — n/a: the release manager reads the plan at release time

Result: pass with accepted defects

Release manager acknowledgement: pending
