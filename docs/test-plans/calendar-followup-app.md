# Feature test plan — calendar-followup-app

| | |
|---|---|
| Feature | Two-way calendar, app half: write change columns, System status list, audit label |
| Backlog item | `docs/backlog.md` → Two-way calendar: poll, move, cancel |
| Branch / worktree | `claude/calendar-followup-app` @ `C:\Development\Animal_Shelter_calendar-followup-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see PR |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | 8f41cd7f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the poll records moves and cancels in the 0236 columns, System status lists them, Recent changes labels them
- [x] Files/areas touched listed — `calendar-poll.ts`, `src/lib/status/calendar-changes.ts`, `admin/status/page.tsx`, `lib/audit/recent-changes.ts`, `admin/recent-changes/page.tsx`, both dictionaries
- [x] Roles affected identified — admins (System status, Recent changes)
- [x] Anything explicitly **out of scope** written down — push notifications, production calendar token

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration; uses 0236 columns
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: 0236 already applied by #792
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: new columns are null for old rows and the list filters on non-null
- [ ] Constraints exercised against real rows — n/a: only 'moved' and 'cancelled' are written, both allowed by the constraint
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan — n/a: 0236 ships with the schema PR's release

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven this session; covered by the Left for manual verification table
- [ ] Data persists — n/a: not driven this session; covered by the Left for manual verification table
- [ ] Create / edit / delete all exercised — n/a: not driven this session; covered by the Left for manual verification table
- [ ] Empty state renders sensibly — n/a: not driven this session; covered by the Left for manual verification table
- [ ] Invalid input is rejected — n/a: no input form added
- [ ] Boundary cases checked — n/a: the 7-day window is a single comparison

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | System status, Recent changes | new list and label | pending: not viewed |

- [ ] Every role above tested — n/a: not driven this session; covered by the Left for manual verification table
- [ ] A role that should not have access is blocked server-side — n/a: pages keep their existing permission checks

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [ ] Manual updated — n/a: the manual file belongs to another stream this batch; follow-up goes on the backlog
- [x] Translatable strings — both `en` and `th` added
- [ ] Mobile viewport — n/a: not driven this session; covered by the Left for manual verification table
- [ ] Browser console clean — n/a: not driven this session; covered by the Left for manual verification table
- [ ] Network clean — n/a: not driven this session; covered by the Left for manual verification table

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven this session; covered by the Left for manual verification table
- [ ] Any shared file touched checked from a second page — n/a: no shared component changed
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item updated in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [ ] `README.md` still accurate — n/a: README does not describe the calendar poll
- [ ] **Release notes.** n/a: the production calendar token is not set, so no live user gets this yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The audit derivation was read from 0236 and `record_audit()`; not run against a live row

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: a move writes the event's own instant unchanged
- [ ] Boundary or banding change assertions — n/a: no banding
- [ ] Evidence pasted is the tool's actual output — n/a: no evidence pasted
- [ ] Public pages re-checked — n/a: no public view changes
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration and reading code in one PR? — n/a: reads 0236 from the schema PR
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback position stated — n/a: code-only change

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Move a visit's event in the test calendar; within 15 min the visit moves and appears on the list | System status |
| 2 | Delete the event; visit is cancelled with the reason, listed, admin mail sent, can be set back to scheduled | System status, visit page |
| 3 | The visit's history shows "Via Google Calendar" | Recent changes |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

- [ ] The manual list above is empty — n/a: three live checks are listed above for a person

Manual verification by: pending: the three checks above against the test calendar

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handover happens at release time

Result: pass with accepted defects
