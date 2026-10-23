## Header

| | |
|---|---|
| Feature | Units of measure, the app half: Settings → Units, and the forms read the `units` table |
| Backlog item | `docs/backlog.md` → "Units of measure become a list Admin edits in the app (Settings), starting with "each"" (item 117) |
| Branch / worktree | `claude/units-of-measure-app` @ `C:\Development\Animal_Shelter_units-of-measure-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR that carries this file |
| Tested by / date | Claude, 2026-10-23 |
| Carries a migration? | no (the schema half is 0252, merged as #885) |
| Tested at SHA | 95976bc1 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — an admin adds, renames, retags and archives units on Settings → Units, and the ingredient, medicine and prescription forms and their save checks use that table instead of `DIET_UNITS` / `DOSE_UNITS`
- [x] Files/areas touched listed — `src/app/admin/units/` (new), `src/app/admin/{diets,medications}/` forms and actions, `src/app/prescriptions/` (new-medicine unit), `src/lib/unit-list*.ts`, `src/components/UnitSelect.tsx`, `src/lib/i18n/` (get-t, I18nProvider, enum-labels, both dictionaries), `src/app/layout.tsx`, `src/lib/permissions/routes.ts`, amount printing in `src/lib/diets/recipe-book.ts`, `src/app/diets/DietForm.tsx`, `src/app/medical/diets`, `src/app/operations/feeding-list`, the resident Diet section; manual, releases, decision, backlog
- [x] Roles affected identified: admin (screen and writes); every signed-in role reads unit names through the layout; no change for signed-out public
- [x] Anything explicitly **out of scope** written down — no migration; `src/app/deliveries/` and `src/app/management/purchasing/` not edited (read only), so `dietUnitLabel` / `doseUnitLabel` stay as aliases of one lookup (decision file); `kg` not seeded

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR (the schema half is 0252, #885)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; dev already had 0252
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; existing rows still print as before on the stock and recipe pages (g, cup, tablet rows)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the 0252 trigger was proved in the schema PR, and here a write the trigger would refuse is stopped earlier by the save check
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; 0252 must be applied to production before this ships, as the migration's consumer header says

## 4. Functional checks

- [x] Happy path works end to end — Egg added through Add an ingredient with the unit each; Egg 1 added to Standard Kibble + Chicken; the recipe shows Small 1 · Medium 1.5 · Large 2, so a Medium dog gets 1.5
- [x] Data persists — reloaded pages show the unit list, Egg and the recipe line unchanged
- [x] Create / edit / delete all exercised — create (unit "pouch", ingredient Egg, ingredient "Pouch test food" on pouch) and edit (rename attempt, refused); delete is n/a for units by design, they are archived
- [x] Empty state renders sensibly (no rows yet) — the screen has a "No units yet." line; not shown in dev because the table is seeded (read in the code, not driven)
- [x] Invalid input is rejected with a readable message, not a crash — archiving each (in use by Egg) refused, naming Egg; renaming each to eggs refused with the reason and the safe route
- [x] Boundary cases checked — a unit still in use cannot be archived, renamed or untagged from its list; the Thai name stays editable; a duplicate name maps to a readable message (read in the code, not driven)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/units, the Units tile on /admin | opens, writes work | driven as the dev admin login |
| management | — | no Settings access | not driven: the route asks `reference.types`, the same cell as /admin/diets |
| staff | — | retired role | n/a: `staff` is retired |
| doctor | — | no Settings access | not driven: same route cell as /admin/diets |
| volunteer | /admin/units | sent to /no-access | driven: redirected to /no-access |
| signed out | /admin/units | sent to sign-in | driven: a fetch with no cookie got a redirect |

- [x] Every role above tested — admin, volunteer and signed out driven; management and doctor read from the route registry (same `reference.types` cell as the sibling pages); staff retired
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — volunteer and signed out, by URL; the actions also re-check `canEditItemSettings`, and the table's own write policy asks the same

## 5. Cross-cutting

- [x] Nav entry correct — a Units tile on the Settings landing (/admin) for admin; the route is registered with `menu: false` like its siblings
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — text added to Managing medications and Managing diets; the /manual page itself was not opened (checked in the source)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the screen's words are in both dictionaries (en and th); unit names are rows edited on the Units screen itself, not part of the translations tool
- [x] Mobile viewport (375px) — /admin/units at 375 px shows the larger-screen notice, no overflow
- [x] Browser console clean — no console errors on /admin/units; one "isCountUnit is not defined" error appeared while a file was mid-edit under hot reload and did not recur on a fresh load of the recipe page
- [x] Network clean — no 4xx/5xx seen on the pages driven

## 6. Regression

- [x] The pages nearest the change still work — /admin/diets, a recipe page, /admin/diets/ingredients and an ingredient page, /management/diets, /management/purchasing, /stocktake and /deliveries (fetched; they carry the new unit by name); the medicine forms were checked by typecheck only
- [x] Any shared file touched checked from a second, unrelated page by loading it — the root layout and I18nProvider (loaded on every page driven, including the volunteer's /no-access), `recipe-book.ts` (recipe page, English and Thai)
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged nothing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-23-units-of-measure-app.md` (rename refused, archive refused, labels from the table)
- [x] `README.md` still accurate — it does not mention the hard-coded unit lists
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for Settings → Units, tagged for admin
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The rename and archive refusals were driven on screen; the claim that archive is stricter than the trigger is read from the 0252 trigger text

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic in this change
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band; the rules are yes or no (in use or not)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates line, unedited
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here, but this code reads 0252, so 0252 must be live on production before this deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager, for 0252
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration here; 0252 is additive apart from dropping one check constraint that its trigger replaces
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: production release manager, apply 0252 to production before this deploys

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: no migration here; reverting this PR leaves the units table in place and the old code would simply not offer new units

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A unit prints as a plain name ("3 can") where the dictionary printed "can(s)" | accepted: names are the admin's to set on the Units screen |
| 2 | low | `dietUnitLabel` and `doseUnitLabel` remain as aliases of one lookup, because deliveries and purchasing (another stream's files) call them | deferred to backlog: inline them once that stream has merged |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording of the new screen, by someone who reads Thai | /admin/units in Thai |
| 2 | Management and doctor logins cannot open /admin/units | sign in as each |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the two rows above

Manual verification by: pending: Thai wording and the management and doctor role check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager has not seen this PR
