# cashflow_forecast: every dose, and the shelter's calendar day (0183)

**Fix 1, doses.** `immunization_next_due` holds one row per resident and vaccine, the *next* due date, so a window
counted one dose however long it was. `0183` adds `immunization_due_dates(p_from, p_to)`, which steps
`interval_months` forward from the last dose (k = 1, 2, …) and returns each date inside the window. The forecast
assumes each dose is given on its due date, so the one after it is exactly one interval later. Overdue doses (due
before `p_from`) are still not counted, as before. Deceased and Adopted residents are excluded; Fostered stay in.

**Measured on dev, 2026-10-11, 90-day window from today:** immunization **฿180 → ฿540** (3x). Dev has 7 vaccine
types with an interval, the shortest 1 month. A monthly pair last dosed 2026-08-23 now yields 3 doses in the window
(Oct 23, Nov 23, Dec 23); before, 1. The old figure was wrong for any window longer than the shortest interval, and
the error grows with window length. It understated, so this is a correction upward.

**Fix 2, clinic visits** now bucket on `shelter_date(appointment_date)` (0073). Checked: 20:00Z on 11 Oct is
12 Oct in Thailand (`shelter_date`) and 11 Oct by `::date`. Dev's clinic figure did not move (฿800 before and after),
since no booked visit sits in the 7-hour gap. No app change was needed.

**For batch 93 (`vaccine-stock-forecast`):** reuse `immunization_due_dates(p_from, p_to)`: it returns
`resident_id, immunization_type_id, due_date`, so doses per vaccine is a `group by immunization_type_id`.
It is `stable`, security invoker, granted to `authenticated`. Not yet covered: overdue doses, and residents with
no record of a vaccine.

**Release hazard:** until `0183` is applied, the forecast under-reports immunization cost. The migration drops
nothing, so the app can roll back on its own.
