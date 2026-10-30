# Feature test plan — prescription-schedule-app

## Header

| | |
|---|---|
| Feature | Prescription form, round screens and medication list read the recurring schedule (stream 3 of 4) |
| Backlog item | `docs/backlog.md` → **PRESCRIPTIONS BECOME A RECURRING SCHEDULE** (left open: the drop stream remains) |
| Branch / worktree | `claude/prescription-schedule-app` @ `C:\Development\Animal_Shelter_prescription-schedule-app` |
| Dev server | `http://localhost:3005` (`preview_start` name `dev`), signed in with `dev-signin.mjs admin` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `9d208cf1` |

## 1. Scope and risk

- [x] Change is described in one sentence — a prescription's days and times are chosen on the form and read by the round screens and the medication list instead of the frequency
- [x] Files/areas touched listed — `src/app/prescriptions/`, `src/lib/prescriptions/`, `src/lib/medication-list/`, `src/lib/rounds/suggest.ts`, `RoundIcons.tsx`, the resident Prescriptions tab, the archive record, both dictionaries, the manual, `scripts/check-medication-list-due.mjs`, the decision file
- [x] Roles affected identified — none; no card, grant or policy changed. Anyone who can add or edit a prescription (`medical.prescriptions`) sees the new form
- [x] Out of scope written down — diets, `frequency_id` and `/admin/frequencies`, any migration, any other check script

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` — see PR body
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded — n/a: no migration (0283 and 0284 already live on dev)
- [ ] File is re-runnable — n/a: no migration
- [x] Existing rows still read correctly — per-prescription doses over two windows, md5 over the 72 existing prescriptions identical before and after; the list's days identical over 2,242 prescription-days
- [ ] Down-migration needed or explicitly not — n/a: no migration
- [x] Production apply plan — the code needs 0282 to 0284 first; it must not be deployed ahead of them (decision file)

## 4. Functional checks

- [x] Happy path — saved Mon + Thu (Morning) and every 2 days (four ticks, amounts 2 / 1 / 1 / 0.5) from the form; the tab and the medication list read them
- [x] Data persists — both rows read back from the database: `week / 1 / {1,4}`, `frequency_id` null, ticks and amounts as entered
- [x] Create / edit / delete — create and edit done (edit prefilled `week`, 1 and 4; added Friday, saved, then set back); delete is not part of this form
- [x] Empty state — a new form starts as every day with Morning ticked; as needed shows no ticks
- [x] Invalid input — server checks cover a missing "every", no weekday, no month day, no tick on a scheduled prescription, more than four ticks; exercised by the unit-style script only for the day rules; not each message driven in the browser
- [x] Boundary cases — month end (the 31st to the 30th, to 28 Feb and 29 Feb), a start partway through the week, a start on a Sunday, {30, 31} on 28 February: `check-medication-list-due` 52/52, also under `TZ=UTC`

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `medical.prescriptions` (write) | the form, Save | allowed | n/a — Admin signed in; the check is unchanged and Admin bypasses cards |
| `medical.prescriptions` (read) | medication list | allowed, no controls | n/a — page unchanged |
| none | the form | refused by `requirePermission` | n/a — not touched |

- [ ] Every role above tested — n/a: no access rule changed; only Admin was signed in
- [x] Blocked server-side — unchanged: `createPrescription` and `updatePrescription` still ask `can(perms, "medical.prescriptions")`

## 5. Cross-cutting

- [x] Nav entry correct — no entry added or moved
- [x] Manual updated — Adding a prescription, The medication list, and the Frequencies note
- [x] Translatable strings — both dictionaries; the Thai wording for days, Night and the errors is mine and wants a Thai reader's eye
- [ ] Mobile viewport — n/a: not driven at phone width in this session (the grids collapse to two columns below `sm`)
- [x] Browser console clean — no errors seen on the pages driven
- [x] Network clean — every request 200 or 304; the only ERR_ABORTED lines are cancelled page prefetches and the form posts that redirect

## 6. Regression

- [x] Nearest checks still work — `check-medication-rounds` 75/75 GREEN; `check-medication-list-due` 52/52; lint clean on the touched folders; typecheck clean apart from the generated `PageProps` names
- [x] Shared file touched checked from an unrelated page — `rounds/suggest.ts` is shared with the feeding list and diets: `roundsFor("food")` and `suggestRound("food")` unchanged by reading and by `check-shelter-dates` (food rows pass)
- [x] Nothing merged from `main` was broken — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately open; the drop stream remains (progress note goes on the `backlog` branch)
- [x] Decision recorded — `2026-10-30-prescription-schedule-app.md`
- [x] `README.md` still accurate — it does not describe the form
- [ ] **Release notes.** — n/a: 0283 and 0284 are not on production yet
- [x] Commit messages say why
- [x] Claims were measured — figures come from queries and driven pages, listed in the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the due rule is date-only and passes under `TZ=UTC`; the Night suggestion is on the shelter clock and its edge check lives in `check-shelter-dates` (left red by design, see defects)
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] Migration and reading code in one PR? — no migration here, and the reading code **requires 0283 and 0284 to be on the target first**
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: no migration
- [x] Apply plan stated — with the release that applies 0282 to 0284

### Rollback

- [x] Rollback position — revert the PR; rows saved meanwhile keep their schedule columns and have a null frequency, which the old screens show as "as needed"

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | `check-shelter-dates.mjs` fails 4 checks: its 23:59 row expects Evening for medication, now Night from 22:00. Not in gates or CI | open — another stream's script; the fix is one row |
| 2 | medium | `check-prescription-schedule-backfill.mjs` lists every prescription saved from the new form (it compares a frequency's count) | open — needs restating before the release that carries 0283/0284 |
| 3 | low | `prescription_round_status` reads `mismatch` for a scheduled prescription with no frequency; no screen reads it | accepted — the drop stream removes it |
| 4 | info | Two disposable test prescriptions ("schedule-app test 2026-10-30 …") remain on dev | accepted — dev test data |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of the days, Night and the error messages | prescription form with the language switched to ไทย |
| 2 | The form and the medication list at phone width | `/prescriptions/new`, Operations → Medication list |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty or each item has a named human signature — pending: Thai wording and a phone-width look

Manual verification by: pending: Thai wording and phone-width look need a person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
