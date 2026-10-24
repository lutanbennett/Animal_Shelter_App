# Feature test plan — diets-and-stock-switches-schema

## Header

| | |
|---|---|
| Feature | 0254: diet forecasts read per-serving columns; two Stocktaking switches (schema only) |
| Backlog item | `docs/backlog.md` → "Simplify diets to one serving recipes"; "TWO Stocktaking ON/OFF switches" |
| Branch / worktree | `claude/diets-and-stock-switches-schema` @ `C:\Development\Animal_Shelter_diets-and-stock-switches-schema` |
| Dev server | n/a: no UI surface, no src/ change |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | yes |
| Tested at SHA | af16f8b3 |

## 1. Scope and risk

- [x] One sentence: the two forecast functions now read qty_per_serving x servings, and two default-on Stocktaking switches exist on site_content; both match the backlog items' schema halves
- [x] Touched: supabase/migrations/0254_*.sql, scripts/check-diets-forecast-functions.mjs, two decision files, docs/backlog.md notes, this plan. No src/
- [x] Roles affected: none visible. The switch guard concerns Admin at 2-step only; the functions feed Management and Admin pages
- [x] Out of scope: dropping qty_small/medium/large, 0250's bridge trigger, both Settings screens, any reader of the switches

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (this repo's script also runs test)

```
=== gates: build exited 0 after 223s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Number 0254 is one above the highest on main (0253); no other branch carries a migration
- [x] `--status` reviewed: 254 applied, 1 pending before applying
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev (qxkmhwybjggxvsfxsxbd), recorded in schema_migrations
- [x] Re-runnable: create or replace, add column if not exists, drop trigger if exists
- [x] Existing rows read correctly: hand check on dev, 2026-10-24, one day, six ingredients: an independent sum over the raw rows (qty_per_serving x servings(size) x portion_factor x conversion) equals diet_forecast for every ingredient (Standard Kibble 59.5, Egg 119, Oats 2380, Turkey mince 5950, Green beans 1190, Renal diet 77)
- [x] Harness scripts/check-diets-forecast-functions.mjs (rolled back, dev) asserts: exact-proportion recipe forecasts the same quantity and cost before and after for both functions and equals the hand formula (Medium 1.5 servings, 10 days = 3000); servings drive the figure; no null qty_per_serving; switches default true; non-admin refused; Admin at aal1 refused; Admin at aal2 allowed; one audit row per change and none for a website edit, naming the Admin and carrying only the switches; a no-login script allowed. 5 diet types differ before/after over all dev data, which are the dev out-of-proportion lines (test data)
- [x] Down-migration not needed: functions are restorable from 0239, the columns are additive defaults, triggers are droppable
- [x] Production apply plan: file 0254 to dbkodyyxxhtygxcxmfcu with the release; no ordering constraint (nothing reads the switches; production forecast figures do not move)

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface; covered by the harness above
- [ ] Data persists — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface; the guard's refusals are asserted in the harness
- [ ] Boundary cases — n/a: no UI surface; Small/Medium/Large and portion_factor covered by the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | no page or route changed | n/a | n/a |

- [ ] Every role above tested — n/a: no page or route changed; guard asserted for non-admin, Admin aal1, Admin aal2
- [ ] Unauthorised access blocked server-side — n/a: the server-side block is the trigger, asserted in the harness

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no UI surface, the app half documents the switches
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest pages are the forecasts' callers (Management Diets, Purchasing, Stock usage); functions keep their signatures and grants, and the same hand check passes through diet_forecast
- [x] No shared file touched (NavLinks, manual, shared libs); docs/backlog.md edited on two lines only
- [x] Nothing merged from main during sync (already up to date)

## 7. Documentation

- [x] Backlog items noted on this branch, both marked schema-done with the app halves still open
- [x] Two decision files, one per subject: diet-forecasts-per-serving and stocktaking-switches-schema
- [ ] README — n/a: nothing in README describes the forecast arithmetic or these settings
- [ ] **Release notes.** n/a: the forecast figures are unchanged (production is in proportion on every line, so the new arithmetic returns what the old one did) and the two switches default on and no code reads them yet, so no screen changes
- [x] Commit messages say why
- [x] Claims were measured: production 0 lines out of proportion (2026-10-24 14:20), dev 8 lines out of proportion, harness output above; none reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing derives today; the forecasts take their dates as arguments
- [ ] Boundary/banding — n/a: no threshold or band changed
- [ ] Evidence is the tool's actual output — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: public_site_content does not list the new columns, no public page changed
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration and reader code together — n/a: no code reads the new columns, and the functions keep their shape
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — n/a: additive columns and function replacement, nothing destructive
- [ ] Apply plan stated — deferred: release manager (file 0254, project dbkodyyxxhtygxcxmfcu, any time relative to the deploy)
- [ ] Rollback — deferred: release manager (re-apply 0239's two functions; the additive columns can stay)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Settings -> Recent changes has no label for the switch audit rows | deferred to backlog: the app half |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the release manager reads it from the branch at release time

Result: pass

Release manager acknowledgement: n/a: not yet released
