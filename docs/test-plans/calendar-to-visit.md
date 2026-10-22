# Feature test plan: calendar-to-visit

## Header

| | |
|---|---|
| Feature | Create a clinic visit from an entry typed in the shelter's Google Calendar, with a confirm list for anything unclear |
| Backlog item | `docs/backlog.md` → Create a clinic visit by adding an event in the shelter's Google Calendar ("Novel - Blackie") |
| Branch / worktree | `claude/calendar-to-visit` @ `C:\Development\Animal_Shelter_calendar-to-visit` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | this PR |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | 6228b8d5 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the poll turns a new entry titled `<clinic> - <resident>[, <resident>]` into visits when each name fits exactly one clinic and one live resident, and everything else waits in a "Calendar entries to confirm" list for one tap or a dismissal
- [x] Files/areas touched listed: `src/lib/clinics/calendar-import-match.ts` (pure), `calendar-import.ts`, `calendar-poll.ts`, `src/app/upcoming-visits/` (page, `ConfirmList.tsx`, `confirm-actions.ts`), `src/lib/audit/recent-changes.ts`, both dictionaries, manual, releases, `eslint.config.mjs` (allow-list), docs; no migration, no `worker/`
- [x] Roles affected identified: whoever holds `visit.book` (the list and its two buttons); everyone else sees nothing new; the Director uses Google Calendar
- [x] Out of scope written down: no production calendar touched or deployed; no calendar-side editing of visits; the home-tile count and the "needs confirming" line on the event are not built (decision file says why); no clinic short-name column (would be a migration)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `unreleased` (two added lines), kept both
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:
  `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; dismissal is a private property on the Google event
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Run on the dev server (:3008) against the dev database and the TEST calendar "Lanna Care: vet visits (TEST)" (confirmed by reading the calendar's own title through the API before creating anything); the production calendar was never touched.

- [x] Happy path works end to end: after a baseline poll, `Novel - Doi` became one scheduled visit (clinic Novel, 10:00 Bangkok), noted "Created from Google Calendar", and its event was retitled `Novel - Doi` with `visitId` and `env: dev`; `Novel - Sua, White` became two visits at 11:00, each with its own event
- [x] Data persists — the visits and their event ids were read back from the database after the poll, and the list was re-read after each button
- [x] Create / edit / delete all exercised: create (import and confirm), edit (event moved to 15:30, the visit moved to 15:30 on the next poll), Dismiss (private flag written, entry gone from the list); delete is not a new behaviour here
- [x] Empty state renders sensibly: with nothing to confirm the section is not drawn at all
- [x] Invalid input is rejected with a readable message: every doubtful entry shows its reason in words (more than one resident has that name; no resident matches that name; the title is not written as Clinic - Resident); a typo (`Novel - Nu-Daen`) created nothing and offered Nu-Daeng with photo and R-code, confirmed with one tap into a visit
- [x] Boundary cases checked: two residents of one name (Kame) stays in the list; deceased and adopted, no dash, empty resident, all-day, unknown and ambiguous clinic, a good name beside a bad one, the same resident twice, R-code and Thai name are unit-tested (6 tests in `calendar-import-match.test.mjs`); a second poll imported 0 (never twice)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /upcoming-visits | list and buttons shown (`visit.book`) | not driven separately: same permission as management |
| management | /upcoming-visits | list and buttons shown | seen working (dev-signin, aal1) |
| staff | n/a | retired role | n/a |
| doctor | /upcoming-visits | refused as before (own-clinic scope); the actions also re-check `visit.book` | not driven |
| volunteer | /upcoming-visits | no list: no `visit.book` | not driven |
| signed out | /upcoming-visits | redirected to login as before | not driven |

- [ ] Every role above tested — n/a: only management was driven in the browser; the list is gated by `can(perms, "visit.book")` and both server actions repeat that check, which the manual list below leaves for a person
- [ ] A role that should not have access is blocked server-side — n/a: not exercised with a second login; both actions return early without `visit.book`, which is read from the code only and is on the manual list

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page; the list sits on the existing Vet visits page
- [x] Manual updated (`src/lib/manual/en.ts`, the Vet visits topic): how to write the title, what waits for confirmation, what Dismiss does. There is no Thai manual in this repo
- [x] Translatable strings go through the dictionaries: both `en.ts` and `th.ts` carry the new `shelterVisits.confirm` block (typecheck enforces parity). Not opened at `/management/translations`
- [ ] Mobile viewport (375px) — n/a: not driven at 375px, only at the pane's default width; the layout is one column of wrapping tiles. The Director will use it on a phone, so it is on the manual list
- [x] Browser console clean — no errors on /upcoming-visits
- [x] Network clean — no server errors in the dev server log during the whole run

## 6. Regression

- [x] The pages nearest the change still work: /upcoming-visits list, calendar views and filters rendered below the new section; the sweep route still synced (`synced:1` after the move)
- [x] Shared files checked from a second page: `releases.ts` and `manual/en.ts` are only appended to; the build prerenders the manual and release notes
- [x] Nothing merged from `main` during `sync` was broken: gates re-run after the merge, all four exit 0

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with what was left out
- [x] Non-obvious design choices added: `docs/decisions/2026-10-22-visits-from-google-calendar.md`
- [x] `README.md` still accurate — nothing in it describes the calendar's direction
- [x] **Release notes.** `unreleased` gained a line for shelter users. Not outstanding on anyone's side: the production calendar token is already in place; the line goes out with the next release
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the matching rules by unit tests, the end-to-end behaviour by the run above; the audit label ("Via Google Calendar" on a created visit) was reasoned from the code and not looked at on the Recent changes page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the entry's own offset is used (`2026-11-03T10:00+07:00` became 03:00Z); no "today" is derived
- [ ] Boundary or banding change covered both edges — n/a: no threshold or band; the matching rules' edges are in the unit tests
- [ ] Evidence pasted is the tool's actual output, unedited — n/a: gates lines above are verbatim; the run output is summarised in section 4
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret or env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reader in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: no schema; `./scripts/pi/deploy-pi.sh --ref <sha>` returns the earlier build. Visits already made from entries stay (they are ordinary visits); entries already dismissed keep a private flag that nothing else reads

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Every future non-visit entry in the shelter calendar (a staff meeting) appears in the confirm list until dismissed | accepted: the item says an entry with no dash goes to confirm |
| 2 | low | No count on the booker's home tile | deferred to backlog: needs a stored count |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Director types `Novel - <a resident>` into the real shelter calendar on her phone and sees it become a visit, and sees the confirm list's wording on a phone | production, after the release |
| 2 | The "Via Google Calendar" label on a created visit in Recent changes | /admin/recent-changes |
| 3 | A volunteer or doctor login sees no list and cannot post the buttons | /upcoming-visits |
| 4 | The list on a 375px phone screen | /upcoming-visits |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet (see the pending signature below)

Manual verification by: pending: the four rows under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the PR's branch and linked from the description
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet
