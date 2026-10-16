# Retire the `facility.map` activity (0212)

`/enclosures` stopped asking `facility.map` when the map became a view of the enclosures
(`2026-10-15-facility-map-is-a-view-of-enclosures.md`). Nothing read the activity any more, so `0212` deletes it:
the `role_extras` rows, the `role_permissions` cells and the `permission_activities` row, in that order.

**The check the backlog item asked for, on dev (`node scripts/facility-map-holders.mjs`, before applying):** six roles
held `facility.map` (head_of_maintenance, head_of_medical, management, second_in_command, staff, volunteer), all at
Edit, all as a `role_extras` row, and **all six also held `facility.enclosures` at Read. None was stranded.** After
applying, the same script reports no holders.

**Production is not verified.** Production reads are refused to these sessions. Before applying `0212` there, run
`node scripts/facility-map-holders.mjs --env production` (read-only, writes nothing). It exits 1 and says
`DO NOT APPLY 0212` if any role holds `facility.map` without `facility.enclosures`. Production may also hold
`facility.map` for roles dev does not have; the script lists them all.

No card bundle names the activity (0170, 0184, 0194 and 0198 checked: none mention it), so no card changed.

**Counts moved with it.** `check-permission-tables.mjs` (63 to 62 activities, 43/20 to 42/20 yes-no/level, cells
57/39/13/5 to 56/38/13/4, 114 expected cells to 111, 756 answers to 744) and `check-permission-parity.mjs` (63 to 62
rows in section 4 of the paper, and the `isShelterRole(facility.map)` pairing removed). Each moved because the activity
is gone, and each ran afterwards. `check-cards-schema.mjs` used `facility.map` as an arbitrary extra the cards do not
give; it now uses `maintenance.delete`, which no card gives either.

**The Director's drafts** (`src/lib/roles-draft/draft-1.json`, `draft-2.json`) ticked row 24, "View the facility map",
as `facility.map`. The loader refuses a key that is not in the catalogue, so row 24 now names `facility.enclosures` at
Read, which is the cell the draft's own `implied` list already gave anyone who ticked it. No role's resolved cells change.

**Left red, not mine:** the doctor disagreement in `check-permission-parity` and `check-permission-tables` (recorded,
a separate decision), and parity's `NEITHER PROBED NOR EXPLAINED: maintenance.bills`, which is `0189`'s and was there before.
