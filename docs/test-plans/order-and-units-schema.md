# Feature test plan — order-and-units-schema

## Header

| | |
|---|---|
| Feature | `0161_place_and_stock_order_and_unit_prices.sql`: `sort_order` on zones, enclosures (within the zone), medication and diet_types, seeded in natural name order, new rows last; Lifecycle refuses an order; the two stocktake views carry the column; both `cost_per_unit` columns widened to `numeric(12, 4)` |
| Backlog item | `docs/backlog.md` → "Put zones and enclosures in the shelter's own order, set in Settings", "Stocktake in cupboard order", "Cost per unit keeps only 2 decimals, so a per-gram price cannot be stored" (schema half of each; all three stay open) |
| Branch / worktree | `claude/order-and-units-schema` @ `C:\Development\Animal_Shelter_order-and-units-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (not started: no UI change) |
| PR | #447 |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | yes — `0161_place_and_stock_order_and_unit_prices.sql` |
| Tested at SHA | 63b4c321 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the columns, constraints and view changes the three items' build steps need, and nothing that reads them, as the brief's "Scope: schema only" asks
- [x] Files/areas touched listed: `supabase/migrations/0161_place_and_stock_order_and_unit_prices.sql`; `scripts/check-order-and-units.mjs` (new); `docs/decisions/2026-10-08-order-and-unit-prices-schema.md`; `docs/backlog.md` (three status notes); this plan. No `src/`, no `worker/`
- [x] Roles affected identified: none see a difference. Writers of zones/enclosures (`facility.enclosures` Edit) and of medication/diet_types (their existing insert policies) now get an order filled in on insert by trigger; the stocktake views' audience is unchanged (same `where`), each role's reading is in the evidence
- [x] Out of scope written down: the Settings Move up / Move down and Sort A-Z, the shared ordering helper and every screen switching to it, the stocktake sorting, Move up / Move down on Management → Medications / Diets, and the `costPerBaseUnit` change (which must wait until 0161 is live on production). The `website.content` row for `shelter-operations-nav` is not in this file: offered to that stream on 2026-10-08, no answer before this commit; see the PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:
```
=== gates: typecheck exited 0 after 46s
=== gates: lint exited 0 after 118s
=== gates: build exited 0 after 174s
gates: typecheck=0 lint=0 build=0
```
- [x] CI green on the PR (runs the same three): #447, 7 passing, 0 failing, mergeable CLEAN (2026-10-08)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0161_place_and_stock_order_and_unit_prices.sql (against origin/main 10bf3026, highest 0160_view_write_grants.sql)`; the only migration-carrying stream this batch (brief)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `160 applied, 0 pending`, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0161_place_and_stock_order_and_unit_prices.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` when Lutan said merge (2026-10-08): `applying 0161_place_and_stock_order_and_unit_prices.sql … ok`. Then the after-check on the applied database: `node scripts/check-order-and-units.mjs` 18 ok, `RESULT: GREEN`; `check-policy-role-names`, `check-app-access-gate`, `check-view-write-grants` all exit 0
- [x] File is re-runnable: `add column if not exists`, `create or replace`, `drop trigger if exists`, seeds that only fill a list with no order yet, and an `alter … type` to the type it already has. Proved by the check below, which runs the file twice in one transaction
- [x] Existing rows still read correctly after the change: every zone, enclosure, medicine and diet keeps its name and id; existing prices keep their value (35.50 reads back as 35.5); the stocktake page's own select (`id, name, unit:dose_unit, stock_on_hand, …`) names only columns the views still have, in the same places
- [x] **Constraints and defaults exercised against real rows** in a rolled-back harness: `node scripts/check-order-and-units.mjs --with <the file>` (committed, repeatable). Asserted: every physical zone and enclosure has an order and no Lifecycle row does; within a zone no "x 10" sorts before "x 2"; a new zone, enclosure, medicine and diet each go last; an enclosure moved to another zone goes last there; the Lifecycle zone and its enclosures refuse an order and still refuse a map shape; a new Lifecycle pseudo-enclosure is still accepted, with no order; 0.035 and 0.0125 round-trip at full precision on the two tables; and one live login per role reads `sort_order` on every stock row it can see, under its own JWT. Evidence below
- [x] Down-migration written, or the reason one is not needed is stated: not needed for an additive file. A down would be: drop the four `*_assign_sort_order` triggers and `place_sort_order_last()`; re-create 0142's `refuse_lifecycle_map()` and its two triggers; re-create the two stock views without the column (`drop` + `create`, as a column cannot be removed by `or replace`); drop the four columns; and `cost_per_unit` back to `(10,2)` / `(12,2)`, which rounds any 4-place price that was saved meanwhile
- [x] Production apply plan stated for the release manager: `0161` to production (`dbkodyyxxhtygxcxmfcu`) with the next release, before or after the deploy (no code in this release reads it). It must be live on production **before** the per-gram price stream's code ships. Run `--status --env production` first: the runner applies every pending file

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet; the database behaviour is proved in §3
- [ ] Data persists — n/a: no screen writes these columns yet; the triggers' writes are asserted in §3
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and zone-change are exercised at the database in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input; the one refusal (an order on Lifecycle) is asserted in §3 and reads "The Lifecycle zone keeps its fixed place and takes no order"
- [ ] Boundary cases checked — n/a: no UI; the database boundaries (2 vs 10, the zone change, Lifecycle) are in §3

### Role access matrix

Measured in the database with each role's own JWT, not on screen. No policy is added or changed.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `stock_medications`, `stock_diet_types` | every row, each with an order | 25 / 25 and 3 / 3 |
| management | the same | every row, each with an order | 25 / 25 and 3 / 3 |
| staff | the same | every row, each with an order | 25 / 25 and 3 / 3 |
| vet | the same | nothing (no stock cell; view `where` unchanged) | 0 and 0 |
| volunteer | the same | nothing (no stock cell; view `where` unchanged) | 0 and 0 |
| signed out | nothing | anon holds no grant on either view (revoked again in the file) | `revoke all … from anon` in the file; `check-app-access-gate` green |

The 2IC and Head of Medical logins read 25 / 25 and 3 / 3 too.

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side: vet and volunteer read 0 rows of both views under their own JWTs; `check-app-access-gate` green (public_viewer gains nothing)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user sees or does changes until the screens land; the Zones, Enclosures and stocktake topics are the screen streams' work
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: checked at the database, which is where the change is. `/stocktake`'s two views keep every column in place and only gain one at the end; the zones/enclosures readers select named columns, so a new one changes nothing. `diet_forecast` and `cashflow_forecast` multiply by the wider price and every screen formats the result with `formatBaht`. `check-policy-role-names` GREEN, `check-app-access-gate` exit 0, `check-view-write-grants` GREEN, `check-migration-grants` ok, `check-new-policy-role-names --base origin/main` ok (1 new file, none with a role-named policy), `check-migration-consumers` ok
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged (`Already up to date.`)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: all three items stay open by design (the brief); each carries a STATUS note saying the schema half is done and which screens remain. The backlog was swept for other items this closes: none (the card-by-card stocktake item says its cards should follow the cupboard order "once it exists", which needs the screen, not only the column)
- [x] Non-obvious design choices added: `docs/decisions/2026-10-08-order-and-unit-prices-schema.md`
- [x] `README.md` still accurate: it lists no columns or check scripts
- [ ] **Release notes.** n/a: no screen reads these yet; the order and the per-gram price are invisible until their screens land, and every list and price reads as it did
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Which roles read the tables was queried on dev (`role_permissions`); "no view depends on `cost_per_unit`" was queried with `pg_depend`; the natural order, the go-last triggers, the refusals and the prices are asserted by the check script. The vet's falling back to name order is stated as reasoning from those two facts

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change covers both edges** — n/a: no boundary or banding; the natural-order seed is asserted across the whole of dev's data
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (below)
- [ ] Public pages re-checked after a cache purge — n/a: anon reads nothing changed here

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** n/a: no app code change
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a destructive or rewriting migration only: a fresh production backup — n/a: additive columns, and the `cost_per_unit` widening loses no value
- [x] Apply plan stated: see §3

### Rollback

- [x] Rollback position stated: no Worker change. The file is additive and safe to leave in place; the down is described in §3, and it would round any 4-place price saved meanwhile

## Evidence

`node scripts/check-order-and-units.mjs --with supabase/migrations/0161_place_and_stock_order_and_unit_prices.sql` (dev, 2026-10-08, exit 0):

```
ok   physical zones all ordered
ok   Lifecycle zone has no order
ok   physical enclosures all ordered
ok   Lifecycle enclosures have no order
ok   numbers read naturally (no "x 10" before "x 2" in a zone)
ok   medication all ordered
ok   diet_types all ordered
ok   new zone goes last
ok   new enclosure goes last in its zone
ok   moved enclosure goes last in the new zone
ok   Lifecycle zone refuses an order
ok   Lifecycle enclosures refuse an order
ok   Lifecycle enclosures still refuse a map shape
ok   a new Lifecycle pseudo-enclosure is accepted, with no order
ok   new medicine goes last
ok   new diet goes last
ok   diet price 0.035 round-trips
ok   medicine price 0.0125 round-trips
stock views read as each role (rows a login can count should all carry an order):
     admin                stock_medications rows 25, with order 25
     admin                stock_diet_types rows 3, with order 3
     head_of_medical      stock_medications rows 25, with order 25
     head_of_medical      stock_diet_types rows 3, with order 3
     management           stock_medications rows 25, with order 25
     management           stock_diet_types rows 3, with order 3
     second_in_command    stock_medications rows 25, with order 25
     second_in_command    stock_diet_types rows 3, with order 3
     staff                stock_medications rows 25, with order 25
     staff                stock_diet_types rows 3, with order 3
     vet                  stock_medications rows 0, with order 0
     vet                  stock_diet_types rows 0, with order 0
     volunteer            stock_medications rows 0, with order 0
     volunteer            stock_diet_types rows 0, with order 0
RESULT: GREEN
```

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | 0142's Lifecycle check looked a zone up by its id, which on insert is not yet in the table, so a new zone named Lifecycle could have taken a map shape | fixed in 0161: a zone row is also checked by its own name |

## Left for manual verification

Empty: there is no screen to look at until the follow-up streams land.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR: #447 description
- [ ] Handed to the production release manager — n/a: not yet — handed over at release cut, after merge

Result: pass
