# 2026-10-30 — Dropping the frequency machinery (stream 4 of 4, migration 0288)

## Release order (read first)
`0288` must be applied to production **in the same release as the app code that stops reading these columns, migrations first**. Old code against
the new schema breaks the medication list. Production is six migrations behind (0282–0288). Applied to **dev** at 2026-10-30 11:12 UTC; nothing applied to production.

## What was found still depending on each object (read from the live dev database, not from migration files)
The brief listed five objects. The database held more, all invisible to a `src/` search:
- Triggers `prescriptions_default_rounds` (on insert) and `prescriptions_default_rounds_on_change` (on update of `frequency_id`) → function
  `prescription_rounds_default_trigger()` → `reset_prescription_rounds()`, which rebuilt ticks from `frequency_rounds`.
- Triggers `frequency_default_rounds` / `_on_change` on `frequency` → `frequency_rounds_default_trigger()` → `reset_frequency_rounds()`.
- `merge_frequency(uuid, uuid)`: rewrites `prescriptions.frequency_id`; its only caller was the deleted page.
- Views `prescription_round_status` and `frequency_round_status`. No `src/` reader of either (grep, and no view or function body references them).
- FK `prescriptions_frequency_id_fkey` and the `frequency_rounds` FK/policies/trigger go with their tables/columns.

Drop order: triggers, functions, views, table `frequency_rounds`, `default_frequency_round_keys()`, then the column. The `frequency` table **stays** (history of
older schedules; its label-source trigger is untouched).

## Proof no prescription's doses changed
Before and after applying 0288 on dev, identical md5: `prescription_doses_between()` over every prescription (74) for 2026-10-01..12-31 (`3d858704…`) and
2027-01-15..03-02 (`c9af29c3…`); all `prescription_rounds` (113 rows, `cb6b0760…`); `medication_forecast(2026-10-01, 2026-12-31)` (12 rows, `50e6bfa3…`).

## Scripts
- check-audit-undo, check-medical-archive-card: `frequency_id` removed from the harness inserts; HARNESS-OK.
- check-medical-soft-delete: insert uses the schedule columns plus a morning tick so the forecast still counts it; HARNESS-OK.
- check-shelter-dates: 23:59 now expects `night` for medication, plus 21:59:59 and 22:00 edges; green.
- check-security-schema-fold, check-view-write-grants, measure-permission-baseline: reference to the dropped views / join removed; first two pass, baseline script not run (it measures, takes its own arguments).
- check-phone-width: `/admin/frequencies` and `frequency_id` removed by reading; **not run** (2.5–3 h).
- check-medication-rounds: **retired** — it tested only the default-rounds machinery, now gone.
- check-prescription-schedule-backfill: **retired** — compared a frequency's dose count with ticks; with no frequency it has nothing to compare.

## Not done / left
Dead i18n strings (`nav.frequencies`, `admin.frequencies`) remain in both dictionaries; harmless, left to avoid an en/th mismatch sweep.
