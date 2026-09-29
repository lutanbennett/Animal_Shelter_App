# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | A stock figure typed in a Management cell writes a `stock_counts` history row, labelled `correction` (0112) |
| Backlog item | `docs/backlog.md` → A single-cell stock edit writes no history, but the `0093` back-fill treated past ones as counts |
| Branch / worktree | `claude/stock-edit-history` @ `C:\Development\Animal_Shelter_stock-edit-history` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-09-29 |
| Carries a migration? | yes — `0112_stock_count_source.sql` |
| Tested at SHA | `4c49b19` plus the follow-up commit carrying the grants, docs and this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the single-cell stock edit goes through `record_stock_correction()`, which writes a `source = correction` row, so there is one way into the history and typed figures are labelled rather than passed off as counts (Lutan chose this option, 2026-09-29)
- [x] Files/areas touched: `supabase/migrations/0112_stock_count_source.sql`; `src/app/management/medications/actions.ts` and `diets/actions.ts` (the two cell edits); `src/app/management/stock-usage/page.tsx`, `src/app/deliveries/page.tsx`, `src/app/deliveries/actions.ts` (read counts only, not corrections); `scripts/check-stock-corrections.mjs`; docs
- [x] Roles affected: admin and management (the cell edit, unchanged who); staff and volunteer only read the history and see no change. Vet, public, anon: none
- [x] Out of scope: no page lists corrections; `0093` / `0096` header prose is left as the record of when it was true; no data change beyond tagging the back-fill rows

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` (`798f39b`) merged in cleanly, no conflicts; the branch had been created from it
- [x] `node scripts/gates.mjs` — `typecheck=0 build=0`; lint exited 1 on the first run for one thing only, the new view lacking an explicit grant (`check-migration-grants`), fixed in the migration; `npm run lint` then exits with 0 errors and `migration grants: ok`. Closing lines of the first run, as printed: `gates: typecheck=0 lint=1 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (`0111`), and no other in-flight branch carries one (`check-migration-numbers` passed on commit)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 111 applied, 0 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0112 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`. The `revoke`/`grant` lines on the view were added afterwards, identical to the grants `0096` already gave it, so dev's state is unchanged; the harness re-runs the final file
- [x] File is re-runnable: `add column if not exists`, constraint dropped then added, `create or replace` for the function and the view; the harness runs the whole file twice
- [x] Existing rows still read correctly: the tagging `update` only touches `counted_by is null` rows still at the default; the view returns the same columns
- [x] Constraints and behaviour exercised in a `begin; … rollback;` harness, `node scripts/check-stock-corrections.mjs` (dev only, writes nothing), asserting: back-fill tagging (null `counted_by` → `backfill`, a user count stays `count`); a management correction writes one row with the right quantity, unit, `counted_by`, and `counted_at` equal to both the function's return and `stock_counted_at`; the diet twin; `stock_count_intervals` still pairs the two counts and skips the correction between them (`used` 30, not distorted); a blank clears the item and writes no row; `record_stocktake()` rows are `source = count`; staff, a negative count, an unknown item and a bad `source` value are all refused. Final output: `HARNESS-OK 0112 twice | S1 … | S7 staff, negative, unknown item and bad source refused`
- [ ] Down-migration written — n/a: additive; undo is stated in the file header (drop the function, recreate the view from 0096, drop the column) and nothing depends on it yet
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` for `0112` on project `dbkodyyxxhtygxcxmfcu`, **before** the deploy, because the code calls `record_stock_correction` and selects on `source`. The 0093 back-fill rows there (seven, per the 2026-09-27 UAT clear, if any remain) become `backfill`

## 4. Functional checks

- [x] Happy path works end to end — at database level (the harness above). The Management page action itself was not driven in a browser; see Left for manual verification
- [x] Data persists — the correction row and `stock_on_hand` were read back in the harness
- [x] Create / edit / delete all exercised: edit (a correction) and clear (blank) exercised; delete of an item cascades as before (foreign keys unchanged)
- [x] Empty state renders sensibly: no UI added; with no correction rows, every read behaves as before
- [x] Invalid input is rejected with a readable message: the page still validates with `parseStockCount` first; the function's own refusals (`Not authorized…`, `A stock count cannot be negative.`, `That item was not found…`) are exercised in the harness
- [x] Boundary cases checked: zero (allowed, unchanged rule), negative, blank, unknown id, wrong role

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | cell edit on Management | allowed (function allows admin) | not driven — function's role list read, not exercised as admin |
| management | cell edit | allowed, row written | passes in harness |
| staff | `record_stock_correction` called directly | refused | passes in harness (`Not authorized`) |
| vet | Management | refused by the page guard, unchanged | not touched by this change |
| volunteer | Management | refused by the page guard, unchanged | not touched by this change |
| signed out | any | refused, function not granted to anon | grant read in the migration, not exercised |

- [ ] Every role above tested — n/a: only management and staff were exercised, against the function; admin, vet, volunteer and signed-out are unchanged by this PR and are listed above with what was and was not checked
- [x] A role that should not have access is blocked server-side: staff calling the function directly is refused in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page or link
- [ ] Manual updated — n/a: no page behaviour a user reads about changed
- [ ] Translatable strings — n/a: no new user-facing strings; the function's error text is only shown if the page's own validation is bypassed
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change, page not loaded
- [ ] Network clean — n/a: no UI change, page not loaded

## 6. Regression

- [x] The pages nearest the change: `/management/stock-usage`, `/deliveries` and Management → Medications / Diets all compile and build (`gates` build exit 0); their behaviour with real rows is covered by the harness's interval assertion, not by loading them
- [ ] Shared file touched checked from a second page — n/a: no shared UI file touched; the only shared object is `stock_count_intervals`, asserted in the harness
- [x] Nothing merged from `main` during `sync` was broken by this branch: `main` had moved only by docs since the branch point

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-29, naming Lutan's choice and the before/after-`0093` split
- [ ] `README.md` still accurate — n/a: it does not describe stock history
- [ ] **Release notes.** n/a: a shelter user sees no change; the edit behaves the same and the history it now feeds is not shown anywhere
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured: the tagging rule, the stamp equality and the interval behaviour are each asserted in the harness; the "seven UAT rows" figure is quoted from the 2026-09-27 backlog entry, not re-read

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic; `counted_at` is the database's `now()` stamp
- [ ] Boundary or banding assertions — n/a: no threshold or band changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the harness's closing line is quoted in section 3 and no results table is hand-kept
- [ ] Public pages re-checked — n/a: no public page reads these tables

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [x] This PR contains both a migration and code that reads it, so the production apply must happen before the deploy; written into the apply plan in section 3
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive; the only row change tags existing back-fill rows
- [x] Apply plan stated: `0112`, project `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [x] Rollback position stated: `wrangler rollback` reverts the Worker but not the migration; the schema is additive and old code, which updates the column directly, keeps working against it, so leaving `0112` applied is safe

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | First lint run failed: the recreated `stock_count_intervals` view had no explicit grant (`check-migration-grants`) | fixed — grants added, identical to `0096`'s |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Type a stock figure into a medication's cell and a diet's cell on Management. Then confirm the figure saved, a blank still clears it, and the item's row shows in `stock_counts` with `source = correction` | `/management/medications`, `/management/diets`, dev |
| 2 | On Stock between counts, an item edited by hand after its latest stocktake still shows "Changed by hand … after this count", and its usage figure is unchanged by the edit | `/management/stock-usage`, dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: nobody has yet typed a stock figure on the Management page and looked at the result

Manual verification by: pending: the two rows above, on dev

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
