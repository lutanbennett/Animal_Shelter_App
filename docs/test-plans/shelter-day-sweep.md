# Feature test plan

## Header

| | |
|---|---|
| Feature | The last five `slice(0, 10)` call sites take the shelter day of a timestamp, not its UTC day |
| Backlog item | `docs/backlog.md` → "Five more places take a UTC day for a shelter day." |
| Branch / worktree | `claude/shelter-day-sweep` @ `C:\Development\Animal_Shelter_shelter-day-sweep` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` |
| PR | #198 |
| Tested by / date | Claude (shelter-day-sweep session), 2026-09-28. **Not signed in** in the browser pane: reading the dev test user's credentials was refused this session, so every check below is scripted against real dev rows and the real exported helper, and the browser checks are in *Left for manual verification* |
| Carries a migration? | no |
| Tested at SHA | `e7d2f31` (fix `ad44891` + sync with `origin/main` at `ac8a722`); this plan is the commit after it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: each of the five sites the backlog item named now computes `todayIso(new Date(x))`, the expression `visitDate()` already uses, instead of `x.slice(0, 10)`. No new helper
- [x] Files/areas touched listed: `src/app/residents/[id]/ResidentHub.tsx` (`today` for active prescriptions and current diets), `src/app/residents/[id]/hospital/return/ReturnFromHospitalForm.tsx`, `src/app/residents/[id]/rehome/RehomeForm.tsx`, `src/app/residents/[id]/rehome/return/ReturnToShelterForm.tsx` (date input `min`), `src/app/maintenance/MaintenanceBoard.tsx` (`updated_at` fallback), `src/lib/releases.ts`, `docs/backlog.md` (tick). No shared lib changed
- [x] Roles affected identified: anyone who opens a resident hub (the prescriptions/diet cards), the placement roles on Return from hospital / Rehome / Return to shelter, and the maintenance board's users. The change reads no role
- [x] Out of scope, written down. Severity is not equal: **only the hub showed wrong data** — a prescription or diet with `end_date` yesterday stayed "current" from 00:00 to 07:00 Bangkok. The three forms offered a `min` one day early for a placement made in that window, but the server (`placementStartDate()` + the `<= current.start_date` check in `src/lib/placements/*.ts`) already refused that day, so the fix turns an error on save into a greyed-out day — no data was ever wrong. The maintenance fallback only applies to a completed job with no `date_completed`, which the 0033/0073 trigger stamps, so it is tidying. The re-run grep of `slice(0, 10)` across `src/`, after syncing, finds **no new sites** since #194: what remains is `immunizations/new/actions.ts:43`, `lib/management/cashflow.ts:120`, `lib/status/usage.ts:112` (all listed as fine in the backlog item), `lib/format.ts:100` (`addDaysIso`, pure date arithmetic done in UTC by design) and a comment at `lib/format.ts:59`

**Checked each site is not an already-consistent comparison** (the brief's trap): the hub compares against `prescriptions.end_date` and `diets.end_date`, both `date` columns written on the shelter calendar; the forms' `min` bounds a date input whose value the server turns into an instant with `placementStartDate()`, which reads the day with `todayIso()`; the maintenance fallback is compared with `recentCutoff = addDaysIso(todayIso(), -N)`, a shelter day. None was UTC-against-UTC.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts`, because #197 cut release 0.8.1 and emptied `unreleased` while this branch added a line to it. Resolved to main's release plus this branch's one line; `git diff origin/main -- src/lib/releases.ts` is that single added line
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 458s

gates: typecheck=0 lint=0 build=0
```

Re-run after a second sync, which brought #199 (vet resident scope) and a second `releases.ts` conflict (both lines kept), at `6b39a52`:

```
=== gates: build exited 0 after 287s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (#198): `check`, `test-plan` and `migration-numbers` all passed at `dd31ef2`, before #199 made the PR conflict; re-run on the merge commit before merging

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; nothing stored changes, only how a stored value is read
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Two dev rows were created for the awkward case (dev data is disposable; left in place):

- prescription `46b3f7d4-…` on **Chompoo** (`a75d0126-…`), Amoxicillin, `start_date 2026-09-20`, `end_date 2026-09-27` — ended yesterday
- placement `e36de253-…` for **Cream** (`78677631-…`), `SendToHospital` at `2026-09-27 20:00:00+00` — **03:00 Bangkok on the 28th**, as `placementStartDate()` stores a same-day move

A scratch script read both rows back from dev and evaluated the old and new expressions at `now = 2026-09-27T20:30:00Z` (03:30 Bangkok, 28 Sep — what the resident page passes as `now`), plus the server's refusal rule from `placementStartDate()` and `hospital.ts`. Output unedited:

```
hub: end_date=2026-09-27 old today=2026-09-27 new today=2026-09-28
PASS  old code counts the finished prescription as active (the bug reproduces)
PASS  fixed code does not
form: start_date=2026-09-27T20:00:00.000Z old min=2026-09-27 new min=2026-09-28
PASS  old min 2026-09-27 is a day the server refuses
PASS  new min 2026-09-28 is accepted by the server
PASS  maintenance fallback: 2026-09-27T20:00Z is shelter day 2026-09-28
PASS  outside 00-07 Bangkok old and new agree
```

- [x] Happy path works end to end, at the logic level: the 03:00 case reproduces the bug with the old expression and not with the new one, for the hub prescription and the Return-from-hospital `min` (above). Rendering the pages is left for manual verification — not signed in
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved differently; the hub is read-only and the forms post whatever date is chosen, as before
- [ ] Create / edit / delete all exercised — n/a: no create/edit/delete path changed
- [x] Empty state renders sensibly: with no current placement the forms' `min` is `undefined` as before (`x ? todayIso(new Date(x)) : undefined` replaces `x?.slice(0, 10)`, which was also `undefined`); a prescription with no `end_date` is still active (`!p.end_date ||` unchanged)
- [ ] Invalid input is rejected with a readable message — n/a: no validation changed; the server's refusal of a pre-placement date is untouched
- [x] Boundary cases checked. The **real exported** `todayIso()` from `src/lib/format.ts`, which is the whole of the changed expression at all five sites, run against fixed instants under `TZ=UTC` (the Workers case), followed by the hub's unchanged `end_date >= today` comparison either side of 17:00Z. Output unedited:

```
ok   2026-09-27T16:59:59.000Z -> 2026-09-27 (want 2026-09-27; old slice gave 2026-09-27) 23:59:59 Bangkok, last second of the 27th
ok   2026-09-27T17:00:00.000Z -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-27) 00:00 Bangkok, first second of the 28th
ok   2026-09-27T20:00:00+00:00 -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-27) 03:00 Bangkok, PostgREST form (Cream's placement)
ok   2026-09-27T20:30:00.000Z -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-27) 03:30 Bangkok, the hub's `now` in the repro
ok   2026-09-27T23:59:59.000Z -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-27) 06:59:59 Bangkok, end of the broken window
ok   2026-09-28T00:00:00.000Z -> 2026-09-28 (want 2026-09-28; old slice gave 2026-09-28) 07:00 Bangkok, UTC and shelter agree again
ok   2026-09-30T17:30:00.000Z -> 2026-10-01 (want 2026-10-01; old slice gave 2026-09-30) month end
ok   2026-12-31T18:00:00.000Z -> 2027-01-01 (want 2027-01-01; old slice gave 2026-12-31) year end
ok   2028-02-28T19:00:00.000Z -> 2028-02-29 (want 2028-02-29; old slice gave 2028-02-28) leap day
ok   hub at 2026-09-27T16:59:59.000Z: end_date 2026-09-27 active=true (want true; old code said true)
ok   hub at 2026-09-27T17:00:00.000Z: end_date 2026-09-27 active=false (want false; old code said true)
ok   hub at 2026-09-27T23:59:59.000Z: end_date 2026-09-27 active=false (want false; old code said true)
TZ=UTC UTC: 12 ok, 0 FAIL
```

and under the machine's zone: `TZ=(system) Asia/Bangkok: 12 ok, 0 FAIL`

The hub's filter is inline in the component, so the comparison line re-types `end_date >= today`; the part that changed, `todayIso(new Date(now))`, is the real function.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | hub, three placement forms, maintenance board | shelter day used | n/a: not signed in; logic proved in §4, rendering in manual item 1–2 |
| management | n/a: access unchanged | same as admin | n/a: no role logic touched; `todayIso()` reads no role |
| staff | n/a: access unchanged | same as admin | n/a: as above |
| vet | n/a: access unchanged | same as admin | n/a: as above |
| volunteer | n/a: access unchanged | same as admin | n/a: as above |
| signed out | resident hub | redirected to `/login` | seen: `/residents/a75d0126-…` → `/login?next=%2Fresidents%2Fa75d0126-…` on :3015 |

- [ ] Every role above tested — n/a: the change is a pure function of a stored timestamp and reads no role; access is untouched
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe how "today" is computed; behaviour now matches what it implies
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: not signed in, so the changed pages were not rendered in this session; manual items 1–2
- [ ] Network clean — n/a: not signed in, as above

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not rendered in this session (not signed in); typecheck and build pass on all five files, and manual items 1–2 cover the render
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched; `format.ts` is only imported, not changed
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought only #197 (release 0.8.1, `releases.ts` and `package.json`); gates ran on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [ ] Non-obvious design choices appended to `docs/decisions.md` — n/a: nothing new to decide; this applies the existing rule (a shelter day comes from `todayIso()`), and the per-site reasoning is in §1 and the commit message
- [ ] `README.md` still accurate — n/a: README does not describe these dates
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line: a prescription or diet that ended yesterday no longer shows as current on a resident's page between midnight and 7, and the three placement forms no longer offer the day before a move made in those hours
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "A day early from 00:00 to 07:00" is the `old slice gave` column above; "the server already refused it" is the `old min 2026-09-27 is a day the server refuses` line, evaluated against Cream's real row

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: release manager — the logic is proved above under `TZ=UTC` against the real `todayIso()`, which formats in `Asia/Bangkok` whatever the runtime zone. What only the deployed build shows is the hub between 00:00 and 07:00 Bangkok: a prescription that ended the day before should not be listed as current. The forms' `min` does not depend on the clock at all, only on the stored placement time
- [x] **Boundary or banding change covers both edges**: both sides of 17:00Z (16:59:59Z → 27th and still active; 17:00:00Z → 28th and not), both ends of the window (00:00 and 06:59:59 Bangkok), the first instant after it (07:00), month end, year end and a leap day
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` reverts the Worker; there is no schema or data change to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Resident hub: a prescription or diet that ended yesterday counted as current from 00:00 to 07:00 Bangkok | fixed |
| 2 | low | Return from hospital / Rehome / Return to shelter: date `min` one day early for a placement made 00:00–07:00 Bangkok; the server refused the extra day, so an error on save rather than wrong data | fixed |
| 3 | low | Maintenance board: `updated_at` fallback compared a UTC day with a shelter-day cutoff | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in, Chompoo's hub renders with no console errors, and the Amoxicillin prescription that ended 27 Sep is **not** listed as current. (At any hour after 07:00 this is also what the old code showed, so it proves the page renders, not the fix — the fix is proved in §4) | `http://localhost:3015/residents/a75d0126-b8ad-52f3-abe6-cbfc047cec09` |
| 2 | Signed in, Cream's Return from hospital form: the date picker's earliest day is **28 Sep**, not 27 Sep. This one discriminates at any hour, because the `min` comes from the 03:00 placement, not the clock | `http://localhost:3015/residents/78677631-a306-5596-a32b-7e9dcef4ef60/hospital/return` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (shelter-day-sweep session)  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: the two browser checks under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links this file, which is in the PR
- [ ] Handed to the production release manager — n/a: not yet — handed over with the PR once it merges

Result: pass

Release manager acknowledgement: pending  Date: —
