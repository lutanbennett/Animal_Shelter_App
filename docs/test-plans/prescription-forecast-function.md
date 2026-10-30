# Feature test plan — prescription-forecast-function

## Header

| | |
|---|---|
| Feature | Medicine forecast switched onto the recurring schedule and ticked rounds (stream 2 of 4) |
| Backlog item | `docs/backlog.md` → **PRESCRIPTIONS BECOME A RECURRING SCHEDULE** (left open: two of four streams outstanding) |
| Branch / worktree | `claude/prescription-forecast-function` @ `C:\Development\Animal_Shelter_prescription-forecast-function` |
| Dev server | not started — no UI surface changed |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | yes — `0284_forecast_reads_schedule.sql` |
| Tested at SHA | `e199635d` |

## 1. Scope and risk

- [x] Change is described in one sentence — the forecast functions read the schedule columns and ticked rounds instead of the frequency
- [x] Files/areas touched listed — `supabase/migrations/0284_*.sql`, `scripts/check-medication-rounds.mjs`, the decision file, this plan
- [x] Roles affected identified — none; no grant, policy or card changed. Anyone who can read the forecast sees the new figures
- [x] Out of scope written down — all of `src/`, the medication list's due logic, diets, `frequency_id`, `/admin/frequencies`, the form

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` — see PR body
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0284 against 0283, `check-migration-numbers` ok
- [x] `--status` reviewed before applying — dev 284 applied, 1 pending
- [x] `--dry-run` reviewed — `0284 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded — `applying 0284_forecast_reads_schedule.sql … ok`
- [x] File is re-runnable — create or replace throughout, no data written
- [x] Existing rows still read correctly — md5s before/after over 72 prescriptions and two windows: exactly one prescription changed (the 0-tick dev test row on the fix list), all others identical; see decision file
- [x] Synthetic schedules through `jsonb_populate_record(null::prescriptions, …)`: Mon+Thu = 9 in Nov, every other day = 15, every other week = 5, monthly on the 31st = 4 across Jan-Apr 2027, {30,31} in February = 1, every 2 months = 3, as needed = 0, end date bounds = 10. All matched hand counts
- [x] Down-migration not needed — functions only; re-apply 0044/0124/0143's bodies to restore
- [x] Production apply plan — with the release that carries 0283; fix list re-run `--env production` immediately before; never applied to production here

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface (the DB constraint is exercised in the harness)
- [ ] Boundary cases — n/a: no UI surface (weekday 8, day 32, every 0 exercised in the harness)

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| any | prescriptions | unchanged | n/a — no policy touched |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] Blocked server-side — n/a: no new access rule

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: nothing user-visible yet
- [ ] Translatable strings — n/a: Thai for Night is in the rounds row, to be confirmed by the Director
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest checks still work — `check-medication-list-due` 27/27; `check-medication-rounds` 75/75 GREEN (two vocabulary assertions restated for four rounds); `check-medical-soft-delete` HARNESS-OK; cashflow_forecast runs
- [ ] Shared file touched checked from an unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` was broken — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately open; three of its four streams are still to come
- [x] Decision recorded — `2026-10-30-prescription-forecast-function.md`
- [x] `README.md` still accurate — it does not list columns
- [ ] **Release notes.** — n/a: 0283 and 0284 are not on production yet
- [x] Commit messages say why
- [x] Claims were measured — hashes and harness output, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing reads the schedule yet
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] Migration and reading code in one PR? — readers unchanged and signature-compatible; the pages call the same function names and columns
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: functions only, no data written
- [x] Apply plan stated — with the app stream's release

### Rollback

- [x] Rollback position — code rollback is safe (same signatures); schema undo: re-apply the previous function bodies (0044, 0124, 0143) and drop the two new helper functions

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | The 0-tick dev test row (Capwarn Test 0924, AMC 500) now forecasts 0 doses; it is the fix-list row | accepted — disposable test data, the design working |
| 2 | info | `due.ts` / the medication list still read the frequency | accepted — the app stream's rebuild; they do not call the forecast |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
