# 2026-10-07 — `map_rooms` writes are converted to `facility.enclosures`, not given an owner

`0157` created `management_rw_map_rooms` as `current_user_role() in ('admin', 'management')`, the
enum pattern, and left `check-policy-role-names` red on `main` (55 policies, the 55th unowned).

**Convert (option a), no new cell.** `facility_maps` writes already ask `facility.enclosures` Edit
(`0150`, §15 of the roles paper), and the rooms are drawn on the same Settings → Facility map page whose
server actions already check that cell. A room on the plan and the plan are one kind of thing, so they
get one answer. `0158` drops the `for all` policy and writes one insert/update/delete policy per command
with `(select has_permission('facility.enclosures'))`. Reads stay `map_rooms_read` (any signed-in login).

- **Known tightening, same as `facility_maps`:** Management holds `facility.enclosures` Read only, so it
  loses a write by hand that the page never offered. Admin keeps it.
- **Why not option b (declare an owner):** nothing about a map room belongs to a later role slice; the
  cell exists and the code already uses it.
- **Open item on plan uploads from the system:** unaffected. If that ever needs a different cell, it
  changes both tables together.
- **Volunteer/vet reads:** checked against dev, the volunteer half is already closed (no `volunteer_*`
  policy remains; the volunteer holds no `stock.*` cell). The vet half is parked with
  `perm-convert-vet`. See the backlog status line.
