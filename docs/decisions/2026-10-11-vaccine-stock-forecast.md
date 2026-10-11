# Vaccine stock forecast: where it lives, overdue doses, never-vaccinated residents

Brief: `vaccine-stock-forecast` (batch 93). Needed `0185` first (#544) because vaccines had no stock columns.

## Where it lives

A **Vaccines section on Management → Medications**, under the medicine cards, using the same 7 / 30 / custom windows and picker. Not a new page: a new page needs a permission key and role grants (a migration), which this stream did not have. The section is visible to anyone who can open Medication stock. Counts are entered on **Settings → Immunization types** (admin only, `reference.types`), as an extra column; they are *not* on the Stocktake sheet yet.

## Doses due

From `immunization_due_dates(p_from, p_to)` (0183), one call per window, grouped by vaccine in the page. No second way of working out a due date.

## Overdue doses: counted in every window, shown on their own

A dose whose date has passed and has not been given is the most urgent one to have on the shelf, and `immunization_due_dates` never returns it (it steps forward from the last dose, and only returns dates inside the window). So the page reads `immunization_next_due` for rows with `next_due_date < today` (one per resident and vaccine: the *next* dose, not every missed one, since a resident years late still needs one dose, not five), drops Deceased and Adopted residents as the function does, and shows the count in an **Overdue now** column. Each window's figure is *overdue + due in the window*, and the warning compares that to stock. Showing overdue separately means the reader can see the figure is not all upcoming.

Measured on dev 2026-10-11: 4 overdue rows, 5 doses due in the next 30 days.

## Residents with no record of a vaccine: not counted

Dev has 90 residents and only 7 with any immunisation record. If vaccines were routine for every animal the real demand would be far larger, but the data cannot say who *should* have which vaccine: there is no "required for species X" rule, only `is_mandatory` on the type. Guessing a count would be a number nobody could check. The page says so in its note. This is a gap in the records, and the answer is to log existing vaccinations, not a calculation. If the shelter later records which vaccines each species needs, this is the place to add "never had it" to the demand.

## Stock is the last count, not run down

Medicines subtract forecast use since the count; vaccines have no usage rate to subtract (use is what the due-dates forecast already counts). The page shows the count and the date it was taken and says to recount after a delivery or clinic day. The shortfall is `max(0, overdue + due − stock)`. A vaccine never counted shows "Not counted" and **no warning**, because 0 and unknown are different (0083); the reader sees the gap.

## Not done

- `reorder_lead_days` exists (0185) but nothing reads it: no reorder flag, no days-of-stock. Days-of-stock needs a usage rate; that is a later item.
- Counting vaccines on the Stocktake sheet and recording vaccine deliveries.
- Management cannot enter counts (admin only, as with the other type lists).

## Release-time dependency

The figures are right only with `0183` (due dates) and `0185` (stock columns) applied on production. Both are on dev. Release manager: apply both before deploying this PR.
