# Feature test plan

## Header

| | |
|---|---|
| Feature | Blood test, procedure and hospital forms take a visit's date from its shelter day, not its UTC day |
| Backlog item | `docs/backlog.md` → "Blood test, procedure and hospital forms default a visit's date from its UTC day." |
| Branch / worktree | `claude/utc-visit-date` @ `C:\Development\Animal_Shelter_utc-visit-date` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | opened from this commit |
| Tested by / date | Claude (utc-visit-date session), 2026-09-28, signed in as the dev test user (admin) in the browser pane |
| Carries a migration? | no |
| Tested at SHA | `2792614` (the fix); this plan is the commit after it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the three call sites that took `appointment_date.slice(0, 10)` as a visit's day now call `visitDate()` from `src/lib/vets/linkable.ts`, the helper the weight and prescription forms already use
- [x] Files/areas touched listed: `src/app/blood-tests/new/BloodTestForm.tsx`, `src/app/procedures/new/ProcedureForm.tsx`, `src/app/residents/[id]/hospital/page.tsx` (local renamed `visitDay` so it does not shadow the import), `src/lib/releases.ts`, `docs/backlog.md` (tick). No shared lib changed
- [x] Roles affected identified: whoever can open these three forms (admin, management, staff, vet for blood tests and procedures; the hospital roles for Send to hospital). The change is a default value computed the same way for every role
- [x] Out of scope, written down: five other call sites that take a UTC day for a shelter day, found by grepping `slice(0, 10)` across `src/`. Reported, not fixed. They are a new backlog item on the `backlog` branch ("Five more places take a UTC day for a shelter day"): `ResidentHub.tsx`'s `today` for active prescriptions; the date `min` on `ReturnFromHospitalForm.tsx`, `RehomeForm.tsx` and `ReturnToShelterForm.tsx` (from the `timestamptz` `placement_history.start_date`); and `MaintenanceBoard.tsx`'s `updated_at` fallback. Also checked and fine: `immunizations/new/actions.ts`, `lib/management/cashflow.ts`, `lib/status/usage.ts`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 289s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; no stored data changes, only the date a form offers by default
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Two dev vet visits were created for resident Grace (`011b4df8-…`) at **03:00 Bangkok**, the case the bug hits:

- `84366bae-…` at `2026-09-27T20:00:00Z`, 03:00 on the 28th (today)
- `7b529408-…` at `2026-09-20T20:00:00Z`, 03:00 on the 21st

The 21st visit is the one that tells the difference. The old code gives the 20th, the fix gives the 21st, and the form's fallback gives today (the 28th), so each outcome is distinct. With today's visit the right answer and the fallback are both the 28th, which proves nothing.

- [x] Happy path works end to end. Each form checked against the 03:00 visit on the 21st (old code: 20 Sep):
  - **Blood test**, arriving from the visit (`/blood-tests/new?…&vetAppointmentId=7b529408-…`): date `2026-09-21`, visit preselected `21 Sep 2026 — UTC-day check 03:00 Bangkok 21 Sep`
  - **Blood test**, visit chosen in the Linked vet visit picker on a blank form: date went `2026-09-28` → `2026-09-21`
  - **Procedure**, arriving from the visit: date `2026-09-21`
  - **Procedure**, visit chosen in the picker with the real keyboard (click, ArrowDown ×2, Enter): date went `2026-09-28` → `2026-09-21` (screenshot in the session)
  - **Send to hospital** (`/residents/…/hospital?vetAppointmentId=7b529408-…`): date `2026-09-21`, `max=2026-09-28`, notes `Vet visit 21 Sep 2026 · UTC-day check 03:00 Bangkok 21 Sep`
  - Today's 03:00 visit (`84366bae-…`) on the blood test form: `2026-09-28`, as expected but not discriminating (see above)
- [ ] Data persists — reload the page and the change is still there — n/a: the change is the date a form offers before anything is saved; saving is unchanged and posts whatever the date field holds
- [ ] Create / edit / delete all exercised — n/a: only the create forms' default changed; edit forms for blood tests and procedures do not default from a visit
- [x] Empty state renders sensibly: with no visit linked, both forms still default to today (`2026-09-28`), and the hospital page with no `vetAppointmentId` still defaults to today
- [ ] Invalid input is rejected with a readable message — n/a: no validation changed
- [x] Boundary cases checked. The **real exported** `visitDate()` (loaded from `src/lib/vets/linkable.ts` through a resolve hook for the `@/` alias, not re-typed) run against fixed instants under `TZ=UTC`, the Workers case, and again under the machine's own zone. Output unedited:

```
ok   2026-09-27T16:59:59Z -> 2026-09-27 (want 2026-09-27; old slice gave 2026-09-27) 23:59:59 Bangkok, last second of the 27th
ok   2026-09-27T17:00:00Z -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-27) 00:00 Bangkok, first second of the 28th (UTC day still 27th)
ok   2026-09-27T20:00:00Z -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-27) 03:00 Bangkok (the dev visit)
ok   2026-09-20T20:00:00Z -> 2026-09-21 (want 2026-09-21; old slice gave 2026-09-20) 03:00 Bangkok on the 21st (the dev visit)
ok   2026-09-27T23:59:59Z -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-27) 06:59:59 Bangkok, end of the broken window
ok   2026-09-28T00:00:00Z -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-28) 07:00 Bangkok, UTC and shelter agree again
ok   2026-09-30T17:30:00Z -> 2026-10-01 (want 2026-10-01; old slice gave 2026-09-30) month end
ok   2026-12-31T18:00:00Z -> 2027-01-01 (want 2027-01-01; old slice gave 2026-12-31) year end
ok   2028-02-28T19:00:00Z -> 2028-02-29 (want 2028-02-29; old slice gave 2028-02-28) leap day
ok   2026-09-27T20:00:00+00:00 -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-27) PostgREST's +00:00 form
TZ=UTC UTC: 10 ok, 0 FAIL
```

and under the machine's zone: `TZ=(system) Asia/Bangkok: 10 ok, 0 FAIL`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all three forms | visit's shelter day as default date | signed in; 21 Sep on all three, see §4 |
| management | n/a: access unchanged | same default as admin | n/a: no role logic touched; `visitDate()` does not read the role |
| staff | n/a: access unchanged | same default as admin | n/a: as above |
| vet | n/a: access unchanged | same default as admin | n/a: as above |
| volunteer | n/a: access unchanged | same default as admin | n/a: as above |
| signed out | n/a: access unchanged | redirected to `/login` | seen on the first load in this session: `/blood-tests/new` → `/login?next=…` |

- [ ] Every role above tested — n/a: the change is a pure function of the visit's timestamp and reads no role; access to these pages is untouched
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe how the default date is computed; behaviour now matches what it implies ("the visit's date")
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — `read_console_messages` (errors only) on `/procedures/new`: "No console logs"
- [x] Network clean — the procedure page's chunk requests all 200/304; no 4xx/5xx seen on the three pages

## 6. Regression

- [x] The pages nearest the change still work: `/blood-tests/new` and `/procedures/new` with and without a visit, `/residents/[id]/hospital` with a visit
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched; `linkable.ts` is only imported, not changed
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged ("Already up to date."), and gates ran on this tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the follow-up (five more call sites) went on the `backlog` branch
- [ ] Non-obvious design choices appended to `docs/decisions.md` — n/a: nothing new to decide; this applies the rule recorded when `visitDate()` moved to the shelter day
- [ ] `README.md` still accurate — n/a: README does not mention these defaults
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line: a blood test or procedure logged from a visit between midnight and 7 in the morning now takes that visit's date, and Send to hospital from such a visit starts on the visit's day
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "day before, 00:00–07:00 Bangkok" claim is the `old slice gave` column above, and the fix is shown in the forms against a real 03:00 row

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: release manager — the logic is proved above under `TZ=UTC` against the real function. What only the deployed Worker can show is the hospital page, which renders on the server: open it from a visit timed 00:00–07:00 Bangkok on `test.lannacare.org` and expect that visit's own day. The two client forms compute in the browser and do not depend on the Worker's clock
- [x] **Boundary or banding change covers both edges**: both sides of 17:00Z (16:59:59Z → 27th, 17:00:00Z → 28th), both ends of the broken window (00:00 and 06:59:59 Bangkok), the first instant after it (07:00), month end, year end and a leap day, all in the §4 run
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page reads vet visits

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [x] Apply plan stated: nothing to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover**: `wrangler rollback` brings back the old default (a visit before 07:00 Bangkok offers the day before). No schema and no stored data are involved. Records saved while the fix was live keep whatever date was saved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Same UTC-day-as-shelter-day pattern in five other places (see §1) | deferred to backlog: "Five more places take a UTC day for a shelter day" |

## Left for manual verification

Empty. The change is a computed default with no new wording or layout, and it was driven in the browser against a 03:00 row. The deployed-build check is in §8.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing for a person to look at; the list is empty and the deployed-build check is §8's

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect is out of scope and deferred to the backlog
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
