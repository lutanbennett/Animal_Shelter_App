# can_see_drive_file: one question where the photo route asked seven (2026-10-13)

Backlog: *An internal photo costs seven queries* (architecture review C7). This is the schema half, `0193`.

- **One branch per source the route checked, in the route's order:** `attachments`, `project_photos`, `maintenance_photos`,
  `community_outing_photos`, `shelter_friends.logo_drive_file_id`, `medication.label_drive_file_id`,
  `stock_medications.label_drive_file_id` (the view). `site_content(_photos)` stay out: anyone may read them, so
  `is_public_drive_file()` already says yes.
- **Security invoker**, so the caller's RLS decides, as it did for the seven selects. `service_role` bypasses RLS as before.
- **Granted to `authenticated` and `service_role` only; revoked from `anon`.** The migration runner's grant check asks for
  the revoke. A signed-out visitor never gets past `is_public_drive_file()` to an internal file, so nothing is lost.
- **One real difference, deliberate:** the old path swallowed a "permission denied" on one table and still counted the
  others. A single `exists` raises instead. It changes no answer today: for every role that can call the function, the
  check below agrees on every id. The route PR treats any error as "not found", as it already does for
  `is_public_drive_file`.
- **Equivalence is proved, not asserted:** `scripts/check-can-see-drive-file.mjs` compares the function with a replica of
  the seven selects (per-branch privilege errors swallowed) for every Drive id on dev plus two ids that do not exist,
  under anon, service_role and one login of every role. Zero disagreements. Admin, management and service_role see 343 of
  345; doctor 1; head_of_maintenance 2; second_in_command 2; volunteer, head_of_medical and a role-less login 0.
- **Left to the route PR:** the route call, and the before/after query count for a gallery.
