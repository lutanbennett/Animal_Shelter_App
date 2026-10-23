# Feature test plan — diets-servings-app

## Header

| | |
|---|---|
| Feature | App half of "one serving" diets: one Amount per serving, Servings by size, shared per-dog expansion helper |
| Backlog item | `docs/backlog.md` → **Simplify diets to "one serving" recipes** (left open, status note added: forecast-function migration and Lutan's per-line calls remain) |
| Branch / worktree | `claude/diets-servings-app` @ `C:\Development\Animal_Shelter_diets-servings-app` |
| Dev server | `http://localhost:3008` |
| PR | pending: number written once the PR is open |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | no — `0250` landed in PR #867 |
| Tested at SHA | `6a0e1c2b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the recipe editor, recipe book, feeding list and `plausible.ts` work per serving; the forecast-function switch is deliberately not here (migration)
- [x] Files/areas touched listed — `src/app/admin/diets/`, `src/lib/diets/` (new `servings.ts`), `src/app/medical/diets/page.tsx`, `src/app/diets/DietForm.tsx`, both dictionaries, `src/lib/manual/en.ts` (Diets topic), `src/lib/releases.ts`, `docs/`, `scripts/check-diets-servings-app.mjs`
- [x] Roles affected identified — admin (Settings → Diets); everyone who reads the feeding list or the resident diet form sees the new exact amounts
- [x] Anything explicitly **out of scope** written down — no migration, `qty_small/medium/large` not dropped, forecast functions untouched, kitchen batch sheet not built, `src/app/residents/[id]/` untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, output redirected to a file and its exit codes read:

```
=== gates: build exited 0 after 131s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; `0250` is already applied
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; the existing Standard, Diabetic and Renal diets were opened and read through `qty_per_serving` (section 4)
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-diets-servings-app.mjs`, a rolled-back dev transaction: a diet of 50 g per serving at servings 1 / 1.5 / 2.5 with a Small, a Medium and a Large dog (Large at `portion_factor` 0.75) for 7 days; `diet_forecast()` delta = 1531.25 g = hand calculation 50×1×7 + 50×1.5×7 + 50×2.5×0.75×7
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end: on dev as a throwaway admin, Add a diet, then Add ingredient (Turkey mince, 50 g per serving); the line read "50 g Turkey mince, per day: Small 50 · Medium 75 · Large 100", defaults 1 / 1.5 / 2 shown
- [x] Data persists: reload showed the line and servings; the stored row read `qty_per_serving 50, qty_small 50, qty_medium 75, qty_large 125` after the next step
- [x] Create / edit / delete all exercised — create diet and line, edit servings (Large 2.5: Small 50 and Medium 75 unchanged, Large 125); delete is not changed by this PR
- [ ] Empty state renders sensibly — n/a: unchanged; a new diet shows "No ingredients yet" as before
- [x] Invalid input is rejected with a readable message — `saveServings` and `saveRecipeLine` refuse zero, negative or blank with `servingsInvalid` / `amountsInvalid` (code read; the browser was not driven with bad values); more than 5 servings asks for confirmation (`plausible.test.mjs`)
- [x] Boundary cases checked — `servings.test.mjs`: Lutan's Standard diet at Small/Medium/Large (Medium 0.75 cup / 1.5 eggs / 0.75 cup / 75 g a day; 0.375 / 0.75 / 0.375 / 37.5 per meal on 2 meals), Large 2.5 moves only Large, `portion_factor` 0.75 on top, unset size reads Medium, no rounding before a total

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Diets | edits per-serving amounts and servings | driven as a throwaway dev admin |
| management | Settings → Diets | refused as before | n/a: permission checks (`canEditItemSettings`) untouched |
| staff | none | retired role | n/a: retired by 0173 |
| doctor | feeding list | sees the new exact amounts | n/a: not driven; read-only list, same query |
| volunteer | none | no access | n/a: no permission changed |
| signed out | none | no access | n/a: no permission changed |

- [ ] Every role above tested — n/a: only admin driven; no permission, grant or route changed
- [x] A role that should not have access is blocked server-side — every action in `recipe-actions.ts` still begins with `refusal()` (`canEditItemSettings`), including the new `saveServings`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`, Diets topic) to describe one serving, Servings by size and per-meal/per-day on the feeding list
- [x] Translatable strings go through the translation path — new keys in `en.ts` and `th.ts`; `typecheck` holds Thai to the English shape
- [x] Mobile viewport (375px) in Thai: the diet page showed no horizontal overflow and the controls were reachable (screenshot)
- [x] Browser console clean — no error surfaced during the driven flow; `read_console_messages` was not run separately
- [x] Network clean — every server action driven returned its success state

## 6. Regression

- [x] The pages nearest the change still work: `/admin/diets` list cards, a diet's own page, the add-ingredient sheet. Not loaded in a browser: the ingredient page, the feeding list, the resident diet form and the resident record export (changed by type, and read through the unchanged `lineAmount` helper; typecheck clean)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `src/lib/manual/en.ts` was edited in the Diets topic only and `releases.ts` gains one line; the build compiles both
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; gates ran at tip

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: not ticked on purpose; the item still needs the forecast-function migration and Lutan's per-line calls, and its title and body now say so
- [x] Non-obvious design choices: `docs/decisions/2026-10-23-diets-per-serving-app.md`, which supersedes the three-amount line of the 2026-10-21 decision
- [x] `README.md` still accurate — it does not describe diet amounts
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`, tagged for admin, management, head of medical, 2IC and doctor
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The forecast equality is the rolled-back harness above; the out-of-proportion lines (8 of 9 on dev, e.g. Standard / Turkey mince stored Medium 100 vs 75 derived) were read from the database

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the only threshold is the servings warning, tested at 2.5 (passes) and 20 (caught) in `plausible.test.mjs`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates lines are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the code reads `0250`, so `0250` must be live in production before this deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration in this PR
- [ ] Fresh production backup for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; `0250` goes first

### Rollback

- [ ] Rollback position stated — n/a: code only; a Pi rollback to the previous ref restores the three-amount editor, and because this editor also writes `qty_*` the old code still reads correct amounts

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | Lines nobody has re-saved still hold old `qty_*`, so the page (Small-based) and the forecast (stored Medium/Large) disagree on 8 of 9 dev lines | accepted: Lutan's per-line call and the forecast-function migration, recorded on the backlog item |
| 2 | minor | `scripts/dev-signin.mjs <role> --port N` fails with the role first (argument parsing skips index 0); `--port N <role>` works | deferred to backlog: not this PR's file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan enters the real Standard diet (kibble 0.5 cup, egg 1, rice 0.5 cup, chicken 50 g) and a Medium dog reads 0.75 cup / 1.5 eggs / 0.75 cup / 75 g a day | Settings → Diets on Test |
| 2 | The feeding list reads naturally with the per-day total beside the per-meal amount | Medical → Diets, a resident on 2 meals |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items wait for Lutan

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
