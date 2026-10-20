# Prescription form: Morning / Lunch / Evening ticks; the frequency stays the count

Built 2026-10-20 (app only, no migration; the tables are 0137/0138). Lutan, 2026-10-19: "When I add a prescription I can add frequency but I can't add time of day."

- **Frequency counts, ticks place.** `doses_per_day` on the chosen frequency is still the only thing the stock forecast, medication list and usage-versus-plan read. The ticks only write `prescription_rounds`. Nothing in `src/lib/prescriptions/rounds.ts` or the save feeds the tick count back, so four times daily with three rounds ticked stays four.
- **Fewer ticks than doses is normal** (Lutan, 2026-10-20: tick the three rounds and write "give final tablet at midnight" in the notes). The form shows a quiet line, never a refusal. **More ticks than doses** shows a red warning but still saves; it is the one case that is a mistake, and the database's `prescription_round_status` view reads it as `mismatch`.
- **No fourth round.** The existing `notes` column is the note field; the medication list now shows it under the frequency.
- **Save:** `saveRounds` in `src/app/prescriptions/actions.ts` upserts the ticked set, then deletes the rest, so a failure part-way leaves a superset, never a prescription with no round. It runs after the prescription write under the same `medical.prescriptions` permission; the `0138` triggers pre-fill defaults and the form's choice then replaces them.
- **As needed / no frequency:** no ticks shown, and the saved set is empty. An every-N-days frequency pre-ticks Morning.
- **Not transactional** with the prescription write (two supabase-js calls), same as the inline medication/frequency creation beside it.
