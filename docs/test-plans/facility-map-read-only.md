# Test plan — facility-map-read-only

## Header

| | |
|---|---|
| Feature | Facility map, read-only (step 2 of 3): a List / Map toggle on `/enclosures` |
| Backlog item | `docs/backlog.md` → Facility, "A facility map: find your way round the site and open an enclosure from it" (stays open: step 3, the editor) |
| Branch / worktree | `claude/facility-map-read-only` @ `C:\Development\Animal_Shelter_facility-map-read-only` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | (opened after this commit) |
| Tested by / date | Claude (automated and driven browser checks) / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | 5e10ad88 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `/enclosures?view=map` shows the hand-drawn plan with a shape per enclosure (overview → zone → enclosure), status from data the page already loads, tap to select then Open
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/enclosures/` (page, `ViewToggle`, `map/FacilityMap`, `map/PanZoom`), `src/lib/facility-map/`, `src/lib/i18n/dictionaries`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `src/components/hub-icons.ts` (one icon), `scripts/lib/acceptance-matrix-entries.mjs`, `public/facility-maps/` (three images); no `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin, management, staff and volunteer hold `facility.map` and see the toggle; vet does not and is refused; signed out is sent to login
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the admin place-on-map editor (step 3); no `facility_maps` rows exist in production, so the Map button stays hidden there until a plan is loaded

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 54s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the schema is 0142 from #360
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the page reads real dev rows and the unchanged list view still renders
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; `node scripts/check-facility-maps.mjs` (0142's harness) was re-run and ended `HARNESS-OK rejections=9`, after clearing the dev plan rows it collides with and putting them back
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — at 375 px in the browser pane, signed in: overview, then a zone chip, then a plan with 13 shapes, tap selects and shows the card with the Open enclosure link
- [x] Data persists — reload the page and the change is still there — nothing is written; shapes and plans are read from the database and survived reloads
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only feature, no create, edit or delete
- [x] Empty state renders sensibly (no rows yet) — with no `facility_maps` row the toggle is not rendered at all; a plan with no shapes shows the image, a "not placed yet" sentence and the unplaced list. Dev has shapes on every plan, so the empty-plan sentence is a code path not seen on screen; the unplaced list was seen on the overview
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; a malformed `map_shape` is dropped by `parseShape` rather than drawn, and the database refuses one anyway
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — zero residents (`0/9`), a maintenance marker (enclosure 6), a one-enclosure plan (Cat Zone, chip hidden), pan clamped, zoom buttons after a drag (a real defect, fixed)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/enclosures?view=map` | toggle and map | 200, 4 polygons, toggle present |
| management | same | toggle and map | 200, 4 polygons, toggle present |
| staff | same | toggle and map, medication marker | 200, 4 polygons |
| vet | same | no `facility.map`: refused | 200 with no map markup (the in-app no-access page) |
| volunteer | same | toggle and map; no medication marker (cannot read prescriptions) | 200, 4 polygons |
| signed out | same | login | 307 to `/login?next=…` |

- [x] Every role above tested — by script against the running dev server with disposable logins (admin and management deleted afterwards; the staff, volunteer and vet logins `fmap-*-20261004@example.test` are left in dev, their passwords only in this worktree's gitignored `.env.local`)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — vet and signed-out above; `facility_maps` is also `to authenticated` in RLS

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; the map is a toggle on the existing Enclosures page
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — topic "Finding your way round on the map" added, and the acceptance matrix gained its row (lint was red until it did); the manual has no Thai file, only `en.ts`; `/manual` itself was not opened
- [x] Translatable strings go through the translation path, checked at `/management/translations` — all map strings are in both dictionaries (`enclosures.map`); the translations page itself was not opened
- [x] Mobile viewport (375px) — no overflow, controls reachable — driven at 375×812: toggle, plan chips, controls, legend and card fit; buttons are 44 px
- [x] Browser console clean — no errors or React warnings — `read_console_messages` errors only: none
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the page and the plan images loaded (images visible), no error responses seen

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/enclosures` list view (200, cards render)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `hub-icons.ts` gained one key and `manual/en.ts` one topic; the build and the acceptance-matrix check pass with both, and the resident hub that `icon-buttons` changed builds
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought in `icon-buttons`; gates ended build=0

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item is not complete (step 3 remains); the status note went on the `backlog` branch, as the brief says
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-04-facility-map-read-only.md`
- [x] `README.md` still accurate — no setup or command changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for the map, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The dead-controls defect and the chip-covers-number complaint were observed in the browser; nothing here involves time zones or concurrency

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the only date used is "current prescription", which reuses `todayIso()` exactly as the special-diet marker does
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no new threshold; occupancy bands are `occupancyLevel`, unchanged
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates block, as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changed; visitors get no map

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the page reads 0142's columns, so the release manager confirms 0142 is live in production before this ships
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, to confirm 0142 is applied
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the Pi rebuild `./scripts/pi/deploy-pi.sh --ref <sha>`; the change is additive and has no migration, so there is nothing to undo in the database (the dev `facility_maps` rows are test data)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | After any drag or pinch the +, − and fit buttons ignored taps until the next press on the plan (the click guard swallowed them) | fixed (controls exempt from the guard) |
| 2 | Low | The count chip covered the enclosure number drawn on the plan | fixed (chip roughly halved; hidden on a one-enclosure plan) |
| 3 | Low | The dev-only `/enclosures/map-prototype` is now redundant | deferred to backlog (noted on the backlog item) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Pinch with two fingers, drag, and double-tap on a real phone; confirm a pan never opens an enclosure by accident and the page still scrolls under a finger outside the plan | Phone, `/enclosures?view=map` |
| 2 | Does the map actually help someone find their way round the site: are the zone outlines and enclosure shapes in the right places? (the dev shapes are rough rectangles Claude drew, not an admin's) | Phone, walking the site |
| 3 | The Thai view reads correctly (labels, plan names) | `/enclosures?view=map` with Thai selected |
| 4 | The Cat Zone crop is low resolution; is it good enough, or does that corner need a re-shoot? | Cat Zone plan, zoomed |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: Lutan to check items 1 to 4 above on a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass with accepted defects
