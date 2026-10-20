# Prescription form sets how often directly; /admin/frequencies becomes read-only

Built 2026-10-20, app half of the prescription schedule, on top of `0234`. No migration.

- **The frequency row still exists and stays the count of doses a day.** The form no longer picks from a named list: it takes a pattern (times a day / every N days, weeks, months / as needed) and finds the `frequency` row with the same schedule, or adds one with a generated English label. Every reader of `frequency_id` keeps working.
- **The tick count is never `doses_per_day`.** Nothing in the form or action reads the ticks into the schedule; fewer ticks than doses is accepted (the fourth dose goes in the notes), more ticks than doses still warns.
- **Per-round amounts.** Each ticked round has an amount box; blank takes the prescription's Dose. Saved to `prescription_rounds.dose_quantity` (upsert, so editing updates it). `prescriptions.dose_quantity` stays as the default, so the `0234` triggers and old readers are unaffected.
- **`/admin/frequencies` is a read-only record** (label, schedule, prescription count). Edit, delete and merge are removed: with duplicates no longer created, there is nothing to tidy.
- **Readers still read one amount.** The forecast is a database function (`0044`), so with no migration in this stream `prescriptions.dose_quantity` is saved as the average of the ticked rounds' amounts (equal amounts average to themselves). Doses a day x average is the true daily total when every dose sits in a ticked round; with a fourth dose only in the notes it is an approximation. A later stream can make the readers sum the rounds. Dropping `frequency_id` and the `0234` interim triggers are also later schema work.
