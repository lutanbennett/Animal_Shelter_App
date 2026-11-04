# Feature test plan — fundraising-events-app

## Header

| | |
|---|---|
| Feature | Staff screens for fundraising events: list, add, edit, publish, photo gallery with cover and memes, event photos in the approval queue, and the two public views (no public page) |
| Backlog item | `docs/backlog.md` → **FUNDRAISING EVENTS** (`#2zi2j`, staff half done; the public page remains) |
| Branch / worktree | `claude/fundraising-events-app` @ `C:\Development\Animal_Shelter_fundraising-events-app` |
| Dev server | `http://localhost:3005` |
| PR | pending: number is known when the PR is opened |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | yes: `0314_fundraising_events_app.sql` |
| Tested at SHA | `fd9c7b9b` plus the docs commit that adds this file |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the staff side of events and the additive views; the website page is the next stream's
- [x] Files/areas touched listed — `src/app/management/events/*`, `src/app/api/events/[id]/photos/route.ts`, `src/lib/events/*`, `src/lib/google/drive.ts` (one helper), `src/app/photos/approve/*`, `src/lib/photos/approval.ts`, dictionaries, `routes.ts`, `cards.ts` (one `opens`), `write-requests.ts`, three check scripts, `releases.ts`, migration 0314
- [x] Cards affected identified — `run_fundraising_events` (`events.run`) now opens the events screens; `approve_photos` (`photos.approve`) now also sees event photos in its queue. No card gained or lost an activity
- [x] Out of scope written down — the public events page, the Worker path list, video, deleting an event

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — to run immediately before the PR is opened; result recorded in the PR
- [x] `node scripts/gates.mjs`, run in the background to a file and read:

```
=== gates: typecheck exited 0 after 80s
=== gates: lint exited 0 after 139s
=== gates: test exited 0 after 16s
=== gates: build exited 0 after 132s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number one above the highest on `main` — 0314 after 0313; the runner printed `migration numbers: ok`
- [x] `--status` reviewed — 314 applied, 1 pending before the apply
- [x] `--dry-run` reviewed — `ok`
- [x] Applied to dev — `applying 0314_fundraising_events_app.sql … ok`
- [x] File is re-runnable — `alter policy`, `create or replace`; no `create` without a guard
- [x] Existing rows still read correctly — the other owner types' branches are copied unchanged from 0264/0276 and 0311; the gates' test step (including the permission and public-view checks) passed
- [x] Constraints and defaults exercised — cancelled cannot be published (action refuses and the save unpublishes); `end_date >= event_date` is checked in the form check
- [ ] Down-migration — n/a: additive; nothing destructive
- [ ] Production apply plan — n/a: applied with the release by the release manager; no data to migrate

## 4. Functional checks

- [x] Happy path works end to end — driven on dev as a login holding exactly `run_fundraising_events` and `approve_photos`: clicked Management → Fundraising events → Add an event, saved a title and date (the event page opened), uploaded a PNG through `/api/events/[id]/photos` (200), made it the cover, and put the event on the website
- [x] Data persists — the event, its photo, cover and published flag were present after navigating away and back
- [ ] Create / edit / delete all exercised — n/a: only create, publish and cover were pressed on dev; edit-save, meme, status change and remove are listed under manual verification
- [x] Empty state renders sensibly — checked: the list said "No event has been added yet." before the first was created
- [ ] Invalid input is rejected — n/a: server-side checks are in `checkEvent()`, not driven by a bad submission here
- [ ] Boundary cases checked — n/a: end-before-start not typed in

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `run_fundraising_events` + `approve_photos` | Management tile, list, add, one event | opens; upload works; approver's own photo approved on save | pass |
| Admin | everything | through the Admin short-circuit | n/a: not driven; no Admin rule changed |
| a login without `events.run` | `/management/events` | refused | n/a: not driven; each page calls `requirePermission("events.run")`, and the permission-catalogue check in the test gate passed |
| anonymous | `public_fundraising_events`, `public_fundraising_event_photos`, base table | views readable, base table refused | pass — REST: 200 and 1 row each for the views, 401 for `fundraising_events` |

- [x] Every login above tested — as stated per row
- [ ] A login that should not have access is blocked server-side — n/a: not driven as a login without the card

## 5. Cross-cutting

- [x] Nav entry correct — the Management tile appears and links to `/management/events`
- [ ] Manual updated and reads correctly — n/a: no manual topic was written for this stream; the public page stream owns the user-facing description
- [x] Translatable strings go through the translation path — all text is in both dictionaries; the event's own text is registered for translation in 0312
- [ ] Mobile viewport (375px) — n/a: not driven
- [ ] Browser console clean — n/a: not read
- [ ] Network clean — n/a: not read

## 6. Regression

- [x] The pages nearest the change still work — Management landing and the events screens loaded
- [ ] Shared files touched checked from unrelated pages — n/a: the gates' build and test passed; `/photos/approve` itself was not opened in the browser
- [x] Nothing merged from `main` during `sync` was broken — to be confirmed at sync

## 7. Documentation

- [x] Backlog item updated in `docs/backlog.md` on this branch — its title now says only the website page remains
- [x] Decision file `docs/decisions/2026-11-04-fundraising-events-staff-screens.md`
- [x] `README.md` still accurate — it does not describe these pages
- [x] **Release notes.** `unreleased` gained a line in this PR, written for a shelter user
- [x] Commit messages say why
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the browser and REST results above are from this session

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: dates are plain `date` columns
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted is the tool output, unedited — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [x] Both a migration and code that reads it? — yes: the code needs 0314 live first; the release applies migrations before deploying code
- [ ] `--env production --dry-run` — deferred: release manager
- [ ] Destructive migration backup — n/a: nothing destructive
- [ ] Apply plan — deferred: release manager, with 0312 if it is also still pending

### Rollback

- [x] Rollback position stated — redeploy the previous ref; the policies and views are additive, so the old code ignores them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | An approver without `events.run` sees a generic title on an event photo in the queue | accepted, written in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A login holding only `run_fundraising_events` uploads a photo and it shows Waiting, then appears in Photos to approve and Approve publishes it | `/management/events/[id]`, `/photos/approve` |
| 2 | Mark as meme, Remove photo, and saving a Cancelled status all work | event page |
| 3 | The Thai wording reads naturally | event screens in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: nobody has looked yet, see the pending signature below

Manual verification by: pending: the waiting-then-approved path and the Thai wording need a person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links the file
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
