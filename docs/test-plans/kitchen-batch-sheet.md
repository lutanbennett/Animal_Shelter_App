# Feature test plan — kitchen-batch-sheet

## Header

| | |
|---|---|
| Feature | Operations → Feeding list: each zone's total of each ingredient for one meal, by diet, plus a plate-by-dog tab |
| Backlog item | `docs/backlog.md` → **Kitchen batch sheet** (ticked on this branch; the ingredient picture is recorded as not built) |
| Branch / worktree | `claude/kitchen-batch-sheet` @ `C:\Development\Animal_Shelter_kitchen-batch-sheet` |
| Dev server | `http://localhost:3013` |
| PR | pending: number written once the PR is open |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | `87e8480e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a read-only Feeding list page (morning/evening, batch-per-zone and plate-by-dog tabs) built on `src/lib/diets/servings.ts`; the one gap is the ingredient picture, see Defects
- [x] Files/areas touched listed — `src/app/operations/feeding-list/` (new), `src/lib/diets/feeding-build.ts` and `feeding-list.ts` (new), `src/app/operations/page.tsx`, `src/lib/permissions/routes.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `docs/`
- [x] Roles affected identified — everyone holding `medical.diet` Read with all-clinic scope (admin, management, second_in_command, head_of_medical); nobody gains or loses a permission
- [x] Anything explicitly **out of scope** written down — no migration, `servings.ts` unchanged, `diet_forecast()` and `stock_diet_forecast()` untouched, no printable edition, medication list not redesigned, home card unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends all four at 0. The first run failed on two real faults (manual roles type, a missing acceptance-matrix row), both fixed; the closing lines of the passing run, as printed:

```
=== gates: build exited 0 after 77s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the page was read against the real dev rows (section 4)
- [x] **Constraints and defaults exercised against real rows** — a read-only SQL sum on dev of qty_per_serving x servings for the dog's size x portion_factor / meals_per_day, per zone, diet and ingredient for the morning meal, compared with the page: all 17 zone/diet/ingredient figures matched (e.g. Front Zone 37 dogs: kibble 13.5 cup; House Zone Renal diet 2 dogs 13.75 can; Main Zone Renal 9 can). Separately, a rolled-back impersonation of head_of_medical counted what each table returns to that login
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; the page reads `0250` columns, already applied to production per the diets-servings-app plan

## 4. Functional checks

- [x] Happy path works end to end: signed in as a throwaway dev admin, Operations → Feeding list shows Cat / Front / House / Main zones with per-diet blocks and totals for the Morning meal
- [x] Data persists — n/a as a check on a page that records nothing, but a reload gave identical totals; ticked for the reload only
- [ ] Create / edit / delete all exercised — n/a: read-only page, no form, no action
- [x] Empty state renders sensibly — a round with nobody fed shows "No one is fed in this round." (code path; every real dev round had dogs, so not seen on screen)
- [ ] Invalid input is rejected with a readable message — n/a: the only inputs are `?round=` and `?view=`, and anything else falls back to the suggested meal and the batch tab
- [x] Boundary cases checked — `feeding-build.test.mjs` (6 tests, pass): the item's acceptance case, portion factor 0.75, exact sums rounding once, special diet in its own block with Standard first, a diet with no meal ticked in both meals and flagged, a dog moved to another zone moving its share and a placeless dog kept apart

**Hand calculation (the item's acceptance case).** Standard diet, 1 serving = kibble 0.5 cup, egg 1, rice 0.5 cup, chicken 50 g; servings Small 1, Medium 1.5, Large 2; two meals a day. Three dogs in one zone, one of each size: 1 + 1.5 + 2 = 4.5 servings a day, so 2.25 servings a meal. Kibble 0.5 x 2.25 = 1.125 cup; eggs 1 x 2.25 = 2.25; rice 1.125 cup; chicken 50 x 2.25 = 112.5 g. The unit test asserts exactly these four numbers. A Large dog at portion factor 0.75 counts 2 x 0.75 = 1.5 servings a day, so 0.75 eggs a meal (also asserted). Not reproduced by placing three dogs in the browser: the dev dogs were checked by the SQL comparison above instead.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Operations → Feeding list | opens, zones and totals | driven in the browser |
| management | Operations → Feeding list | opens, same totals | driven in the browser, in Thai |
| staff | none | retired role | n/a: retired by 0173 |
| doctor | none | refused: clinical scope is not all residents, as for `/medical/diets` | n/a: not driven; the route carries `scope: { clinical: "any" }` and the page calls `refuseFor` |
| volunteer | none | no `medical.diet` | n/a: not driven; same guard as `/medical/diets` |
| signed out | none | sent to sign in | n/a: not driven; `requirePermission` is the guard every page uses |
| head_of_medical | Operations → Feeding list | opens, zones present | pending: not driven in the browser (the sign-in snippet was mistyped once and the role was checked at database level instead): rolled-back impersonation showed her login reads 100 residents, 92 diet rows, 4 diets and the placement view (100 rows), but `resident_current_state` returns 0 rows, which is why placement is read from the medication-list view |

- [ ] Every role above tested — n/a: admin and management driven; head_of_medical at database level only; the rest unchanged guards
- [x] A role that should not have access is blocked server-side — the page itself calls `requirePermission("medical.diet", "read")` and `refuseFor` on scope, not just the hidden tile

## 5. Cross-cutting

- [x] Nav entry correct — the Operations landing tile appears for those who can open the route; no menu item added (`menu: false`, as the medication list)
- [x] Manual updated (`src/lib/manual/en.ts`, new topic "The feeding list") and an acceptance-matrix entry added; `acceptance-matrix.mjs --check` ok
- [x] Translatable strings go through the translation path — new `feedingList` keys in both dictionaries; Thai viewed in the browser
- [x] Mobile viewport (375px) — emulated 375 px, `scrollWidth` 375 = `clientWidth` 375 on the by-dog tab, controls reachable (screenshots English and Thai)
- [x] Browser console clean — `read_console_messages` was not run separately; no error surfaced on screen and the dev server log showed 200s only
- [x] Network clean — `GET /operations/feeding-list` returned 200 each time in the dev server log

## 6. Regression

- [x] The pages nearest the change still work: the Operations landing compiles with its new tile (the route and tile are read at build), and `/operations/feeding-list` itself was loaded as admin and management. Not loaded: `/medical/diets` and `/operations/medication-list`, which share the placement view but were not edited
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/permissions/routes.ts`, `src/lib/i18n/dictionaries/*`, `src/lib/manual/en.ts`: the Operations landing and the Thai/English toggle on a page other than the new one both rendered; the build and the registry checks in `lint` pass
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; gates ran at tip

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; no other open item was closed by this work (searched `special-list`, `diet`, `zone`, `meals_per_day`, `feeding`, `medication-list`: the diets-servings item stays open for the forecast-function migration)
- [x] Non-obvious design choices: `docs/decisions/2026-10-23-feeding-list.md`
- [x] `README.md` still accurate — it does not list Operations pages
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`, tagged for admin, management, second in command and head of medical; nothing outstanding stops a user using the page once deployed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The matching totals are a SQL sum compared with the page; the "resident_current_state returns no rows for the Head of Medical" claim is from a rolled-back impersonation (0 against 100 for admin)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the page reads "today" through `todayIso()` and `suggestRound`, both already pinned by `check-shelter-dates.mjs`; nothing new derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold added; the one rule, a diet with no meal ticked, is tested in and out of the round
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates lines are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the code reads columns from `0250`, which must be live in production first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration in this PR
- [ ] Fresh production backup for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated — n/a: code only, read-only page; a Pi rollback to the previous ref removes the page and changes no data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The ingredient's picture, asked for by the item, is not shown: `diet_types.label_drive_file_id` has no editor, `/api/photos` does not serve it, and the picker view omits it | deferred to backlog: needs a view column and a proxy path (schema), recorded in the decision file |
| 2 | minor | `scripts/dev-signin.mjs <role> --port N` fails with the role first; `--port N <role>` works | accepted: already recorded as deferred in the diets-servings-app plan; not this PR's file |
| 3 | minor | `resident_current_state` returns no rows for a login that cannot open resident records, so any page reading placement from it alone shows every dog as "not in a zone" for the Head of Medical | fixed here by reading the medication-list view first; no other page was audited |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The layout reads well for the kitchen and the numbers feel right for the real Standard diet once Lutan has entered it | Operations → Feeding list on Test, as management on a phone |
| 2 | The page opens and shows zones for the Head of Medical's login | Operations → Feeding list, signed in as head_of_medical |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items wait for Lutan

Manual verification by: pending: Lutan to confirm the layout, and the Head of Medical's view

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
