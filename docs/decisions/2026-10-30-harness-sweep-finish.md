# Harness sweep, finishing pass

2026-10-30, stream `harness-sweep-finish`. Follows `2026-10-30-harness-exit-triage.md`.

## The fair red count (dev server up, port 3006, 60 s per check, serial)

181 checks run (the 4 browser ones skipped, on purpose). **160 exit 0. 21 do not.** A first attempt was
discarded: an earlier sweep launch was still alive, so two sweeps wrote one log and collided on a temp
folder (`check-worktree-done` read as red because of it). The count below is from one clean serial run.

| Group | Checks | Reading |
|---|---|---|
| Doctor holds no cards while cards are tested one at a time | check-clinic-allow-lists, clinics-readonly, doctor-clinic-scope, doctor-multi-clinic, doctor-own-clinic-writes, doctor-report-schema, doctor-resident-scope, doctors, who-does-what | Expected red (CLAUDE memory: Doctor is the test role). Not fixed. |
| Not run to completion at 60 s, no assertion failed so far | access-requests-card (waits 61 s on purpose), public-views, residents-sort | Findings: slower than the limit, not shown broken. |
| Need an argument, not a red | drive-token (`--env-file`), schema-drift (`--against`), resident-sections (`--out`) | Run bare they print usage and exit 1. |
| Red on purpose or on dev data | menu-coverage (24 pages, "red until someone has looked"), prescription-schedule-backfill (listed rows to fix in the app) | Not mine. |
| Real, not diagnosed here | card-grants (1 failed), features-schema (orphan row for card `manage_shop_page`), medical-jobs-app (1 expectation) | Follow-ups; card-grants/features-schema may be neighbours writing cards. |
| This PR's own plan | check-test-plan | Red until the plan exists; green once it is filled in. |

## The 23 swaps (deliverable 2)

Of #1089's 25 "safe", 23 were swapped. Excluded by the brief: `check-card-walkthrough` (outside scope) and
`check-medication-list-due` (`prescription-schedule-app`'s this batch). I read the last lines of **all 23**:
nothing runs after the exit call in any, so **the table held, 23 of 23**. Two (`next-og`, `units-schema`)
exit inside a final `if`; still nothing follows. All 23 ran exit 0 in the sweep.

## The 51 guard reads: named follow-up, not started

The 51 "needs a guard" scripts in the triage table.
Each needs `else`/`return` read before `exitWith`. Note `check-restated-columns` exited 127
in the first (contaminated) sweep, the libuv crash this helper cures; it is among the 51.

## Diagnoses

- **check-can-see-drive-file: not broken, was slow.** Already fixed by `9f1181b5` (skip disposable
  `dev_signin_cards_*` roles, evaluate once per id). Run with the server up it completes and every role
  agrees (393 ids, 0 disagreements, rolled back). The ">100 s" reading was the 46 leftover disposable
  roles, not a fault in `can_see_drive_file()`. No change made.
- **check-daily-count: green.** The one data fault is already excluded by id in `7afff2ff` (an immutable
  `placement_history` row; fixing it needs the immutability trigger off on shared dev). All six dates match.
  No row changed by me.

No `src/`, migration or `scripts/lib/` change.
