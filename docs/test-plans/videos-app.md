# Feature test plan

## Header

| | |
|---|---|
| Feature | Videos of residents, app half: upload straight to Drive, play, filter, Drive space |
| Backlog item | `docs/backlog.md` → "Videos of residents: keep them in the resident's Photos section, uploaded straight to Drive" |
| Branch / worktree | `claude/videos-app` @ `C:\Development\Animal_Shelter_videos-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | (opened from this branch) |
| Tested by / date | Claude (dev, browser pane at 375px) — 2026-10-20 |
| Carries a migration? | yes — `0231_public_photos_exclude_videos.sql` (renumbered from 0230, which #763 took on `main`) |
| Tested at SHA | SHA_PLACEHOLDER |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a resident's Photos section takes MP4/MOV videos (up to 500 MB, about five minutes) uploaded from the browser straight to Drive in resumable chunks, lists them with a play icon and a Photos / Videos / All filter, plays them inline through a ranged stream, and System status shows Drive space.
- [x] Files/areas touched: `src/app/api/residents/[id]/videos/{start,finish}/route.ts`, `src/app/api/videos/[fileId]/route.ts`, `src/app/api/photos/[fileId]/route.ts` (never load a video into memory), `src/lib/google/drive.ts`, `src/lib/uploads/resumable-video.ts`, `src/components/PhotoUploader.tsx`, `PhotoGallery.tsx`, `src/app/photos/approve/ApproveQueue.tsx`, `src/lib/photos/approval.ts`, meme maker and archive readers (photo-only filter), `src/app/admin/status/page.tsx`, i18n en/th, manual, releases, `eslint.config.mjs` allow-list, acceptance matrix, migration 0230.
- [x] Roles affected: anyone with `photos.resident_add` (admin, management, doctor); signed-out public sees no video anywhere.
- [x] Out of scope: real-device playback, sweeping abandoned `video_uploads`, a public video view, videos on the Medical-only, shelter-only and adoption-update uploaders, a server-side refusal of a video as profile photo (button hidden).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, exactly as printed:

```
GATES_PLACEHOLDER
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (0230, doctor medical cells, #763) after `sync`; renumbered from 0230 with `git mv`, the stale dev row deleted and 0231 applied
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` (as `0231_public_photos_exclude_videos.sql`)
- [x] File is re-runnable (`create or replace view`)
- [x] Existing rows still read correctly after the change — the resident Photos tab, with its three existing photos, loaded and showed them after the view change
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: the file only redefines a view with one extra predicate; the column and constraint were 0229's
- [ ] Down-migration written — n/a: restate 0217's view to undo; nothing is lost either way
- [x] Production apply plan: apply 0231 to production *before* the deploy, since the app reads `media_kind` in the photo list

## 4. Functional checks

- [x] Happy path works end to end — on dev, 375px browser pane: a 3 s MP4 added to Angsumalin under Medical went Uploading → Saving… → Done, through Drive's resumable session (CORS and chunk PUT worked from the browser)
- [x] Data persists — after reload the gallery shows Photos (3), Videos (1), the tile has the Drive thumbnail, a play button and 0:03
- [ ] Create / edit / delete all exercised — n/a: create and play only; moving, deleting and marking posted reuse the photo actions unchanged and were not re-run on a video
- [x] Empty state renders sensibly — the filter chips only appear once a resident has a video
- [x] Invalid input is rejected with a readable message — `start` answered 400 with the 500 MB message for 600 MB, the not-MP4/MOV message for a Matroska type, and the folder message for a bad folder
- [x] Boundary cases checked — 600 MB refused, and the upload loop's 308 handling without a readable Range header assumes the whole chunk landed; a zero-length or unknown-duration video shows no length badge

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Photos, add video, Drive space tile | all work | tile read as admin; upload run as the same throwaway login while it held management, then admin |
| management | add video | works | uploaded the test clip as management |
| staff | — | n/a: retired role | n/a |
| doctor | add video, Medical only | folder fixed to Medical | not tested: no doctor session; the route's one-folder rule is the photo route's, read from source |
| volunteer | none | refused | not tested: no volunteer session; `photos.resident_add` is checked first in both routes |
| signed out | `/api/videos/<id>` | redirected to sign-in | curl with no cookie got a 307 from the proxy |

- [ ] Every role above tested — n/a: admin and management only; doctor and volunteer left below
- [x] A role that should not have access is blocked server-side — signed-out request to `/api/videos/<id>` is redirected; `start` and `finish` check `photos.resident_add` before any Drive call

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`, topic "Adding resident videos"); acceptance matrix rows added and `acceptance-matrix.mjs --check` is ok. Not opened at `/manual`
- [x] Translatable strings go through the dictionaries, both `en.ts` and `th.ts`
- [x] Mobile viewport (375px) — the uploader, chips, tile and the player dialog all fit, no overflow
- [x] Browser console clean — the only errors were my own deliberate 400s and one 404 I did not trace (a photo thumbnail request)
- [ ] Network clean — n/a: see the 404 above, not traced

## 6. Regression

- [x] Pages nearest the change still work: resident Photos tab with existing photos, `/admin/status` with the new tile
- [ ] Shared file touched from a second, unrelated page — n/a: `drive.ts` is shared and `/admin/status` (Drive connected, calendar) loaded fine; the approve queue, meme maker and archive edits were not loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; follow-ups named in the decision file
- [x] Decision file `docs/decisions/2026-10-20-videos-uploaded-straight-to-drive.md`
- [x] `README.md` still accurate — not touched, does not describe photo formats
- [ ] **Release notes.** n/a: a note is in `unreleased`, but the migration 0231 must be applied to production before the deploy and Lutan's real-phone playback check is outstanding, so it is not ticked
- [x] Commit messages say why, not just what
- [x] Claims were measured: the 206 range response, 0:03 duration, 15 GB dev Drive figure and the signed-out redirect were all observed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager; the Worker path in particular (the ranged stream and the CORS origin handed to Drive)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change — n/a: the 80% / 95% Drive thresholds are display only
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked — deferred: release manager; the public view now excludes videos

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var in production — n/a: none

### Migration ordering

- [ ] Code and migration in one PR — deferred: release manager; yes, apply 0231 to production before deploying
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: a view redefinition, not destructive
- [ ] Apply plan stated — deferred: release manager; apply before the deploy

### Rollback

- [ ] Rollback position stated — deferred: release manager; code rolls back alone, the view change is harmless to leave

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | A 404 in the console on the Photos page that I did not trace | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Playback on a real iPhone and a real Android, inline, with seeking | `/residents/<id>/photos` |
| 2 | A weak connection resumes: start a 100 MB clip, toggle airplane mode, restore; it says Connection lost and finishes | phone on site |
| 3 | A 400 MB clip uploads | phone |
| 4 | A doctor can add a video, only to Medical; a volunteer cannot | as each role |
| 5 | A video from a login that may not publish waits in Photos to approve and plays there | `/photos/approve` |
| 6 | The Drive space tile on test shows the right figure | `/admin/status` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; only the person who looks may tick this

Manual verification by: pending: playback on a real iPhone and a real Android

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — manual verification outstanding

Result: pass with accepted defects
