# Dev sign-in: the documented command failed, and `--remove` now says why

2026-10-23, found verifying `0.39.5`, fixed in `claude/script-tooling-fixes`.

**1. `node scripts/dev-signin.mjs <role>` always threw the usage error.** `a5ba4761` (the `--cards` feature)
picked the role with `i !== portIdx + 1 && i !== cardsIdx + 1`. With no `--cards`, `cardsIdx` is `-1`, so
`cardsIdx + 1` is `0` and the filter skipped index 0, which is where the role is. `portIdx` had the same
fault. Both are now `idx >= 0 ? idx + 1 : -1`. Checked: `admin`, `admin --port N` and `--port N admin` all parse.

This is the likeliest reason streams kept reporting `pending: no signed-in session` after the route was
declared settled on 2026-10-22: the documented command looked like the caller's mistake, so they stopped.
It was broken from `a5ba4761` on. (Reading, not measured per stream.)

**2. `--remove admin` failed with "Database error deleting user".** Cause, measured: the admin login had created
2 `clinic_visits` and 2 `bulk_appointments` rows while a stream verified something, and those tables' `created_by`
keys to `auth.users` do not cascade. The other roles' logins had made no such rows. `--remove` now lists the
tables and counts holding a login it cannot delete (a read-only `do` block through the Management API) and says
to delete or reassign them. **It does not delete them itself:** the dev database is shared by every stream and
those are real-shaped rows someone may be looking at. The admin login therefore still exists on dev until those
four rows go.

**3. `check-home-screens-live.mjs` could not run at all.** Its default roles included `staff`, retired by `0173`.
Replaced by `head_of_maintenance`, the nearest live role (it has the Maintenance tile, no Management pages, no
Appointments). Two assertions had also drifted, found once it ran: Head of Maintenance has no Stocktake tile
(asserts Maintenance only), and the doctor no longer redirects to Appointments: `/home` draws a tile home
(`src/app/home/page.tsx` comment) with an Appointments tile, so it asserts that. It passes, 5 logins deleted.
Not in CI, which is why nobody noticed.
