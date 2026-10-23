# Feature test plan — medical-diets-schema

## Header

| | |
|---|---|
| Feature | Two schema files: `0249` lets a `who_and_where` role holding a `medical.*` edit READ the resident record; `0250` adds one-amount-per-serving columns to diets |
| Backlog item | `docs/backlog.md` → **FAILED CARD** and **Simplify diets to "one serving" recipes** (both left open, status notes added) |
| Branch / worktree | `claude/medical-diets-schema` @ `C:\Development\Animal_Shelter_medical-diets-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | yes — `0249_medical_card_reads_the_record.sql`, `0250_diets_one_amount_per_serving.sql` |
| Tested at SHA | `70d49599` (after sync with `origin/main` `1f67830f`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for — the schema half of each: a narrower resident read for medical-edit logins, and the per-serving columns with a back-fill
- [x] Files/areas touched listed — `supabase/migrations/0249_*.sql`, `0250_*.sql`, `scripts/check-medical-card-reads-record.mjs`, `scripts/check-diets-per-serving-schema.mjs`, `docs/backlog.md` (status notes), `docs/decisions/2026-10-23-medical-card-read-and-diet-servings-schema.md`, this plan
- [x] Roles affected identified — 0249: Head of Medical, 2IC and card logins with a medical edit gain the resident and placement-history READ; volunteer, Head of Maintenance, doctor, management, admin unchanged. 0250: no role sees a change
- [x] Anything explicitly **out of scope** written down — all `src/` code; the forecast functions (deliberately untouched); photos/attachments and adoption updates for card logins (still ask `sees_all_residents()`); the out-of-proportion decisions, which are Lutan's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `1f67830f` merged in cleanly (docs only: the 0.39.3 record)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Closing lines pasted below, unedited:

```
=== gates: build exited 0 after 418s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0249` and `0250` against highest `0248`; the brief names this as the batch's only migration stream; `check-migration-numbers` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 249 applied, 2 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — both `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0249 … ok`, `applying 0250 … ok`; `--status` lists both as applied here with no file on `origin/main` yet
- [x] File is re-runnable — `or replace` / `if not exists` / `drop … if exists` throughout; both harnesses were run before and after the real apply, so the text ran twice over its own result
- [x] Existing rows still read correctly after the change — 0249: management/admin still read all 100 residents and 194 placement rows; 0250: all 9 existing ingredient lines have `qty_per_serving` and both forecasts compare identical row by row
- [x] **Constraints and defaults exercised against real rows** in rolled-back harnesses on dev. 0249 (`check-medical-card-reads-record.mjs`, 14 checks): a throwaway login per role, rows counted as `authenticated` before and after: Head of Medical and 2IC 0 → 100 residents and 0 → 194 placements; volunteer and Head of Maintenance stay at 0 (0134); doctor, management, admin unchanged; the new readers' no-op `update residents` changes 0 rows. 0250 (`check-diets-per-serving-schema.mjs`, 12 checks): `diet_forecast` and `stock_diet_forecast` identical before/after over a month and over all dates; every line back-filled as `qty_small / servings_small`; servings default 1 / 1.5 / 2; a cup-based recipe in exact proportion forecasts the same under the old functions as under qty_per_serving × servings(size) × portion_factor × conversion; the bridge re-derives the serving when Small is edited and leaves an explicit serving alone. Both `RESULT: GREEN`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: both additive (a function and two read policies re-created as 0144 had them; three columns and a trigger). 0249's header says how to undo it
- [x] Production apply plan stated for the release manager — both files on `dbkodyyxxhtygxcxmfcu` with the next release, any time before the batch 2 app halves deploy. Applying 0250 prints a NOTICE per out-of-proportion line on production's own data: copy that list to Lutan. Confirm production's `roles` rows for the 0249 list of who gains the read

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence of the columns asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; the bridge trigger's insert and update paths are exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the `> 0` checks are database constraints
- [ ] Boundary cases checked — n/a: no UI surface; the 0.005 proportion tolerance is applied in the harness list

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | residents, placement history | unchanged | 100 / 194 rows before and after |
| management | residents, placement history | unchanged | 100 / 194 rows before and after |
| doctor | residents, placement history | unchanged | same before and after (0 for a throwaway login with no clinic; the vet policies were not touched) |
| head_of_medical | residents, placement history | gains read | 0 → 100 / 0 → 194; cannot update |
| second_in_command | residents, placement history | gains read | 0 → 100 / 0 → 194; cannot update |
| volunteer | residents, placement history | stays none (0134) | 0 / 0 |
| head_of_maintenance | residents, placement history | stays none (0134) | 0 / 0 |
| signed out | nothing | nothing | n/a: no anon grant or policy changed |

- [x] Every role above tested — all but signed-out, in the harness, as `authenticated` with that role
- [x] A role that should not have access is blocked server-side — volunteer and Head of Maintenance read 0 rows from `residents` and `placement_history` with the file applied

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the manual topics belong to the app halves
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of `residents`, `placement_history`, `diets` and `diet_ingredients`; both forecasts proven identical before/after by the 0250 harness
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought docs only; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — both items deliberately left open with a rewritten title and a SCHEMA LANDED note naming what the app half still does; searched the backlog for `residents_select_perm`, `sees_all_residents`, `diet_ingredients`, `diet_forecast`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-23-medical-card-read-and-diet-servings-schema.md`
- [x] `README.md` still accurate — it does not describe these policies or columns
- [ ] **Release notes.** n/a: schema only — no UI surface, and no code reads these columns until the batch 2 app halves
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — who gains the read comes from a query of the dev `roles` and `role_permissions` rows and the harness, not from the migration files (0179's `legacy_role` clause is dead since 0181)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff beyond the proportion tolerance, which only builds a list
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `0249` consumer is the resident page (still redirecting), `0250` has no reader yet. Both must be on production before their app halves deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive; 0250 back-fills a new column only
- [x] Apply plan stated — both files on production with the next release; 0250 prints the out-of-proportion list for Lutan

### Rollback

- [x] Rollback position stated — code rollback does not revert migrations and does not need to: 0250 is additive, and 0249 only lets more logins read, so older code ignores it. To undo 0249, re-create the two policies as in 0144 and drop `may_open_resident_record()`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Resident photos/attachments and adoption updates still ask `sees_all_residents()`, so a card login sees the page without them | deferred to backlog — a third schema file if wanted, on the page stream's say |
| 2 | info | Production `roles` could not be read from this session (production reads refused), so who gains the read there is confirmed at apply time | accepted — the function follows the rows |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: schema only, no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass

Release manager acknowledgement: n/a: not at release yet
