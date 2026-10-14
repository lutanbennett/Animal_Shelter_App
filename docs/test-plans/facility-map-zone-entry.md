# Feature test plan: facility-map-zone-entry

## Header

| | |
|---|---|
| Feature | Facility map: zone tap opens its plan, back link to overview |
| Backlog item | `docs/backlog.md` → Facility map: make the Shelter overview the way in |
| Branch / worktree | `claude/facility-map-zone-entry` @ `C:\Development\Animal_Shelter_facility-map-zone-entry` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | d358551f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a zone tap opens its plan, with a way back up.
- [x] Files touched: `src/app/enclosures/map/FacilityMap.tsx`, both i18n dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, backlog, a decision file.
- [x] Roles affected: everyone who can open the map (admin, management, volunteer); signed-out public cannot.
- [x] Out of scope: map rooms, drawing zone outlines (Admin → Facility map), any migration.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch was cut from current main today; nothing to merge.
- [x] `node scripts/gates.mjs` closing lines:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser; dev needs a login and zone outlines drawn on the overview, listed under Left for manual verification
- [ ] Data persists — n/a: nothing is saved by this change
- [ ] Create / edit / delete — n/a: read-only map
- [ ] Empty state renders sensibly — n/a: the empty-overview text path is unchanged
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: not driven; a zone with no plan routes to the list in code

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /enclosures/map | unchanged | not re-tested |
| management | /enclosures/map | unchanged | not re-tested |
| staff | retired | n/a | n/a |
| doctor | unchanged | unchanged | not re-tested |
| volunteer | /enclosures/map | unchanged | not re-tested |
| signed out | redirect to login | redirect | seen on dev: redirected to /login |

- [ ] Every role above tested — n/a: access rules were not touched; only the signed-out redirect was seen
- [ ] Blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`, topic "Finding your way round on the map"); not re-read at /manual
- [ ] Translatable strings through the translation path — n/a: fixed UI strings in both dictionaries, no user-entered text
- [ ] Mobile viewport (375px) — n/a: not driven; listed under Left for manual verification
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [ ] Nearest pages still work — n/a: the build passes but no page was loaded
- [ ] Shared file touched checked by loading — n/a: the manual and releases edits are single-string changes and the build passed
- [x] Nothing merged from main during sync was broken: nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file added: `docs/decisions/2026-10-14-zone-tap-opens-plan.md`
- [x] `README.md` still accurate: it does not describe the map's tap behaviour
- [x] **Release notes.** `unreleased` has a new line on the zone tap and the back link
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: they describe code that was read, not timing or numbers

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no thresholds changed
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates lines, pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Both migration and code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Keyboard and screen-reader behaviour of the new zone link (Enter, Space, spoken name) not exercised by hand | deferred to backlog: manual list below |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Zone outlines drawn on the real Shelter overview (Lutan or the Director; not code) | Admin → Facility map |
| 2 | Tap a zone: its plan opens at once; ← Shelter overview comes back; the count shows on the zone and above the plan. Keyboard: Tab to a zone, Enter and Space open it; a screen reader says the zone, residents and where it opens. A zone with no plan opens its list | The Director's phone, and a keyboard on a computer, at 375 px and in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed: gates only; no browser check was run
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so it is not ticked here

Manual verification by: pending: the map on a phone and with a keyboard, and the real zone outlines

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 1 is deferred to the manual list
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged

Result: pass with accepted defects

Release manager acknowledgement: pending
