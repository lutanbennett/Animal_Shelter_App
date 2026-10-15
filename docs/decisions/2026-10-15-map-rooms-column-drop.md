# 2026-10-15 — Dropping map_rooms.map_id and .shape (0201); `kind` stays

**Decision.** `0201` drops `map_rooms.map_id` and `.shape`. Both were dead: `0198` moved every room onto
`map_room_placements`, the app half (2026-10-15) stopped reading and writing them, and
`check-map-rooms.mjs` / `check-map-markers.mjs` were rewritten off them first, in this PR. A placement per
room that had both values was back-filled by `0198`, so the pre-change values are not lost, only the
now-redundant copy.

**The "three leftovers" were already gone.** The one-per-kind unique rule, `map_rooms_name_from_kind` and
`map_room_kind_name()` were dropped by `0184`, not left for this PR. The backlog item was stale on that
point; nothing to do.

**`kind` stays.** It is nullable, new rooms leave it null, and nothing writes it. It is still *read* by
`shapesOn` in `src/app/admin/facility-map/actions.ts` and by the restore path, because history snapshots
written before the editor existed hold only `kind` and are rebuilt into rooms from it
(`LEGACY_ROOM_NAMES`). Dropping the column would break "Undo the replace" for those snapshots, to save one
empty column. Revisit when the old snapshots are gone.

**Checks.** The marker harness previously read the stale `map_rooms.map_id/shape`, so it never saw rooms
placed after `0198`. Reading placements found a real overlap in dev's test drawing (a Quarantine room
placed over Blue Enclosure 13); the dev placement was moved, not the check loosened.

**Number.** `0201`, as briefed. `claude/public-page-photos-app` also carries a `0201` (`0201_public_page_photos_public.sql`, applied to dev, not yet on main); whichever merges second renumbers. The drop is idempotent. An interim apply under `0202` left a harmless orphan row in dev `schema_migrations` (`0202_map_rooms_drop_map_id_shape.sql`).
