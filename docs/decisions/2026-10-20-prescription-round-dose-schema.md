# Prescription schedule, schema half: amount per round, and a free-text note (0234)

Built 2026-10-20 from Lutan's answers of 2026-10-04 (different amounts per round) and 2026-10-20 (three rounds stay, no fourth).

- **`prescription_rounds.dose_quantity`** (nullable, > 0) holds the amount given in that round. Back-filled by copying each prescription's single amount onto every round it holds. A round inserted without an amount takes the prescription's.
- **No new note column.** The free-text note is the existing `prescriptions.notes` (shipped in #770); the next stream shows it beside the rounds.
- **Additive only.** `prescriptions.dose_quantity` and `frequency_id` stay; every reader and `/admin/frequencies` keep working. Dropping `frequency_id` is a later stream.
- **The tick count is NOT `doses_per_day`.** The frequency stays the count; ticks say which of the three rounds. A 4x-daily prescription with three ticks and a midnight note must still read 4 in the stock forecast, medication list and usage-versus-plan. The midnight dose exists only as prose and appears on no round list; Lutan accepted that cost.
- **Interim triggers** keep the two amounts in step until the form writes per-round amounts: editing `prescriptions.dose_quantity` carries to rounds still holding the old amount; a round a person set differently is left alone. The feature stream may drop them once the amount is read from the rounds.
- **Next stream** (`prescription-frequency-screen`): per-round amount boxes on the form, readers summing per round, the note shown with the rounds, and the replacement for the frequency screen.
