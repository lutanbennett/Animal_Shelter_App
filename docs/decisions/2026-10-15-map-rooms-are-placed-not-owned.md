# 2026-10-15 — Rooms are PLACED on a map, not owned by one (`0198`, schema half)

**Decision.** A room is what it is (`map_rooms`: name, Thai name, description) and is *placed* on
zero or more plans (`map_room_placements`: `room_id`, `map_id`, `shape`). **This supersedes `0157`'s
one-map row**, where a room held a single `map_id` and `shape`. The Medical room can now be named and
described once and drawn on every plan it appears on.

**May a room sit twice on one plan? No.** `unique (room_id, map_id)`. This is the backlog item's
assumption; if a real case turns up it is Lutan's call, not a session's.

**Read policy: not copied from `0157`.** `0157`'s `map_rooms_read` was `using (true)`, which answered
public_viewer, roleless and archived logins (found 2026-10-09). `0170` §3 already narrowed it to
`private.has_app_access()`, so the new table copies the *current* policy, not the original. Writes
copy `0158`: `has_permission('facility.enclosures')` for insert / update / delete. The table is added
to `check-app-access-gate.mjs`.

**`map_rooms.map_id` and `.shape` are now nullable and otherwise untouched.** The live editor and map
still read and write them; dropping them is a later file once the app half ships. Because they are
nullable, `check-map-rooms.mjs` no longer asserts that a null shape is refused (the placement table's
own `shape` is `not null`).

**Back-fill.** One placement per room that has a plan and an outline, `on conflict do nothing`, so
the file re-runs. Dev: 2 rooms before, 2 placements after, 0 mismatched on map or shape.

**Not usable yet.** Nothing reads the new table; the editor and `/enclosures/map` are the app half.
