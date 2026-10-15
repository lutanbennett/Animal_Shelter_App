# 2026-10-15 — Map rooms, app half: placements are what the editor and map read

**Decision.** Settings → Facility map and `/enclosures/map` now read and write a room through
`map_room_placements` (`0198`). `map_rooms.map_id` and `.shape` are no longer read or written by the
app; new rooms leave them null. Dropping the two columns is a later migration (filed on the backlog).

**Placing an existing room reuses the editor's existing flow.** Every room was already listed on every
plan, and a room not drawn there already showed "draw it here". So *Place a room already on another plan*
in Add room only picks that row and starts the draw; saving is an upsert on `(room_id, map_id)`. A room
drawn on a plan it is already on is reshaped, which the same upsert covers.

**Delete room names every plan.** Deleting now removes a room from every plan at once, and the person is
looking at one plan, so the confirmation lists each plan by name and points at Remove from this plan for
the one-plan case. The list comes from the placements the editor already holds, so it is as fresh as the
page; a placement added in another window after the page loaded is not named. The delete itself cascades in
the database, so it still removes them.

**`addRoom` is two inserts.** The room, then its placement; if the placement is refused the room is taken
back, so a failed add stores nothing, as before. Not one transaction because the Data API has no multi-table
write; the compensating delete is the substitute.

**Plan replace and Undo.** A replace that clears shapes now deletes the plan's *placements*, not its rooms,
so the rooms (and their descriptions) survive and stay on other plans. Undo puts a placement back, creating
the room only if it was deleted since, and never overwrites a room's current name with the snapshot's.

**The map needed almost no change.** `/enclosures` still hands `FacilityMap` one entry per placement, with
the room's one name and description, so a tap shows the same text on every plan.
