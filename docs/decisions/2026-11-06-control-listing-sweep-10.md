# Control listing sweep 10: the first browser drive (2026-11-06)

Item `#79sqf`. Nine sweeps read code; this one pressed buttons, on dev port 3005, with one-card logins.

- `--cards do_maintenance` builds a working login (the item's "no card holds `maintenance.photos`" was false; `jobs.ts:108`). Both halves of the new-job form and the job page's add and remove controls were drawn and worked.
- `/photos/add` was driven with `--cards add_photos`: it asks `photos.shelter_add` / `photos.resident_add`, not `maintenance.photos`. Drawn, upload accepted.
- `project_folders` (`0323`): *New folder* drawn and works; photo controls correctly absent.
- No fault found; no code changed. Admin-only `facility.enclosures` edit and `placement.death_withdraw` cannot be driven by a one-card login, by design.
- `#79sqf` is not ticked: the hub Photos tab uploader (`photos.tsx:44`, another stream's file) and the other pages' controls remain undriven. The item's remainder text should say the maintenance, `/photos/add` and project-folder drives are done (for the planner to file).
- Test data left in dev: job `sweep10 drive photo test`, folder `sweep10 folder drive`, one Shelter photo (disposable).
