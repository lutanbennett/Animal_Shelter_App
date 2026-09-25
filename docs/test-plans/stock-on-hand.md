# Feature test plan

## Header

| | |
|---|---|
| Feature | Stock on hand, days-of-stock and a reorder flag on Management → Medications and → Diets: the feature half of stock on hand |
| Backlog item | `docs/backlog.md` → **Stock on hand and days-of-stock** (ticked on this branch) |
| Branch / worktree | `claude/stock-on-hand` @ `C:\Development\Animal_Shelter_stock-on-hand` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from the commit that adds this plan; number recorded in the follow-up commit |
| Tested by / date | Claude (automated and browser-driven) / 2026-09-25 |
| Carries a migration? | no. It reads `0083_stock_on_hand.sql`, which is merged (#121) and applied to dev |
| Tested at SHA | `32a6275` (after syncing `origin/main`); this plan is the only change on top |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: both management pages now record a stock count in place (a **Count** row action), show how old it is, show days of stock computed from the 30-day forecast rate, and flag **Reorder** when that is within the item's lead time in days, which is edited in place under **Edit**
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/management/medications/{page,MedicationsTable,actions}`, `src/app/management/diets/{page,DietTypesTable,actions}`; new `src/lib/management/stock.ts` (calculation and parsers) and `src/components/StockCells.tsx` (the two cells, shared by both pages); `src/lib/i18n/dictionaries/{en,th}.ts` (`management.stock`); `src/lib/manual/en.ts` (the two topics); `src/lib/releases.ts`; new `scripts/check-stock-reading.mjs`; `docs/backlog.md`, `docs/decisions.md`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. Admin and management, the only roles that reach these two pages (`requireManagementUser`). Both new server actions start with `assertManagementRole()`, the same guard as every other action in those files
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: no stock or lead time on the **add** forms (an item is added, then counted). No stock history: each count replaces the last. No stock on the dashboard or the cashflow page. The manual screenshots `management-medications.png` and `management-diets.png` are now missing the two new columns. That is left for the planned full re-shoot and not done here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: merged the other stream's `0084_is_public_drive_file.sql` schema PR with no conflicts, then pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 404s

  gates: typecheck=0 lint=0 build=0
  ```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; 0083 was applied with #121
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change. Before anything was entered, all 24 dev medications and both diets rendered *Not counted* / *—* (section 4)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR. The trigger behaviour this feature depends on was checked end to end through the UI against dev instead, with the rows read back (section 4). Note for the future: `scripts/check-stock-on-hand.mjs` (0083's harness) asserts that every stock column in dev is null, so it now fails case A by design, since dev holds real counts. It was a check for the day the migration was applied, not a regression suite
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR. **`0083` must be on production before this deploys**, because both pages select the new columns and would fail to load without them

## 4. Functional checks

All on `http://localhost:3002` against dev, driven in the built-in browser and signed in as Lutan's account (Lutan signed in). Rows were read back through the Management API (read-only `select`). Rates come from dev's own forecast: FBC 30 tablets per 30 days (1 a day), Hepato 90 (3 a day), Standard Kibble 4,170 cups (139 a day).

- [x] Happy path works end to end — FBC → Count → `20` → Save: *Saved.*, and the row updated in place without a reload to `20 tablet(s) / counted today | About 20 days / runs out around 15 Oct 2026`. Diets: Kibble → Count → `1000`: `1000 cup(s) / counted today | About 7 days / runs out around 2 Oct 2026` (1000 ÷ 139 = 7.19)
- [x] Data persists — reload the page and the change is still there — reloaded both pages after each save and the figures were as saved. The rows read back as `FBC stock_on_hand 20, reorder_lead_days 19`, `Standard Kibble stock_on_hand 1000, reorder_lead_days 10`
- [x] Create / edit / delete all exercised (whichever the feature has) — Count (set, re-save the same figure, set 0, clear to blank) and Edit (lead time set, changed, validated) on both pages. The add-diet form still creates a diet: `Stock test diet (harness)` was created, reading *Not counted* / *—*, then deleted through the row's Delete. **The trigger rule the schema half asked this feature to respect, checked in the database:** an Edit save (lead time 21 → 19) left FBC's `stock_counted_at` at `11:32:36`, while re-counting the same 20 moved it to `11:34:50`. On diets, the Edit save that followed the Kibble count (lead time 10; the dev log shows `updateDietType` after `updateDietTypeStock`) left its stamp at the Count's `11:36:37`
- [x] Empty state renders sensibly (no rows yet) — every dev item before any count read *Not counted* / *—*, never `0` or *Out of stock*
- [x] Invalid input is rejected with a readable message, not a crash — count `-1`: "Stock must be a number, 0 or more. Leave it blank if it hasn't been counted." Lead time `0`, `2.5` (medications) and `400` (diets): "Lead time must be a whole number of days, 1 to 365. Leave it blank for no reorder flag." None reached the check constraints. The server actions re-parse with the same functions
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — **null vs zero:** Renovit counted `0` reads *Out of stock* in both cells, while Synbiotic counted `5` then cleared to blank reads *Not counted* / *—*, with `stock_on_hand` and `stock_counted_at` both null in the database. **No usage:** Bravecto (nothing due) counted `12` reads *None due in the next 30 days*. **Flag edges:** FBC at 20 days reads **Reorder** with lead time 21 and no flag with lead time 19. **Aged counts** (two dev timestamps backdated with the triggers disabled and re-enabled in one transaction; `tgenabled` read back `O` for both): FBC 20, counted 25 days ago, reads *counted 25 days ago | Probably used up since the count — count again / Reorder*. Hepato 90, counted 4 days ago with a 30-day lead time, reads *About 26 days / runs out around 21 Oct 2026 / Reorder* ((90 − 3×4) ÷ 3 = 26). **The calculation itself:** `node scripts/check-stock-reading.mjs` runs the real `readStock`/parsers against fixed instants, 32 cases, `all passed` in local time and under `TZ=UTC`. Negative controls: flipping the flag's `<=` to `<` fails "days 7, lead 7"; the previous real-time version fails the three regression cases below (see Defects)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no change to access | unchanged | n/a |
| management | `/management/medications`, `/management/diets` | Count, Edit, flag | tested (Lutan's account) |
| staff | n/a: no change to access | unchanged | n/a |
| vet | n/a: no change to access | unchanged | n/a |
| volunteer | n/a: no change to access | unchanged | n/a |
| signed out | n/a: no change to access | unchanged | n/a |

- [ ] Every role above tested — n/a: no route, guard, policy or grant changed. The pages keep `requireManagementUser()`, both new actions (`updateMedicationStock`, `updateDietTypeStock`) open with the same `assertManagementRole()` as their neighbours, and 0083's columns are covered by the tables' existing grants and RLS
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access surface changed; see the line above

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no new page and no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — three steps added to each of *Managing medications* and *Managing diets and the food forecast* (Count, days of stock, the lead time). The screenshots are now missing the new columns (section 1)
- [x] Translatable strings go through the translation path, checked at `/management/translations` — the new strings are UI dictionary strings, with `management.stock` added to both `en.ts` and `th.ts` (the `Dictionary` type makes a missing Thai key a type error). No user content is added, so nothing is queued at `/management/translations`. Switched to ไทย on `/management/diets`: headings *คงคลัง | ใช้ได้อีก (วัน)*, cells *1000 ถ้วย / นับวันนี้ | ประมาณ 7 วัน / หมดราว 2 ต.ค. 2569 / ควรสั่งซื้อ / ระยะเวลาจัดส่ง 10 วัน*
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not verified. At 375px both pages show their existing *Best on a larger screen* notice, and after *Show anyway* the page does not scroll sideways (`scrollWidth` 375), but the pane did not lay out the table for measuring. In Left for manual verification
- [x] Browser console clean — no errors or React warnings — `read_console_messages` (errors) after all of the above: none
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the dev server log shows every GET and POST to both routes as 200, with each action call (`updateMedicationStock`, `updateMedication`, `updateDietTypeStock`, `updateDietType`, `createDietType`, `deleteDietType`) listed, and `preview_logs` at level error reports "No server errors found"

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — both pages' existing columns (cost, forecast windows, prescriptions/records, diet cost totals) render as before, and the diets footer total still lines up under its forecast columns with the two new columns added. Rename-free Edit (lead time) and the add-diet form were exercised, and so was delete. Medication merge was not driven, and its code is unchanged
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/i18n/dictionaries/*` was touched: the diets page was loaded in Thai and English, and the medications page in English, all rendering every existing label. `manual/en.ts` only gained steps
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought in only a migration, a script and a test plan (`0084`, `check-public-drive-file.mjs`), and the gates passed after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — days-of-stock from the fixed 30-day rate net of usage since the count, in whole shelter days; the three empty states; the inclusive flag; Count separate from Edit because of the trigger rule; validation limits
- [x] `README.md` still accurate — it does not describe the management pages' columns
- [x] **Release notes.** Would a shelter user notice this change? Yes. `unreleased` in `src/lib/releases.ts` has a line for it, written for staff: Count after a stocktake, days it will last, Reorder with a lead time
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The one timing claim, that usage is taken off in shelter days and that a fresh count reads its full figure, is asserted by `check-stock-reading.mjs` against fixed instants on both sides of 17:00Z and under `TZ=UTC`. The first version's claim, that real elapsed time is subtracted, was measured wrong in the browser and corrected in both places

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: release manager. The logic half is done: `TZ=UTC node scripts/check-stock-reading.mjs` passes, with cases on both sides of 17:00Z and at year-end. Whether the deployed build agrees during 00:00–07:00 Thai is a deploy check
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** The flag is asserted at days = lead + 1, lead and lead − 1. The run-down boundary is asserted at exactly zero and below zero, with *out* (counted 0) kept separate. The day boundary is asserted at 22:00 Thai the previous day, 5 minutes after the count, and later the same day
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates lines are pasted as printed, and the browser cell text is quoted as read back by script
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page reads these columns

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here, but this code reads `0083`, so production needs `0083` applied **before** this deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (for `0083`)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: 0083 is additive nullable columns and triggers
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager. `0083_stock_on_hand.sql` to production (`dbkodyyxxhtygxcxmfcu`) before the deploy that ships this

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` reverts the pages. Counts entered stay in the columns, which are harmless to the previous code because it never selects them. No migration to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A count saved seconds earlier read a day short: 20 tablets at 1 a day showed *About 19 days*, because usage since the count was subtracted in real elapsed time and then floored. Found in the browser | fixed in `6c4940e`: usage is taken off in whole shelter days, with an epsilon on the floor. Three regression cases in `check-stock-reading.mjs` fail on the old code |
| 2 | low | Lint (`react-hooks/purity`) refused `Date.now()` in both page components | fixed in `b9af373`: `readStock` defaults the time itself |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | How the new cells look at a normal desktop width: the red *Out of stock* / *Probably used up*, the yellow **Reorder** pill, and that the table is not uncomfortably wide with the two extra columns plus a custom date window. The pane here was too small for a readable screenshot | `/management/medications` (FBC, Hepato, Renovit are set up in dev), `/management/diets` (Kibble) |
| 2 | At 375px, after *Show anyway*, the table scrolls inside its box and Count / Save are reachable | both pages on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: the desktop look of the new cells and the 375px table (Left for manual verification 1 and 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over at merge

Result: pass

Release manager acknowledgement: pending
