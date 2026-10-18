# Dashboard trend chart: Cumulative view and the daily at-the-shelter count

2026-10-18, `claude/dashboard-cumulative-chart`. Lutan's answer of 2026-10-17 replaced the item's "monthly average".

**The counting rule** (`src/lib/management/daily-count.ts`, `dailySeries`). One point per shelter day. A resident is *at the
shelter* from any placement that is not Foster, Adopt or an open Deceased, and *away* otherwise. Each resident's
placements are walked in start order and the count steps +1 / −1 on the shelter day (Chiang Mai) they move between the two.
That is Lutan's "start number + intake − fostered − adopted − deceased + returned": the start number is everyone at the
shelter before the first day, counted from the **whole** placement history (read in pages of 1000, past the row cap).
Foster → Adopt changes nothing (away to away); Adopt/Foster → ReturnToShelter is +1; a withdrawn Deceased (followed by
`DeceasedInError`) is away while open and back after.

**Hospital counts as at the shelter** (SendToHospital never changes the count): still the shelter's responsibility and coming back.
**Fostered residents do not count** while away, a deliberate reversal of the item's first recommendation.
**Intakes are in the cumulative view** as a running total beside adoptions and deaths; one line to drop if Lutan prefers.
Adoptions and deaths use the monthly bars' rules (a withdrawn death is no death), so the cumulative figure on the last day
equals the sum of the twelve bars. Totals run from the first day shown. The residents line has its own right-hand scale.
Print shows whichever view is on screen; Copy as text gives that view's month-end figures.

**Cross-check** (`scripts/check-daily-count.mjs`, dev database, six dates across the year, straight count of residents whose
open placement is not in the Fostered/Adopted/Deceased lifecycle enclosure): five dates agree. **2026-07-16 differs by one**
(series 80, straight count 81). Cause: resident `853951b2-81c4-5e40-a5df-c178304e6b09` has a **Foster** placement
(2026-06-01 to 2026-09-07) whose enclosure is **Unassigned**, not Fostered. By type it is away; by enclosure the app's
status view reads it as Outreach. The chart follows the placement type. It is a data question for Lutan, not a chart bug:
either the type or the enclosure on that row is wrong. Outreach residents (Unassigned enclosure) are otherwise counted as
at the shelter by type; the script would show any further such rows as gaps.
