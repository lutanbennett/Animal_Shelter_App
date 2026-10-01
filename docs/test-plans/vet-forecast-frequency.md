# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Cashflow vet line forecast from recent visit frequency |
| Backlog item | `docs/backlog.md` → "Base the vet forecast on recent visit frequency, not a flat per-visit estimate" |
| Branch / worktree | `claude/vet-forecast-frequency` @ `C:\Development\Animal_Shelter_vet-forecast-frequency` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | linked from the PR itself |
| Tested by / date | Claude (vet-forecast-frequency session), 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | `4b019ae` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the vet row of Cashflow is now `max(typical visits a week, visits booked that week)` costed per visit, computed in TypeScript (`src/lib/management/vet-forecast.ts`)
- [x] Files/areas touched: `src/lib/management/vet-forecast.ts` (new), `src/app/management/cashflow/page.tsx` and `CashflowView.tsx`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/`. Nothing under `supabase/` or `worker/`
- [x] Roles affected: admin and management only (the page is behind `requireManagementUser()`)
- [x] Out of scope: changing `cashflow_forecast` (it still returns vet rows, now ignored by the page), the Thai manual (none exists), and the rate dividing by a full 90 days when the history is shorter

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` was already merged in; nothing arrived during the work
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 67s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration, the rule is computed in TypeScript
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: the real exported `vetForecast` was run on fixed inputs (cases below). The page itself was not driven, because the browser pane refused navigation to localhost:3003; that is in Left for manual verification
- [ ] Data persists — n/a: read-only page, nothing is saved
- [ ] Create / edit / delete — n/a: read-only page
- [x] Empty state: no history and nothing booked forecasts 0 with `historyVisits` 0, which is what makes the note say "no typical rate… an empty month means nothing is booked" (asserted on the data; the wording was not seen on screen)
- [ ] Invalid input is rejected — n/a: no input changed, the window picker is untouched
- [x] Boundary cases, all asserted and passing: one booked visit with a cost against a typical 1.63 a week gives its own cost plus 0.63 of the unit cost; two booked with costs where the typical is lower gives booked only and basis `actual`; a window straddling a month end sums to the window total (two weeks at 7 a week at ฿100 is ฿1,400, with 6 days in October); three invoices replace the flat estimate with their mean and two do not; no estimate and no invoices leaves a "not priced" gap rather than a silent 0; a window entirely in the past forecasts 0

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/cashflow` | unchanged | n/a: guard untouched, not run |
| management | `/management/cashflow` | unchanged | n/a: guard untouched, not run |
| staff | n/a | refused as before | n/a: guard untouched |
| vet | n/a | refused as before | n/a: guard untouched |
| volunteer | n/a | refused as before | n/a: guard untouched |
| signed out | n/a | refused as before | n/a: guard untouched |

- [ ] Every role above tested — n/a: no access rule changed; the two new reads are plain `vet_appointments` selects under the existing RLS, which the RPC they replace already depended on
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated: the Cashflow topic in `en.ts` gained a step on the vet rule (not viewed at `/manual`)
- [x] Translatable strings: the new strings are in both `en.ts` and `th.ts` dictionaries, and typecheck enforces parity (not checked at `/management/translations`)
- [ ] Mobile viewport — n/a: only a note paragraph under the table changed, and it wraps like its neighbours
- [ ] Browser console clean — n/a: page not loaded, the browser pane refused localhost; see Left for manual verification
- [ ] Network clean — n/a: page not loaded, the browser pane refused localhost; see Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not loaded; typecheck and build, which compile the page, pass
- [ ] Any shared file touched checked from a second page — n/a: `manual/en.ts` and the dictionaries changed only by an added step and replaced vet strings, no other page loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-01-vet-forecast-frequency.md`, all four decisions including the empty case
- [ ] `README.md` still accurate — n/a: it does not describe the vet forecast
- [x] **Release notes.** `unreleased` has a line for admin and management
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the worked figures come from running the real exported function

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager at deploy
- [ ] Timezone-sensitive behaviour proved — n/a: dates go only through `todayIso()` and `addDaysIso()`, and the week and month boundaries are asserted above; whether the deployed build agrees is left for manual verification
- [ ] Boundary or banding assertions cover both edges — n/a: the week-split and month-end cases above cover both sides; no threshold other than the 3-invoice rule, which is asserted at 2 and 3
- [ ] Evidence pasted is the tool's actual output — n/a: the only pasted evidence is the unedited gates lines
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager at deploy
- [ ] `strip-baked-env` seen — deferred: release manager at deploy
- [ ] Any new secret or env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. It is code and docs only, with no schema, so there is nothing to undo in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | While building, two scripted edits to the page silently did not apply (mixed line endings) and typecheck caught it | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Does the vet figure look right to you? Compare a month against the visits booked and the note's rate and cost per visit | `/management/cashflow`, 30 and 90 day windows |
| 2 | The note under the table reads correctly, in English and Thai, and the vet column header still says estimated | `/management/cashflow` |
| 3 | Console and network are clean on that page (the browser pane refused localhost during this work) | `/management/cashflow` |
| 4 | The no-history wording, if a dev database with no completed visit in 90 days is at hand | `/management/cashflow` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (vet-forecast-frequency session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the list is not empty and nobody has looked; see the pending signature below

Manual verification by: pending: the page was not viewed, and "does this number look right" is Lutan's call

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR is not open yet
- [ ] Handed to the production release manager — n/a: not yet — after merge and the manual check

Result: pass

Release manager acknowledgement: pending
