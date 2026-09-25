# Feature test plan

## Header

| | |
|---|---|
| Feature | On-site / Off-site cascade on `/residents`, shared with `/enclosures` |
| Backlog item | `docs/backlog.md` → Facility → **Give `/residents` the same On-site / Off-site cascade as `/enclosures`.** |
| Branch / worktree | `claude/residents-place-cascade` @ `C:\Development\Animal_Shelter_residents-place-cascade` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3016` |
| PR | not yet opened at this commit |
| Tested by / date | Claude, 2026-09-25 (browser pane signed in by Lutan as admin) |
| Carries a migration? | no |
| Tested at SHA | `ccf49bd` (code + sync; this file is the commit after it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `/residents` gets Everywhere / On-site / Off-site (`?place=`) above multi-select zone chips (`?zone=<id>,<id>`), through the same component and `place.ts` helpers as `/enclosures`, with residents placed by status (Unassigned on site; Hospital, Fostered and Outreach off it; Adopted and Deceased only under Everywhere)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/residents/page.tsx`, `src/app/residents/ResidentsTable.tsx`, `src/app/enclosures/page.tsx` and `EnclosureFilters.tsx` (moved onto the shared pieces, no behaviour change intended), new `src/components/PlaceZoneChips.tsx`, `src/lib/enclosures/place.ts` (`offeredZones`, `zonesKeptIn`), new `src/lib/residents/place.ts`, `src/lib/i18n/dictionaries/en.ts` + `th.ts` (Location header relabelled; the unused `residents.list.zone` / `allZones` removed), `src/lib/manual/en.ts` (Finding a resident topic), `src/lib/releases.ts`, `docs/`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every signed-in role that can open `/residents` sees the new control. It reads `zones`, `enclosures` and `resident_list_view`, which the page already read for every role, and has no role branch. Signed-out users never reach it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — no schema change; the resident hub's own Internal / External line (`ResidentHub.tsx`, reads `zone_internal`) is untouched; `/manual` screenshots not regenerated (full rerun planned after this batch); Adopted is deliberately in neither place (`docs/decisions.md`, 2026-09-25)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merge `ccf49bd`: PR #128's two migrations, `check-app-access-gate.mjs`, `check-migration-grants.mjs`, docs; no `src/` changes)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed, from the run after the sync:

```
=== gates: build exited 0 after 293s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the page reads the same view as before, with `current_status in (…)` added
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

Driven in the in-app browser against `next dev` on :3016 (dev database), signed in as admin. Dev had nobody off site, so four residents were placed through `placement_history` inserts shaped like the app's own actions (note "residents-place-cascade verification", left in place: dev test data is disposable): R-0080 Capwarn OK 0924 → Hospital, R-0079 Capwarn Test 0924 → Fostered (carer Lutan Bennett), R-0077 Wizard Test 23 Sep → Adopted, R-0076 Ong Ngern → Orchard 1. After that, dev had 42 Resident, 29 Unassigned, 1 each Hospitalised / Fostered / Outreach / Adopted, and 6 Deceased. Each URL's server-rendered page was read for the heading line, the place control and chips (`aria-current`), rows and their Status / Location cells, hidden inputs and links.

- [x] Happy path works end to end — `/residents`: "75 residents · 6 deceased hidden", Everywhere active, 17 chips (16 zones + Lifecycle), Location column On-site 71 / Off-site 3 / — 1 (the adopted one). `?place=internal`: "71 residents", 13 chips, exactly the 42 Resident + 29 Unassigned, all reading On-site. `?place=external`: "3 residents", 4 chips (All zones, Offsite, Orchard, Village), exactly the Hospitalised, Fostered and Outreach residents, all reading Off-site. Clicking Off-site from `?place=internal&zone=<Cat>,<Green>` navigated to `?place=external`, with Off-site and All zones active and 3 rows
- [x] Data persists — reload the page and the change is still there — every state is a GET URL; loading each URL directly gave the results above
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a read-only filter; it creates, edits and deletes nothing
- [x] Empty state renders sensibly (no rows yet) — `?place=internal&q=B2` (a deceased name) renders 0 rows with "No residents match these filters." and the deceased-match line below
- [x] Invalid input is rejected with a readable message, not a crash — `?place=external&zone=<Cat Zone>,<Orchard>` keeps only Orchard (1 row, hidden input `zone=<Orchard>`); `?place=internal&zone=<Lifecycle>&all=1` drops both the Lifecycle zone and `all` (71 rows, as plain On-site); `?place=external&enclosure=<Cat Enclosure>` drops the enclosure (3 rows)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — **place switch drops stale zones**: from `?place=internal&zone=<Cat>,<Green>` (5 rows, both chips active), the Off-site link is `/residents?place=external` and Everywhere keeps both zones; chip links add or remove only themselves. **Show all**: `?all=1` → "81 residents · including 6 deceased", Hide deceased link, and both place links drop `all=1`; under On-site / Off-site the toggle is not rendered. **Deceased search under a place**: `?place=internal&q=B2` → "0 residents · 1 deceased resident matches — show", linking to `/residents?q=B2&all=1`. **Lifecycle chip under Everywhere**: 32 rows (29 Unassigned, Hospitalised, Fostered, Adopted). **Enclosure select**: 69 options under Everywhere, 59 On-site, 5 Off-site, 1 for Cat Zone + Green; `?place=internal&zone=<Cat>&enclosure=<Cat Enclosure>` keeps it (5 rows)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/residents` | place control, chips, filters as above | **pass** — driven in the browser on dev |
| management | `/residents` | same as admin | not signed in as; the control reads only the rows the page already fetched for this role, and there is no role branch |
| staff | `/residents` | same as admin | not signed in as; same reason |
| vet | `/residents` | same as admin | not signed in as; `vet_read_zones` (0001) lets vets read `zones`, no role branch |
| volunteer | `/residents` | same as admin | not signed in as; `volunteer_read_zones` (0001) |
| signed out | nothing | sent to sign-in, as before | unchanged by this PR |

- [ ] Every role above tested — n/a: only admin was signed in; the change adds no role branch and reads no table the page did not already read for every role, so per-role sign-ins would exercise nothing this PR altered
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access is granted or withdrawn

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `/manual` loaded; `#residents-list` contains the new On-site / Off-site, chips and Show-all steps; the Enclosures topic's "statuses rather than places" line is unchanged
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the one changed string (the Location header) is a static UI label in the en/th dictionaries, not user content. The Thai rendering was not looked at (Left for manual verification 2)
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/residents?place=internal` at 375×812: page `scrollWidth` 375 (no sideways scroll), the chip strip scrolls inside itself (1355 in 375), the Enclosure select is hidden as intended, and the place control and search are reachable
- [x] Browser console clean — no errors or React warnings — the only errors are from before the checks, when Lutan's sign-in raced the first `/residents` compile ("Failed to find Server Action", a stale form after a recompile — Defect 1); none from the runs above
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — every `/residents` and `/enclosures` variant above and `/manual` returned 200 (dev server log)

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/enclosures?place=internal&zone=<Cat>,<Green>` rendered On-site + both chips active with the Cat Zone heading; its Off-site link was `/enclosures?place=external`, and clicking it showed Offsite, Orchard and Village with Off-site and All zones active, as before the refactor
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `place.ts` and `PlaceZoneChips` via `/enclosures` (above); `manual/en.ts` via `/manual`; the dictionaries via `/enclosures` and `/manual`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge touched no `src/` file; the gates above ran after it, and `/residents` was loaded after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — where Lifecycle residents land, Show all under Everywhere, the search exception, filtering on `current_status`, chips on phones
- [x] `README.md` still accurate — it does not describe the residents filters
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: the Residents list's On-site / Off-site choice and zone chips, where Unassigned, hospital and foster residents land, and the Location column
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the 29 Unassigned figure and the status mix were counted on dev; the place counts, stale drops, Show-all and search behaviour were observed in the browser (section 4). That `current_status` follows `zones.internal` was read from 0066, and confirmed on dev by the Orchard move reading `Outreach`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: not a boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates block, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: code only; `npx wrangler rollback --env production` reverts it completely

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low (dev only) | Signing in on :3016 appeared not to work: the first sign-in succeeded (`POST /login` 303), but the redirect to `/residents` was aborted mid-compile (`ECONNRESET`) while the pane was being reloaded, and later presses submitted a sign-in form from before a recompile, which the server rejected as `Failed to find Server Action`. A `next dev` artefact on a machine running several streams and a build at once; not app code, and unrelated to this change | accepted — a fresh page load after the compile finished was already signed in |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The control reads well and the chips feel the same as on Enclosures — tap On-site, pick two zones, tap Off-site (the zones should clear), tap Everywhere, Show all | `/residents` on :3016 or test.lannacare.org |
| 2 | In ไทย: the place labels and the relabelled Location header ("ภายใน / ภายนอกศูนย์") read correctly | `/residents` with ไทย selected |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are outstanding; see the pending line below

Manual verification by: pending: the look of the control and the Thai labels (Left for manual verification 1–2)

### Result

- [x] Open defects are either fixed or explicitly accepted above — the one defect is a dev-server artefact, accepted
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
