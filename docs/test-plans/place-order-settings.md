# Feature test plan

## Header

| | |
|---|---|
| Feature | Zones and enclosures in the shelter's own order: Move up / Move down and Sort A-Z on Settings → Zones and Settings → Enclosures, and that order used on every list of zones or enclosures (screen half; schema was `0161`, PR #447) |
| Backlog item | `docs/backlog.md` → *Put zones and enclosures in the shelter's own order, set in Settings* (ticked in this PR) |
| Branch / worktree | `claude/place-order-settings` @ `C:\Development\Animal_Shelter_place-order-settings` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude (place-order-settings session), 2026-10-08 |
| Carries a migration? | no (reads `0161`, already on `main` and applied to dev) |
| Tested at SHA | `d4a617e4` (after `sync`, origin/main merged at `43521cd7`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the Director sets the order of zones, and of enclosures within a zone, with up/down arrows and a Sort A-Z button in Settings, and every screen that lists zones or enclosures shows them in that order instead of A-Z
- [x] Files/areas touched: `src/lib/enclosures/order.ts` (new shared helper), `src/lib/enclosures/options.ts` (every zone → enclosure picker and the maintenance filters), `src/app/admin/zones/*`, `src/app/admin/enclosures/*`, `src/app/enclosures/page.tsx`, `src/app/enclosures/map/FacilityMap.tsx`, `src/app/admin/facility-map/page.tsx`, `src/app/immunizations/new/page.tsx`, `src/lib/residents/list-view.ts`, `src/lib/medical/residents.ts`, `src/lib/medication-list/load.ts`, `src/lib/diets/special-list.ts`, `src/components/hub-icons.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-place-order-roles.mjs` (new). No `worker/`, no migration
- [x] Roles affected: admin (and whoever else holds `facility.enclosures` write — the Director) sets the order; every role that reads zones and enclosures sees it
- [x] Out of scope: the stocktake order (`medication.sort_order` / `diet_types.sort_order`, batch 73), the zone colour dot (its own item), anything under `/admin/medications` or `/admin/diets`. An enclosure's own page lists one enclosure's residents by name and Purchasing does not group by place, so neither changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (0.21.0 had been cut, emptying `unreleased`), resolved to this PR's one line
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 468s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; reads `0161`, merged in #447 and applied to dev
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a rollback harness — n/a: no migration; 0161's Lifecycle refusal was exercised against dev by `scripts/check-place-order-roles.mjs` instead (section 4)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; `0161` must be live in production before this deploys, which is the release manager's usual `--status --env production` check

## 4. Functional checks

- [x] Happy path, in the browser pane at 375 px as a throwaway admin: on Settings → Zones, Move up on *Main Zone - Blue* put it above *Left Zone*; /enclosures' zone groups and the residents list's enclosure filter then followed that order. On Settings → Enclosures, Move up on *Front Zone 10* put it above *Front Zone 9* within Front Zone, and no other zone changed
- [x] Data persists — each move was read back from the reloaded page, and /enclosures (a separate request) showed it
- [x] Create exercised: a new enclosure *Front Zone 0 order test* added to Front Zone went last (13th), though its name sorts first. Sort A-Z on that zone then put it first and 9 before 10. Sort A-Z on the zones put dev's zone order back. Edit and delete are unchanged code paths
- [x] Empty state: a zone with no enclosures is left out of the grouped table, and the Sort button is disabled for a list of fewer than two
- [x] Invalid input: a move for a Lifecycle row is refused by the action before writing (`lifecycleRefused`), and by the database (`check-place-order-roles.mjs`: "The Lifecycle zone keeps its fixed place and takes no order"); the first/last row's arrows are disabled
- [x] Boundary cases: first and last rows (Up disabled on the first, Down on the last); a zone with one enclosure; numbers read as numbers (2 before 10) in Sort A-Z, the pickers and /enclosures' Name sort

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Zones / Enclosures, every list | sets the order; lists follow it | as expected (browser pane, throwaway admin) |
| management | the lists | reads the order; no Settings pages | not driven: same `facility.enclosures` read as staff, no code here branches on it |
| staff | /enclosures, pickers | sees the order; Settings refused; database refuses an order write | as expected (`check-place-order-roles.mjs`) |
| vet | /enclosures, /residents | pages load; order shown if the tables are readable | as expected: pages load, and the vet read all 18 zones on dev, so sees the order |
| volunteer | /enclosures, medical pickers via `resident_who_and_where` | sees the order | not driven: reads the same tables as staff |
| signed out | nothing new | public enclosure page is one enclosure, unchanged | unchanged code |

- [ ] Every role above tested — n/a: admin, staff and vet driven; management and volunteer read the same `zones` / `enclosures` select policy as staff and no code in this change branches on role
- [x] A role that should not have access is blocked server-side: staff are turned away from `/admin/zones` and `/admin/enclosures` fetched directly, and their `update enclosures set sort_order` writes 0 rows with the order unchanged (`check-place-order-roles.mjs`, run 2026-10-08, "all held")

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated: the *Zones and enclosures* topic (four new steps and the Lifecycle note) and *Browsing by zone and enclosure* (what the Zone and Name sorts now mean)
- [ ] Translatable strings through `/management/translations` — n/a: no free text; the new labels are in both dictionaries (`t.admin.placeOrder`, English and Thai)
- [x] Mobile viewport (375 px): both Settings pages driven at 375 px; the row buttons are the 44 px `RowActionButton`, laid out two by two below `md`, and the table scrolls sideways inside its own box as it did before (the pages sit behind *Best on a larger screen*). `MSYS_NO_PATHCONV=1 node scripts/check-phone-width.mjs --roles=admin,staff --locales=en,th --pages=/admin/zones,/admin/enclosures,/enclosures,/residents` printed: "12 page view(s) measured (admin, staff; en + th), 4 skipped because the role cannot open them, 0 warning(s). 677 component action(s) measured for tap size. No page scrolls sideways. No text box, select or textarea is under 16 px (iPhone zoom on tap). Every component action is at least 44 px." (The two Settings pages show their larger-screen notice at 375 px until *Show anyway* is pressed, so the arrows' size rests on `RowActionButton` and the browser pass, where they rendered 44 px.)
- [x] Browser console clean — `read_console_messages` with errors only: "No console logs" after the Settings and /enclosures passes
- [x] Network clean — the pane's request log for the session (335 requests) showed the moves' POSTs and page loads at 200, and the one aborted request was the RSC refresh a server action cancels; no 4xx/5xx

## 6. Regression

- [x] Nearest pages checked by loading them: /enclosures (Hospital, Unassigned and Fostered cards still first, zone chips and groups in order), /residents (enclosure filter), a resident's Move form (zone select in order), Settings → Enclosures' Add form (zone select in order)
- [x] Shared files: `src/lib/manual/en.ts` and `src/lib/enclosures/options.ts` checked from other pages by loading them — the Move form (options.ts) and /residents
- [x] Nothing merged from `main` during `sync` was broken: gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with what closed it; searched the other open items for the files and features changed, and none other is closed by this (the zone colour and stocktake order items stay open by design)
- [x] Design choices in `docs/decisions/2026-10-08-place-order-screens.md`
- [x] `README.md` still accurate — it does not describe list ordering
- [x] **Release notes.** One line in `unreleased` in `src/lib/releases.ts`, written for a shelter user
- [x] Commit messages say why, not just what
- [x] Claims measured: the vet claim from `0161`'s header ("the vet cannot read the tables") was tested and found wrong on dev, and the comment and decision record were corrected to the measurement

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager at deploy time
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary assertions cover both edges — n/a: no threshold or band changed
- [ ] Evidence pasted is the tool's actual output — deferred: release manager at deploy time
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager at deploy time
- [ ] `strip-baked-env` seen — deferred: release manager at deploy time
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration in this PR; the code reads `0161`, which must be applied to production first
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR, or roll the Pi back with `./scripts/pi/deploy-pi.sh --ref <sha>`. Any order set in the meantime stays in the `sort_order` columns, harmless to the older code, which ignores them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `0161`'s header (and this branch's first comment) said the vet cannot read `zones` / `enclosures`; on dev the vet reads all 18 zones | fixed: comment and decision record corrected; no behaviour depends on it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone, move a zone and an enclosure with the arrows and check it feels right (the Settings table is wide and scrolls sideways on a phone) | Settings → Zones and Settings → Enclosures, on a phone, as the Director or an admin |
| 2 | Read the Thai wording of the new buttons and notes | the same pages with ไทย selected |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (place-order-settings session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items wait for Lutan

Manual verification by: pending: items 1 and 2 above need Lutan to look on a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — it is handed over when the next release is cut

Result: pass

Release manager acknowledgement: pending
