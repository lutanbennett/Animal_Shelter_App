# Feature test plan — admin-actions-result-sweep

## Header

| | |
|---|---|
| Feature | Server Actions under `/admin` return `ActionResult` instead of throwing (#441, part 2 — the `/admin` area only) |
| Backlog item | `docs/backlog.md` → "Server Actions across the app: return a result instead of throwing (#441, part 2)" — left unticked (spans the whole app); a bracket note records `/admin` done here |
| Branch / worktree | `claude/admin-actions-result-sweep` @ `C:\Development\Animal_Shelter_admin-actions-result-sweep` |
| Dev server | **production build**, `next build` + `next start -p 3003` (the worktree's `.port`). #441 exists only in production, so `next dev` would prove nothing |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-28 |
| Carries a migration? | no |
| Tested at SHA | `d75b3f9` (after `node scripts/worktree.mjs sync` merged in `origin/main`, which had moved to `42ac098` — #201/#202 and the "no Auto-fix" CLAUDE.md rule) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every exported `"use server"` function under `src/app/admin/**` now returns `ActionResult` (`{ ok: true, … } | { ok: false, error }`) wrapped in `runAction()` instead of `throw new Error(...)`, and `assertAdminRole()` calls inside action bodies became `hasAdminRole()` checks returning a refusal
- [x] Files/areas touched listed — `src/app/admin/{enclosures,frequencies,immunization-types,procedure-types,blood-test-types,website,status,zones}/actions.ts` and every client component under those directories that calls one of those actions (tables, create forms, website's Gallery/Hero/PublishedProjects/FeaturedResident/SitePage/SiteSettings/VetVisitEstimate); `docs/backlog.md`, `docs/decisions.md`, `src/lib/releases.ts`, this test plan. `zones/actions.ts` had already been converted before this branch's work started (per `.brief.md`); this PR finished `ZonesTable.tsx` / `CreateZoneForm.tsx`, which had not been updated to match yet
- [x] Roles affected identified — admin only; every page under `/admin` is admin-only and every action still checks the role first, in the same order as before
- [x] Anything explicitly **out of scope** written down — (a) every other area under `src/app` (residents, contacts, management, projects, maintenance) — later streams, per the backlog item's own "probably one PR per area"; (b) `src/app/admin/security/**`, already converted 2026-09-26, read only as reference; (c) `src/lib/action-result.ts`, `src/lib/auth/require-admin.ts`, `src/lib/uploads/run-upload-action.ts` — untouched, used as-is; (d) folding `FriendActionResult`/`ProjectActionResult`/`MaintenanceActionResult`/`TranslationActionResult` into `ActionResult` — none of the four appear under `/admin` (`grep -rn` returned no matches), so nothing to fold here; left for the areas that own them; (e) what any action allows — guards, their order and outcomes are byte-for-byte the same, only how a refusal reaches the browser changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run after the docs commit: `origin/main` had moved to `42ac098` (#201 `0109_public_project_photos_exclude_non_images.sql`, #202, and the new "no Auto-fix" CLAUDE.md rule) while this branch was in progress. Merged clean (`Auto-merging docs/backlog.md`, `Auto-merging docs/decisions.md`, no conflicts), pushed; `git status -sb` shows even with `origin/claude/admin-actions-result-sweep` afterwards
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run again after the sync above so it reflects the merged tree:

```
=== gates: build exited 0 after 126s

gates: typecheck=0 lint=0 build=0
```

(An earlier run before the sync, at `4ec7842`+docs, also ended `gates: typecheck=0 lint=0 build=0` with all eight converted `/admin` routes present in the route list.)

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; every action reads/writes the same tables and columns as before
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — verified at the code level for every converted function: each mirrors the merged `security/actions.ts` / `zones/actions.ts` pattern exactly (same query, same `revalidatePath`/`refresh` calls, same success value), and the production build compiles and type-checks against every caller's expected return shape, which would fail to build if a success or refusal branch were shaped wrong
- [ ] Data persists — reload the page and the change is still there — n/a: no admin browser session was available in this sandbox to drive a real create/edit/delete; see "Left for manual verification" item 1
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no admin browser session was available in this sandbox; the code path for each was reviewed against its pre-conversion source instead (§4 above) — see "Left for manual verification" item 1
- [ ] Empty state renders sensibly (no rows yet) — n/a: no empty-state rendering changed, only how a refusal reaches the screen
- [x] Invalid input is rejected with a readable message, not a crash — every validation refusal (`nameRequired`, `selectZone`, `capacityNonNegative`, `intervalPositive`, `costInvalid`, `mergeSelf`, `hasPrescriptions`/`hasProcedures`/`hasBloodTests`, the website link/WhatsApp checks, `noFile`, etc.) kept its exact message and is now returned as `{ ok: false, error }` rather than thrown; confirmed by reading every converted function against its pre-conversion source (git diff) — same string, same condition, same order
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — unchanged from before this PR; no validation rule's logic changed, only its delivery mechanism

### Production-build verification (the check that matters most here)

- [x] `node scripts/gates.mjs` produced a real Turbopack **production** build (`next build`), not a dev server — see §2 output above
- [x] `next start -p 3003` served the built app: `GET /` → `200`
- [x] Unauthenticated `curl` requests to three converted `/admin` pages redirected to `/login` rather than crashing or exposing anything, proving `requireAdminUser()`'s page-level guard is unaffected by this change on a real production build:
  ```
  curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:3003/admin/zones
  307 -> http://localhost:3003/login?next=%2Fadmin%2Fzones
  curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:3003/admin/status
  307 -> http://localhost:3003/login?next=%2Fadmin%2Fstatus
  curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:3003/admin/website
  307 -> http://localhost:3003/login?next=%2Fadmin%2Fwebsite
  ```
- [ ] **Signed in as admin, triggered 2–3 real refusals on the production build and read the actual message (not "Minified React error #441")** — n/a: genuinely not performed, not a false tick. `node scripts/bootstrap-admin.mjs --env test` refuses because the dev Supabase project already has 13 role rows (it only seeds an *empty* table), and no existing admin's password or Google account was available in this sandbox to sign in with. This is exactly the check the backlog item and `.brief.md` call the one that matters most — see "Left for manual verification" item 1. The mechanism itself (`runAction`/`ActionResult` instead of `throw`) is the identical pattern `security/actions.ts` used, and *that* page's equivalent check was performed and passed in a real browser on 2026-09-26 (`docs/test-plans/security-action-errors.md`, §4) — this PR applies the same mechanism mechanically to the remaining `/admin` files, verified here by code diff and a clean production type-check/build rather than by a second live repro

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every converted `/admin` page and its actions | every action works; refusals readable | not driven live — see above; guard and action logic unchanged from the reviewed diff |
| management | nothing here | redirected by `requireAdminUser()`; an action call refused by `hasAdminRole()` | unchanged code path — not signed in as this role |
| staff | nothing here | same | unchanged code path — not signed in as this role |
| vet | nothing here | same | unchanged code path — not signed in as this role |
| volunteer | nothing here | same | unchanged code path — not signed in as this role |
| signed out | nothing here | redirected to `/login` | confirmed above: `/admin/zones`, `/admin/status`, `/admin/website` → `307` to `/login?next=…` on the production build |

- [ ] Every role above tested — n/a: the page guards are untouched (`requireAdminUser()`); the action guard is the same `hasAdminRole()` test every converted action now shares with `security`/`zones`; signing in as each role needs passwords Claude does not have in this sandbox
- [x] A role that should not have access is blocked server-side — signed out, direct URLs to three converted pages redirected to `/login` on the production build (above); for the actions themselves, `hasAdminRole()` is still the first check inside every `runAction()` body, before any read or write (confirmed in the diff for every file)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no control, page or wording visible to staff changed; only how an existing refusal message is delivered
- [ ] Translatable strings go through the translation path — n/a: every message reused is an existing dictionary string (`t.admin.*.errors.*`, `t.common.*`); no new string was added
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout or markup change; the same message `<p>` elements render in the same place, now fed from `.ok`/`.error` instead of `"error" in state`
- [ ] Browser console clean — no errors or React warnings — n/a: no admin browser session was available in this sandbox to drive the pages and read the console; see "Left for manual verification" item 2
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: only the signed-out `curl` checks above were possible here (clean `307`s, no 5xx); a signed-in pass was not driven — see "Left for manual verification" item 2

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — all eight converted areas compile, type-check and are present in the production build's route list (`/admin/zones`, `/admin/enclosures`, `/admin/frequencies`, `/admin/immunization-types`, `/admin/procedure-types`, `/admin/blood-test-types`, `/admin/website`, `/admin/status`)
- [x] Any shared file touched checked from a second, unrelated page — no shared file outside `/admin` was touched; `src/lib/action-result.ts`, `src/lib/auth/require-admin.ts` and `src/lib/uploads/run-upload-action.ts` are read-only dependencies here and unchanged, so every other consumer of them (e.g. `security/actions.ts`, `GalleryPhotos.tsx`'s `runUploadAction` usage) keeps compiling against the same exports — confirmed by the clean typecheck across the whole app, not just `/admin`
- [x] Nothing merged from `main` during `sync` was broken by this branch — no merge was needed for this run (§2)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked — the item spans the whole app and this PR is `/admin` only, per `.brief.md`. A bracket note was added instead recording `/admin` done 2026-09-28 and which areas remain
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — "2026-09-28 — Server Actions return a result, not a throw (part 2: `/admin`)"
- [x] `README.md` still accurate — n/a: README does not describe `/admin`'s action error handling or the `ActionResult` convention
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line, tagged `roles: ["admin"]`, for the real refusal messages now shown across Zones, Enclosures, Frequencies, Immunization types, Procedure types, Blood test types, Website and System status
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the `FriendActionResult`/etc. absence under `/admin` is from an actual `grep -rn` run (no matches), not assumed; the dev-database role count that blocked `bootstrap-admin.mjs` is the script's own printed refusal, quoted verbatim; the production build/route list and the `curl` redirect codes are pasted from the actual runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives "today" or any instant; every change is refusal-delivery only
- [ ] **For a boundary or banding change, both edges of the band and both sides of the boundary covered** — n/a: no threshold, rounding rule, retry window, pagination limit or permission cutoff changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` build output, the `curl` redirect lines and the `bootstrap-admin.mjs` refusal text above are copied from the actual runs in this worktree
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched; `/admin/**` is not public

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — `npx wrangler rollback --env production` restores the throwing (#441-showing) version in seconds; purely a code change, no schema or data involved, so nothing else needs undoing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

No defects found during code review or the checks that could be run in this sandbox.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as admin on a production build (`test.lannacare.org` after deploy, or `next start` on this worktree) and trigger 2–3 real refusals across different converted `/admin` subpages — e.g. try to delete a zone/procedure-type/blood-test-type that's referenced elsewhere, submit an empty required field on a create form, or try a self-merge on Frequencies/Procedure types/Blood test types — and confirm the actual refusal message is shown, not "Minified React error #441" | `test.lannacare.org` → `/admin/zones`, `/admin/enclosures`, `/admin/frequencies`, `/admin/immunization-types`, `/admin/procedure-types`, `/admin/blood-test-types`, `/admin/website` |
| 2 | Browser console and network tab clean while doing the above (no unexpected errors, no 4xx/5xx) | same pages |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1–2 are waiting for someone with an admin login

Manual verification by: pending: an admin sign-in on a production build to see the real refusal messages (items 1–2)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened after this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
