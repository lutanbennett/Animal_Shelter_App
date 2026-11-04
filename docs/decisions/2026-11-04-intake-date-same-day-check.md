# Intake date correction: has a same-day extra weight or diet ever been moved? (#pdg6b part 2)

**Status:** the instrument exists; the production answer is one run away. Not answered by this file.

## What the correction matches on (read, not inferred)

- `record_intake()` (`supabase/migrations/0248_residents_card_can_register.sql:128-134`) inserts **at most one** weight row (only if a weight was typed) and **exactly one** diet row, both dated `p_intake_date`. Neither is marked as made by the intake.
- `correct_intake_date()` (`supabase/migrations/0307_intake_date_deceased.sql:205-206`, same body as `0302`) runs `update resident_diets set start_date = p_new_date where resident_id = … and start_date = v_old` and the same for `weight.date`. **Date alone, every row, archived weights included** (no `archived_at` filter on the move, though the refusal query at `:167-170` does filter).
- So the item's reading is right: a second weighing or diet row dated the intake day moves too. The Intake placement is matched by type, not date, so placements are not affected.
- Mitigation is real: the preview (`p_preview`, `:136-139`) lists the diets and weights that will move before Save.

## What the check asks

`node scripts/check-production.mjs intake-date-extra-same-day-rows`: residents with more than one weight, or more than one diet, dated their own intake date (the intake makes at most one of each, so any more is a row the move would take along), and how many were created over a day after the resident. Codes and counts only. Takes no SQL; one named, read-only SELECT.

## What dev returned (DEV, `qxkmhwybjggxvsfxsxbd`; not the answer)

108 residents with an intake date; weight 0; diet 1 (`R-0394`, 0 created over a day later, so a same-time double diet, probably test data). Dev is disposable test data; production is unread.

## Reading

It can bite only for a resident with a second same-day row, and the preview shows it. Whether it has happened is for the production run.
