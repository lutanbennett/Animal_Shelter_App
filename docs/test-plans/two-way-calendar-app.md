# Feature test plan

## Header

| | |
|---|---|
| Feature | Two-way calendar, app half: the 15-minute poll applies a moved or deleted vet-visit event back to the visit, and mails admins on a cancel |
| Backlog item | `docs/backlog.md` → "Two-way calendar" (reworded on the backlog branch, not ticked: a schema follow-up remains) |
| Branch / worktree | `claude/two-way-calendar-app` @ `C:\Development\Animal_Shelter_two-way-calendar-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch |
| Tested by / date | Claude (automated) / 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | 7798aad6 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the sweep route now polls Google by syncToken and applies moves and deletes to visits
- [x] Files/areas touched listed: `src/lib/clinics/calendar-poll.ts`, `calendar-change.ts`, `calendar-sync.ts`, `calendar-event.ts`, `src/app/api/calendar/sweep/route.ts`, `src/lib/status/alerts.ts` (two exports), `eslint.config.mjs`, manual, releases. No `worker/` change, no migration
- [x] Roles affected identified: admin, management, doctor (vet-visit users); admins receive the cancel mail; no other role sees anything
- [x] Out of scope written down: Google push, the "changed in the last week" list, a cancel-reason column and the audit label "via Google Calendar" (all need schema; the migration slot was another stream's)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed: `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration, 0232 already on main
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: against the real test calendar a dragged event moved its visit, and a deleted event cancelled its visit with the note "Cancelled from Google Calendar"; the admin mail was written to the dev log
- [x] Data persists — read back from the database after the sweep
- [x] Create / edit / delete all exercised: event created, patched by an app edit, deleted in the calendar
- [x] Empty state is sensible: a first run with no sync token only records a starting point and changes nothing
- [ ] Invalid input is rejected with a readable message — n/a: no input; a refused move (prescription rule) is written to calendar_error
- [x] Boundary cases checked: all-day event, same start, completed visit, app edit plus calendar edit (the app won and the event was put back), the app's own change ignored; 7 unit tests

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | no screen; receives the cancel mail | mail | mail logged on dev |
| management | none | nothing | n/a |
| staff | none | nothing | n/a |
| doctor | none | nothing | n/a |
| volunteer | none | nothing | n/a |
| signed out | /api/calendar/sweep | 401 without the service key | route auth unchanged |

- [ ] Every role above tested — n/a: no screen or per-role behaviour; the only entry is the bearer-checked cron route, unchanged
- [ ] A role that should not have access is blocked server-side — n/a: no per-role surface; the route's auth check is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [x] Manual updated (`src/lib/manual/en.ts`, Vet visits topic)
- [ ] Translatable strings — n/a: mail and note text is English operational text like the existing alert mail
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [x] Network clean — Google calls returned 200 and 204, the sweep returned 200

## 6. Regression

- [x] The pages nearest the change still work: app-side create, patch and delete of events still run through the sweep, checked live
- [x] Shared file touched checked: `alerts.ts` only gained exports and the build passes
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: not complete (schema follow-up); reworded on the `backlog` branch
- [x] Design choices in `docs/decisions/2026-10-20-two-way-calendar-poll.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line for it
- [x] Commit messages say why
- [x] Claims were measured, not reasoned: the move, cancel, own-change and clash cases were run live

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the start is compared as an instant and written back as an instant; the Bangkok day appears only in a mail line
- [ ] Boundary or banding assertions — n/a: no threshold or band
- [x] Evidence pasted into this plan is the tool's actual output
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret or env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--dry-run` against production — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | No lasting "changed from calendar" list, cancel-reason column or audit label (need schema) | deferred to backlog |
| 2 | low | A clash is cleared from calendar_error when the sweep puts the calendar back; only the run's count survives | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at; driven live against the test calendar

Manual verification by: n/a: no screen; driven live against the test calendar

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch
- [ ] Handed to the production release manager — n/a: Lutan handles the release

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet
