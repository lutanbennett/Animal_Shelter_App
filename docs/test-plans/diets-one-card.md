# Feature test plan

## Header

| | |
|---|---|
| Feature | Settings → Diets opens on one card, Set up diets (`diets.settings`) |
| Backlog item | `docs/backlog.md` → `#d3cw7`, `/admin/diets` gets one card |
| Branch / worktree | `claude/diets-one-card` @ `C:\Development\Animal_Shelter_diets-one-card` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude (Opus 5.5), 2026-11-09 |
| Carries a migration? | yes, `0340_diet_settings_card.sql` |
| Tested at SHA | 93be5be7 (code; this plan is committed on top) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every Settings → Diets screen and save asks one new activity, `diets.settings`, held by one new card, instead of `reference.types` Edit and `stock.diets` Edit together
- [x] Files/areas touched listed: `supabase/migrations/0340_diet_settings_card.sql`; `src/lib/permissions/{catalogue,cards,routes,item-settings}.ts`; `src/app/admin/diets/*` (four pages, two action files); `src/lib/diets/recipe-book.ts`; `src/app/management/units/actions.ts` (diet branch); `src/app/deliveries/{page.tsx,promote-actions.ts,PromoteOffers.tsx}`; `src/app/management/diets/page.tsx` (one link); en/th dictionaries; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `scripts/check-cards-count.mjs`, `scripts/check-permission-catalogue.mjs`, `scripts/lib/permission-probes.mjs`, `src/lib/permissions/cards.test.mjs`
- [x] Cards affected identified: new card `diet_settings` (holds `diets.settings` only). `food_forecast` unchanged. Context, transient: on dev no role holds a card granting `reference.types` or `stock.diets` Edit, so Admin alone used this page before and nobody holds the new card yet. Admin unaffected (bypass); signed-out public unaffected
- [x] Out of scope written down: Settings → Units still asks `canEditItemSettings` for both kinds (unchanged on purpose); medicine conversions' write policy asking `stock.diets` (found, reported for the planner); `/management/diets`, medications, `check-production.mjs`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` is `0`:

```
=== gates: typecheck exited 0 after 92s
=== gates: lint exited 0 after 267s
=== gates: test exited 0 after 32s
=== gates: build exited 0 after 287s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (0339), and no other in-flight branch carries one (the migration-number hook checked against `origin/main`)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (341 applied, 1 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (`dry-run 0340_diet_settings_card.sql … ok`)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`on conflict … do update`, `drop policy if exists` before each `create policy`, `create or replace function`)
- [x] Existing rows still read correctly after the change: the recipe book drew three diets with their lines, the ingredient list, and *2 residents on it* for the standard diet from `diet_usage()` on real dev rows
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness run as the one-card login (`request.jwt.claims` set to its user, role `authenticated`): asserted it holds `diets.settings` and neither old cell; read `units` and `diet_usage()`; inserted an ingredient, a diet, a line and a measure (`item_kind = 'diet_type'`); updated the diet (one row) and deleted the measure and the diet (one row each); read zero `resident_diets` rows and zero medicine measures. Result `PASS diet_settings alone`. The file's own `do $report$` block also asserts the activity, the single grant, the feature and the seventeen policies
- [x] Down-migration not written, the reason: the change is purely additive (one activity, one card, seventeen new permissive policies, one function); the file's header gives the undo order
- [x] Production apply plan stated: `0340_diet_settings_card.sql` on `dbkodyyxxhtygxcxmfcu`, applied **before** the deploy that carries this code, because the pages call `diet_usage()` and open on `diets.settings`

## 4. Functional checks

- [x] Happy path works end to end: as a login holding exactly `diet_settings`, Home → Set up diets → recipe book → Ingredients → Pumpkin → note typed → Save → *Saved.*
- [x] Data persists: the note read back from `diet_types` in the database
- [x] Create / edit / delete all exercised: edit in the browser; create, update and delete of ingredient, diet, line and measure in the rollback harness as the same login
- [ ] Empty state renders sensibly — n/a: no rendering of an empty book changed; the pages' empty states are untouched
- [ ] Invalid input is rejected with a readable message — n/a: no validation changed; the actions' parsing is untouched
- [ ] Boundary cases checked — n/a: no input handling changed; the change is which activity is asked

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | not driven: the `perms.isAdmin` bypass and `has_permission()`'s Admin branch are unchanged, and `diet_usage()` asks `has_permission` | everything | not driven |
| exactly `diet_settings` | Home tile *Set up diets*; `/admin/diets`, ingredients, an ingredient's page; save | tile, page and save work; no Stock link | as expected (screenshots `shots/diets-one-card-home.jpg`, `-book.jpg`, `-save.jpg`) |
| exactly `food_forecast` (`stock.diets` Read; no card grants `reference.types`, so this is the nearest half-holder) | Home tile *See the food forecast*; Diet stock | no diets tile, no link into Settings → Diets, `/admin/diets` refused | as expected; direct load of `/admin/diets` served no book and landed on `/no-access` (`shots/diets-one-card-half-holder.jpg`) |
| signed out | not driven | the proxy sends every app page to `/login` | not driven; unchanged |

- [x] Every login above tested, or marked not driven with the reason
- [x] A login that should not have access is blocked server-side (`food_forecast` fetching `/admin/diets` got no recipe book and was sent to `/no-access`)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: `/admin/diets` is `menu: false`; it is reached by its card's tile, which was drawn
- [x] Manual updated (`src/lib/manual/en.ts`): three sentences said an admin or the setup-lists card keeps Settings → Diets; they now name the Set up diets card
- [x] Translatable strings go through the translation path: card label, description, activity label and the refusal key are in both `en.ts` and `th.ts` (`check-sql-refusal-keys.mjs` confirms the key is worded in both)
- [ ] Mobile viewport (375px) — n/a: no layout changed; one link is now conditional
- [x] Browser console clean — `read_console_messages` (errors only) returned none at the end of the drive; it holds the current page's messages, so this is weaker than a per-page read
- [x] Network clean — the save POST returned 200 (`updateDietDefinition` in the dev server log)

## 6. Regression

- [x] The pages nearest the change still work: `/admin/diets`, `/admin/diets/ingredients`, an ingredient's page, `/management/diets` (as `food_forecast`), `/home`
- [x] Shared file touched (`routes.ts`, `cards.ts`, `recipe-book.ts`) checked from a second page by loading it: `/home` drew both logins' tiles from `cards.ts`/`routes.ts`, and `/management/diets` loaded as `food_forecast`
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (`#d3cw7`, with what closed it)
- [x] Non-obvious design choices added: `docs/decisions/2026-11-08-diets-one-card.md`
- [ ] `README.md` still accurate — n/a: the README does not describe cards or Settings → Diets
- [x] **Release notes.** `unreleased` gained a line tagged `cards: ["diet_settings"]`, telling Admin the new card exists and that nobody holds it yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: the live policies, foreign keys and the absence of any card granting the two old cells were read from dev on 2026-11-09

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: `diet_usage()` uses `shelter_today()`, the same shelter date the page used before through `todayIso()`; no new date logic
- [ ] **For a boundary or banding change** — n/a: no threshold or band changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** Yes: `0340` must be applied to production before the deploy (the pages open on `diets.settings` and call `diet_usage()`)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only — n/a: additive only
- [x] Apply plan stated: `0340_diet_settings_card.sql`, production project `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [x] Rollback position stated: the Pi rebuild at the previous SHA reverts the code; 0340 can stay applied (additive: an unheld card and extra permissive policies keyed on an activity nobody holds). The old code would read `resident_diets` again and ask the two old cells, as before

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `item_unit_conversions` write policies ask `stock.diets` for medicine rows too | not this item; reported in the PR for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the browser drive was done by Claude and is signed above; nothing is left for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file rather than pasting it
- [ ] Handed to the production release manager — pending: the production release manager's pre-deploy pass

Result: pass

Release manager acknowledgement: pending: the production release manager's pre-deploy pass
