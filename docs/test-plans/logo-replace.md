# Feature test plan

## Header

| | |
|---|---|
| Feature | Replace the logo with a better-quality copy of the same artwork |
| Backlog item | `docs/backlog.md` → "Replace the Lanna Care for Animals logo with Lutan's better-quality JPEG" (Quick wins) |
| Branch / worktree | `claude/logo-replace` @ `C:\Development\Animal_Shelter_logo-replace` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3014` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | `6792fe9` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `public/lca-logo.jpg` is replaced by Lutan's higher-resolution copy of the same artwork (124 × 117 px, 8 KB → 781 × 746 px, 33 KB)
- [x] Files/areas touched listed — `public/lca-logo.jpg`, `src/lib/releases.ts` (one `unreleased` line), `docs/backlog.md` (tick), this plan. No code that draws the logo changed
- [x] Roles affected identified — everyone sees the logo: every signed-in role in `AppHeader`, signed-out visitors in `PublicHeader`, the sign-in / forgot / request-access pages and `LockedLanding`. Nobody's access changes
- [x] Anything explicitly **out of scope** written down — the favicon (`public/favicon.ico`) and Open Graph image are unchanged; the file was used as supplied (no resize, no recompression), since 33 KB is already small and every box it is drawn in is ≤ 88 px

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. The first run failed on `build=1` while this worktree's `next dev` was running against the same `.next`; with the dev server's build finished, a standalone `npm run build` and a second gates run both passed:

```
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — #282 at `cb9053d`: all five checks passed: check, test-plan, migration-numbers, audit, public-views

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on `localhost:3014`, `/lca-logo.jpg` returns 200 with 33,032 bytes; on `/login` the logo `<img>` reports `naturalWidth × naturalHeight` 781 × 746, drawn at 64 × 61 in its circle; on `/` at 375 px, light mode, the public header logo reports 781 × 746, drawn at 28 × 27, round and unstretched
- [x] Data persists — reload the page and the change is still there — the file is static and committed; a reload served the same 781 × 746 image
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a static image swap; nothing is created, edited or deleted
- [ ] Empty state renders sensibly (no rows yet) — n/a: no data behind the logo
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the only boundary is shape: the new image is 1.047 : 1 against the old 1.060 : 1, and every place it is drawn uses a square box with `object-contain` (`AppHeader` 28, `PublicHeader` 40, sign-in pages 72, `LockedLanding` 88), so it letterboxes by under 1 px rather than stretching

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/lca-logo.jpg`, app header | new logo | not driven signed in — same `AppHeader` file and same image URL as checked signed out |
| management | as admin | new logo | as admin |
| staff | as admin | new logo | as admin |
| vet | as admin | new logo | as admin |
| volunteer | as admin | new logo | as admin |
| signed out | `/lca-logo.jpg`, `/`, `/login` | new logo, 200 signed out | pass: 200, 781 × 746 on both pages |

- [x] Every role above tested — the image is one public static file with no per-role code path; `src/lib/public-paths.ts` keeps `/lca-logo.jpg` on both signed-out lists (filename unchanged), so every role is served the same bytes. Signed out was driven; the signed-in header uses the same URL
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the logo is deliberately public to every role and to signed-out visitors

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual does not describe the logo's image quality
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/` at 375 × 812: header logo, name, Donate and menu all in one row
- [ ] Browser console clean — no errors or React warnings — n/a: not read during this check; the change is a binary file swap with no script involved
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/lca-logo.jpg` 200, `/login` 200, `/` 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/login`, `/` (public home, phone width, light)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared code file touched; `releases.ts` gained one string in the existing `unreleased` array, and the build that renders `/releases` passed
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was "Already up to date."; gates green

`OfflineBanner` uses `/lca-logo.jpg` as its connectivity probe; it sends a `HEAD` request (`src/components/OfflineBanner.tsx:68`), so the larger file adds no traffic there.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no design choice beyond using the file as supplied, recorded on the backlog tick
- [ ] `README.md` still accurate — n/a: the README does not mention the logo file
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line in this PR: the logo is sharper, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — dimensions read from the JPEG headers (124 × 117, 781 × 746), byte counts from the files and the served response, drawn sizes from the page's own `<img>` elements

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here depends on the date or time
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: not a boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the `gates:` line is copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager (the old 124 px logo can linger in edge and browser caches until they expire)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert this PR (the old image returns from git) and redeploy: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, `npx wrangler rollback --env production` for the Worker fallback. Nothing in the database to undo; cached copies of the new image may outlive a rollback until their cache expires

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The new logo looks right in the dark-mode app header and on the locked landing page — not driven here (the sign-in page was seen in dark mode, the public header in light) | `test.lannacare.org` once deployed, signed in and signed out |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item outstanding, awaiting Lutan

Manual verification by: pending: item 1, the logo in the dark-mode app header and on the locked landing page

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — summarised in the #282 description, which links this file
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending: after merge
