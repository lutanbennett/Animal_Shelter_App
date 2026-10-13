# 2026-10-13 — Red check harnesses: what was fixed, retired, and left for a ruling

**Context.** The backlog item *Thirteen dev check harnesses still red after `check-harness-repair`* (found 2026-10-10).
All were re-run on 2026-10-13 first; the red list was already partly out of date (activity counts, a new
`stock_receipts` update policy, a replay that broke on `0181`). Rule applied throughout: **ask which side is wrong
before touching either, and never copy today's behaviour into an expectation.**

## Done

| Harness | Which side was wrong | What changed |
|---|---|---|
| `check-fixed-outgoings` | Both. It replayed `0114`, which calls `current_user_role()` (dropped), and "table starts empty" held only before real rows. Its policy-text check named `admin\|management`; `0150` replaced that with four `has_permission('reports.cashflow')` policies on purpose. | No replay (rule 1). Clean slate by `delete` **inside** the rolled-back transaction, nothing asserted about rows it did not make. Policy check now: 4 policies, each gated on `reports.cashflow`. Who holds that cell is parity's job. |
| `check-facility-maps` | It replayed `0142` (same dropped function). Dev holds real plan rows. The fixture picked a zone with no enclosure, so an update of no row read as a missed rejection. | No replay; plan rows cleared inside the transaction; the zone is chosen from an enclosure that exists. `process.exit` replaced by `exitCode` (a libuv crash on Windows gave exit 127 on a pass). All 9 rejections still asserted. |
| `check-safety-stock` | "No row carries a safety stock" is an apply-day claim (rule 4); staff have set real ones. | Claim dropped with the reason in the file. "Omitted → null" is still proved on a fresh row. |
| `check-medication-label` | Same apply-day claim. And "no view names the column" was wider than the real rule: `0136` and `0161` put the label in two signed-in-only views on purpose. | Claim dropped. D now asserts that **no view `anon` can select** names the column, which is the line that matters for the public site. |
| `check-lifecycle-guards` | It replayed `0122`/`0123`, which define `public_*` views that later migrations redefined (rules 1 and 2). | No replay; every guard and anon assertion runs against the live schema. |
| `check-role-write-policies` | Part 1 read `'<role>'::app_role` out of policy text (removed by the conversions) and expected the retired `staff`; the doctor's write path is `is_clinic_login()`, not a cell. Part 2 compared an empty set (Staff is archived). | **Part 1 reduced, not simply retired:** each offered write must have *some* permissive policy for its command (the original `blood_tests` bug: a form and no policy). Role reach now belongs to `check-permission-parity`. **Part 2 and its advisory retired.** Part 3 untouched and green. A negative probe confirmed the new part 1 still fails on a missing policy. |
| `check-impact-baselines` (was untraced) | Dev data. Two figures were set on 2026-10-01, so the view rightly shows them and the pair-rule probes hit rows that were already paired. | Figures set to unset **inside** the transaction. Fully traced, no ruling needed. All 33 checks hold; dev's real figures were re-read afterwards and are unchanged. |
| `check-permission-tables` | Mostly stale expectations: 61→62 activities (`community.outings`, `0169`), 41→42 yes/no, Management 56→57 cells, 732→744 answers, 113→114 expected cells. F's baseline assumed no audit row ever carried an actor. G replayed `0132`, which writes `user_roles.legacy_role`, dropped by `0181`. | Counts follow the migrations that added them, each commented. F is measured as a difference from a baseline taken in the transaction. G retired with its reason (re-runnability is `apply-migrations.mjs --dry-run`'s job). **The paper was wrong too:** `docs/roles-and-permissions.md` §4 gave `maintenance.bills` no Management cell while its own note and `0189` say Management only; one cell added. |
| `check-medication-rounds` (the write half) | Stale expectation. A `frequency_rounds` write asks `reference.types` Edit since `0145`, which is Admin's (paper: "A write is now Admin's, as the frequency list is"). | Management write expected **0**, with the citation. `2026-10-07-management-settings-split.md` does not itself name the frequency list; `2026-10-05-perm-convert-orphans.md` and paper §4 do. |
| `check-perm-convert-orphans` (the `stock_receipts` lines) | Not in the item. Update is allowed for `stock.delivery` since `0191` (the bills inbox needed a cost written onto a receipt). | Expectation `1011`→`1111` for the four roles holding the cell. |
| `check-permission-parity` (count only) | Same 61→62. | Count bumped; nothing else touched. |

Nothing was deleted from dev. Every "clear a table" happens inside a transaction that ends in a rollback.

## Left red on purpose — each needs a ruling from Lutan

- **The doctor.** `check-permission-tables` (the recorded known-red block; everything else in it now holds), `check-permission-parity`
  (21 doctor MISMATCH lines), `check-perm-convert-orphans` (7 rounds probes as the doctor) and `check-medication-rounds` (the doctor
  cannot read `frequency_rounds`, which asks `medical.prescriptions` Read) all say one thing: dev's doctor holds 2 cells, the paper
  gives 13. Whether the paper or the draft is right is the recorded open question, so no expectation was moved. `check-permission-parity`
  also has four `[STALE]` N4 entries (doctor `medical.archive`) saying "the database now matches the default"; they are the same
  question seen from the other side and were left with it.
- **Cells against `jobs.ts`:** `check-2ic-role`, `check-maintenance-role`, `check-medical-jobs`. Whether the bundle or the cells
  are right is a question about what each role may do.

## For the next person

An apply-day assumption ("starts empty", "all null", "the seed logged nothing") is the commonest way a harness goes red on a
database that is working. Replace it with a difference from a baseline taken inside the transaction, or drop it and say so.
