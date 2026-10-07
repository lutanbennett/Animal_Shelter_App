# Map rooms: a tap shows the name and opens nothing (feature half of 0157)

Decided by the Director and Lutan (decision brief q9); the choices below are the build's, recorded so
they are not re-derived.

- **A room is its own kind of item on the map**, not an enclosure with a flag. `FacilityMap` builds
  `kind: "room"` items from `map_rooms`; the card for one carries the name and a one-line note and has
  no Open button or link, so the map's enclosure route cannot be reached from a room. It is a
  `role="button"`, not a `link`, for the same reason.
- **Colour is not occupancy.** Rooms are blue and dashed, outside the green/orange/red scale, so a
  kitchen never reads as "empty" or "full". The name is printed on the shape, as for a zone.
- **Rooms are offered on every plan in the editor**, because nothing says which plan a room belongs
  on. `unique (kind)` makes each room exist once, so drawing it on another plan *moves* it
  (`saveRoom` upserts on `kind`); the list shows "On another plan" for a room drawn elsewhere.
  Clearing deletes the row. This is the minimum for "move them without a developer": no general room
  editor, no new rooms, no renaming.
- **The old editor note was wrong from now on.** It told the Director to draw rooms as enclosures
  ("they are enclosures too"). It and its Thai twin are replaced; an enclosure someone already made for
  a room is left alone and can be taken off the plan with the bin.
- **No migration.** 0157 is unchanged.
