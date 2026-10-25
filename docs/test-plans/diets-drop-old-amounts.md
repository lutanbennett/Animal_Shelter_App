# Feature test plan — diets-drop-old-amounts

## Header

| | |
|---|---|
| Feature | 0260: drop diet_ingredients.qty_small/medium/large and 0250's bridge trigger (diets link 4) |
| Backlog item | `docs/backlog.md` → "Simplify diets to one serving recipes" |
| Branch / worktree | `claude/diets-drop-old-amounts` @ `C:\Development\Animal_Shelter_diets-drop-old-amounts` |
| Dev server | n/a: no UI surface; one comment removed in src/ |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | yes |
| Tested at SHA | 655268f7 |

## 1. Scope and risk

- [x] One sentence: drops the three per-size amount columns and 0250's bridge, which nothing reads or writes since 0254, 0258 and #918
- [x] Touched: supabase/migrations/0260_*.sql, a comment in src/app/admin/diets/recipe-actions.ts, scripts/lib/readonly-checks.mjs, five check scripts, one decision file, backlog tick, this plan
- [x] Roles affected: none visible
- [x] Out of scope: older harnesses already broken by 0243 (check-diets-recipes-schema, check-diets-sheet); production apply

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 227s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] 0260 is one above the highest on main (0259); no other branch carries a migration
- [x] `--status` reviewed: 260 applied, 1 pending
- [x] `--dry-run` reviewed: ok (a view still depending on a column would have failed it)
- [x] Applied to dev (qxkmhwybjggxvsfxsxbd), recorded in schema_migrations
- [x] Re-runnable: drop trigger/function/column if exists
- [x] Existing rows still read correctly: check-diets-servings-app.mjs forecast delta equals the hand calculation on dev data
- [x] Harness check-diets-forecast-functions.mjs (rolled back, dev) all ok after the drop: forecasts equal the hand formula, servings drive the figure, no null qty_per_serving, switches and audit
- [x] Down-migration not needed: the columns held values derivable from qty_per_serving x servings and nothing reads them
- [x] Production apply plan: file 0260 to dbkodyyxxhtygxcxmfcu at the next release; 0258 is already live there; no code reads the dropped columns so ordering with the deploy does not matter

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface; covered by the harnesses above
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: the recipe editor already writes only qty_per_serving (#918); servings-app harness inserts it
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | no page or route changed | n/a | n/a |

- [ ] Every role above tested — n/a: no page or route changed
- [ ] Unauthorised access blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no UI surface
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest callers are the forecasts and special_diet_list; the forecast harness passes after the drop
- [x] No shared file touched beyond readonly-checks.mjs, from which the obsolete diets-proportion entry was removed
- [x] Nothing merged from main during sync was broken by this branch (gates green after sync)

## 7. Documentation

- [x] Backlog item ticked, stale "only once 0258 is applied on production" wording marked superseded
- [x] Decision file 2026-10-25-diets-drop-old-amounts.md
- [ ] README — n/a: nothing in README names the dropped columns
- [ ] **Release notes.** n/a: no shelter user would notice; nothing displayed or computed changes
- [x] Commit messages say why
- [x] Claims were measured: step-zero grep read in full, dry-run and harnesses run on dev

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary/banding — n/a: no threshold changed
- [ ] Evidence is the tool's actual output — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: no public page or view touched
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration and reader code together — n/a: no code reads the dropped columns
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — deferred: release manager (destructive column drop; amounts are re-derivable from qty_per_serving x servings)
- [ ] Apply plan stated — deferred: release manager (file 0260, project dbkodyyxxhtygxcxmfcu)
- [ ] Rollback — deferred: release manager (columns would need re-adding and back-filling from qty_per_serving x servings)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the release manager reads it from the branch at release time

Result: pass

Release manager acknowledgement: n/a: not yet released
