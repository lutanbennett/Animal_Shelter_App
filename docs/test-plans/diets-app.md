# Feature test plan — diets-app

## Header

| | |
|---|---|
| Feature | App half of "diets are recipes": Settings → Diets recipe editor, resident diet form with a portion multiplier, Diet section, stock usage, archive, export and enclosure markers read recipes |
| Backlog item | `docs/backlog.md` → **Diets made of ingredients** (left open, title rewritten: the Feed Special Diets sheet and intake still need a schema PR) |
| Branch / worktree | `claude/diets-app` @ `C:\Development\Animal_Shelter_diets-app` |
| Dev server | not started — checks driven against the dev database by script; no browser session was available with a signed-in admin |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | no — `0239` is already on `main` and on dev |
| Tested at SHA | `946c7974` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a diet is edited as a recipe of ingredients, residents point at a recipe with a portion multiplier, and everything that forecasts, buys or counts expands it. The Feed Special Diets sheet and intake are NOT done (see out of scope)
- [x] Files/areas touched listed — `src/app/admin/diets/` (page, actions, new `recipe-actions.ts` and `RecipesPanel.tsx`, slimmed ingredient table and form), `src/app/diets/` (form, actions, new/edit pages), `src/lib/diets/` (new `recipes.ts`, `plausible.ts`, `special.ts`, `options.ts`), the hub Diet section and card query, `src/lib/archive/resident-record.ts`, `src/lib/residents/export.ts`, `src/app/management/stock-usage/page.tsx`, Purchasing and Diet stock pages (Standard badge removed), manual, both dictionaries, `releases.ts`, `scripts/check-diets-app.mjs`
- [x] Roles affected identified — admin (edits recipes and ingredients), management (Purchasing, Diet stock, stock usage read ingredients), anyone with `medical.diet` (the diet form and Diet section), anyone who sees enclosure cards (special-diet markers)
- [x] Anything explicitly **out of scope** written down — `special_diet_list` (Feed Special Diets and its diet sheet) and `record_intake` / the intake form still read `diet_types`, and need a small schema PR (no migration is allowed in this stream); the cleanup migration that drops the bridge, `diet_types.daily_qty_*`/`is_standard` and `resident_diets.diet_type_id`/`daily_quantity`. See `docs/decisions/2026-10-21-diets-app-half.md`. The Director enters the real Standard and Diabetic recipes herself

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`0240` and `0241` from the bills schema stream came in)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly:

```
=== gates: build exited 0 after 98s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR (`0239` was applied by #803)
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the back-fill was proved by #803
- [ ] **Constraints and defaults exercised against real rows** — n/a: no schema change; `scripts/check-diets-app.mjs` exercises the recipe expansion against real dev rows in a rolled-back transaction (§4)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR; but `0239` must be on production before this app deploys, and the Feed Special Diets/intake schema PR should go with it

## 4. Functional checks

- [x] Happy path works end to end — the number the item exists for, `node scripts/check-diets-app.mjs` on dev (78 residents on Standard, October 2026): kibble need 4708 before the split, 1177 after (exactly a quarter), chicken 1765.5 and rice 1765.5 appear, the three sum to 4708, and `stock_diet_forecast` (what Purchasing calls) shows the same three. All five checks ok, rolled back
- [ ] Data persists — reload the page and the change is still there — n/a: UI not exercised in a browser this session (see Left for manual verification); the recipe writes are plain inserts/upserts through RLS
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: recipe editor actions typecheck and lint but were not clicked through; listed under Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: not rendered in a browser; the panel has explicit empty messages for no diets, no ingredients and a diet with none
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not exercised in a browser; each action returns a dictionary message for a blank name, a duplicate name, a zero amount and an unconverted serving unit (the last is the 0239 trigger's message)
- [ ] Boundary cases checked — n/a: portion warning limits covered by `src/lib/diets/plausible.test.mjs` (4 passing); form boundaries not clicked through

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Diets, diet form | full edit | n/a — not exercised in a browser |
| management | Diet stock, Purchasing, stock usage | read ingredients | n/a — not exercised in a browser; no policy changed |
| staff | — | — | n/a — role retired (`0173`) |
| doctor | diet form via `medical.diet` | reads recipes | n/a — not exercised; RLS on `diets`/`diet_ingredients` is `0239`'s |
| volunteer | — | no diet form | n/a — no access rule changed |
| signed out | nothing | nothing | n/a — no access rule changed |

- [ ] Every role above tested — n/a: no policy or grant changed in this PR; the new tables' policies were reviewed in #803
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: `recipe-actions.ts` calls the same `canEditItemSettings` refusal as the ingredient actions; not exercised against a non-admin login

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; Settings → Diets keeps its place
- [x] Manual updated (`src/lib/manual/en.ts`) — the Diet recording topic and Managing diets topic rewritten for recipes, ingredients, serving units and portions; `/manual` rendering not loaded in a browser, `acceptance-matrix` check passed in lint
- [x] Translatable strings go through the translation path — new strings are in both dictionaries (`admin.diets.recipes`, `management.diets.table`, `diets.*`, `residents.sections.portion`); recipe and ingredient Thai names use the existing `name_th` fields. `/management/translations` not loaded in a browser
- [ ] Mobile viewport (375px) — n/a: Settings → Diets sits behind the larger-screen notice; the resident diet form keeps its layout. Not loaded at 375px
- [ ] Browser console clean — n/a: no browser session this run
- [ ] Network clean — n/a: no browser session this run

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — typecheck, lint and the production build all compile every page touched: hub, Diet section, diet form new/edit, Settings → Diets, Diet stock, Purchasing, stock usage, the archive and the export. Not loaded in a browser
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `NavLinks.tsx` untouched; `manual/en.ts` and the dictionaries are covered by the build and the acceptance-matrix check, not loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought in migrations `0240`/`0241` and docs only; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item is only partly done, so it stays open with its title rewritten to say what remains (the Feed Special Diets sheet and intake)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-21-diets-app-half.md`
- [x] `README.md` still accurate — nothing in it describes the diet model
- [x] **Release notes.** `unreleased` gained a line saying diets are recipes an admin can fill with ingredients, and does not promise the Standard or Diabetic recipes are entered
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "quarter" is measured by `scripts/check-diets-app.mjs` on dev data, not asserted

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives today's date (the forecast functions are #803's)
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the only threshold is the portion warning (more than 3), covered both sides in `plausible.test.mjs`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block above is pasted unedited; the proof numbers are quoted from the script's output
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here, but this code reads `0239`'s tables, so `0239` must be applied to production before this deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (for `0239`)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration here
- [ ] Apply plan stated — deferred: release manager — `0239` to production before this deploy, with the Feed Special Diets/intake schema PR

## Left for manual verification

| What | Why it needs a person |
|---|---|
| Settings → Diets: add a diet, add three ingredients in cups (with a 1 cup = 0.1 kg unit already set), edit, remove, make Standard, delete a diet nobody is on | the editor was typechecked and built, not clicked through |
| Add Diet form: pick a diet, read the hint listing the bowl at the dog's size, save with a 0.75 portion, edit it, confirm the hub Diet section shows the bowl and the portion | needs a signed-in session |
| Purchasing and Diet stock after splitting Standard | the forecast is proved by script; the pages were not loaded |
| Feed Special Diets and intake after this lands | known gap, awaiting the schema follow-up |

## Sign-off

Automated checks by: Claude  Date: 2026-10-21
Manual verification by: pending: the screens listed under Left for manual verification

Result: pass with accepted defects
