# The prescription form, round screens and medication list read the schedule (no migration)

Stream 3 of 4 for **PRESCRIPTIONS BECOME A RECURRING SCHEDULE** (Medical records), the half a user can see.
Stream 1 was `0283`, stream 2 was `0284` (`2026-10-30-prescription-forecast-function.md`). Medication only; diets untouched.
Lutan's four answers of 2026-10-30 are applied as given: four doses a day at most, Night about 10 pm and medication only with the
clock pre-selecting it, diets unchanged, and a month without the day uses its last day.

## What changed

- **The form** (`PrescriptionForm.tsx`, new `ScheduleDays.tsx`): *Repeats* (every day or every N days / chosen weekdays every N weeks /
  chosen days of the month every N months / as needed), then four time boxes (Morning, Lunch, Evening, Night) each with its own amount.
  Each tick is one dose on every scheduled day, so the tick count *is* the dose count; there is no second number to keep in step.
  Start and end date as before. **Twice weekly (Mon + Thu) is storable** and is what the schedule says.
- **The write** (`actions.ts`): writes `schedule_unit / _every / _weekdays / _month_days` (validated to 0283's shape by
  `parseScheduleForm`) and **no longer writes `frequency_id`**: a new prescription leaves it null, and an edited one has it set to null, because a
  stale frequency beside a new schedule would be two answers to one question. A scheduled prescription needs one to four ticks
  (server-side, not only in the browser); as needed owes none.
- **The one-amount average is gone.** The form used to store the *average* of the round amounts in `dose_quantity` because the forecast read
  one amount. Since 0284 the forecast reads each round's amount, so `dose_quantity` now stays as typed ("the dose above", the fallback for a round with none).
- **The round screens**: Night is a fourth round on the medication list, with a moon icon (Evening is now a sunset). `suggestRound("medication")`
  returns Night from 22:00; **food is unchanged** (`roundsFor("food")` is still Morning/Evening, `suggestRound("food")` never returns Night).
  00:00 to 06:59 is still Morning, as before. A medicine shows in every round it is ticked for **with that round's amount**.
- **The medication list** (`due.ts`, `load.ts`): `due.ts` reads the prescription's schedule through the same rule as
  `prescription_dose_days_between()` (0284) and no longer reads the frequency or the `frequency` table. The pick list sums the per-round amounts.
- **Other readers of a prescription's frequency**: the resident's Prescriptions tab and the archive export (`resident-record.ts`) describe the days
  from the schedule instead (`describeRxSchedule`); the archive uses plain English as it always did.
- **`scripts/check-medication-list-due.mjs`** restated for the schedule, 27 cases became 52 (Mon + Thu, a start date partway through the week,
  every other week on chosen days, a start on a Sunday, the 1st and 15th, {30, 31} on 28 February, every 2 months on chosen days). It loads the
  real `due.ts` and passes under `TZ=UTC` as well.

## `default_frequency_round_keys()`: decided, no migration

The brief calls it `default_medication_round_keys()`; the function that exists is `default_frequency_round_keys(doses_per_day, interval_count)` (0137).
**Returns now and before: identical.** `>= 3` gives `{morning, lunch, evening}`, 2 gives `{morning, evening}`, 1 or an interval gives `{morning}`,
otherwise none. It never returned Night and still does not. **It no longer matters to a user**: the form no longer reads it (the TypeScript mirror
`defaultRoundKeys` returns `{morning}` for a prescription that has days, and the form pre-ticks Morning for a new prescription), and a prescription saved from
the new form has no frequency, so the 0138 reset triggers that call it insert nothing. I added no migration (the brief's rule), so the function stays until the
drop stream removes `frequency_id`, `frequency_rounds` and the function with it.

## Measured on dev, with the numbers

Built a twice-weekly (Mon + Thu, Morning) prescription through the form, and a second every two days with all four ticks and amounts 2 / 1 / 1 / 0.5.

1. **Forecast totals unchanged for every prescription that was not on the fix list.** Per-prescription `prescription_doses_between()` over
   2026-10-01..2026-12-31 and 2027-01-15..2027-03-02, md5 over all 72 existing prescriptions: window A `ef9a56d0...` before and after,
   window B `9e70ca30...` before and after. (A prescription's figure does not depend on this PR, since there is no schema change; this is the proof that saving
   from the new form did not disturb any other row.) The whole-`medication_forecast()` md5 does change, only because the two new test rows add to
   *Dryrun Med 1018*.
2. **Every prescription's days read the same before and after on the medication list**: the old rule on the frequency against the new rule on the
   schedule, 72 prescriptions x every day of each prescription's own date range from 1 Oct 2026 to 28 Feb 2027, **2,242 prescription-days, 0 differences**.
   (Outside its own date range the list never asks: it only reads prescriptions current today. The old per-day rule said "due" before the start date; the new one says
   "not today", which is unreachable and more correct.)
3. **Twice weekly (Mon + Thu)**: stored as `week / 1 / {1,4}`, `frequency_id` null; **exactly 2 doses a week** (2 Nov to 8 Nov: 2; 9 Nov to 15 Nov: 2), **18 doses
   from 30 Oct to 31 Dec** (nine Mondays and nine Thursdays), 18 scheduled days. It was **absent from Friday 30 Oct's Morning list**, appeared on it once Friday was
   added through the edit form (the edit form prefilled `week`, 1 and 4), then I set it back to Mon + Thu.
4. **Browser, signed in with `dev-signin.mjs admin`**: saved both prescriptions from the form; the resident's tab reads *Every week on Mon, Thu · Morning* and
   *Every 2 days · Morning, Lunch, Evening, Night*; the medication list's chooser has four rounds, Lunch was preselected at midday, Morning shows the 2-tablet
   dose, Lunch the 1, Night the 0.5. `requestAnimationFrame` fired (checked); every page was reached by clicking through.

## Found, not fixed (not mine, or not allowed)

- **`scripts/check-shelter-dates.mjs` now fails 4 checks**: its 23:59 edge row says `suggestRound("medication")` is `evening`; since Lutan's answer it is `night`
  from 22:00. Left for `harness-sweep-finish` (it owns `scripts/` this batch): change that one row's medication column to `night` and add a 21:59:59 edge
  (still evening). It is not in `gates.mjs` or `.github`, so nothing blocks on it.
- **`scripts/check-prescription-schedule-backfill.mjs` (the fix list) now lists every prescription saved from the new form**, because it compares a *frequency's*
  dose count with the ticks and a new prescription has no frequency. It was meant to be run before the release that carries 0283 and 0284 and **it will now give false
  positives for anything saved since this PR**. It needs restating (or retiring with `frequency_id`). Left for the same owner or stream 4.
- **`prescription_round_status` (0138) reads rounds owed from the frequency**, so a scheduled prescription with a null frequency reads `mismatch`. No screen reads it
  (only scripts that look at its grants); the drop stream removes it with `frequency_id`.
- Dictionary keys for the old inline "add a frequency" fields (`newFrequency*`, `couldntLoadFrequencies`, `frequency`, ...) are now unused. Left for the drop stream,
  which also removes `FrequencyScheduleFields` and `frequency.ts`.

## Production: do not deploy this without 0282, 0283 and 0284

The code now **selects the `schedule_*` columns and the Night round**. Production does not have `0283` or `0284` (by Lutan's decision), so **this PR deployed ahead of them
would break the Prescriptions tab, the form and the medication list on production.** It must travel with the release that applies them. Then re-run the backfill fix list
(see above: it needs restating first) and the forecast comparison.

## Release note

`n/a: 0283 and 0284 are not on production yet`. The screens do not work on production until they are applied, so a note saying they do would be false. **The release
that applies them owes the user-facing note**: days and times on the prescription form, Night on the medication list, the forecast following them.

## Buttons follow cards: this page's action controls

Nothing is gated differently; all were already gated on `medical.prescriptions`, and the form's new inputs are part of the form.

| Control | Where | Gated on |
|---|---|---|
| Save prescription / Save changes | `PrescriptionForm`, reached only through `/prescriptions/new` and `/prescriptions/[id]/edit`, both `requirePermission("medical.prescriptions")` | `createPrescription` / `updatePrescription` ask `can(perms, "medical.prescriptions")` |
| the day, weekday, month-day and time ticks | the same form | not separately gated: inputs of the form above, shown only with it |
| Add prescription, Edit, End today | resident's Prescriptions tab | `can(perms, "medical.prescriptions")` (unchanged); End today's action asks the same |
| Archive | resident's Prescriptions tab | `canArchive("prescription")` (unchanged) |
| the round chooser links | Operations → Medication list | links to a read-only page, `requirePermission("medical.prescriptions", "read")` |

Found, not fixed: none. No card was designed or changed, and no role is named anywhere.

## Not a security change

No card, grant, policy or role was touched. No migration: schema stayed with `affiliate-links-schema`.
