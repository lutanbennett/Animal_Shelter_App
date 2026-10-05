# 2026-10-04 — Facility map schema (step 1 of 3)

`docs/facility-map-scope.md` §3, built as `0142_facility_maps.sql` (0141 was already reserved by the
maintenance-role PR). Schema only; the read-only map and the place-on-map editor are the next two PRs.

- **`facility_maps`** holds one row per plan image: `kind` `overview` (no `zone_id`, at most one) or `zone`
  (a `zone_id`, at most one per zone), with the image's pixel `width`/`height`. Two zones may share one
  `image_path`. The Main Zone and Cat Zone are drawn on the same plan (Director, 2026-10-04), so each gets
  its own row pointing at the same file. Shapes are percentages of the image, so the same coordinates serve
  both.
- **`enclosures.map_shape` / `zones.map_shape`** are `[[x,y], …]` in percent (0–100), at least three points,
  null = not on the map. Validated by a check constraint through an immutable function, so a hand-edited or
  buggy editor write cannot store a shape the map cannot draw.
- **Lifecycle is refused by trigger**, on all three tables (a shape on a Lifecycle zone or enclosure, a plan for
  the Lifecycle zone). A check constraint cannot look at another table, and this is the same line 0119 draws
  for placements.
- **Read by every signed-in login, write by admin and management.** Not anon: the map is staff-only
  (scope §6). Volunteers read it, which the roles brief wants ("they can view the map"). The image files
  themselves are the editor PR's business.
- **Deleting a zone deletes its plan** (`on delete cascade`). Deleting an enclosure takes its shape with it,
  because the shape is a column on the row.
- **Not decided here:** non-resident rooms (Medical room, Kitchen, Storage room) and free-roam spaces with no
  capacity. They are enclosures like any other as far as this schema goes; whether they are excluded from
  occupancy colouring and the unplaced list is a map-render question for step 2, to settle with the Director.
