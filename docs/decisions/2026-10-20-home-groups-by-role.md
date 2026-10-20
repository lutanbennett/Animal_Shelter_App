# Home screen groups tiles by role for a login that holds more than one

Lutan, 2026-10-19: keep the cards separated into their roles so the person can flick between their standard job and the assigned job.

- `homeGroupsForRoles()` (`src/lib/home/tiles.ts`) returns one group per held role, main first, each drawn exactly as that role's own home. `homeTilesForRoles()` (merged list) is kept for other callers.
- A tile two roles give is in each group. A cover group that draws nothing is left out; the main group is always kept.
- Layout only: `perms` is still the database union, so no right changes. No migration, `NavPane` untouched, no change to which tiles a role has.
- Role names and cover end dates come from `loadHeldRoles()` (service-role read of `user_roles`, same live rule as `loadHeldRoleKeys`).
- Phone: tab switch, choice kept in `localStorage` for the shelter day only; a new day, or a role no longer held, falls back to the main role. From `sm` the groups stack. A one-role login renders the old `HomeTiles` unchanged.
