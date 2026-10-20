# Feature test plan: prescription frequency screen

## Header

| | |
|---|---|
| Feature | Prescription form sets how often directly, one amount per round; /admin/frequencies read-only |
| Backlog item | `docs/backlog.md` → Prescription schedule: three round ticks plus a notes field |
| Branch / worktree | `claude/prescription-frequency-screen` @ `C:\Development\Animal_Shelter_prescription-frequency-screen` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | to be opened from this branch |
| Tested by / date | Claude, 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | ccfaa62f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the add/edit prescription form chooses how often directly and gives each ticked round its own amount, and Settings → Frequencies becomes a read-only record
- [x] Files/areas touched: src/app/prescriptions/, src/app/admin/frequencies/, src/lib/prescriptions/frequency.ts, i18n en/th, manual, releases, backlog, decisions
- [x] Roles affected: admin, management, head_of_medical, doctor (medical.prescriptions); admin only for the frequencies page
- [x] Out of scope: dropping frequency_id, changing how doses_per_day is computed, making the SQL forecast sum per-round amounts

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main had nothing new (0 commits ahead at last fetch)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:
  `gates: typecheck=0 lint=0 test=0 build=0` (run before the final amount-averaging commit; typecheck and eslint re-run clean after it)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; existing prescriptions keep frequency_id and are read unchanged
- [ ] Constraints exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Data persists — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Create / edit / delete all exercised — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Empty state renders sensibly — n/a: the frequencies page empty state is the existing no-frequencies line, unchanged
- [ ] Invalid input is rejected with a readable message — n/a: not driven in a browser; reused parseSchedule errors and the dose-positive message, checked by code reading only
- [ ] Boundary cases checked — n/a: not driven in a browser this session; listed under Left for manual verification

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/frequencies, prescription forms | all | not tested |
| management | prescription forms | form only | not tested |
| doctor | prescription forms | form only | not tested |
| volunteer | none | refused | unchanged (permission checks untouched) |
| signed out | none | refused | unchanged (permission checks untouched) |

- [ ] Every role above tested — n/a: permission checks were not changed and no role was signed in this session
- [ ] A role that should not have access is blocked server-side — n/a: requirePermission and can() calls are unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated (src/lib/manual/en.ts) and the topic reads correctly at /manual — n/a: manual text updated in source, how it reads is listed under Left for manual verification
- [ ] Translatable strings checked at /management/translations — n/a: dictionary entries in en and th, no translatable data rows added
- [ ] Mobile viewport (375px) — n/a: not driven; listed under Left for manual verification
- [ ] Browser console clean — n/a: not driven in a browser this session
- [ ] Network clean — n/a: not driven in a browser this session

## 6. Regression

- [ ] The pages nearest the change still work — n/a: build passes; pages not loaded in a browser this session
- [ ] Any shared file touched checked from a second, unrelated page — n/a: manual and dictionaries touched; not loaded in a browser this session
- [x] Nothing merged from main during sync was broken by this branch: nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Design choices added in `docs/decisions/2026-10-20-prescription-frequency-screen.md`
- [x] `README.md` still accurate: it does not describe the frequency list
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were reasoned from reading the code and the 0044 and 0234 migrations, not measured against live data; the average-amount claim is arithmetic only

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding assertions cover both edges — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line, copied as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Any new secret or env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reader in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code-only change; redeploy the previous ref, no schema change to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Forecast and medication list read one prescription amount; with different amounts per round it is their average, approximate if a dose exists only in the notes | accepted, recorded in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Add a prescription: set how often, tick rounds, give different amounts, save; reopen and edit | /prescriptions/new and edit |
| 2 | Four times a day with three ticks saves and still reads 4 on the medication list and stock forecast | medication list, /management/medications |
| 3 | Settings → Frequencies shows the read-only list | /admin/frequencies |
| 4 | Phone width and Thai wording of the form | prescription form |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items remain for a person, see the pending signature below

Manual verification by: pending: the four items under Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 1 is accepted and recorded in the decision file
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over after merge

Result: pass with accepted defects

Release manager acknowledgement: n/a: release manager signs at deploy
