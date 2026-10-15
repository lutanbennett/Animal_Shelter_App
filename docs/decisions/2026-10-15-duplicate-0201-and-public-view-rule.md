# Duplicate 0201, `since_year`, Thai breed/colour — and a planning rule

2026-10-15, stream `labels-and-year-schema` (migrations 0203–0205, plus a rename).

## 1. The two files numbered 0201

`main` had `0201_public_page_photos_public.sql` (PR #646, merged first) and
`0201_map_rooms_drop_map_id_shape.sql` (PR #645, merged second). The map-rooms stream took 0201
correctly when it started; #646 merged in between, and nothing caught it because the filenames differ.
Dev's schema was right throughout (`check-map-rooms.mjs` 44/44). The danger was the next production
deploy and any from-zero rebuild, where the order is ambiguous. Production had applied neither.

Checked before acting: dev held 204 ledger rows against 203 files, including a phantom
`0202_map_rooms_drop_map_id_shape.sql` (the map-rooms stream applied its file under two names).

Fix: rename the later-merged file to `0202_map_rooms_drop_map_id_shape.sql` — dev already holds an
applied row under exactly that name, so nothing is re-applied — and add `0203` to delete the one stale
row `0201_map_rooms_drop_map_id_shape.sql` by exact name. Neither `0201` file's contents were edited.
The two files are independent, so their relative order does not matter. After: 206 files, 206 rows.
On production `0203` deletes nothing (the row was never there), which is harmless.

## 2. `since_year` is a year, not a date (0204)

A year can only be filled in one way and the label only ever prints a year. A date invites a day nobody
knows ("counting began 2019-01-01" is a made-up precision). `smallint`, nullable, check 1990–2100.
Null means not entered, and no "since" is shown. The Director supplies the year; nothing shows one yet.
`public_impact_figures` names it (appended last) — see rule below.

## 3. Thai breed and colour in the public views (0205)

`residents.breed_th` and `colour_th`, appended last to `public_resident_cards` and
`public_resident_profiles`. This **widens two public views**, so the reasoning: the English breed and
colour are already in both views and shown on `/adopt` and `/r/<code>`; the Thai text is the same
information, so a visitor learns nothing new. Exactly two columns were added to each; both views were
re-created from their live `pg_get_viewdef`, not from the old migration. Before/after column lists and
the `check-public-views.mjs` run are in the test plan. Registering the labels in `translatable_labels`
and the screens are the later item.

## 4. The planning rule this clash earned

The root cause was not the map-rooms stream's numbering. `0200_public_page_photos.sql` added nine
columns the public website had to read, and **a column is public only when the public view names it**.
So the schema half was not actually finished; the app half needed a migration it had been told it could
not write, and wrote one anyway (`0201_public_page_photos_public.sql`), which collided with #645.

**Rule: a schema PR that adds columns the public site must read is not finished until the public view
names them — the view change belongs in the schema PR, not the app half.** This is a planning gap, not
a stream's mistake. The next schema/app split puts the view in the schema half's scope from the start.
0204 and 0205 follow it.
