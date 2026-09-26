# Feature test plan

## Header

| | |
|---|---|
| Feature | Record stock deliveries; Stock between counts shows received and used |
| Backlog item | `docs/backlog.md` → "Record stock deliveries, so Stock between counts can state usage" (feature half; schema `0096` was #158) |
| Branch / worktree | `claude/stock-deliveries` @ `C:\Development\Animal_Shelter_stock-deliveries` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | #163 |
| Tested by / date | Claude (stock-deliveries session), 2026-09-27 |
| Carries a migration? | no — reads `0096` (`stock_receipts`, `stock_count_intervals`), already on `main` and applied to dev |
| Tested at SHA | `4a937f8` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: staff and managers record each delivery on a new `/deliveries` page, and Management → Stock between counts shows the deliveries between two counts and **used** (read from `stock_count_intervals`) instead of only how the count changed
- [x] Files/areas touched listed: new `src/app/deliveries/` (page, form, delete button, actions) and `src/lib/management/stock-receipts.ts`; reworked `src/lib/management/stock-usage.ts` and `src/app/management/stock-usage/page.tsx`; a Record a delivery link on `src/app/management/medications/page.tsx`, `.../diets/page.tsx` and `src/app/stocktake/page.tsx`; `src/lib/i18n/dictionaries/en.ts` / `th.ts`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `scripts/check-stock-deliveries.mjs` (new) and `scripts/check-stock-usage.mjs`; docs. No `worker/`, no migration, no `NavLinks.tsx`
- [x] Roles affected identified: admin, management and staff record deliveries (`0096`'s write policy); volunteers keep the Stocktake page but get no delivery link and are redirected from `/deliveries`; Stock between counts stays admin/management; vet and signed-out public untouched
- [x] Out of scope, written down: the CSV download, a difference-as-percentage column and a minimum-quantity floor (carried on the item; split to their own `backlog` item); editing a delivery in place (delete and re-record instead); a nav entry for `/deliveries`; any change to `stock_on_hand` from a delivery

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in the status-alerts schema, `0098`; no overlap)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (an earlier run crashed inside Turbopack — `turbo-tasks … internal panic`, build exit 3221226505 — with the machine out of memory under several sessions' builds; typecheck and lint had passed. Rerun after a restart, dev server stopped):

```
=== gates: typecheck exited 0 after 38s
=== gates: lint exited 0 after 203s
=== gates: build exited 0 after 328s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — #163: `check`, `migration-numbers` and `test-plan` all pass

Also run, both zones, each ending `all ok`:

- `node scripts/check-stock-deliveries.mjs` and `TZ=UTC node scripts/check-stock-deliveries.mjs` — the real `receivedAtFor` against a pinned "now": today with no count → `now()`; a back-dated day with no count → midday Bangkok; a count day with no answer → asks; before → the earliest count's own instant; after → a second past the latest count, or `now()` today; the shelter day not the UTC day (a 01:00 Thai count); future and malformed dates refused; quantity parsing; the packs helper (3 × 0.1 = 0.3); roles
- `node scripts/check-stock-usage.mjs` and `TZ=UTC …` — `receivedBetween` on a consecutive pair, across a skipped same-day recount (adds both intervals, equals from + received − to), a null `used` anywhere → unit change, a chain that doesn't reach → null; every reading state including `unlogged` (a rise bigger than what was recorded) and `unknown` (view not loaded); `standsOut`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR; `0096` was applied with #158
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR; the page was checked against dev's existing counts, which read exactly as before where nothing was delivered (Hepato 80 → 25 = 55 used)
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration in this PR; `scripts/check-stock-receipts.mjs` (#158) is `0096`'s harness
- [ ] Down-migration — n/a: no migration in this PR
- [ ] Production apply plan — n/a: no migration in this PR

## 4. Functional checks

Driven in the browser pane on `localhost:3004` against dev, signed in with the dev test login.

- [x] Happy path works end to end: recorded 10 tablets of AMC 500 on 20 Sep (packs 2 × 5 filled the quantity) — "Recorded 10 tablet(s) of AMC 500.", item cleared, day kept. Stock between counts then read, checked by hand:
  - AMC 500: 2 (12 Sep) + 10 received − 5 (26 Sep) = **7 used** — before the delivery the same row read "At least 3 tablet(s) arrived that wasn't recorded" (2 → 5, nothing recorded)
  - FBC: 60 + 30 − 20 = **70 used**, "Used 56 tablet(s) more than planned" against 14 planned. The 30 was recorded on 26 Sep (a count day) as *before* the count; a second delivery of 5 on the same day marked *after* the count was correctly **left out** of this interval
  - Rows with no deliveries unchanged (Hepato 80 − 25 = 55)
  - The box at the top named the first recorded delivery ("recorded since 20 Sep 2026"); before any were recorded it said none had been
- [x] Data persists — reload the page and the change is still there: the three deliveries listed on reload with time, kind and "recorded by"; Stock between counts figures above were read after navigating away and back
- [x] Create / edit / delete all exercised (whichever the feature has): create ×3; delete of the 5-tablet FBC delivery (confirm, "Deleting…", row gone). No edit by design
- [x] Empty state renders sensibly (no rows yet): "No deliveries recorded yet." before the first save; Stock between counts said "No deliveries have been recorded yet, so every figure here assumes nothing arrived."
- [x] Invalid input is rejected with a readable message, not a crash: the server checks role, item, quantity (> 0), cost (≥ 0) and date (not future, a real date, before/after answered on a count day) and returns the dictionary wording; the logic is pinned by `check-stock-deliveries.mjs`, and the form's `max` date and required radio stop the common cases in the browser
- [x] Boundary cases checked: count day vs not (question appears on 26 Sep for AMC 500, not on 20 Sep); before vs after on the same day (landed in different intervals, above); the 17:00Z shelter-day boundary and future dates in the script; zero and negative quantity refused; optional supplier / cost / note left blank on every browser save

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/deliveries`, Stock between counts, the links | full | the dev test login: recorded, deleted, read the page |
| management | same as admin | full | not signed in as one; `canRecordDelivery` / `canManage` list it (`check-stock-deliveries.mjs` asserts the role list) — left for manual |
| staff | `/deliveries`, the Stocktake link; not Management | record and delete | not signed in as one — left for manual |
| vet | nothing new | redirected from `/deliveries` | not signed in as one; `canRecordDelivery("vet")` false (script); RLS gives vets nothing on `stock_receipts` (`0096` harness) — left for manual |
| volunteer | Stocktake, without the delivery link | redirected from `/deliveries`; action refused | not signed in as one; `canRecordDelivery("volunteer")` false (script); RLS refuses the write (`0096` harness) — left for manual |
| signed out | nothing | `/deliveries` → `/login` | seen: the first visit redirected to `/login?next=%2Fdeliveries` |

- [ ] Every role above tested — n/a: only the dev test login and signed-out were driven; the others are in Left for manual verification
- [x] A role that should not have access is blocked server-side: the page redirects before loading anything and both actions re-check the role; underneath, `0096`'s RLS (asserted by its harness in #158) refuses volunteers, vets and anon. Signed-out `/deliveries` → `/login` seen

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry by design; reached from links on Medications, Diets, Stocktake and Stock between counts (all four checked in the served HTML: `/deliveries`, `/deliveries?tab=diets` on the diet pages)
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: new "Recording a delivery"; "Stock between counts" rewritten around Used; a line on Medications, Diets and Stocktake. Loaded `/manual` — the new text is there and the old "Deliveries aren't recorded in the app" warning is gone
- [x] Translatable strings go through the translation path: every string is in `en.ts` with a `th.ts` twin (typecheck enforces the shape); Stock between counts viewed in Thai with deliveries recorded — heading, box, columns and readings all Thai
- [x] Mobile viewport (375px) — `/deliveries?tab=diets`: `scrollWidth` 375 = `clientWidth`, Food tab preselected, every field reachable
- [x] Browser console clean — no errors across `/deliveries`, Stock between counts and `/manual`
- [x] Network clean — every request on those pages 200, including the server-action POSTs

## 6. Regression

- [x] The pages nearest the change still work: Stock between counts (all six dev rows read), `/deliveries`, and Medications / Diets / Stocktake served with their new link
- [x] Shared files checked from a second page by loading it: `en.ts` / `th.ts` via Stock between counts in both languages and `/manual`; `manual/en.ts` via `/manual`
- [x] Nothing merged from `main` during `sync` was broken by this branch — it brought only `0098_status_alerts.sql`, its harness and plan, none of which this branch touches; gates and both check scripts rerun green after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the CSV / percentage / floor extras went to the `backlog` branch as a new item
- [x] Non-obvious design choices appended to `docs/decisions.md` (2026-09-27), and the 2026-09-26 count-to-count entry marked superseded rather than left disagreeing
- [x] `README.md` still accurate — it lists no pages at this level
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line: staff see a new action and managers see changed figures
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the arithmetic in §4 was read off the page after real saves; the timing rule and both zones were run as scripts; "an unrecorded delivery makes usage read low" is the sign of `used = from + received − to` with `received` understated, shown by AMC 500 reading −3 before its delivery was recorded and 7 after

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan
- [ ] Timezone-sensitive behaviour proved — deferred: release manager (record a delivery on `test.lannacare.org` between 00:00 and 07:00 Thai: Arrived on must default to the Thai date and a same-day count must bring up the before/after question. The logic is `todayIso()`, fixed to Asia/Bangkok, and `check-stock-deliveries.mjs` passes under `TZ=UTC`)
- [x] For a boundary or banding change, both edges covered: `GAP_RATIO` unchanged (25%, the edge case still asserted); the new used-below-zero boundary asserted at −20 and −30 and at +20 (a rise fully covered by deliveries reads as usage, not unlogged); the delivery-instant boundary on both sides of a count and both sides of 17:00Z
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the gates lines; the figures as the page printed them)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration; the code reads `0096`, which must be on production before this deploys — deferred check for the release manager is the line below
- [ ] `--env production --dry-run` run and clean — deferred: release manager (confirm `0096_stock_receipts.sql` is applied on production with `--env production --status` before deploying this)
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR; `0096`'s plan is #158's

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` removes `/deliveries` and returns Stock between counts to count-to-count; `0096` stays (additive), and any deliveries recorded meanwhile stay in `stock_receipts` and are read again on redeploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Two deliveries recorded before and after a same-day stocktake show the same minute in Recent deliveries, so the list can't show which side of the count each fell | deferred to backlog (noted on the Stock between counts extras item) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a **staff** login: Stocktake shows Record a delivery; `/deliveries` records and deletes; `/management/stock-usage` still redirects away | `/stocktake`, `/deliveries` |
| 2 | As a **volunteer** login: Stocktake shows no Record a delivery link, and typing `/deliveries` sends you away | `/stocktake`, `/deliveries` |
| 3 | As a **management** login: the links on Medications / Diets and the whole flow work | `/management/medications`, `/deliveries` |
| 4 | The wording on Stock between counts reads right for the shelter — the box at the top, "Used … less than planned" with its "a delivery arrived that nobody recorded" line, "At least N arrived that wasn't recorded" — in English and Thai | `/management/stock-usage` |
| 5 | Recording a real delivery on a phone, including the "came in packs?" helper and the before/after question on a stocktake day | `/deliveries` on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stock-deliveries session)  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; five items wait for Lutan

Manual verification by: pending: the five items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR (#163 description)
- [ ] Handed to the production release manager — n/a: not yet — handed over once the PR is open

Result: pass

Release manager acknowledgement: pending
