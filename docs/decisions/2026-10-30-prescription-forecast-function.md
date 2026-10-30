# Prescription forecast reads the schedule (migration 0284)

Stream 2 of 4 for **PRESCRIPTIONS BECOME A RECURRING SCHEDULE** (Medical records). Stream 1 was `0283`
(`2026-10-30-prescription-schedule-schema.md`). Medication only; diets untouched.

## What changed

`prescription_doses_between()` and `medication_forecast()` no longer read `frequency_id`. They read
`prescriptions.schedule_*` (0283) and the ticked rounds:

- **scheduled days** = days in the window the pattern lands on. `day`: every N days from the start date.
  `week`: the chosen ISO weekdays (default: the start date's) in every Nth week, weeks counted Monday to Sunday from the
  start date's week. `month`: the chosen days (default: the start date's) in every Nth month; **a day the month lacks
  moves to its last day** (Lutan, 2026-10-30), and 30 and 31 both landing on 28 February count once.
- **doses** = scheduled days x ticked rounds (the ticks are the dose count, four at most).
- **quantity** = scheduled days x the sum of each ticked round's `dose_quantity`, a round with none taking the
  prescription's `dose_quantity` (as 0234 does). This is what lets "2 in the morning, 1 in the evening" reach the forecast.
- No `schedule_unit` = as needed = 0, as before. A dose written only in the notes is not in the forecast, by design.

Three new functions: `prescription_dose_days_between()` and `prescription_quantity_between()` (new), with
`prescription_doses_between()` rewritten on the first. **`stock_medication_forecast()` (0143) is rewritten too**: it is
the security-definer copy for a login that cannot read the filtered view, and its own header says a change to the
arithmetic must be made in both. It was not on the brief's list. No grant, policy or role changed.
The archived filter from `0124` is kept. `0044`'s `medication_forecast` is not the live body; `0124`'s was.

## The proof the figures did not move

On dev (72 prescriptions), per-prescription `prescription_doses_between()` over 2026-10-01..2026-12-31 and
2027-01-15..2027-03-02 (crosses a short February), and the whole `medication_forecast()` over both windows, read before
and after applying. The md5s differ, as they must: **exactly one prescription moved**, and everything else is identical.

| | before | after |
|---|---|---|
| per-prescription, window A | `c2aa16b70458bca5441c63e8b584598b` | `4fa09faeb0ff2ddc24e280724a9438ca` |
| per-prescription, window B | `ba2b2c27e41ffdc454fec8c9864f0d44` | `11fd088c016f6f83dd7bb8675e4c8964` |
| forecast A | `b7617ed22e90919a78ec75e39d4bada7` | `867238b1bb1c547aec917640e34549d1` |
| forecast B | `25f01fa834a255338eff09676e40b228` | `9c7c794d8b56f6ff3f50bf29a3bb0478` |

The one prescription: `e5733e74-…` (AMC 500, Twice daily, **0 ticks**), 140 -> 0 doses in A and 94 -> 0 in B. It is the
single row on `check-prescription-schedule-backfill.mjs` (dev test data, "Capwarn Test 0924"). Its medication's forecast
fell by exactly those doses and nothing else. That is the design working: no ticks, no doses, and the fix list exists
to catch it before release. Every other prescription, including the 3 as-needed, is unchanged to the dose and the quantity.

The day logic was also exercised on eight synthetic schedules (Mon+Thu, every other day, every other week, monthly
on the 31st across Jan-Apr, {30,31} in February, every 2 months, as needed, end date bounds): all as expected.

## The fix list, and its clock

Dev: one test row, above. Production: the planner ran it with `--env production` at about 07:00 UTC on 2026-10-30
and it was empty. **Re-run `node scripts/check-prescription-schedule-backfill.mjs --env production` immediately
before the release that carries `0283` and `0284`**: a prescription edited since can create a mismatch, and with this
migration a mismatch is medicine vanishing from the forecast, not a note. Production is two behind on purpose
(`0282`, `0283`); `0284` makes it three. Nothing was applied to production.

## Readers re-proved, and which were left alone

Re-proved against the new functions and left untouched: `0072`, `0183`, `0211` (cashflow, all call
`medication_forecast`; `cashflow_forecast` still runs on dev, 3 medication rows), `0083` (stock on hand, unit only),
`src/lib/management/stock-usage.ts` and the `management/{medications,purchasing,stock-usage}` pages (they call the
two forecast functions by name and the signature and columns are unchanged), `check-medical-soft-delete` (HARNESS-OK,
including that an archived prescription leaves the forecast).
**`src/lib/medication-list/due.ts` and `check-medication-list-due.mjs` still read the frequency** (27/27 pass) and do
not call the forecast; they are the medication list's "due today", which is the app stream's rebuild. Left alone.

## `check-medication-rounds.mjs`: fixed here

Both vocabulary assertions restated for four rounds (night is sort 4, medication only). 75 checks held, GREEN.

## Hand-over

**App stream:** the form (day pattern, four ticks, per-round amounts), the round screens, the medication list's due
logic on `due.ts`, and `default_medication_round_keys()` (decide the four-a-day default). The fix list must be at zero
first. **Drop stream:** `frequency_id` and `/admin/frequencies`; note that `prescription_round_status` and the reset
triggers (0138) still use it. A prescription saved from the old form between now and the app stream still gets its
rounds from the frequency's defaults, so the ticks and the forecast stay consistent until then.

## Release note

`n/a: 0283 and 0284 are not on production yet`. **The release that applies them owes the user-facing note** that the
medicine forecast now follows the prescription's days and ticked times.

## Not a security change

No card, grant, policy or role was touched.
