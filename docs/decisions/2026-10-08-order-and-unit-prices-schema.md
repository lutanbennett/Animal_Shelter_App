# 0161: one order column per list, and 4-place prices on both tables

2026-10-08, `claude/order-and-units-schema`. The schema half of three backlog items
("Put zones and enclosures in the shelter's own order", "Stocktake in cupboard
order", "Cost per unit keeps only 2 decimals"). Their screens are later streams.

## An integer `sort_order`, not unique, renumbered by the screen

Every list (zones; enclosures within a zone; medication; diet_types) gets a
nullable `sort_order integer`, low first, **ties broken by name**. There is no
unique constraint. Move up / Move down is meant to work as
Management → Shelter Friends' `moveFriend` already does: read the list in display
order, swap two, write 0..n back. A unique index would make that swap fail
half-way unless it were deferrable, and the only thing it would prevent (two
rows with the same number) is harmless when name breaks the tie.

## A new row goes last by trigger, not by the add forms

`place_sort_order_last()` gives a row inserted with no order one more than the
highest in its list, and moves an enclosure that changes zone (with its order
untouched) to the end of the new zone. So the existing "add" forms on Settings and
Management put new rows last today, without knowing the column exists, and
build step (4) of the zones item needs no app code. Two inserts at the same moment
can share a number; see above.

## Seeded in natural name order, once

The seed is today's order, which is by name, but with digit runs compared as
numbers so "Enclosure 2" comes before "Enclosure 10" (the item's own complaint).
It only fills a list that has no order yet, so re-running the file never undoes
an order someone has set. The key is written inline in the file, not kept as a
function: the screens' "Sort A-Z (numbers in order)" button sorts in the app.

## Lifecycle takes no order

The Lifecycle zone and its pseudo-enclosures (Unassigned, Hospital, Fostered …)
are not places anyone walks past; `/enclosures` shows them as fixed status cards.
They stay `null`, and 0142's `refuse_lifecycle_map()` now refuses an order as well
as a map shape (same function, `sort_order` added to the columns its triggers
watch). It also now checks a zone by its own name, because on insert the zone is
not yet in the table for the old lookup to find. A new pseudo-enclosure is still
accepted, with no order.

## No zone or enclosure view changed

Checked 2026-10-08: every list of zones or enclosures in `src/` reads the `zones`
and `enclosures` **tables**, whose select policy asks `facility.enclosures` Read.
On dev every role that opens the app holds it except the vet (Admin passes
everything). The resident views (`resident_list_view` and the rest) carry zone and
enclosure **names**; a screen that groups residents by place sorts those with the
order read from the tables. The vet cannot read the tables and keeps name order,
which is acceptable for a role scoped to its own clinic's residents. Adding the
column to a dozen fixed-column views would have been churn for no reader.

The stocktake is different: `/stocktake` reads `stock_medications` and
`stock_diet_types` (0143), so both gain `sort_order` at the end. The pickers
(`picker_medications`, `picker_diet_types`, 0151) are not the stocktake and are
unchanged.

## An order, not a shelf name, for the stocktake

The item allowed "a `shelf` or `sort_order`". The shelter has not yet described
its shelves. The sheet needs an order whatever they are called, and an order is
what the zones item builds too, so one Move up / Move down pattern serves both. A
shelf label can be added later as display text.

## Both `cost_per_unit` columns, to `numeric(12, 4)`

The item named two columns and the brief warned that fixing one would be the
likely half-done outcome. Both widen, because a medicine bought by the bottle and
given by the ml has exactly the diet's problem. Four places keeps a per-gram price
to a hundredth of a satang. No view depends on either column (checked with
`pg_depend` on dev), so the `alter … type` is not blocked; `diet_forecast` and
`cashflow_forecast` multiply by it and every screen formats the result with
`formatBaht`.

The app's rounding to 2 places and its `tooCoarse` refusal in `costPerBaseUnit`
stay until 0161 is live on production. Code that saves 4 places into a 2-place
column would round without saying so, which is the very failure the refusal
exists to prevent.

## Proof

`node scripts/check-order-and-units.mjs --with <the file>` runs the file twice in
one rolled-back transaction against real dev rows and asserts all of the above,
then reads the two stock views as one live login per role.
