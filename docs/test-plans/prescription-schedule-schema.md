# Feature test plan — prescription-schedule-schema

## Header

| | |
|---|---|
| Feature | Schema half of the recurring prescription schedule: day-pattern columns, the Night round, the dose-count fix list |
| Backlog item | `docs/backlog.md` → **PRESCRIPTIONS BECOME A RECURRING SCHEDULE** (left open: three of four streams outstanding) |
| Branch / worktree | `claude/prescription-schedule-schema` @ `C:\Development\Animal_Shelter_prescription-schedule-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | yes — `0283_prescription_schedule.sql` |
| Tested at SHA | `3013e5bd` |

## 1. Scope and risk

- [x] Change is described in one sentence — additive schema for a recurring prescription schedule plus a Night round, forecast untouched
- [x] Files/areas touched listed — `supabase/migrations/0283_*.sql`, `scripts/check-prescription-schedule-backfill.mjs`, the decision file, this plan
- [x] Roles affected identified — none; no grant changes. Visible by card: anyone who can open the prescription form will see a Night tick box
- [x] Out of scope written down — all of `src/`, the forecast functions, diets, `frequency_id`, `/admin/frequencies`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` — see PR body
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0283 against 0282, `check-migration-numbers` ok
- [x] `--status` reviewed before applying — dev 283 applied, 1 pending
- [x] `--dry-run` reviewed — `0283 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded — `applying 0283_prescription_schedule.sql … ok` (re-applied once after a constraint fix; see decision file)
- [x] File is re-runnable — if not exists, drop/add constraint, on conflict, back-fill only where null
- [x] Existing rows still read correctly — md5 of `prescription_doses_between()` over 72 prescriptions (two windows) and of `medication_forecast()` identical before and after
- [x] Harness in `begin … rollback`: Mon+Thu stored; monthly on 31 stored; as-needed (all null) stored; weekday 8, every 0, weekdays on a day pattern, day 32 and an orphan `every` all refused; forecast unchanged after setting a pattern; night is medication-only and refused on a diet. Result: PASSED (rolled back). It caught a real null-in-CHECK bug, fixed
- [x] Down-migration not needed — additive; drop the constraint, four columns and the night row to undo
- [x] Production apply plan — with the app stream's release, after the fix list is run `--env production`; never applied to production here

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

- [x] Nearest checks still work — `check-medication-list-due` 27/27; `check-medication-rounds` 2 of 75 fail, see Defects
- [ ] Shared file touched checked from an unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` was broken — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately open; three of its four streams are still to come
- [x] Decision recorded — `2026-10-30-prescription-schedule-schema.md`
- [x] `README.md` still accurate — it does not list columns
- [ ] **Release notes.** — n/a: schema only; the schedule has no UI and the forecast is not switched over
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

- [x] Migration and reading code in one PR? — no; `-- consumer: none`; the readers are the next streams
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: additive columns and one lookup row; the back-fill sets only new columns
- [x] Apply plan stated — with the app stream's release

### Rollback

- [x] Rollback position — nothing reads the new columns, so code rollback is safe; schema undo: drop constraint `prescriptions_schedule_shape`, the four `schedule_*` columns, and the `night` round

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `check-medication-rounds.mjs` fails 2 vocabulary assertions (now four rounds); brief forbids editing existing checks | accepted — handed to the app stream in the decision file |
| 2 | info | A Night tick box appears on the prescription form (it lists every medication round) | accepted — specified by the brief; harmless to the forecast |
| 3 | info | Fix list shows 1 dev test row (Twice daily, 0 ticks) | accepted — disposable test data |

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
