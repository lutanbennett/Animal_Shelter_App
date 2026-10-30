# Prescription schedule: the schema half (migration 0283)

Stream 1 of 4 for the backlog item **PRESCRIPTIONS BECOME A RECURRING SCHEDULE** (Medical records).
Lutan, 2026-10-30: *"I think we should make it like a recurring task so that users have complete control
over what days of the week / month dosage is given and it has an extra item which is times or the day
(Morning, Lunch. Evening, Night (additional to now). That then drives calculations for number medication
forecasts etc as well"*. Medication only; diets are not touched.

**This PR is additive.** `prescription_doses_between()` and `medication_forecast()` still read
`frequency_id` and give today's answers. Measured on dev before and after applying: the md5 of every
prescription's `prescription_doses_between()` over two windows (72 prescriptions) and of the whole
`medication_forecast()` is identical. Nothing reads the new columns yet (`-- consumer: none`).

## His four answers (2026-10-30), recorded

1. **Four times a day is the most.** *"keep it to 4 with additional notes if something needs to be given
   hourly - this will be very rare so would be managed by the staff anyway"*. One amount per slot, four slots.
   **Consequence, by design: a dose written only in the notes is NOT in the forecast.**
2. **Night is about 10 pm, medication only** (a round like the others, `for_food` false).
3. **Diets stay as they are.** No Night, no recurring schedule; `reset_diet_rounds()` and
   `default_diet_round_keys()` are untouched.
4. **Monthly on a day the month lacks moves to the month's last day.** That is what the system does today;
   the schema stores the day (1..31) and the reader keeps that rule.

## The shape: columns on `prescriptions`, not a table

`schedule_unit` (day | week | month; null = as needed), `schedule_every` (>= 1), `schedule_weekdays`
(ISO 1..7), `schedule_month_days` (1..31). Null weekdays / month days mean the start date's weekday / day.
Why columns: a schedule belongs to exactly one prescription, is read with it everywhere (the forecast is a
join on `prescriptions` already), and has no identity or history of its own; a table would add a join to every
reader for nothing. One CHECK (`prescriptions_schedule_shape`) keeps the combination valid: every field null,
or a unit with `every >= 1`, weekdays only on week, month days only on month. Start/end dates already exist.
The per-round amount already exists (`prescription_rounds.dose_quantity`, 0234); no second one was added.
Twice weekly = `week, every 1, {1,4}`; every other day = `day, every 2`.

The day pattern is back-filled **exactly** from the frequency (every day, or every N unit). 69 of 72 dev
prescriptions got one; the 3 without are as-needed. That copy switches off the updated_at stamp, the audit
trigger and the deceased lock for that one statement (re-enabled in the same transaction), because a copy is
not an edit: no prescription reads as changed today and the audit log gets no row per prescription.

## Night

One insert into the `rounds` lookup table (`night`, Thai กลางคืน, sort 4, medication only), so the
two-file enum trap does not apply. **The Thai wording is the Director's to confirm,** like the rest.
**Visible side effect:** the prescription form lists every `for_medication` round
(`src/lib/prescriptions/options.ts`), so a Night tick box appears there from this migration. Ticking it is
harmless to the forecast (still frequency-driven).

## The back-fill rule, and the two decisions it reverses

Under the new design the ticked times *are* the dose count. A prescription saved today as 4x daily has three
ticks (`default_medication_round_keys()` stops at three) plus a note, so a naive back-fill would turn it
into 3x daily and medicine would vanish from the forecast. Therefore the count-versus-ticks back-fill is
**not done; it is listed for a person to fix, never guessed**:
`node scripts/check-prescription-schedule-backfill.mjs` (read-only; exit 1 while any are listed). On dev it
lists one test row (Twice daily, 0 ticks). Run it with `--env production` before the app stream ships.

Reversed (the rule is gone, the reason survives): Lutan, 2026-10-20, *"THREE rounds stay, there is NO fourth
round, and an extra dose is written in a free-text note"*; and `2026-10-20-prescription-round-dose-schema.md`,
*"the tick count must NEVER become `doses_per_day`"*. Now there are four rounds, and the tick count becomes the
dose count, but only once a person has checked it.

## Hand-over: the three remaining streams

1. **Forecast rewrite:** `prescription_doses_between()` / `medication_forecast()` read the schedule + ticks.
   Readers to re-prove: 0072, 0083, 0183, 0211, `src/lib/medication-list/due.ts`,
   `src/lib/management/stock-usage.ts`, `management/{medications,purchasing,stock-usage}`,
   `scripts/check-medication-list-due.mjs`. Month rule: last day.
2. **App:** the form (day pattern, four ticks, per-round amounts), the round screens, the medication list.
   Also needs `default_medication_round_keys()` decided (4 per day) and the fix list at zero first.
3. **Drop `frequency_id` and the read-only `/admin/frequencies` page.**

**Found, not fixed (outside this stream's files):** `scripts/check-medication-rounds.mjs` now fails two
vocabulary assertions ("morning, lunch, evening in order"; "lunch is medication only, the others are both")
because there are four rounds. It runs against the live dev schema, not in CI. The app stream should update it.

## Dev tracking note

The first apply of 0283 had a CHECK that passed `unit null, every 2` (a null inside `in (...)` makes the branch
null, and a CHECK treats null as a pass). The rollback harness caught it. The runner has no un-apply, so dev's one
`schema_migrations` row for 0283 was deleted by hand and the corrected file re-applied through the runner.
Dev only; production has never seen 0283.

## Not a security change

No grant added, removed or narrowed; no role named. Who may edit a prescription is exactly as the cards say.
