# Three scripts items in one stream: restore-a-death, the archive check, the lockfile version

Backlog `#dklvq`, `#36egc`, `#jhd8s`. One decision file for all three (same kind of work, all inside `scripts/`).

## `#dklvq` — what `correct-resident.mjs` covers now

**What the five `audit_log`-only corrections were.** The backlog item counts them: **R-0392, R-0208, R-0317, R-0067 and the
R-0221/R-0182 pair.** Their receipts were written to a scratch folder that has since been cleared, so each survives only in
`audit_log` (which cannot be edited, `0121`): the record is not zero, but there is no before-state to compare against. Nothing
can be done to recover those receipts; this file only records that they were lost and why, so nobody searches for them. No real
names or row contents are written here (the repo is public).

**What the script now covers.** The item names two gaps, and both are closed:

1. *Restore a withdrawn death* — **`--restore-death <code> --date <YYYY-MM-DD>`**. The R-0323 correction needed this and the script
   could only delete a duplicate, so it was done by hand (a rehearsal in a rolled-back transaction, then one commit; the method was
   right, it simply left no receipt). The mode deletes the open `DeceasedInError` row and re-opens the `Deceased` row it closed
   (`end_date` back to null), so the death keeps its original date. No row is created. Same shape as the removal mode: dry run by
   default (a rolled-back run of the real SQL), `--apply --confirm <code>` on production.
2. *The receipt is a property of the operation* — the new mode writes its before-state **first**, to the **main checkout's gitignored
   `.local/`** (found from git's common dir, so it is the same folder from any worktree), named `production-<code>-restore-death-before-<date>.json`
   and never overwritten. The existing removal mode keeps its Desktop receipt unchanged.

**The guards, and the field each one reads** (written down because a guard that tests the wrong property is reported as safety):
"not deceased now" reads `resident_is_deceased()`, the function the database lock itself uses (the open placement is in the
Lifecycle zone), not `placement_type` alone; "the Deceased row" is the row immediately before the open one, `Deceased`, in a
Lifecycle-zone enclosure, whose `end_date` equals the open row's `start_date`; "the open row" is the only row with `end_date is null`,
`DeceasedInError`, and the last; `--date` must match the Deceased row's start as a UTC or an Asia/Bangkok date. All of it is re-checked
inside the transaction. Anything after the withdrawal means the resident has moved since, and it refuses.

**The cascade is not undone, and the script says so.** Withdrawing a death put back the cancelled vet appointments and ended
prescriptions; only *inserting* a `Deceased` row cancels them, so re-opening one does not. If any are live the run refuses unless
`--leave-cascade` is given. `ready_for_adoption` is likewise not cleared. This was a judgement call: the alternative (re-applying the
cascade in the script) would duplicate trigger logic.

**Proved on dev, not production.** On dev (`R-1007`, which had `…Deceased, DeceasedInError`): a wrong `--date` refused; a resident
whose death was not withdrawn refused (three reasons); the dry run passed in a rolled-back transaction; `--apply` wrote the receipt, then committed,
and `R-1007` read deceased in `Lifecycle / Deceased` on its original date; a second run then refused. No production run was made.

**Judged out of scope:** nothing the item names. Not invented, per the brief: any other correction mode.

## `#36egc` — which check settles it

**`node scripts/check-production.mjs deceased-archive-outstanding --env production`** (it lives in `scripts/lib/readonly-checks.mjs`).
It lists, for any deceased resident, whether `deceased_archived_at` is set, whether the Drive summary and index are recorded, and the
placement-type sequence (so "exactly Intake then Deceased" is visible). Codes, dates, true/false and placement types only. It takes no
SQL, as designed. The standalone `scripts/check-deceased-archive-state.mjs` (#1292) is kept: it also prints the resident's name, so
it answers a different, human-facing question. **A session asking "is R-0323 archived?" runs the named check and does not ask Lutan.**

## `#jhd8s` — the lockfile version

`cut-release.mjs` now sets the lockfile's top-level `version` and `packages[""].version` beside `package.json`'s, by an anchored edit
that does not re-serialise the rest of the file, and refuses before writing anything if it cannot find both. `--verify` asserts
the three agree. Proved without cutting a release: a copy of `package.json`, the lockfile and `releases.ts` in a scratch folder, cut with
`--root`, then `--verify` passed (17 of 17); the root-package version in the scratch lockfile was set back to `0.41.0` and `--verify` failed
that one assertion and exited 1.
