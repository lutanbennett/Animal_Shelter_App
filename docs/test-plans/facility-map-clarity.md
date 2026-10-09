# Feature test plan — facility-map-clarity

## Header

| | |
|---|---|
| Feature | Facility map: small markers only on a zone plan; a tapped enclosure shows its details below the plan |
| Backlog item | `docs/backlog.md` → "Facility map: drop the count chip and the room names…" and "Facility map: tapping an enclosure shows its details straight away…" |
| Branch / worktree | `claude/facility-map-clarity` @ `C:\Development\Animal_Shelter_facility-map-clarity` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `d443930d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — on a zone plan an enclosure shows only small medication / diet / maintenance icons (no count chip, no room names), and tapping it shows its residents, notes and maintenance under the plan without leaving the map
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/enclosures/map/FacilityMap.tsx`, new `src/app/enclosures/map/actions.ts`, `src/app/enclosures/[id]/EnclosureHub.tsx` (split into exported pieces) and `page.tsx`, new `src/lib/enclosures/details.ts`, `src/lib/facility-map/geometry.ts` (`markerBoxes`, `insideShape`), both dictionaries, `src/lib/manual/en.ts` (map and enclosure-page topics only), `src/lib/releases.ts`, two new scripts. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — everyone with `facility.map` (admin, management, staff, volunteer); the panel is gated on `facility.enclosures` read, the enclosure page's own gate
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the overview plan and its zone names are unchanged (Lutan: "a zone plan such as Main Zone, and nothing else for now"); room descriptions and adding rooms are the separate "Map rooms" item (needs schema)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck exited 0 after 16s
=== gates: lint exited 0 after 68s
=== gates: build exited 0 after 42s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — all seven checks passed on #494 at `bd6d77c3`, read from the PR status 2026-10-09

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

- [x] Happy path works end to end — in the browser pane as an admin on dev: Main Zone shows no chips, every circled number on the drawing readable, a spanner small in 6's corner and a diet icon in 1's; tap 6 → card with 0/5, 1 open job, no residents; tap 1 → card switches, "Loading who is here…", then the resident with photo, code and Renal diet, notes, maintenance, Open full page; ✕ closes it and the URL never left `/enclosures?view=map`
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written; the panel only reads
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete in this feature
- [x] Empty state renders sensibly (no rows yet) — enclosure 6 with no residents shows "No residents are in this enclosure right now." and "No notes recorded"; an enclosure with no markers draws no icons
- [x] Invalid input is rejected with a readable message, not a crash — `check-map-details.mjs`: an enclosure id that does not exist returns `ok:false` with the "no longer exists" message; signed out returns no details
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — `check-map-markers.mjs` places one, two and three markers in every enclosure on both dev zone plans (84 markers) and asserts each halo is inside its own outline, reaches no other enclosure or room, does not overlap another marker and keeps clear of the middle; a long resident name truncates in the card at 375 px

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | map, panel action, enclosure page | details | browser pane (Lutan's admin) and script: residents, notes, maintenance returned |
| management | map, panel action | details | not run separately; same `facility.enclosures` gate and loader as the page |
| staff | map, panel action | details | not run separately; same gate and loader as the page |
| vet | no `facility.map` | no map | not run; map gate unchanged by this PR |
| volunteer | map, panel action | who and where only | script: action returns the enclosure's residents through `resident_who_and_where`; enclosure page lists the same |
| signed out | nothing | refused | script: action returns no details |

- [ ] Every role above tested — n/a: admin, volunteer and signed out were driven; management, staff and vet reach the panel through the enclosure page's own unchanged gate and loader, so they are listed under Left for manual verification rather than claimed
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the action checks `facility.enclosures` read itself and signed-out calls return no details (`check-map-details.mjs`)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the map topic's chip, Open enclosure and room-name lines rewritten, and the enclosure-page topic mentions On medication; read in the diff, the page itself not loaded
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no staff-typed prose added; new UI strings are in both dictionaries
- [x] Mobile viewport (375px) — no overflow, controls reachable — at 375 × 812 the page is 375 wide, the tap scrolls the card into view, ✕ and Open full page are 44 px
- [x] Browser console clean — no errors or React warnings — no console errors on the map through the taps, nor on Settings → Facility map
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — action calls return 200 in the script; the plan image loads

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/enclosures/<id>` for admin and volunteer (script: 200, same residents as the panel); Settings → Facility map loads with no console errors; the map's overview and Cat Zone buttons work
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `geometry.ts` is shared with the map editor: `/admin/facility-map` loaded; `EnclosureHub.tsx` from `/enclosures/<id>` (script)
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought only the 0.23.0 release record files; gates rerun after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — both items; the "Map rooms" item stays open (it needs schema; nothing of it is closed here)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-10-09-facility-map-markers-and-details.md`
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — "every marker draws at 2.6" and "no marker leaves its enclosure" are the output of `check-map-markers.mjs` on dev; "centred icons sat on the numbers" was seen in the browser pane before the corner change

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the only date is the prescription "current today" rule, unchanged and reused from the map page
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or banding changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — redeploy the previous SHA on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`); no schema, so nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | Centred markers covered the drawing's circled enclosure numbers (spanner over 6, diet icon over 1) | fixed: markers moved to the top-left corner; `check-map-markers.mjs` now fails a marker over the middle |
| 2 | minor | At 375 px the zoom buttons sit over enclosure 1, so a tap there hits a button; it existed before this PR | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the icons are big enough to read at a glance on a real phone, and the drawing now reads clearly | Main Zone on Lutan's phone, pinch in and out |
| 2 | A staff or management login sees the same panel; a volunteer's panel reads right | Map → Main Zone → tap an occupied enclosure |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see the signature line

Manual verification by: pending: icon legibility on a real phone and a staff/management view of the panel

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 2 is deferred to the backlog, pre-existing
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
