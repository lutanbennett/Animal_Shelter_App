# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Public photos served at fixed sizes (160 / 400 / 1200), kept on the Pi's disk |
| Backlog item | `docs/backlog.md` → Public website photos load slowly: serve sized copies, cached on the Pi (also subsumes the Pi photo spike) |
| Branch / worktree | `claude/public-photo-sizing` @ `C:\Development\Animal_Shelter_public-photo-sizing` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | linked from the PR itself |
| Tested by / date | Claude (public-photo-sizing session), 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | the PR head; gates run after syncing `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `/api/photos/<id>?w=` serves Drive's own 160/400/1200 rendition (original as fallback), every public page asks for the size it shows, and the Pi keeps each size on a capped, disposable disk cache
- [x] Files/areas touched listed: `src/app/api/photos/[fileId]/route.ts`, new `src/lib/photo-cache.ts`, `src/lib/google/drive-client.ts` and `drive.ts` (regex fix, purge on trash/delete), the public pages and cards (`page.tsx`, `adopt/*`, `r/[code]`, `our-work/*`, `friends`, `FriendCard`), `scripts/pi/write-env.mjs`, docs. No `supabase/`, no `worker/`
- [x] Roles affected identified: the signed-out public (every image); nobody else, staff views still use the original
- [x] Out of scope written down: staff-only photos (unchanged by request), `srcset`, caching full-size originals on the Pi, the phone-from-Thailand timing (Lutan's)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 119s

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

Run against the dev server on :3009 with the dev database and Drive.

- [x] Happy path works end to end. Bytes of the images each page loads, original vs sized (curl; dev test data, smaller than real phone photos): `/` 3,842,798 B → 369,629 B (12 images); `/adopt` 342,488 → 35,254 (2); `/our-work` 376,416 → 49,458 (2). One 1.44 MB original: 8,601 B at 160, 37,020 at 400, 148,982 at 1200. The home hero rendered in the browser pane at 900×1200 from `?w=1200`
- [x] Data persists: with `PHOTO_CACHE_DIR` set, the second request for a size came from disk (`400.jpg` appeared in `<dir>/<fileId>/`); cold 4.45 s (included a dev compile) vs warm 0.28 s, same 37,020 bytes
- [x] Create / edit / delete exercised: no records are created. Cache write, read, purge (`purgeCachedPhoto` removes the folder) and eviction were run by script against the real module under a 1 MB cap: six 300 KB files left the three newest and removed the emptied folders; an `image/svg+xml` body was refused
- [x] Empty state: a file with no rendition falls back to the original (`downloadThumbnail(...).catch(() => null)` then `downloadFile`), cached 5 minutes and not written to disk. This branch was read, not provoked: every dev file has a rendition
- [x] Invalid input is rejected: `?w=999` → 400 `Invalid photo size.`; a made-up valid-shaped id with `?w=400` → 404 `Photo not found.`, nothing written under the cache dir
- [x] Boundary: only the exact strings `160`, `400`, `1200` pass. Known edge: Drive upscales, so a small original comes back slightly larger as the 1200 rendition (188 KB → 206 KB on a small dev file)
- [x] The `is_public_drive_file` gate on what reaches disk: disk is written only inside `if (isPublic)` and read only after the database check, so an internal file never touches it. Shown from outside with the made-up id (404, empty cache dir) at a sized request. The positive internal-file path needs a signed-in session and is in the manual table
- [x] Worker fallback path: the Worker has no `PHOTO_CACHE_DIR` (only `write-env.mjs`, which runs on the Pi, sets it), so every `photo-cache` function returns before touching `node:fs`. Exercised as `next dev` without the variable (sizes served, nothing on disk). A real Worker build was not run; it is in the manual table

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | public pages | sized images, same as everyone | not separately run |
| management | public pages | as above | not separately run |
| staff | public pages | as above | not separately run |
| vet | public pages | as above | not separately run |
| volunteer | public pages | as above | not separately run |
| signed out | `/`, `/adopt`, `/our-work`, `/api/photos/<public id>?w=` | sized image, 200 | 200 |
| signed out | `/api/photos/<made-up id>?w=400` | 404, no disk write | 404, cache dir empty |

- [ ] Every role above tested — n/a: the route's behaviour does not depend on role for public files; only the signed-out case was driven
- [ ] A role that should not have access is blocked server-side — n/a: access rules are unchanged (same `is_public_drive_file` / `canSeeInternalFile` calls as before); the signed-out refusal was hit directly

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: nothing to document beyond images loading faster
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: layouts unchanged; only the image URL differs
- [x] Browser console clean: no errors on `/` and `/adopt`
- [x] Network clean: all sized requests 200; hidden and lazy images did not load, as before

## 6. Regression

- [x] Nearest pages still work: `/` and `/adopt` loaded in the pane; `/our-work` HTML was read by curl and shows the `?w=` URLs, not driven in the browser
- [x] Shared files touched: `drive.ts` and `drive-client.ts` are imported by staff routes too (typecheck and build pass); `driveImageUrl(id)` with no width is identical to before
- [x] Nothing merged from `main` during `sync` was broken: gates run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, and the Pi spike marked subsumed
- [x] Decision added: `docs/decisions/2026-10-01-public-photo-sizing.md` (widths, cap, eviction, invalidation)
- [x] `README.md` still accurate — `docs/pi-hosting.md` gained a "Photo cache on the Pi" section; the README does not describe photo serving
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line: public photos load faster
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: byte counts are from curl; the tunnel and Drive timing is left to Lutan's phone test rather than asserted; the regex bug was read from the file bytes (`=sd+`, a literal "d")

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: the width allowlist is exact-match; both an invalid (`999`) and valid widths were hit
- [ ] Evidence pasted is the tool's actual output — n/a: byte counts are summarised from curl runs, labelled as such, not a generated table
- [ ] Public pages re-checked after a cache purge — deferred: release manager (purge, then check `/our-work` bytes)

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: `PHOTO_CACHE_DIR` is written by `write-env.mjs` on the Pi at the next `deploy-pi.sh`; nothing to set in Cloudflare

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; `npx wrangler rollback --env production` for the Worker, `deploy-pi.sh` after the revert for the Pi. `~/photo-cache` is disposable and can be deleted; nothing in the database changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `downloadThumbnail`'s size rewrite regex was `/=sd+$/` (literal "d"), so it never rewrote the size | fixed |
| 2 | low | Drive upscales: a small original comes back slightly larger as the 1200 rendition | accepted: real photos are far larger than 1200 px |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Bytes and time for `/our-work` and one story, cold and warm, on a real phone from Thailand, before and after | Phone |
| 2 | After `deploy-pi.sh`: `~/photo-cache` appears and fills, `x-lanna-cache` still shows edge hits, and `du -sh ~/photo-cache` stays under 1 GiB | The Pi |
| 3 | A staff-only photo (blood-test or maintenance attachment) opened signed in still works; signed out is still "Photo not found." | lannacare.org |
| 4 | With the tunnel stopped (Worker fallback), a project page's photos still load | lannacare.org |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (public-photo-sizing session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items remain in the table above; not ticked on anyone's behalf

Manual verification by: pending: the four items under Left for manual verification (phone timing, Pi cache after deploy, staff photo, tunnel-down fallback)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet; the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet; waits on the PR and Lutan's checks

Result: pass
