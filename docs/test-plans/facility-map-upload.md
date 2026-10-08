# Feature test plan

## Header

| | |
|---|---|
| Feature | Facility map plans uploaded and replaced in the app (the mechanism; Lutan loads the two new plans through it) |
| Backlog item | `docs/backlog.md` → **Facility map plans uploaded and replaced from the system, not committed to the repo** (left open with a status note) |
| Branch / worktree | `claude/facility-map-upload` @ `C:\Development\Animal_Shelter_facility-map-upload` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | the tip of `claude/facility-map-upload` when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — plan pictures are added and replaced from Settings → Facility map (photo or file, phone or desk) into a private Supabase Storage bucket served only to signed-in staff, with a replace preview (shapes drawn over the new picture, keep or clear), undo, and a history of who and when. Scoped by the brief to the mechanism: the House Zone and revised Main Zone plans are Lutan's to load.
- [x] Files/areas touched listed — `src/app/admin/facility-map/` (`actions.ts`: `uploadPlan`, `undoReplace`, old file-name `addPlan` removed; `MapEditor.tsx`; new `PlanUpload.tsx`; `page.tsx`), new `src/app/api/facility-maps/[...path]/route.ts`, new `src/lib/facility-map/plan-image.ts` and `plan-store.ts`, `src/lib/facility-map/types.ts` (`planImageUrl`), both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-08-facility-map-plans-uploaded.md`. No `worker/`, no migration.
- [x] Roles affected identified: admin (only holder of `facility.enclosures` Edit, which every action checks — not widened); every signed-in role that sees the Map reads pictures through the new route; signed-out public is refused.
- [x] Anything explicitly **out of scope** written down — loading the two new plans and placing their enclosures (Lutan); deleting the three committed files from `public/` (after production moves them; backlog follow-up); an `audit_log` trigger on `facility_maps` (schema; backlog follow-up); the pre-existing zone-plan insert bug from `0162` (schema; backlog follow-up, see Defects).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 179s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data) — the three dev `facility_maps` rows with bare file names rendered from `public/` before being moved, and after the move `/enclosures?view=map` serves every plan from `/api/facility-maps/plans/…` with no `/facility-maps/*.webp` left in the page
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the storage bucket is created by the app on first upload (5 MB, WebP/PNG/JPEG/JSON only, private) and was created that way on dev
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration. After deploy, production's plans are moved into storage by Lutan from the editor (*Move into the app's storage*); the bucket creates itself on the first one

## 4. Functional checks

Driven over HTTP against the dev server by a scratch script signed in as a disposable dev admin (`fmap-admin-20261008@example.test`), calling the real `uploadPlan` / `undoReplace` / `removePlan` Server Actions and the image route, and reading the rows and storage back with the service role. The browser pane could not be signed in (see Left for manual verification), so the picker and preview UI are not driven.

- [x] Happy path works end to end — Main Zone plan (13 enclosures placed) moved into storage keeping shapes; replaced keeping shapes (row 1740×2040, all 13 shapes byte-identical); undone (row back to the moved picture, 870×1020); replaced with a 1200×800 new layout clearing shapes (0 placed, history records `replace/cleared` by "Facility map test admin" with 13 enclosures in the snapshot); undone (picture back and every shape restored exactly). Overview and Cat Zone moved into storage with zone outlines and rooms unchanged. A plan added for the Green zone was refused by the database (Defect 1)
- [x] Data persists — reload the page and the change is still there — every check reads the row and the shapes back from the database after each call; the server-rendered editor shows "Replaced … by Facility map test admin"
- [x] Create / edit / delete all exercised (whichever the feature has) — add (overview: refused as a duplicate, in words; zone: Defect 1), replace keep, replace clear, undo, undo with nothing to undo ("There is no replace to undo on this plan any more"), remove plan unchanged
- [x] Empty state renders sensibly (no rows yet) — unchanged from 2026-10-05 ("There is no plan yet. Add one above"); the add form now offers a photo or file instead of a file name
- [x] Invalid input is rejected with a readable message, not a crash — **upload refused for a wrong type or size:** a PDF, an SVG and 3000 zero bytes named `.webp` each got "That file is not a WebP, PNG or JPEG picture…", a 6 MB file got "That picture is larger than 5 MB…", and the plan row was unchanged after all four
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the 145×210 Cat Zone crop is accepted (minimum is 100 px); the header parser read the committed WebPs (1492×1054, 870×1020) and a JPEG (781×746) correctly and rejected zero bytes and SVG text; a refused duplicate add now stores nothing (plan folders 4 before and after)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/facility-map`, every action, plan pictures | full use | as expected (disposable dev admin, scripted) |
| management | plan pictures through the Map; not the editor's writes | `facility.enclosures` is Read for management since `0150`, so the actions refuse | not run as management: the check is the unchanged `can(…, "facility.enclosures")` line every editor action already had |
| staff | plan pictures through the Map | same | not run separately: the image route asks only "signed in with an app role" |
| vet | no Map toggle (no `facility.map`) | a picture URL, if known, still loads (any signed-in login reads `facility_maps`, 0142) | not run separately |
| volunteer | plan pictures through the Map | same | not run separately |
| signed out | nothing | refused | `/api/facility-maps/plans/…` → 307 to `/login` (proxy), a made-up name → 404 for a signed-in admin, `history.json` through the route → 404; `/facility-maps/main-zone-blue.webp` also → 307 to `/login` |

- [ ] Every role above tested — n/a: only admin and signed out were driven; the other roles meet unchanged permission checks (the editor's `facility.enclosures` gate) or the route's single "signed in with an app role" test, which the admin and signed-out runs cover from both sides
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — **a signed-out request for a plan image is refused** (307 to `/login`; the route itself answers 404 to anything without a session and an app role)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the editor keeps its Settings tile
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — *Placing enclosures on the facility map* gains adding by photo or file, *Replace this plan* (keep or clear), Undo, and *Move into the app's storage*; *The facility map* says where plans are added. Read in the source, not at `/manual` (the pane was not signed in)
- [x] Translatable strings go through the translation path, checked at `/management/translations` — every new control and message is in both `en.ts` and `th.ts` (typecheck enforces the same shape); `/management/translations` covers data, not the dictionaries, so there is nothing new there
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven, the browser pane could not be signed in; listed under Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: not driven in a browser (same reason); listed under Left for manual verification
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/admin/facility-map` 200, `/enclosures?view=map` 200, each stored picture 200 `image/webp` with `private, max-age=31536000, immutable`; the only 4xx were the deliberate refusals above

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/admin/facility-map` (server render: plan block, history line, add form), `/enclosures?view=map` (pictures from the new route); shapes and rooms on the overview and both zone plans unchanged by moving them
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `planImageUrl` is shared with the read-only Map: `/enclosures?view=map` loaded and uses the stored pictures
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (already up to date)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: the brief says leave it open with a status note (the two plans are Lutan's to load); the note is added, and the related `facility_maps` writes item has a note that it is still open. Follow-ups (the `0162` trigger bug, an audit trigger, deleting the committed files) are on the `backlog` branch, `a5a0ca2b`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-10-08-facility-map-plans-uploaded.md`, superseding the storage section of `2026-10-05-facility-map-editor.md`
- [x] `README.md` still accurate — it does not describe plan storage
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`: plans added and replaced in the app, by photo or file, with the keep-or-clear preview and undo
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the signed-out refusal of `/facility-maps/*.webp` was measured (307) before the decision file said so; the `0162` bug was reproduced (42703 `record "new" has no field "name"` on a zone-plan insert) before it was written down; "Admin only" was corrected from the brief after reading `0150`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager (upload on the Worker build, the image route through the edge)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the only time is the history's ISO timestamp, shown with `formatDateTime`, which already reads the shelter's zone
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no banding change; the size gates were exercised on both sides (6 MB refused, 86 KB accepted; 145 px accepted against a 100 px minimum)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: production release manager (the gates block above is pasted from the run)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changes; plan pictures are never public

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new; the route and actions use `SUPABASE_SERVICE_ROLE_KEY`, which production already has

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `./scripts/pi/deploy-pi.sh --ref <previous sha>` on the Pi (and `wrangler rollback` for the Worker fallback). **Not covered:** a plan already moved into storage has a `storage:` `image_path`, which the previous build would try to load from `public/facility-maps/storage:…` and show as a broken picture. Before rolling back, set those rows back to their file names (each plan's `history.json` holds the `from` of its first replace), or roll forward instead

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | Adding a plan for a **zone** fails with `record "new" has no field "name"`: `refuse_lifecycle_map()` since `0161`/`0162` reads `new.name`, which `facility_maps` lacks. Pre-existing on `main`, not caused by this branch; replace and the overview are unaffected. Blocks loading the House Zone plan if that zone has no plan yet | deferred: fix folded into the in-flight schema PR #463 (`0164`) at Lutan’s request, 2026-10-08 |
| 2 | minor | A refused duplicate add stored its picture before the database refused the row | fixed (existing plan checked first) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The picker and replace preview in a real browser: choose a picture, see it with the existing outlines over it and the count, Keep vs Clear (and the "different shape" warning picking Clear), Save, then Undo the replace | Settings → Facility map, signed in as admin |
| 2 | On a phone (375 px): *Take a photo or choose a picture* offers the camera, a full-size phone photo uploads (made smaller first), and the page has no sideways scroll | a phone on dev or `test.lannacare.org` |
| 3 | Load the House Zone and revised Main Zone plans, place their enclosures (zone numbers repeat: place against the right zone), decide whether the revised Main Zone becomes the overview, and check the Map on a phone. House Zone needs Defect 1 fixed first (#463 applied) if it has no plan yet | Lutan, after the release |
| 4 | Thai wording of the new editor strings reads naturally | Settings → Facility map in ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; only the person who looks may tick this

Manual verification by: pending: the picker and preview in a browser, a phone upload, loading the two new plans, the Thai wording

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: Defect 1 is pre-existing and deferred to the backlog, not fixable without schema; Lutan to accept or hold
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR is merged

Result: pass with accepted defects

Release manager acknowledgement: pending
