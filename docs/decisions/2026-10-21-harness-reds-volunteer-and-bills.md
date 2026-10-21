# harness-reds: volunteer check fixed, bills ruling recorded

**check-volunteer-narrowing (fixed, script only).** Three stale expectations, no app change:
- "read translations": `0184` added `map_rooms_translations_read`, which lets any signed-in user read *approved* `map_rooms` translations (room names on the map). The volunteer reading those is on purpose. The probe now asks `table_name <> 'map_rooms'`, so every other translation is still proved refused.
- The function list: `on_volunteer_floor` is the floor itself (`0196`), and `is_public_drive_file` only names the `volunteer_photo_drive_file_id` column (`0201`). Neither grants anything. `has_app_access`, `has_shelter_floor` and `record_attachment` no longer say "volunteer", so the expected list is now exactly those two.

**check-bills-roles (ruled, not fixed here).** The doctor got `medical.visits` in PR 766, and `can_use_bills_inbox()` (`0189`) admits anyone holding that cell. Lutan ruled 2026-10-21: a visiting vet may **not** use the bills inbox (it is one shared pile of everyone's bills with amounts). So the check is right and the app is wrong; the fix is a migration, in its own schema PR in a later batch (this stream was forbidden one). The check stays red until then.
