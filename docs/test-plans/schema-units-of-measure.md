# Feature test plan

## Header

| | |
|---|---|
| Feature | Units of measure, schema half — `item_unit_conversions` plus the as-entered `entered` record on `stock_receipts` and `stock_counts` |
| Backlog item | `docs/backlog.md` → **Units of measure: buy and count in one unit, feed or dose in another** (not ticked here; the feature half closes it) |
| Branch / worktree | `claude/schema-units-of-measure` @ `C:\Development\Animal_Shelter_schema-units-of-measure` |
| Dev server | not started — this change ships no runtime code |
| PR | pending — number added once opened |
| Tested by / date | Claude (automated) / 2026-09-30 |
| Carries a migration? | yes — `0118_unit_conversions.sql` |
| Tested at SHA | branch on `main` @ `465f1b4`; the migration, harness, decision, backlog note and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one additive migration adds a per-item conversion table and an `entered` jsonb on deliveries and counts holding the factors in force when each was saved, so the feature half can take and show other units without re-valuing history
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0118_unit_conversions.sql`; `scripts/check-unit-conversions.mjs` (dev-only rollback harness); `docs/decisions/2026-09-30-units-of-measure-schema.md`; a note on the item in `docs/backlog.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — none visible yet; no code reads or writes the new objects. The new table's policies (admin and management write; admin, management, staff, volunteer read) were exercised in the harness
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — every form, page and forecast change; cost per purchase unit; refusing a conversion named like the base unit; stamping `factor` from the live conversion; whether a factor may be marked approximate; mixed-unit entry on the sheet; the backlog tick

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — "Already up to date", exit 0
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:

  ```
  === gates: build exited 0 after 186s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `main` tops out at `0117_public_is_microchipped.sql`; `worktree.mjs sync` printed `migration numbers: ok — 0118_unit_conversions.sql`; no open `*-schema` PR
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `117 applied, 0 pending`, no drift against `origin/main` 465f1b4
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0118_unit_conversions.sql … ok`; `check-migration-grants.mjs` also ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0118_unit_conversions.sql … ok`. Applied twice: the first apply was followed by the harness finding a null-CHECK bug (see Defects), so the file was fixed, its row removed from dev's `schema_migrations` and the fixed file re-applied; the file was unmerged and dev-only
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — the harness runs the whole file twice in one transaction, and it had already been applied once for real
- [x] Existing rows still read correctly after the change (checked against real dev data) — harness step A writes a count and a receipt the old way (no `entered`) and both insert and read back with `entered` null; step H shows `stock_count_intervals` still returns intervals. The migration contains no `update` or `delete` against existing rows, and the only new columns are nullable. Regression harnesses `check-stock-receipts` and `check-stock-corrections` (0096, 0112) still end `HARNESS-OK` after the apply. `check-stocktake` (0093) fails at K0, "back-fill does not match the counted items", which compares 0093's back-fill with the live dev counts and does not touch anything this migration changed; not re-proved against `main` — recorded under Defects
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/check-unit-conversions.mjs`, with throwaway items and users. Asserted: (A) old-style rows unaffected, entered null; (B) conversions insert, one row may be both purchase and count unit; (C) zero factor, blank unit, duplicate unit by case and spacing, a second purchase unit, a second count unit and both item ids all refused; (E) editing a factor from 200 to 180 leaves an earlier receipt at 400 cups with factor 200; (F) mixed entry (1 bag + 10 kg = 300) saves, and a mismatching total, zero factor, non-array and empty array are refused; (G) `record_stocktake` with the old shape is unchanged, with `entered` stores it beside the base-unit count and unit, and a mismatching `entered` is refused with nothing written; (H) `stock_count_intervals` unchanged; (I) volunteer and staff can read but not write conversions, management writes, anon is refused; (J) deleting an item deletes its conversions. Output, unedited (after the fix, real apply done):

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0118 twice | A old-style counts and receipts still insert, entered null | B conversions insert (one row may be both purchase and count unit) | C zero factor, blank/duplicate unit, second purchase/count unit, two item ids all refused | E editing a factor (200 to 180) leaves an earlier receipt at 400 cups with factor 200 | F mixed entry (1 bag + 10 kg = 300) saved; mismatch, zero factor, non-array, empty all refused | G record_stocktake: old shape unchanged, entered stored beside base-unit count, mismatch refused with nothing written | H stock_count_intervals unchanged | I volunteer and staff read but cannot write, management writes, anon refused | J deleting an item deletes its conversions
  CONTEXT:  PL/pgSQL function inline_code_block line 160 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit; the script exits 0 only on `HARNESS-OK`.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive and unread; undoing it is dropping the table, the two constraints and columns, the helper function, and restoring `record_stocktake` from 0093, and nothing in data depends on it until the feature half ships
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0118_unit_conversions.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--env production --dry-run` then without, **before** the feature half is deployed. It also replaces `record_stocktake()`, so it should go on after any other pending file that touches that function (none is open)

## 4. Functional checks

- [x] Happy path works end to end — harness steps E, F and G are the paths the feature half will use
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these tables yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert, edit and cascade delete were exercised in the harness
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash — step C and F constraint refusals, and step G's "The units entered for a diet type count do not add up to the count."
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — zero factor, blank unit, empty array, non-array, omitted `entered`, one row as both purchase and count unit

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | table via the Data API | read and write (policy shared with management, not separately exercised) | n/a: not a separate harness case |
| management | `item_unit_conversions` | read and write | wrote a conversion (harness I) |
| staff | `item_unit_conversions` | read, no write | read 2 rows, write refused (harness I) |
| vet | `item_unit_conversions` | no access | n/a: not exercised; policy names no vet role |
| volunteer | `item_unit_conversions` | read, no write | read, write refused (harness I) |
| signed out | `item_unit_conversions` | refused | refused by the grant (harness I) |

- [x] Every role above tested — every role that matters to a stocktake and to conversions, as listed; admin and vet are the two not run separately
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — staff, volunteer and anon refused at the database; there is no URL

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature half documents it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page loaded: nothing in `src/` reads the new objects. The stock regression harnesses `check-stock-receipts` and `check-stock-corrections` still pass; `check-stocktake` is discussed in §3 and Defects
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing; build green on the tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the brief says not to tick it, the feature half closes it; a note recording the tables, columns and the point-in-time factor is on the item instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-09-30-units-of-measure-schema.md`
- [x] `README.md` still accurate — it does not list tables or columns
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: tables and columns that no screen reads yet; the feature half adds the line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the 200-to-180 re-valuation claim, the mismatch refusals and the old-shape stocktake come from the harness run above; the null-CHECK hole was found by it, not predicted

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy — SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the only tolerance is 1e-6 relative on the total, and the harness covers both a match and a clear mismatch (399 against 400)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or page reads these tables

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no; the feature half will read it, so production must have 0118 before that deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. The schema is additive and safe to leave. To remove it: drop the table, both constraints and `entered` columns and `units_entered_total`, and restore `record_stocktake()` to its 0093 body. Once the feature half ships, dropping `entered` loses the as-entered record on every delivery and count made in another unit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | The first `stock_*_entered_matches` CHECKs let a malformed `entered` through: the helper returned null, and a CHECK that evaluates to null passes. Found by harness step F (zero factor accepted) | fixed — comparison wrapped in `coalesce(…, false)`; dev re-applied; harness green |
| 2 | Low | `scripts/check-stocktake.mjs` fails on dev at K0 ("back-fill does not match the counted items") | accepted — it re-runs 0093's back-fill against the live dev counts, which have moved on since it was written; it does not exercise `record_stocktake()` or anything 0118 changed. Not re-run on `main` to prove it was already failing |

## Left for manual verification

Empty — nothing in this change has a surface a person needs to look at that the harness did not already cover.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output rather than duplicating it
- [x] Handed to the production release manager — the PR states the production apply as Lutan's, before the feature half deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
