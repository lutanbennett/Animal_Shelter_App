-- consumer: none
--
-- Drops map_rooms.map_id and map_rooms.shape. Since 0198 and the app half (PR #636 and its follow-up) a
-- room is PLACED on a plan through map_room_placements; nothing reads or writes these two columns, and
-- the two harnesses (check-map-rooms, check-map-markers) no longer insert them. 0198 back-filled one
-- placement per room that had both, so what the columns held already lives in map_room_placements.
--
-- Dropping the columns takes map_rooms_map_id (0157's index) and the shape check with them. Plain DROP
-- COLUMN, no CASCADE: if a view or other dependent still existed, this would fail rather than remove it.
--
-- map_rooms.kind stays: see docs/decisions/2026-10-15-map-rooms-column-drop.md. The unique rule, the
-- name-from-kind trigger and map_room_kind_name() were already dropped by 0184.
--
-- Re-runnable.

alter table map_rooms
  drop column if exists map_id,
  drop column if exists shape;
