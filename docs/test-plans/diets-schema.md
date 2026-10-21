# Feature test plan — diets-schema

## Header

| | |
|---|---|
| Feature | Schema half of "a diet is a recipe of ingredients": `diets`, `diet_ingredients`, `resident_diets.diet_id` / `portion_factor`, both forecasts expanding recipes |
| Backlog item | `docs/backlog.md` → **Diets made of ingredients** (left open: the app half is `diets-app`) |
| Branch / worktree | `claude/diets-schema` @ `C:\Development\Animal_Shelter_diets-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | yes — `0239_diets_are_recipes.sql` |
| Tested at SHA | `83419e93` (after sync with `origin/main` `ce754d32`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the schema PR of the item: recipe tables, back-fill of one single-ingredient recipe per diet type, forecasts expanding recipes, nothing moving on the day it lands
- [x] Files/areas touched listed — `supabase/migrations/0239_diets_are_recipes.sql`, `scripts/check-diets-recipes-schema.mjs`, `docs/diets-ingredients-design.md` (answers recorded), `docs/decisions/2026-10-21-a-diet-is-a-recipe-of-ingredients.md`, this plan
- [x] Roles affected identified — none see a change: no screen reads the new tables. The recipe tables read like `picker_diet_types` (stock.diets read, resident.register, medical.diet read) and write with stock.diets edit
- [x] Anything explicitly **out of scope** written down — all of `src/`: Settings → Diets, Purchasing wording, diet sheet, stock usage, archive/export, manual, dictionaries, releases line are `diets-app`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `ce754d32` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit code read directly:

```
=== gates: build exited 0 after 379s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0239` against highest `0238`; no open PRs at the time (`gh pr list` empty); the brief names this the batch's only migration stream
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 239 applied, 0 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0239_diets_are_recipes.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0239_diets_are_recipes.sql … ok`; `--status` then lists it as applied here, no file yet on `origin/main` (expected until merge)
- [x] File is re-runnable — every create is `if not exists` / `or replace` / `drop … if exists`; the back-fill inserts guard with `not exists`; the harness runs the file in a transaction on a database that already has it applied (second run after the real apply)
- [x] Existing rows still read correctly after the change — `check-diets-recipes-schema.mjs` compares `diet_forecast` and `stock_diet_forecast` row by row before and after the file's own text, over October 2026 and over every date (2000–2100): 0 differences in each of the four comparisons. Dev holds 2 diet types, so this is a small sample; the back-fill logic is per-row and does not depend on count
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev: every resident diet points at a recipe; the standard flag carried over; one recipe and one ingredient line per diet type; a three-ingredient recipe in cups (1 cup kibble = 0.1 kg, 1.5 cups chicken = 0.15 kg each, 1.5 CUP rice = 0.2 kg each) forecasts each ingredient in kg to 1e-9 through both forecast functions; a serving unit with no conversion is refused; a new diet type gets its one-ingredient recipe and a quantity edit reaches it. 14 checks, RESULT: GREEN, run both before and after the real apply
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive. Old code reads `diet_type_id` and `daily_quantity`, which are kept (`diet_type_id` merely nullable), and the bridge triggers keep new old-app rows valid
- [x] Production apply plan stated for the release manager — apply `0239` on production with the app PR's release (`--status --env production` first); it changes the forecast functions, so it must not ship alone without the bridge triggers, which it carries. The back-fill needs no human data

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these tables yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the database refusal (unknown serving unit) is asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; the resident with an unset size (Medium) is covered by the unchanged size rule

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | recipe tables | read and write | n/a — policies follow `has_permission`, no screen uses them yet |
| management | recipe tables | read and write | n/a — as above |
| staff | recipe tables | read | n/a — as above |
| vet | recipe tables | read | n/a — as above |
| volunteer | recipe tables | none | n/a — as above |
| signed out | nothing | nothing | n/a — grants revoked from public and anon |

- [ ] Every role above tested — n/a: no UI; policies copy the proven `picker_diet_types` / `diet_types` permission cells and are not yet reachable from the app
- [ ] A role that should not have access is blocked server-side — n/a: no UI; anon and public hold no grant on the new tables

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the Diets topic is `diets-app`'s
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of the two forecast functions, whose signatures and return shapes are unchanged; the harness shows identical output
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought a release record and docs; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, the app half remains. Searched for `diet_types`, `diet_forecast`, `resident_diets`: every other hit is a ticked item; no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-21-a-diet-is-a-recipe-of-ingredients.md`
- [x] `README.md` still accurate — it does not describe diet tables
- [ ] **Release notes.** — n/a: schema only — no UI surface, and no code reads these tables until the diets-app stream
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the before/after was run on dev, not argued; the one non-exact point (portion factor division) is stated with its tolerance

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date derived in a new way; day counts are the existing formula
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`. The forecast functions change but keep their shape, and existing readers get the same numbers
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive; the only rewrite is filling new columns
- [x] Apply plan stated — see §3

### Rollback

- [x] Rollback position stated — code rollback does not revert `0239` and does not need to: older code reads the kept columns, and the bridge triggers keep new rows valid

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | First harness run: the back-fill update hit the deceased-record lock on a deceased resident's diet row | fixed — the back-fill uses the lock's transaction-local bypass, as 0026 does |
| 2 | low | `portion_factor = daily_quantity / size default` can differ from the old figure past the 15th digit | accepted — the proof compares to 1e-9 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these tables yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
