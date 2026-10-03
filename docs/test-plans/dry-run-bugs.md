# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Three wrong-result bugs from the staff dry run: Scan a chip finds nothing (F-02), today's date refused before 07:00 Thai time (F-03), a resident cannot be moved on the day it arrived (F-04) |
| Backlog item | `docs/backlog.md` → *Review the staff dry-run report* → F-02, F-03, F-04 (the parent item stays open) |
| Branch / worktree | `claude/dry-run-bugs` @ `C:\Development\Animal_Shelter_dry-run-bugs` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | linked from the PR itself |
| Tested by / date | Claude (dry-run-bugs session), 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the chip test on `/residents` is fixed (and extracted so it can be tested); every "can't be in the future" check now compares calendar days in Asia/Bangkok, which covers three server actions that compared a UTC-midnight date with `Date.now()`; and a placement may follow another on the same shelter day, because intake stamps its placement at 00:00 UTC (07:00 Bangkok), later than `now` until 07:00
- [x] Files/areas touched listed: `src/app/residents/page.tsx`, `src/lib/residents/microchip.ts`; `src/app/{immunizations,blood-tests,procedures}/new/actions.ts`; `src/lib/placements/{dates,move,hospital,rehome,deceased}.ts`; the six `dateBefore…` strings in `src/lib/i18n/dictionaries/{en,th}.ts`; `src/lib/releases.ts`; `scripts/check-shelter-dates.mjs`, `scripts/check-chip-scan.mjs`; `docs/` (backlog, decision, audit addendum, this plan). No migration, no `worker/`
- [x] Roles affected identified: chip scan and Move enclosure are used by admin, management (chip scan), staff, vet (chip scan, scoped to their clinic by RLS) and volunteer (Move); the dated forms by admin, staff and vet. Signed-out: none
- [x] Out of scope written down: **F-01** (staff cannot write blood tests, stream 3010), **F-05–F-07** (phone overflow, stream 3011), **F-13** (ID search needs `R-0055`; this change does not touch the ID branch), moving the intake stamp to shelter midnight (a data migration; not needed once the comparison is by day), and the remaining fifteen findings

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict, in `src/lib/releases.ts` (`unreleased` emptied by the 0.15.1 cut), resolved by keeping this branch's two lines
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 35s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration (`0131` belongs to `schema-blood-test-policies`)
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; no stored value changes. The refusals fixed here wrote nothing
- [ ] Constraints and defaults exercised against real rows — n/a: no migration. (The existing `end_date > start_date` constraint was exercised by the F-04 run in §4)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Evidence, all run on 2026-10-03 against dev:

- `node scripts/check-shelter-dates.mjs` — the real exported `chipFromSearch`, `isFutureDate`, `placementStartAfter` at fixed instants (16:59:59Z, 17:00:00Z, 18:00Z, 03:00Z, 05:00Z) under four process time zones (UTC, Asia/Bangkok, America/Los_Angeles, Pacific/Kiritimati), plus a scan that fails if any `.getTime() > Date.now()` returns to `src/`. **All checks passed.** With the old chip regex put back, it and `check-chip-scan.mjs` both fail (4 and 5 failures respectively), so neither is vacuous.
- `node scripts/check-chip-scan.mjs` — a throwaway staff login and a throwaway resident with a random 15-digit chip, requested through the running page: the bare chip, the chip typed in groups of three with spaces and with dashes all go to the resident; an unknown chip stays on the list, says "No resident has microchip …" and offers "New resident with this chip"; a name is still a name search. **All expectations held.**
- The real `moveResidentToEnclosure()` run against dev as a throwaway staff login, on a resident whose intake was stamped 23:00 Thai time **today** (later than `now`, on the same shelter day, which is the 01:00 situation at any hour): a move dated today succeeded and was stamped one second after the intake; a second move the same day succeeded; a move dated 2 Oct was refused with "The move date can't be before the day the current placement started." The prior rows' `end_date` were set (the `end_date > start_date` constraint held). The throwaway resident and login were deleted.

- [x] Happy path works end to end: chip scan reaches the resident; a same-day move succeeds against the real database
- [x] Data persists — reload the page and the change is still there: the placement rows were read back from `placement_history` after each move (two `ChangeEnclosure` rows, intake and first move closed correctly)
- [ ] Create / edit / delete all exercised — n/a: no new record type; the move is a create, exercised above
- [x] Empty state renders sensibly: an unknown chip shows the chip-specific "not found, register?" message (it never did before)
- [x] Invalid input is rejected with a readable message, not a crash: a date a day before the placement began is refused with the reworded message; a malformed date is refused as invalid by the three form actions (`isIsoDate`) — by reading the code, not run
- [x] Boundary cases checked: both sides of Bangkok midnight (16:59:59Z / 17:00:00Z), 01:00 and 10:00 Thai time, the intake-day tie at 00:00Z, the back-dated `T12:00Z` tie, a placement start whose Bangkok day differs from its UTC day, chips of 14, 15 and 16 digits, chips with letters, resident IDs and names

### Role access matrix

No permission changes. Only staff was signed in (throwaway login, deleted); the other roles are unchanged code paths.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | not run: no permission change |
| management | n/a | unchanged | not run: no permission change |
| staff | `/residents?q=<chip>`; `moveResidentToEnclosure` | chip → resident; same-day move allowed | passed (above) |
| vet | n/a | unchanged | not run: RLS still limits the chip lookup to the vet's clinic (comment in `page.tsx` kept) |
| volunteer | n/a | unchanged | not run: `MOVE_ROLES` untouched |
| signed out | n/a | unchanged | not run: no permission change |

- [ ] Every role above tested — n/a: no permission or role logic changed; staff was run as the representative role
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: no manual topic describes the old refusals or the chip test (grepped `src/lib/manual/en.ts`)
- [x] Translatable strings go through the translation path: the six `dateBefore…` refusals are reworded in `en.ts` and `th.ts`. The Thai edit is a mechanical swap (`ต้องอยู่หลังวันที่` → `ต้องไม่ก่อนวันที่`) made without a Thai reader — listed under manual verification
- [ ] Mobile viewport (375px) — n/a: no layout change. Move enclosure shares a page with F-05's hub header (stream 3011); see §6
- [ ] Browser console clean — n/a: not driven through the browser pane. The pane's tab stayed hidden (`visibilityState: hidden`) and the page never hydrated, so the UI could not be clicked; the behaviour was exercised through the page's HTTP response and the real server function instead
- [ ] Network clean — n/a: same reason; the chip-scan check reads the page's status and body directly

## 6. Regression

- [x] The pages nearest the change still work: `/residents` as a name search (by name, in `check-chip-scan.mjs`), the weight, adoption-update, microchip and placement actions that already used `isFutureDate` (their imports and behaviour are unchanged; `typecheck` and `build` cover them)
- [ ] Shared file checked from a second, unrelated page — n/a: `src/lib/placements/dates.ts` is shared by all six placement actions; `move.ts` was run against the real database, and the other five use the identical `placementStartAfter` call. Hospital, rehome and death were **not** run end to end, only compiled and covered by `placementStartAfter`'s checks
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the synced tree
- [x] Overlap with `phone-width-fixes` (3011): different files, same page (`/residents/[id]/move` sits under the hub). Nothing in this change touches the hub header or any layout, so a hub misbehaving at phone width after both merge is 3011's change, not this one

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: F-02, F-03, F-04 ticked with a note each; the parent review item is left open
- [x] Non-obvious design choices added as `docs/decisions/2026-10-03-dry-run-bugs.md` (the shelter-day rule, that F-04 shares F-03's cause, why the intake stamp is not migrated, that F-13 is not fixed here)
- [ ] `README.md` still accurate — n/a: README does not describe date validation or chip search
- [x] **Release notes.** Two lines added to `unreleased` in `src/lib/releases.ts`: chip scan now finds the animal; dates are no longer refused before 7 am and a resident can be moved on the day it arrived
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision were measured, not reasoned: that `new Date("2026-10-03")` is later than 01:00 Thai time, and that the old move guard refuses at 18:00Z and allows at 03:00Z, were computed with the old logic; the new behaviour was run (above). **Not measured:** the immunization, blood-test and procedure forms at an actual clock before 07:00 — see manual verification. Also corrected the dry-run report's "wait a day": waiting until 07:00 also worked

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour: the real exported functions were run at fixed instants either side of 17:00Z, at the 00:00 and 06:59 Thai ends of the window, and under `TZ` of UTC, Bangkok, Los Angeles and Kiritimati. The "does the deployed build behave as the source" half needs 00:00–07:00 Thai time on `test.lannacare.org` and is under manual verification
- [x] Boundary assertions cover both edges: Bangkok midnight on both sides; 01:00 (refused before, accepted now) and 10:00 (accepted before and now); the intake day, the day before it, and the tie of two back-dated changes. The case the finding named (01:00) and the case that discriminates (the day *before* the placement, still refused) are both asserted
- [x] Evidence pasted is the tool's actual output: the §2 lines are printed by `scripts/gates.mjs`; the §4 results are summarised from the scripts' own "All checks passed" / "All expectations held" endings
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi (a rebuild); `npx wrangler rollback --env production` for the Worker. No migration and no stored data changed, so there is nothing to undo beyond the code

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | F-02: Scan a chip never found a resident (regex without backslashes) | fixed |
| 2 | high | F-03: today refused as "in the future" 00:00–07:00 Thai time on immunizations and blood tests; **procedures had the same line** and was not in the report | fixed (all three) |
| 3 | high | F-04: a move on the intake day refused 00:00–07:00 Thai time (intake stamped 00:00 UTC), and two same-day back-dated changes refused as a tie | fixed (all six placement actions) |
| 4 | low | The new Thai wording of the six `dateBefore…` refusals has not been read by a Thai speaker | accepted — listed below |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Between 00:00 and 07:00 Thai time on `test.lannacare.org`: log an immunization, a blood test (once `schema-blood-test-policies` has merged, or as admin) and a procedure with the form's own default date. All three should save | Resident → Log immunization / Log blood test / Log procedure |
| 2 | Same window: add a resident (intake today), then Move enclosure dated today. It should save and the history should show the move on today's date | Resident → Move enclosure |
| 3 | Scan a real chip with a real reader, and type one with spaces | Residents → Scan a chip |
| 4 | Whether the Thai refusals read naturally: "วันที่ย้ายต้องไม่ก่อนวันที่เริ่มการจัดที่พักปัจจุบัน" and the five like it | Move, hospital (in and back), foster/adopt (out and back), death |
| 5 | After this and `phone-width-fixes` are both on `main`: open Move enclosure at 375 px and confirm the page is not wider than the screen | Resident → Move enclosure |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (dry-run-bugs session)  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the list is not empty and no person has looked (see the pending signature below)

Manual verification by: pending: the five items under *Left for manual verification*, chiefly the 00:00–07:00 Thai-time run, which cannot be done at midday

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR is opened

Result: pass with accepted defects

Release manager acknowledgement: n/a  Date: —
