# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Management → Purchasing page, safety-stock forms, shared expected-stock helper |
| Backlog item | `docs/backlog.md` → Management → Purchasing (feature half; item ticked) |
| Branch / worktree | `claude/purchasing-page` @ `C:\Development\Animal_Shelter_purchasing-page` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | linked from the PR itself |
| Tested by / date | Claude (purchasing-page session), 2026-10-02 |
| Carries a migration? | no (0128 shipped the schema) |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence: a Purchasing page recommending what to buy per medicine and food (needed − expected now, never below 0, rounded to packs, working shown), safety-stock fields on the add/edit forms, and one shared `expectedStockNow()` that also fixes days-of-stock ignoring deliveries
- [x] Files/areas touched: `src/lib/management/{stock,purchasing,receipts-server}.ts`, `src/app/management/{purchasing,medications,diets}`, `src/components/{StockCells,PrintButton}.tsx`, manual, both dictionaries, releases, backlog, decision, `scripts/check-purchasing.mjs`
- [x] Roles affected: management and admin (the page and forms use `requireManagementUser` / `hasManagementRole`); nobody else gains access
- [x] Out of scope: a custom-date period (see decision), a Thai manual file (none exists)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 282s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — no migration

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (0128 already applied)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the page reads existing counts, receipts and conversions and rendered against real dev rows (§4)
- [ ] Constraints exercised in a rollback harness — n/a: no migration; 0128's harness is `check-safety-stock.mjs`
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; 0128 must be applied to production before this deploys, since the code selects `safety_stock`

## 4. Functional checks

Driven in the browser pane on `localhost:3009` against dev, signed in by the user (a management login).

- [x] Happy path: `/management/purchasing` renders both sections with the working. FBC counted 20 (6 days ago), used ~6, received 1 → ~15 now; needs 26 over 26 days (7 + 19 lead time); buy 11 (hand-checked: 26 − 15)
- [x] **A worked example with a real kibble item:** "Standard Kibble + Chicken" counted 950 cups 6 days ago, used ~852 since, received 0 → ~98 on the shelf; needs 2414 over 17 days (7 + 10 lead time); buy 2316 (2414 − 98), listed under To buy. Special diets sort before it
- [x] **An item never counted is flagged rather than guessed:** e.g. Amoxiclav, Renal diet read "Never counted — count it before ordering", Buy says "Can't tell — count it first", they are absent from the To buy list, and a banner counts the 5 in use
- [x] **Recommended purchase never negative:** Bravecto (10 on the shelf, nothing due) reads "Nothing to buy"; the script asserts max(0, …) for plenty-on-the-shelf and received-since cases
- [x] Data persists: set FBC's safety stock to 30 on Management → Medications (Edit → Save); after the save the row shows "safety stock 30 tablet(s)", and at `?days=14` FBC reads "33 … + 30 safety stock = 63", buy 48 (63 − 15)
- [x] Days-of-stock now counts deliveries: FBC reads "About 15 days" (20 − 6 + 1 received), which it would not have before the fix
- [x] Create / edit exercised: edit with safety stock exercised in the browser. Creating with a safety stock and the Diets form's safety field: not driven — left for manual
- [x] Empty state: both tables carry an empty row; the shopping list says "Nothing to buy for this period." (code path; not forced in the browser)
- [x] Invalid input is rejected: `parseSafetyStock` refuses negative and non-numeric before the database does (script)
- [x] Boundary cases: null vs 0 vs unit conversion (`2 bags` → 400), exact pack multiples, used-up counts, stale at 21/22 days, lead time on/off — all asserted in `check-purchasing.mjs` (48 cases, all ok)
- [ ] **The CSV grouped by supplier** — n/a: the grouping and `csvField` escaping are asserted by script (`groupBySupplier`: A–Z, no-supplier last; `=SUM` neutralised); no dev delivery carries a supplier, so the page showed one "No usual supplier" group and the download itself was not driven — left for manual

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/purchasing` | full | not signed in as one — left for manual |
| management | `/management/purchasing` | full | signed in as the user's management login; page and edit worked |
| staff | nothing | redirected | `requireManagementUser`, same as every Management page — left for manual |
| vet | nothing | redirected | same — left for manual |
| volunteer | nothing | redirected | same — left for manual |
| signed out | nothing | to `/login?next=…` | observed: the pane redirected to login before the user signed in |

- [x] Roles tested: management (driven) and signed-out (observed); the rest in the table are left for manual
- [x] A role that should not have access is blocked server-side: signed-out redirected to login by the server; the safety-stock write is also gated by `hasManagementRole()` in both actions

## 5. Cross-cutting

- [x] Nav entry correct — the Management landing page has a Purchasing tile (the group has no separate nav list); Medications and Diets link to it
- [x] Manual updated (`src/lib/manual/en.ts`, topic "Purchasing: what to buy") — reading it at `/manual` left for manual
- [x] Translatable strings go through the dictionaries (en and th); `Dictionary` typing makes a missing Thai key a typecheck failure
- [ ] Mobile viewport (375px) — n/a: the page is wrapped in `LargerScreenNotice` like its Management siblings; not driven — left for manual
- [x] Browser console clean — only `ws://localhost:3009/_next/hmr` websocket errors from the dev pane, no app errors or React warnings
- [x] Network clean — pages loaded without 4xx/5xx

## 6. Regression

- [x] Pages nearest the change still work: loaded `/management/medications` (rows, Edit mode, Save) and `/management/purchasing`; `/management/diets` and the Stocktake sheet (also calls `readStock`) typecheck and build but were not loaded — left for manual
- [x] Shared files checked from a second page: `stock.ts` is read by Medications (loaded) and Purchasing (loaded); `StockCells.tsx` by Medications (loaded); `check-stock-reading.mjs` still passes unchanged
- [x] Nothing merged from `main` during `sync` was broken (nothing merged)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Design choices in `docs/decisions/2026-10-02-purchasing-page.md` (lead time, the `stock.ts` receipts bug, safety stock, never-counted, supplier)
- [x] `README.md` still accurate — it mentions no stock or Management pages
- [x] **Release notes.** Ticked: `unreleased` gained a line in this PR, for management and admin, including that days of stock may now read longer
- [x] Commit messages say why
- [x] Claims were measured: the receipts bug was found by reading `readStock` (no receipts term) and confirmed by the FBC figure; the worked figures were hand-checked

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: "days since the count" uses the shelter calendar through the same `todayIso` the existing `readStock` suite already covers under both clocks (`check-stock-reading.mjs`, unchanged and passing); the new code adds no date logic of its own
- [ ] Boundary or banding change covered both sides — n/a: the stale threshold is asserted at 21 days (not stale) and 22 (stale); pack rounding at an exact multiple and just over
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates lines above, pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering

- [ ] PR contains both migration and code reading it — n/a: no migration in this PR; but the code selects `safety_stock`, so 0128 must be on production first. deferred: release manager
- [ ] `--env production --dry-run` — deferred: release manager (0128 only)
- [ ] Production backup — n/a: no migration here
- [ ] Apply plan stated — deferred: release manager: 0128 to production before this deploys

### Rollback

- [ ] Rollback position stated — deferred: release manager; no schema in this PR, a code rollback leaves the nullable column harmlessly in place

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `readStock` ignored deliveries since the count, so days-of-stock ran short (pre-existing) | fixed in this PR (`expectedStockNow`) |
| 2 | low | lint `react-hooks/purity` rejected `Date.now()` passed in render | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Download CSV and Print on a list with a real supplier on a delivery: grouped by supplier, opens cleanly in a spreadsheet, print shows only the list | `/management/purchasing` after recording a delivery with a supplier |
| 2 | An item with a purchase unit rounds up to whole packs and shows "= N in its own unit" | `/management/purchasing`, item with a unit under Units of measure |
| 3 | Add a medication and a diet with a safety stock; edit a diet's safety stock in a purchase unit (2 bags) | Management → Medications / Diets |
| 4 | Diets page and Stocktake sheet still load; days of stock sensible | `/management/diets`, `/stocktake` |
| 5 | Staff, vet, volunteer are redirected away from the page | `/management/purchasing` |
| 6 | Phone width shows the larger-screen notice; Thai wording reads correctly | `/management/purchasing`, EN/ไทย toggle |
| 7 | Manual topic reads correctly | `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (purchasing-page session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not empty; the list above is outstanding

Manual verification by: pending: the seven items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
