# Feature test plan: calendar-button-and-env-guard

## Header

| | |
|---|---|
| Feature | The calendar: remove the button, tag the environment, own event ids, on-screen status |
| Backlog item | `docs/backlog.md` → Remove the "Add to Google Calendar" button; CAUSE FOUND 2026-10-22 (duplicates / cancel-on-delete) |
| Branch / worktree | `claude/calendar-button-and-env-guard` @ `C:\Development\Animal_Shelter_calendar-button-and-env-guard` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | this PR |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | 509e7f7e |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the button is removed, every synced event carries its environment and the poll ignores another environment's, the cancellation mail names its system, events get our own deterministic id, and each coming visit says where it stands with the calendar
- [x] Files/areas touched listed: `src/lib/clinics/calendar-{event,sync,poll,change}.ts` (calendar-link.ts deleted), `src/app/upcoming-visits/`, the resident Clinic visits section, both dictionaries, manual, releases, docs; no migration, no worker/
- [x] Roles affected identified: everyone who sees vet visits (status line); Retry stays admin/medical.visits only; admins get the labelled mail
- [x] Out of scope written down: no production deploy, no deletion from the production calendar, no inbound calendar-to-visit, no schema; the Pi env check is left to Lutan (see PR)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends as pasted below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: booked Panda at Family Pet Clinic on dev; the redirect page showed "In the shelter calendar" at once, no sweep; the TEST calendar held the event at 09:30 with an id starting `d` and private props visitId + env=dev
- [x] Data persists: reloading the Clinic visits list (mobile and desktop) still shows "In the shelter calendar"
- [ ] Create / edit / delete — n/a: create exercised above; edit and delete paths are unchanged code
- [ ] Empty state — n/a: no new list, only a status line on existing rows
- [ ] Invalid input — n/a: no new input
- [x] Boundary cases checked: Google behaviours measured on the test calendar: a second create with the same id returns 409; a deleted event still returns its env tag when fetched by id; a create after delete returns 409; PATCH status=confirmed revives it (event restored afterwards). Unit tests cover the id shape, the tag and the other-environment rule

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Vet visits, resident Clinic visits | no Add to Google Calendar; status line; Retry | ok (dev-signin admin, aal1) |
| management | same pages | same, no new permission | not driven |
| staff | retired | n/a | n/a |
| doctor | same pages | same, no new permission | not driven |
| volunteer | same pages if allowed | same, no new permission | not driven |
| signed out | pages sign-in gated | unchanged | not driven |

- [ ] Every role above tested — n/a: no permission changed; admin driven, the status line has no role logic and Retry keeps its existing medical.visits guard
- [ ] A role that should not have access is blocked server-side — n/a: no access rule added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: page served with the new wording and without the old button text
- [x] Translatable strings go through the translation path: new strings added to both en.ts and th.ts dictionaries
- [x] Mobile viewport (375px) — no overflow: scrollWidth 375 on the resident Clinic visits list
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work: /upcoming-visits (list renders, no calendar link in the DOM), resident Clinic visits, /clinic-visits/new booking
- [x] Any shared file touched checked from a second, unrelated page: both dictionaries and releases.ts load on /manual and /upcoming-visits
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought only docs/backlog.md

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: button item ticked; the duplicates/cancel-on-delete item annotated PARTLY DONE with the Pi check still open
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-22-calendar-event-environment-tag.md`
- [x] `README.md` still accurate: it does not mention the button
- [x] **Release notes.** Three lines added to `unreleased` in `src/lib/releases.ts`: the button is gone, the status line, and (admin-tagged) the environment tag and labelled mail
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The button as the duplicates' cause was measured by the planner on the production calendar; the 409, delete and tag-on-deleted-event behaviours were measured here, not assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the event time logic is unchanged; the 09:30 booking landed at 09:30+07:00 on the test calendar
- [ ] Boundary or banding change — n/a: no threshold or band changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates line is pasted verbatim; nothing else is tool-output evidence
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] production deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (code only, no schema: redeploy the previous SHA; events already carrying the env tag keep working under old code, which ignores it)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A deletion made by another environment is ignored: delete a foreign-tagged event and see the visit stay scheduled and no mail | Worker poll |
| 2 | With the four calendar values unset in one runtime, a booking there shows "not switched on in this app" on the visit | Pi / local without values |
| 3 | The Pi app process holds the four calendar env values (names only) | Pi |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items 1 to 3 are pending, so this is left unticked on purpose

Manual verification by: pending: items 1 to 3 above need a person (Lutan) on the poll and the Pi

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over when the PR is open

Result: pass

Release manager acknowledgement: n/a: not yet reviewed
