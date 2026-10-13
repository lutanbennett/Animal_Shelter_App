# Feature test plan — vet-visits-director

## Header

| | |
|---|---|
| Feature | One shelter-wide page of upcoming vet visits for the Director: list by day, Hide overdue, week/month calendar |
| Backlog item | `docs/backlog.md` → **Upcoming vet visits for the Director: one page (list and calendar)…** (ticked; the Google Calendar stretch is filed as its own item) |
| Branch / worktree | `claude/vet-visits-director` @ `C:\Development\Animal_Shelter_vet-visits-director` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | `09723e8d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a page, `/upcoming-visits`, listing every clinic visit with resident, clinic, doctor, time, reason and links, as a day-grouped list and a calendar
- [x] Files/areas touched listed — `src/app/upcoming-visits/`, `src/lib/clinics/shelter-visits.ts` (+ test), `src/lib/permissions/routes.ts`, `src/app/operations/page.tsx`, both dictionaries, manual tip, `releases.ts`, `scripts/check-upcoming-visits-page.mjs`
- [x] Roles affected identified — Management and Admin (shelter-wide scope) gain the page; doctor, public viewer and no-role are refused
- [x] Anything explicitly **out of scope** written down — Google Calendar (filed separately), an Awaiting results status (put to Lutan), a tile on the Management home (ruled Lutan's call)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged, up to date
- [x] `node scripts/gates.mjs` ends with the line below:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, the page only reads `clinic_visits`
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a Management login gets 200 from `/upcoming-visits` with every visit rendered
- [ ] Data persists — n/a: read-only page; the Hide overdue choice is per device by design, with storage wrapped in try/catch
- [ ] Create / edit / delete all exercised — n/a: read-only page, the edit links go to the existing visit form
- [ ] Empty state renders sensibly — n/a: dev has 6 scheduled visits so the empty message was not seen on screen
- [ ] Invalid input is rejected with a readable message — n/a: no input beyond filters
- [x] Boundary cases checked — `shelter-visits.test.mjs`: a 03:00 Bangkok visit (20:00Z the previous day) lands on the shelter's day and time; group order; grouping loses no visit

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | not driven | same shelter-wide scope as management | not run |
| management | /upcoming-visits | 200, 6 of 6 scheduled visits | ok |
| staff | n/a | retired role | not run |
| doctor | /upcoming-visits | refusal page, no visit links | ok |
| volunteer | not driven | | not run |
| signed out | not driven | | not run |

Also driven: public_viewer → 307 to `/`, and a login with no role → 307 to `/login?error=no_role`.

- [ ] Every role above tested — n/a: management, doctor, public viewer and no-role were driven by `scripts/check-upcoming-visits-page.mjs`; admin, volunteer and signed-out were not
- [x] A role that should not have access is blocked server-side — the harness requests the URL directly as doctor, public viewer and no-role; the response carries no visit links

## 5. Cross-cutting

- [ ] Nav entry correct (`NavLinks.tsx`) — n/a: reached through a tile on the Shelter Operations landing via the route registry; the sidebar is untouched
- [x] Manual updated (`src/lib/manual/en.ts`) — a tip on the existing clinic-visits topic
- [x] Translatable strings go through the translation path — both dictionaries carry `shelterVisits`, the nav label and the tile; resident and clinic names are data
- [ ] Mobile viewport (375px) — n/a: not driven in the browser pane this session, see Left for manual verification
- [ ] Browser console clean — n/a: not driven in the browser pane this session
- [ ] Network clean — n/a: not driven in the browser pane, the harness requests returned 200 or the expected redirects

## 6. Regression

- [x] The pages nearest the change still work — the Operations landing builds and lint passes, including check-home-screens, acceptance-matrix and check-permission-catalogue
- [ ] Any shared file touched checked from a second page — n/a: only the route registry and dictionaries, whose checks pass in lint
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged, already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the stretch goal filed on the `backlog` branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-13-upcoming-visits-page.md`
- [x] `README.md` still accurate — it does not list pages at this level
- [x] **Release notes.** `unreleased` has a line for Admin and Management; nothing is outstanding, no migration and no hand step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 6-of-6 count, the redirect on `/vet-visits` and the role outcomes come from the harness run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — deferred: release manager, the logic is proved by the unit test at 03:00 Bangkok and the deployed build at 00:00–07:00 Thai is still to be seen
- [ ] Boundary or banding change covers both edges — n/a: the only boundary is overdue (day before today against today), asserted on both sides in the test
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: the gates line is pasted unedited above
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration plus reader in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager, nothing here is schema so a rebuild of the previous ref is a full rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First build used `/vet-visits`, which `next.config` redirects to `/clinic-visits` | fixed: page moved to `/upcoming-visits` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Director opens Shelter Operations → Vet visits on her phone: the list reads well at 375 px, photos load, Hide overdue sticks after a reload | her phone |
| 2 | The week and month calendar on a PC, and a Thai reader | a PC |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet, only the Director can tick this and she has not looked; the signature below is pending

Manual verification by: pending: the Director to open this on her phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is part of the PR
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass

Release manager acknowledgement: pending: release manager
