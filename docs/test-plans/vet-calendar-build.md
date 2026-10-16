# Feature test plan — vet-calendar-build

## Header

| | |
|---|---|
| Feature | App half of the vet calendar: each clinic visit becomes its own Google Calendar event (`Novel - Blackie`), written automatically, with Retry, a 15-minute sweep, and a System status tile |
| Backlog item | `docs/backlog.md` → **Vet visits go into the shelter's Google Calendar by themselves** (left open on purpose: the token is not minted, see sign-off) |
| Branch / worktree | `claude/vet-calendar-build-e5f89d` @ `C:\Development\Animal_Shelter_App\.claude\worktrees\vet-calendar-build-e5f89d` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3000` (no `.port` file in this worktree) |
| PR | pending: number once opened |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | no — `0207` is already on `main` |
| Tested at SHA | `c8631a77` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a booked, moved or cancelled visit creates, changes or deletes its own calendar event, with the calendar never able to block the booking
- [x] Files/areas touched listed — `src/lib/clinics/calendar-sync.ts`, `calendar-event.ts` (+ test), `src/app/api/calendar/sweep/route.ts`, `src/proxy.ts`, `worker/index.mjs`, `src/app/clinic-visits/` (edit and new actions, `calendar-actions.ts`), `src/app/assistant/actions.ts`, resident Clinic visits section, `src/app/admin/status/page.tsx`, `scripts/lib/runtime-config.mjs`, `.env.example`, `eslint.config.mjs`, both dictionaries, manual, decision file, backlog note
- [x] Roles affected identified — staff/doctor who book or edit visits (Retry shown with `medical.visits`); admin (status tile); signed-out public (link refuses)
- [x] Anything explicitly **out of scope** written down — a one-page medical summary (asked of Lutan, not built), the `.ics` feed (not ticked until he confirms), a clinic address (the table has none), events for hard-deleted visit rows (needs a migration)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in, already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: build exited 0 after 117s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: 0207 was applied by the schema PR
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: 0207 goes with its own release

## 4. Functional checks

- [ ] Happy path works end to end — pending: needs the refresh token; no event has been seen in a real calendar
- [ ] Data persists — pending: needs the token (the sync columns are written only after a real Google answer)
- [ ] Create / edit / delete all exercised — pending: book, reschedule and cancel on test need the token
- [ ] Empty state renders sensibly — n/a: nothing lists events here; with the calendar unset the page shows no "not in the calendar" line (the `calendarConfigured()` gate)
- [ ] Invalid input is rejected with a readable message — n/a: no new input; the forms' own validation is untouched
- [x] Boundary cases checked — `calendar-event.test.mjs`: a 03:00 Bangkok visit lands at 03:00 to 04:00 the same day (not the UTC day before); 23:30 ends 00:30 next day; `Novel - Blackie` 9:30 to 10:30; unreadable date gives no event; description holds the two links and no reason

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | System status calendar tile | tile shows "Not set up" | pending: not driven in a browser |
| staff/doctor | Retry on a visit | shown only with `medical.visits`, only when calendar is on | n/a: needs the token |
| volunteer | Retry | not shown, action refuses | n/a: code check only |
| signed out | `/residents/<id>` and `/residents/<id>/clinic-visits` | redirect to `/login?next=…` | pass — curl: both 307 to `/login?next=%2Fresidents%2F…` |
| signed out | `POST /api/calendar/sweep` | refused | pass — curl: no key 401, wrong key 401 |

- [ ] Every role above tested — n/a: only the signed-out rows were driven; the others need a login or the token
- [x] A role that should not have access is blocked server-side — signed-out curl results above (links and sweep)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page or nav entry
- [x] Manual updated (`src/lib/manual/en.ts`) — the Vet visits topic gained the calendar paragraph; reading it at `/manual` is left to a person
- [ ] Translatable strings go through the translation path — n/a: strings added to both dictionaries (typecheck enforces parity); machine translation unchanged
- [ ] Mobile viewport (375px) — pending: the Retry row and tile were not viewed in a browser
- [ ] Browser console clean — pending: not driven in a browser
- [ ] Network clean — pending: not driven in a browser

## 6. Regression

- [x] The pages nearest the change still work — the build compiles every route; the edit and booking actions only gain a call after the save
- [ ] Any shared file touched checked from a second, unrelated page — pending: `en.ts`/`th.ts` and `proxy.ts` not loaded in a signed-in browser
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing came in

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open with a note saying what is built and what is outstanding, because the feature does not work for her until the token is set
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-16-vet-calendar-one-event-per-visit.md`
- [x] `README.md` still accurate — it does not describe the vet calendar
- [ ] **Release notes.** — n/a: the shelter calendar is not connected until the refresh token is set
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the 03:00 and 9:30 claims are test output; "a failure leaves the visit saved" is by code order only and is marked pending below

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: proved by the 03:00 Bangkok unit test, which uses a fixed +07:00 offset and no runtime timezone
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output** — deferred: release manager for deploy output; the gates lines above are unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — deferred: Lutan sets `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` in the production values file explicitly (a production `--secrets` deploy otherwise falls through to dev values)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the code reads 0207, which must be on production before this deploys
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: 0207 goes first with its own release

### Rollback

- [x] Rollback position stated — unset the two variables and nothing is sent; otherwise revert the PR. Events already created stay in the calendar and are not removed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Clinics have no address column, so the event location is the clinic name | accepted — noted in the decision file |
| 2 | low | A hard-deleted visit row leaves its event | accepted — no screen deletes visits; fixing needs a migration |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After Lutan mints the token and sets the calendar id: book, reschedule and cancel a visit on test and see each in the calendar within a minute | test.lannacare.org + Google Calendar |
| 2 | A visit at 03:00 Bangkok shows at 03:00 in the real calendar | Google Calendar |
| 3 | `Novel - Blackie` 9:30 to 10:30 shows as the Director types them | Google Calendar |
| 4 | With a bad token, a booking still saves, shows "Not in the shelter calendar yet", and Retry fixes it once the token is right | a visit's Clinic visits list |
| 5 | The record link in the event opens that dog signed in, and goes to sign-in then the record when signed out | phone |
| 6 | The Director sees the entry on her phone | her phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty

Manual verification by: pending: the refresh token is not minted, so no event has been seen in a real calendar; items 1 to 6 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
