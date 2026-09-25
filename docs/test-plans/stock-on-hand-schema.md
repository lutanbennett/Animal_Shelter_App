# Feature test plan

## Header

| | |
|---|---|
| Feature | `stock_on_hand`, `stock_counted_at` and `reorder_lead_days` on `medication` and `diet_types`, with a trigger that stamps when the count was taken: the schema half of stock on hand and days-of-stock |
| Backlog item | `docs/backlog.md` → **Stock on hand and days-of-stock** (not ticked here: the item closes when the feature half, `claude/stock-on-hand`, lands) |
| Branch / worktree | `claude/stock-on-hand-schema` @ `C:\Development\Animal_Shelter_stock-on-hand-schema` |
| Dev server | not started: this change ships no runtime code |
| PR | #121 |
| Tested by / date | Claude (automated) / 2026-09-25 |
| Carries a migration? | yes: `0083_stock_on_hand.sql` |
| Tested at SHA | `f059306` (branch on `main` @ `7bf0e9c`); the migration, harness, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one additive migration adds the stock figure the item asks for on both tables. It adds a per-item reorder lead time in days where the item said "maybe `reorder_at`" (Lutan's choice, 2026-09-25), plus a count timestamp so that days-of-stock can tell how old the count is
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0083_stock_on_hand.sql`; `scripts/check-stock-on-hand.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. None, because no code reads the columns. Grants (0077) and RLS on both tables are table-level and cover the new columns unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the in-place editing on the two management pages, the days-of-stock column and the reorder flag all belong to the feature stream. The backlog tick lands with it too

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: fast-forwarded to `7bf0e9c` before any change
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 343s

  gates: typecheck=0 lint=0 build=0
  ```

- [x] CI green on the PR (runs the same three): PR #121, run 36088705656 at `895d09d` — `check` pass (1m41s), `migration-numbers` pass, `test-plan` pass

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0083_stock_on_hand.sql (against origin/main 7bf0e9c, highest 0082_anon_function_execute.sql)`; this stream holds the day's one migration slot (`.brief.md`)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `This checkout: 82 applied, 1 pending.` with `On origin/main, not applied here: 0` and `Applied here, no file on origin/main: 0`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0083_stock_on_hand.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0083_stock_on_hand.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness executes the whole file twice in one transaction after the real apply, so three runs in total against the same schema
- [x] Existing rows still read correctly after the change (checked against real dev data): all 24 medications and 2 diet types are present, with all three new columns null (harness case A). Nothing was back-filled
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-stock-on-hand.mjs`. Shape: the six columns are nullable with no default, typed `numeric` / `timestamptz` / `integer`, and all 4 triggers are present. For each table, on a real row: (A) existing rows are all null; (B) setting a count stamps `now()`, overwriting a hand-set `2000-01-01` in the same write; (C) an update that does not name `stock_on_hand`, whether a hand-set stamp or a price edit, keeps the stamp; (D) clearing the count to null clears the stamp; (E) re-saving the same count restamps it over a planted old value; (F) a count of 0 is accepted and stamped, while `-1` stock and `0` lead days are refused with `check_violation`; (G) an insert with a count is stamped `now()` and one without is null, whatever it asks for. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK shape: 6 nullable columns, 4 triggers | medication: rows=24 all-null | diet_types: rows=2 all-null  | per table: existing rows all-null, count stamps now() over a hand-set time, unrelated edit and hand-set keep the stamp, clearing clears it, same-count re-save restamps, 0 accepted, -1 stock and 0 lead days refused, insert with count stamped / without null | file ran twice
  CONTEXT:  PL/pgSQL function inline_code_block line 177 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit. The script exits 0 only on `HARNESS-OK`, and it did.) **Negative control:** the same harness, with the keep branch's `new.stock_counted_at := old.stock_counted_at;` replaced by `null;`, fails with exit 1:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: FAIL C medication: hand-set stock_counted_at stuck at 2000-01-01 00:00:00+00
  CONTEXT:  PL/pgSQL function inline_code_block line 36 at RAISE
  ```

- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive. Undoing it means dropping the four triggers, `stamp_stock_counted_at()` and the six columns, and nothing reads them
- [x] Production apply plan stated for the release manager (which file, which project, when): Lutan applies `0083_stock_on_hand.sql` to production `dbkodyyxxhtygxcxmfcu` from the main checkout, running `node scripts/apply-migrations.mjs --env production --dry-run` first and then the real apply. It **must be applied before** the deploy that carries the `claude/stock-on-hand` feature, because that code selects these columns

## 4. Functional checks

- [x] Happy path works end to end: harness cases B, E and G are the writes the feature will make (record a count, confirm it, create an item with a count)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert and update exercised in the harness, and delete removes the row with its columns
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: at the database layer, negative stock and zero lead days raise `check_violation` against the named constraints (case F). The readable message on the page belongs to the feature stream
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): stock 0 accepted, -1 refused; lead days 0 refused; null count; same-value re-save; backdated hand-set stamp on insert and update

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route or policy changed | — | — |
| management | n/a: no route or policy changed | — | — |
| staff | n/a: no route or policy changed | — | — |
| vet | n/a: no route or policy changed | — | — |
| volunteer | n/a: no route or policy changed | — | — |
| signed out | n/a: no route or policy changed | — | — |

- [ ] Every role above tested — n/a: no route, grant or RLS policy changed; the triggers run as the writer for every role alike
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature stream documents it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page was loaded, because nothing in `src/` selects the columns. The existing pages select named columns (`id, name, dose_unit, cost_per_unit` and the diet equivalent), not `*`, so the new columns do not change their payloads. The harness's case C is the price edit those pages make, and it succeeded under the new triggers
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync fast-forwarded before any change, and the build is green on this tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item closes with the feature half (`claude/stock-on-hand`), not with the schema
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: unit choice, null vs 0, computed days-of-stock, lead days over `reorder_at`, why `stock_counted_at` exists, and the two-trigger SET-list stamp with its consequence for the feature's edit form
- [x] `README.md` still accurate: it does not list columns
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: columns no screen shows yet; the feature stream writes the line when stock appears on the pages
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned:** the stamp, keep, clear, re-save, constraint and insert behaviour all come from the harness run above. The claim that the forecasts return quantity in `dose_unit` / `unit` was read from `0071_cashflow_prices.sql`'s column comment and the two management pages

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: `stock_counted_at` is a stored instant from `now()`; nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band; the two check constraints were tested on both sides (0 / -1 stock, 0 lead days refused, 14 accepted)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view reads either table

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, but the follow-on `claude/stock-on-hand` feature will read these columns, so production must have `0083` before that feature deploys (see §3)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive nullable columns; existing values untouched
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: there is no Worker change, so `wrangler rollback` does not apply. The columns and triggers are safe to leave in place. Once the feature ships, removing them would lose every recorded count

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty: nothing in this change has a surface a person needs to look at that the harness did not already cover.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output rather than duplicating it
- [x] Handed to the production release manager: the PR states that Lutan applies it to production, before the feature deploy

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
