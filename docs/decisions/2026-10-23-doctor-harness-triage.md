# Doctor harness triage: five check scripts, five verdicts (2026-10-23)

Backlog item `check-scripts-doctor-triage`, from the sweep in `2026-10-23-check-scripts-report-to-nobody.md`.
Every script was **re-run on dev today before anything was reasoned**, because a recorded red is a measurement
with a timestamp. Dev was 253 applied, 0 pending.

## First line: two genuine permission faults, filed, not fixed

A login with the `doctor` role can write at a clinic it does not belong to. Two harnesses say so and **both are right**.

| Harness | Says today | Cause |
|---|---|---|
| `check-doctor-own-clinic-writes` (E) | doctor made a bulk booking for other: 1 | `bulk_appointments_*_perm` (0147) ask only `has_permission('visit.book')` |
| `check-doctor-report-schema` (D) | doctor added a report at another clinic: 1; then added a BILL: 1; read a bill (1) | `attachments_*_perm` fall to `bill_owner_can('clinic_visit', …)` = `medical.visits` (0189), no `sees_all_clinical()` |

Policies are permissive and OR together, so the clinic-scoped `doctor_write_bulk_appointments` and
`doctor_write_visit_reports` never get the chance to refuse. **What opened it:** `0230` (Lutan's ruling 2026-10-19,
`2026-10-20-doctor-medical-cells.md`) gave `doctor` `visit.book` and `medical.visits` at level 2 and said "scope kept by the
existing policies". That holds for the tables 0182 clamped (`clinic_visits_insert_perm` is `visit.book AND sees_all_clinical()`)
and not for these two. The ruling authorised the *cells*, not writing at another clinic, and `0220`'s header says a doctor
"never writes or reads a BILL". So this is **not a deliberate change**.

Evidence: with the failing assertions neutered in a scratch copy, everything behind the bulk-booking line in the own-clinic
harness passes (visits, prescriptions, procedures, blood tests, files, doctors are all correctly scoped); the report-schema
harness fails three times in a row on the same cause. Dev's `role_permissions` for `doctor` holds `visit.book` 2 and `medical.visits` 2,
read from the live table. Update and delete on `bulk_appointments` share the unscoped shape; read from `pg_policies`, not run.

Filed as its own item under Security with the exact queries and the fix shape. **No migration written here.**
The two harnesses are left asserting the intended behaviour, so they stay red until that fix lands.

**Production: not established.** The doctor has those two cells only through 0230, so production is affected exactly if 0230 is
applied there. The production env file is not readable from a worktree. `node scripts/apply-migrations.mjs --status --env production`
from the main checkout settles it in one line.

## The other three

| Script | Verdict | Evidence | Change |
|---|---|---|---|
| `check-doctor-multi-clinic` | **Stale harness** | G expected the clerk's `merge_doctors` to die with a unique violation (-4). `0178` put the gate in the function (`clinics.doctors` or a clinic login, else `insufficient_privilege`), so the clerk is refused earlier (-1). Refusal is the intent; the later management merge proves nothing was merged. Everything else in the script (A to H) passes. | accepts -1 or -4 |
| `check-worker-origin` | **Stale harness** | 22 of 23 cases passed. The failing one searched `src/proxy.ts` for the text `return updateSession`; since 2026-10-14 the call is `const response = await updateSession(request)`. `originKeyRefuses` is still called first (line 20 vs 52). | order test now matches `updateSession(` |
| `check-backup-prune` | **Real edge case in `scripts/lib/backup-prune.mjs`, found by the flaky check** | Failed 2 of 25 runs, always 1 violation. Random ages collide at the minute, giving two files with one name. If one sits in the protected newest five and its twin past the floor, `remove` held that name; `backup.mjs` trashes by name (`dumps.find(...)`), so the protected dump goes. Drive allows duplicate names, and a retry inside one minute makes one. | `planPrune` never removes a name that is in the protected set; two fixed cases added for it. 0 failures in 60 runs after, 2 in 25 before. |

The collision is rare in practice (it needs a same-minute twin straddling the floor, all older than the cutoff). It is fixed
because this is the only guard between a bad retry and the shelter's only backup, not because it is likely.

## The other 47

Not touched, and no shared cause found with these five, so no table. The rule from the sweep stands: run each by hand when its
migration or feature changes.
