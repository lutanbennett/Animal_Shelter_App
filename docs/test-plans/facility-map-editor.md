# Test plan — facility-map-editor

## Header

| | |
|---|---|
| Feature | Facility map editor (step 3 of 3): Settings → Facility map, where an admin draws enclosures and zones on the plans |
| Backlog item | `docs/backlog.md` → Facility, "A facility map: find your way round the site and open an enclosure from it" (ticked by this PR as the last of three steps, with the caveat in section 7) |
| Branch / worktree | `claude/facility-map-editor` @ `C:\Development\Animal_Shelter_facility-map-editor` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3016` |
| PR | (opened after this commit) |
| Tested by / date | Claude (gates and a script against dev; **no driven browser check**, see Defects) / 2026-10-05 |
| Carries a migration? | no |
| Tested at SHA | d82691ae |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — an admin page that places each enclosure (and each zone on the overview) on a plan by drawing a rectangle or polygon, so nobody types a coordinate
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/admin/facility-map/` (page, actions, `MapEditor`), `src/app/enclosures/map/PanZoom.tsx` (one prop), `src/lib/facility-map/geometry.ts`, `src/lib/permissions/routes.ts`, `src/components/hub-icons.ts`, `src/app/admin/page.tsx`, i18n dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, acceptance-matrix entries; deleted `src/app/enclosures/map-prototype/` and `public/prototype/`; no `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin opens the page and writes; everyone else is refused (volunteer proved by script), signed out is sent to login; the Map on Enclosures that shows the result is unchanged for its roles
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — uploading plan images (they stay committed files, decided in `docs/decisions/2026-10-05-facility-map-editor.md`); moving a whole shape; non-enclosure shapes; whether rooms belong on the map (the Director's answer)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (`unreleased`), resolved by keeping both lines
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 44s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the schema is 0142
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev rows) — n/a: no migration; the editor page rendered for an admin against real dev rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the existing constraints were exercised by `scripts/check-facility-map-editor.mjs` (two points and an off-plan point refused, 23514; a second plan for a zone refused, 23505)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser. The sign-in needed for the pane was not available to Claude, so drawing, dragging a corner and the round trip to the Map were not exercised on screen; the data path under them was (script, below), and the whole drive is item 1 of the manual list
- [x] Data persists — reload the page and the change is still there — by script: a shape written as the admin's own login reads back through `parseShape` unchanged, the unplaced list shrinks by one, and a plan removed keeps its shapes
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: exercised at the database level by script (place, clear, add plan, remove plan), not through the UI
- [ ] Empty state renders sensibly (no rows yet) — n/a: not seen on screen; the page's no-plan sentence and the Add a plan section opening by default are code paths only
- [x] Invalid input is rejected with a readable message, not a crash — `saveShape` re-parses with `parseShape` and rejects a shape under the minimum area with a sentence; `addPlan` refuses a non-file name and turns a duplicate plan into a sentence; the database refuses malformed shapes regardless (script)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the maths: a click off the plan is clamped, a collinear scribble and a slip of the finger are under the minimum area, a 2% square is accepted (10 assertions, script)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/facility-map` | the editor | 200, title and the new on-site zone present |
| management | same | not exercised — the page asks `facility.enclosures` at edit, which is the same cell as Zones and Enclosures beside it | not run |
| staff | same | refused | not run (same activity as the volunteer case) |
| vet | same | refused | not run |
| volunteer | same | refused | 200 with no editor markup (the in-app no-access page); a volunteer's write to `map_shape` changes nothing and a plan insert is refused by RLS |
| signed out | same | login | 307 to `/login?next=%2Fadmin%2Ffacility-map` |

- [ ] Every role above tested — n/a: admin, volunteer and signed out were; management, staff and vet were not, because they ask the one activity the volunteer case already proves them refused or allowed by
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — volunteer and signed out above; RLS is the second wall (a volunteer's write updates 0 rows)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; a tile on the Settings landing page and a route registry entry (`menu: false`), like Zones and Enclosures
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — topic "Placing enclosures on the facility map" added with two acceptance-matrix rows (lint was red until they existed); `/manual` itself was not opened; the manual has no Thai file
- [x] Translatable strings go through the translation path, checked at `/management/translations` — the strings are in both dictionaries (`admin.facilityMap`, `nav.facilityMap`, the landing tile); the translations page was not opened and the Thai wording was written by Claude and is item 3 below
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven. The page sits behind `LargerScreenNotice`; the buttons are 44 px by class, which is not the same as seen
- [ ] Browser console clean — no errors or React warnings — n/a: no browser session
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no browser session; the server rendered the page 200 to the script

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `check-home-screens.mjs`, `check-permission-catalogue.mjs` and `acceptance-matrix.mjs --check` pass; the build compiles every route; `/enclosures?view=map` itself was not re-opened
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `PanZoom` gained a prop defaulting to the old behaviour; `hub-icons.ts` one key; `routes.ts` lost the prototype's entry, and the home-tile check (volunteer's home is Residents and Enclosures) still passes
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ended 0/0/0 after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — ticked, as step 3 is the last step; the status note says the on-screen drive and the Director's rooms question are still open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-05-facility-map-editor.md` (storage, rooms, desktop-first, per-screen table)
- [x] `README.md` still accurate — no setup or command changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for the editor, written for an admin
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 26 script assertions ran; the decision file's statements about the editor's behaviour (corner dots, auto-advance, Escape and Backspace) are from the code and have **not** been seen working

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no dates
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the one threshold (minimum shape area) is asserted on both sides
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates block, as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the editor writes 0142's columns, so the release manager confirms 0142 is live in production before this ships
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, to confirm 0142 is applied
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the Pi rebuild `./scripts/pi/deploy-pi.sh --ref <sha>`; additive code, no migration; shapes an admin draws in production are data and are not undone by a rollback (the Map keeps showing them)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | The editor's drawing, corner dragging, auto-advance and the round trip to the Map were never seen working on screen: the browser pane could not be signed in (the shared test password is refused to Claude, and the disposable admin's password could not be read back), and the dev server had stopped by the time the merge was asked for | accepted: the PR was merged on Lutan's instruction with this stated; first item below |
| 2 | Low | A re-shot plan with a different aspect ratio leaves old shapes in the wrong place, undetected | deferred (named in the decision file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The whole editor, which has not been seen working:** add or pick a plan, draw a rectangle for several enclosures in a zone, draw one polygon, drag a corner, Draw again, take one off; reload and confirm they stay; then open Enclosures → Map and confirm the shapes are there and "Not on this plan yet" is shorter. Watch that a click puts the point where the cursor is at 1× and when zoomed and panned (the conversion uses the SVG's own matrix and was never run) | Computer, `/admin/facility-map` then `/enclosures?view=map`, signed in as an admin |
| 2 | Can an admin place twenty enclosures without swearing: is the rectangle tool quick enough, are the corner dots easy to grab, is moving a whole shape missed | Computer |
| 3 | The Thai wording and the English wording of the page read correctly | `/admin/facility-map`, both languages |
| 4 | Behind "Show anyway" on a phone: nothing breaks, a drag pans and a tap places a point | Phone, 375 px |
| 5 | Ask the Director whether the medical room, kitchen and storage belong on the map | Director |
| 6 | Delete the disposable admin `dryrun-mapeditor-20261005@example.test` left in dev | Settings → Security |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: Lutan to check items 1 to 6 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass with accepted defects
