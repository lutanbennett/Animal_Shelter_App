# Feature test plan

## Header

| | |
|---|---|
| Feature | `/upload-blood-work` skill + `scripts/upload-blood-work.mjs` |
| Backlog item | `docs/backlog.md` → none: requested directly in chat 2026-10-15 |
| Branch / worktree | `claude/upload-blood-work` @ `C:\Development\Animal_Shelter_upload-blood-work` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` (not needed: no app change) |
| PR | to be added once opened |
| Tested by / date | Claude, 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | af892b3a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a Claude skill that loads lab reports from the Blood Work inbox on Drive as a clinic visit (found or created) plus one blood test per panel with the report attached, asking the user about any gap
- [x] Files/areas touched listed: `.claude/skills/upload-blood-work/SKILL.md`, `scripts/upload-blood-work.mjs`, `README.md`, `docs/decisions/2026-10-15-upload-blood-work-skill.md`. No route, no `worker/`, no migration
- [x] Roles affected identified: none in the app. The script runs as the database owner from a Claude session; rows carry the `--as` person as creator and audit actor
- [x] Anything explicitly **out of scope** written down: structured result values (results stay a summary in the free-text box); any in-app upload screen; scheduled or unattended runs

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines:

```
=== gates: build exited 0 after 118s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a rollback harness — n/a: no migration (the script's own dry run does run its write inside `begin…rollback`; see §4)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: on the test database, Mom (R-0062)'s NOVEL CBC report loaded with `--apply`. Read back: one CBC on 2026-09-29, linked to a new `completed` visit at Novel at 09:17 shelter time, one attachment, `created_by` set, one `audit_log` row with an actor
- [x] Data persists — the read-back above was a separate query after the script exited
- [x] Create / edit / delete all exercised: create only, which is all the feature does. Covered: visit created, existing visit reused (plan with `visit.id`), clinic and type creation (dry run). Nothing edits or deletes
- [x] Empty state renders sensibly: `inbox` lists files; empty-inbox handling is the skill's "say so and stop"
- [x] Invalid input is rejected with a readable message, not a crash. Each case below was refused:
  - unknown resident code: "There is no resident R-9999."
  - a visit outside the day or the day before
  - a future date: "date 2027-01-01 is in the future."
  - a missing `--as`
  - an existing clinic or type name, in any letter case
  - an unknown command
  - a second visit on the same day without `--new-visit`
  - the same report loaded twice: "Mom already has CBC (Complete Blood Count) on 2026-09-29. Has this report been loaded before? Ask the user."
- [x] Boundary cases checked:
  - A two-panel report rehearsed as 2 blood tests and 2 attachments, and a count afterwards found 0 rows: rolled back.
  - The day-before rule is enforced both ways.
  - Dates are in shelter time (Asia/Bangkok) for "today" and for visit days.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | not an app surface | n/a |
| management | n/a | not an app surface | n/a |
| staff | n/a | not an app surface | n/a |
| doctor | n/a | not an app surface | n/a |
| volunteer | n/a | not an app surface | n/a |
| signed out | n/a | not an app surface | n/a |

- [ ] Every role above tested — n/a: no app route; the script needs the Management API token, which only the developer machine holds
- [ ] A role that should not have access is blocked server-side — n/a: no app route

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: a developer-machine skill, not something shelter users run
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: the trial rows are ordinary `clinic_visits` / `blood_tests` / `attachments` rows, written with the same columns as `createBloodTest` and `schedule_bulk_appointments`; every trigger on those tables (deceased lock, audit, doctor link) fired in the load
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched (README only)
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing merged; gates green)

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item; requested directly in chat
- [x] Non-obvious design choices added as `docs/decisions/2026-10-15-upload-blood-work-skill.md`
- [x] `README.md` still accurate — `scripts/` list gains `upload-blood-work.mjs`
- [ ] **Release notes.** — n/a: a developer-machine skill and script; no shelter user sees anything change until records it loads appear, and those look like any other blood test
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Two claims were measured:
  - "Test and live share one Drive": the app's Drive token reported `lannaanimalfoundationbwm@gmail.com`, and `.env.deploy.production` sets no `GOOGLE_*`.
  - "`record_attachment()` would refuse": inferred from its body (`has_permission` needs `auth.uid()`), so the decision file words it as "would", not as observed.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — deferred: release manager
- [ ] Boundary or banding change assertions — deferred: release manager
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] Deploy target ref read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var in production — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Lookup missed an exact name ("Mom"): `nearMatchReason` is for near-duplicates and skips identical names | fixed: exact-name check first |
| 2 | low | `process.exit` with a fetch open tripped a libuv assertion on Windows | fixed: refusals throw, top level sets `exitCode` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The first live run's Drive half: the copy lands in `Residents/<Name> (<code>)/Blood Tests/<YYYYMMDD>/`, opens from the resident's Blood tests tab, and the original moves to "Loaded into system". This path only runs with `--env production` | lannacare.org + BWM Drive, on the first live run |
| 2 | Mom (R-0062)'s trial CBC on 29 Sep reads correctly on the resident's Blood tests tab, with the PDF opening | test.lannacare.org → Mom → Blood tests |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items await Lutan

Manual verification by: pending: Lutan to look at Mom's trial blood test on test, and at the Drive half on the first live run

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none open; both fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass
