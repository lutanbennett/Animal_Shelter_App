# Zones and enclosures in the shelter's order: the screens

2026-10-08, `claude/place-order-settings`. The screen half of the backlog item
"Put zones and enclosures in the shelter's own order, set in Settings"; the
schema half is `0161` (`docs/decisions/2026-10-08-order-and-unit-prices-schema.md`).

## One helper in the app, not a view column

Every list of zones or enclosures sorts through `src/lib/enclosures/order.ts`:
`inShelterOrder()` for rows read from the tables, `enclosuresInShelterOrder()`
for enclosures from several zones, and `loadPlaceOrder()` for screens that group
residents by place from the resident views (`resident_who_and_where`,
`medication_list_residents`, `special_diet_list`), which carry zone and enclosure
**names** but not the order. Those read the order from the tables once and
compare by it (a zone by name, which is the views' grouping key; an enclosure by
id). No view changed, so no schema.

Rows with no order sort last, by name with numbers read as numbers. That covers
the Lifecycle pseudo-zone and its pseudo-enclosures (0161 refuses them an order)
and every place for the **vet**, who cannot read the tables: a failed read in
`loadPlaceOrder()` leaves name order rather than an error.

`/enclosures`'s *Name* sort and *Fullest* tie-break now compare names with
numbers in order too ("Enclosure 2" before "Enclosure 10"). The item complained
about exactly that, and leaving the alternative sort alphabetical would have kept
the complaint alive one click away.

## Move up / Move down, renumbered 1..n

As Management → Shelter Friends' `moveFriend`: read the list, swap the row with
its neighbour in the order shown, renumber the whole list and write only the rows
whose number changed. 1..n rather than 0..n to match 0161's seed, so a list that
has never been moved writes nothing. Up/down rather than drag: everyone but the
Director is on a phone, and Settings has to work there when it must. The row
buttons are the 44 px `RowActionButton`, laid out two by two below `md`.

Enclosures move only within their zone; the action loads that zone's list alone.
Moving an enclosure to another zone stays the Edit form's job, and 0161's trigger
puts it last there.

*Sort A-Z (numbers in order)* is per list (the zones; each zone's enclosures),
asks first because it replaces a set order, and is also how dev's order was put
back after testing.

## The Lifecycle rows

They are not offered: no arrows, no Sort button on their group, and a dash in the
Order column. The actions also refuse them before writing (`lifecycleRefused`),
so a hand-made request gets a readable message rather than the database's
exception. The database refuses anyway (0161).

## Revalidating everything

A move revalidates `/` as a layout, not just the Settings page: the order shows
on most pages, and a reorder is rare enough that the cost does not matter.

## What did not need a change

An enclosure's own page lists one enclosure's residents (by resident name), and
Purchasing does not group by place. The maintenance board's filters, and the
move, intake, hospital-return, rehome-return and maintenance forms, all read
`loadEnclosureOptions()`, so they changed in one place.
