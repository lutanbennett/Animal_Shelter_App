# Feature test plan — reels-app

## Header

| | |
|---|---|
| Feature | App half of the Reels library: `/reels` (library, add, view, edit, archive, record where posted), reel upload and playback routes, `#tag` split into `reel_residents` and `reels.tags` |
| Backlog item | `docs/backlog.md` → **A REELS LIBRARY** (`#8bz78`, annotated not ticked) and `#v9t4m` (ticked) |
| Branch / worktree | `claude/reels-app` @ `C:\Development\Animal_Shelter_reels-app` |
| Dev server | `http://localhost:3006` (`.port`), stopped before the gates so `next build` had `.next` to itself |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no — `0322_reels.sql` is already on `main`; the SQL for `can_see_drive_file()` is in the decision file, not a migration |
| Tested at SHA | 495ffc29 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a reels library that joins the social library: add a video with a description and date taken, `#tags` that name residents, edit, archive, and record where it was posted; never public
- [x] Files/areas touched listed — `src/app/reels/`, `src/app/api/reels/` (start, finish, `[id]/video`), `src/lib/reels/`, `src/lib/google/stream-video.ts` (lifted out of `/api/videos/[fileId]`), `src/lib/uploads/resumable-video.ts` (chunk loop lifted into `sendToDrive()`), `src/app/memes/page.tsx` (a Reels link), both dictionaries, `routes.ts`, `write-requests.ts`, `eslint.config.mjs`, `docs/hard-coded-security-registry.json`, `scripts/check-permission-catalogue.mjs`, decision file, backlog
- [x] Cards affected identified — every reel screen and action asks `social.library` (Read to browse, Edit to change), carried today by the `meme_library` card; the `#` picker additionally asks `resident.record` at Read (carried by `view_residents`). No card or activity added or changed. Admin passes through `can()` as everywhere; the signed-out public is refused (below)
- [x] Anything explicitly **out of scope** written down — a Reel card or any split of `social.library` (`#i7qkz`), a path to the website (`#7j2qf`), posting to Facebook from the app (`#vkswg`, on hold), the resident page's list of its reels, a migration (the `can_see_drive_file()` SQL is in the decision file), the user manual

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (auto-merge of `docs/backlog.md`, no conflicts), then pushed
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — all four `0`:

```
=== gates: typecheck exited 0 after 18s
=== gates: lint exited 0 after 207s
=== gates: test exited 0 after 30s
=== gates: build exited 0 after 216s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR (`0322` is already on `main` and applied to dev)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR; `0322` was applied by #1325
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; the one table this code shares with an existing feature, `video_uploads`, is covered by the resident-video regression in §6
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no migration in this PR; `0322`'s own harness passed in #1325
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR; `0318`-`0322` are pending on production and must be applied before this code is deployed (the reel pages read `reels`, which production does not have yet)

## 4. Functional checks

- [x] Happy path works end to end — Management → Home → Meme library → Reels → Add a reel: video chosen, description typed with `#adopted` and `#An`, Angsumalin picked from the list, saved; the reel opened, Record where it was posted saved a Facebook post with a link
- [x] Data persists — read back from dev after the save: one `reels` row (`tags = {adopted}`, `date_taken` 2026-11-06), one `reel_residents` row (Angsumalin), one `video_uploads` row (`owner_kind = 'reel'`, `resident_id` null, `complete`); the page showed them after a reload
- [x] Create / edit / delete all exercised — create (upload), edit (description and tags changed, the picked resident kept), archive and bring back, record a post. Remove a recorded post and un-tagging a resident by editing out `#name` are covered by `splitDescription` tests and not clicked
- [x] Empty state renders sensibly — the library with no reels read "No reels yet. Tap Add a reel to file the first one."
- [ ] Invalid input is rejected with a readable message, not a crash — pending: the field checks (`checkReelFields`, wrong video type, size cap) are unit-tested and the server routes return sentences, but no bad input was typed into the running form
- [x] Boundary cases checked — `src/lib/reels/form.test.mjs` (9 tests): a pick whose `#name` was edited out links nothing; a hash never picked stays a word even when it spells a resident; `#Billy Bob` is taken out before `#Billy`; free hashtags lower-cased, punctuation trimmed, deduplicated and capped at 30; `room#4` is not a tag; empty description allowed, impossible date refused, 2,001 characters refused

### Role access matrix

By card (`CLAUDE.md`, *All analysis is by CARD*). Read card keys from `src/lib/permissions/cards.ts`.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | — | outside the card system, passes `can()` | pending: not driven; unchanged `can.ts` short-circuit |
| exactly `meme_library` + `view_residents` | `/reels`, `/reels/new`, `/reels/[id]`, `/reels/[id]/edit`, `/api/reels/*` | every control drawn; upload, edit, archive, record a post all succeed | pass — driven end to end; no card holds `social.library` at Read alone, so the Read-only view is not buildable with `dev-signin --cards` (see Left for manual verification) |
| exactly `view_residents` | none | `/reels` and `/reels/new` redirect to the no-access page; `/api/reels/start` and `/finish` 403; `/api/reels/<id>/video` 404 | pass — fetched as that login |
| exactly `residents` | resident Photos | a resident video still uploads and records its resident | pass — see §6 |
| signed out | none | every `/api/reels/*` path redirected to sign-in (307); anon refused every method on `reels` and `reel_residents` | pass — `curl` for the three API paths; the table refusals are `check-public-views.mjs`, added in #1325 |

- [x] Every login above tested — except admin, which is `pending:` in the table and unchanged code
- [x] A login that should not have access is blocked server-side — the no-card login was fetched directly (pages, `start`, `finish`, `video`), not merely checked for a hidden link

## 5. Cross-cutting

- [x] Nav entry correct — a card opens one page and `meme_library` opens `/memes`, so the way in is a Reels link on the meme library page and a Meme library link back, drawn on the Read the page already needs; reached by clicking through. The `/reels` route registry row is `menu: false`, `section: "management"`, like `/memes`
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing in the manual covers the meme library either, and reels are not live on production (the release note and manual belong to the PR that closes the deploy step)
- [x] Translatable strings go through the translation path — every new string is in `en.ts` and `th.ts` under `reels` and `nav.reels`; `check-thai-dictionary.mjs` passes. **The Thai is unreviewed**: written by Claude, not checked by a Thai speaker
- [ ] Mobile viewport (375px) — pending: not resized; the grid reuses the meme library's classes (two columns at 375 px) and the form's controls are `min-h-11`
- [x] Browser console clean — no errors read during the drive
- [x] Network clean — every request during the drive answered as intended; the only non-2xx were the deliberate refusals above

## 6. Regression

- [x] The pages nearest the change still work — `/memes` (loaded, now with a Reels link), `/home` tile, `/residents/[id]/photos`
- [x] **A RESIDENT video still uploads and still records its resident (the migration dropped `NOT NULL` on `video_uploads.resident_id`).** Signed in with `--cards residents`, clicked Residents → Angsumalin → Photos, attached a 4 KB `video/mp4`, which went through the refactored `sendToDrive()`. Dev rows: `video_uploads` `owner_kind = 'resident'`, `resident_id` = Angsumalin, `complete`, `attachment_id` set; `attachments` `owner_type = 'resident'`, `media_kind = 'video'`. `/api/videos/<file id>` (now through `streamDriveVideo()`) answered 206, `video/mp4`, `private, no-store`
- [x] Any shared file touched checked from a second, unrelated page by loading it — `resumable-video.ts` and `stream-video.ts` are shared with the resident photo uploader and `/api/videos`; both were exercised above from the resident Photos page, not read
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought in a CLAUDE.md change, a skill file, a backlog line and another stream's decision and plan; the four gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `#v9t4m` ticked; `#8bz78` annotated and left open because its *Done when* ends with the resident's own page listing its reels, which is not built
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-06-reels-app.md`
- [x] `README.md` still accurate — it lists no per-screen features for the meme library, so there is nothing to add
- [ ] **Release notes.** n/a: needs 0322 applied to production — `0318`-`0322` are pending there, so a note saying reels work would promise something live for nobody (`#518`); the drafted wording is in the decision file for the PR that closes the deploy step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The proofs above are rows read back from dev and responses fetched as each login; what was not measured (video decoding, the length badge, the Read-only view, 375 px) is named as not measured, not described as working

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: `date_taken` is typed by a person and defaults to `todayIso()`, the same helper the meme share date uses; the server derives no date
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: the 30-tag cap and 40-character tag limit are asserted at the cap and past it, and no other threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates block above, copied from the run
- [ ] Public pages re-checked after a cache purge — n/a: no public page, view or route changed; reels are never public

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable; the routes read `GOOGLE_DRIVE_ROOT_FOLDER_ID`, which the meme upload already needs

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration here, but this code reads `reels`, `reel_residents` and `video_uploads.owner_kind` from `0322`, so **production must have `0318`-`0322` applied before this deploys**
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive or rewriting migration backup — n/a: no migration in this PR
- [ ] Apply plan stated — deferred: release manager (apply `0322` and the four before it, then deploy)

### Rollback

- [ ] Rollback position stated — deferred: release manager; `./scripts/pi/deploy-pi.sh --ref <sha>` reverts the code, `0322` is additive and stays

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | No card opens `/reels` (`meme_library` opens `/memes`) | fixed for now by a Reels link on the meme library page; a tile is a card question, for the planner |
| 2 | Medium | The `#` picker needs `resident.record` at Read, which `meme_library` does not hold, so that card alone cannot link a resident | deferred: for the planner (card question, not changed here) |
| 3 | Low | `can_see_drive_file()` does not list reels, so `/api/videos/` cannot serve one | worked around by `/api/reels/[id]/video`; SQL in the decision file for the next schema PR |
| 4 | Low | The resident's own page does not list its reels | deferred: `#8bz78` stays open for it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A real iPhone or phone MP4: plays in the page, shows its length on the tile, and Download saves it | `/reels/<id>` on a phone |
| 2 | The Read-only view: no Add, Edit, Archive or Record control drawn (needs a login holding `social.library` at Read only; no card gives that today) | `/reels` |
| 3 | The Thai wording reads naturally | `/reels` with the language set to Thai |
| 4 | The 375 px layout of the grid and the form | `/reels`, `/reels/new` on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the four items in Left for manual verification

Manual verification by: pending: the four items in Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — pending: defects 2-4 are deferred to the planner, none blocks this PR
- [ ] Checklist pasted into the PR — pending: after the PR opens
- [ ] Handed to the production release manager — pending: release time

Result: pass with accepted defects

Release manager acknowledgement: pending: release time
