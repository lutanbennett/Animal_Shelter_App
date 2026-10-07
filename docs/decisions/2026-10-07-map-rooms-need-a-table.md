# Non-resident rooms on the map need their own table (0157)

**Question the backlog item set:** can the Medical room, the Kitchen and Storage be held as data
that already exists, or does a shape with no resident, no capacity and nothing to open need schema?

**Answer: schema.** Shapes live in two columns, `zones.map_shape` and `enclosures.map_shape`
(0142). A room is neither. The two ways to avoid a table both fail:

- *An enclosure row per room.* It would appear in `/enclosures`, the zone counts, every
  "where is this animal" picker and the capacity sums, each of which would then need a "not a real
  enclosure" filter. One missed filter puts a kitchen in front of someone choosing where a dog sleeps.
- *Coordinates in code.* The plan images are data an admin replaces (`facility_maps`), and the shapes
  are percentages of whichever image is current. Hard-coded numbers would drift from the drawing
  the first time it is redrawn, and nobody could fix them without a deploy.

**Shape of the table.** `map_rooms (id, map_id → facility_maps on delete cascade, kind, shape)`.
`kind` is `medical | kitchen | storage`, a fixed list, because the Director asked for those three
and no room editor. The label is **not** stored: it is in both dictionaries, so staff read it in
Thai without a second column to keep in step. `unique (kind)`: each room exists once on the site.
`shape` reuses `map_shape_valid` and is not null (a room that is not drawn has no row, rather than
a row with no shape). Access is the same as `facility_maps`: any signed-in login reads, admin and
management write, anon never.

**Because it is a separate table, the map's click handling cannot send a room to an enclosure
route.** The app half (batch 65) draws rooms from `map_rooms` as their own kind of item. A tap on a
room should show its name and nothing to open; that is decided there, deliberately.

**Two streams, per CLAUDE.md.** This PR is the schema only; the map drawing, the place-on-map
editor, both dictionaries, the manual and the release-notes line are the next PR, from the updated
`main`. Adding a fourth room later is a changed check constraint plus a dictionary entry.

Proof: `node scripts/check-map-rooms.mjs` (29 checks, rolled back, dev only).
