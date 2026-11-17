# System status is Admin-only: the `system.status` activity is retired (`#stscp`)

**Lutan, 2026-11-17, asked directly in the day's plan and choosing from three options: Admin only.**

## Why it was asked
`/admin/status` reports the whole installation (row counts, sign-ins, storage, the Pi, the Worker, alert health). With a second
shelter on the system, a login holding it would be one customer reading another's installation. The counts themselves were
filtered by PR #1647; this is about who reaches the page at all.

## What was found (step zero)
- `system.status` was an *activity* in `catalogue.ts` and `permission_activities` (0132), mapped by `routes.ts` to `/admin/status`.
  **No card ever granted it** (`cards.ts`, `jobs.ts`, `who-does-what.ts` do not name it), so the page was already Admin-only in
  behaviour: since 0257/0261 a role's cells are the union of its cards' grants.
- The gap was structural: while the activity existed, anything that wrote a cell could grant it again, and nothing said it must not.

## The shape it took
- **The activity is removed** from `catalogue.ts` and, in migration `0399`, from `permission_activities` (same shape as `0301` for
  `audit.view`/`audit.undo`; refuses rather than deletes if a card or role has been given it since). Labels removed from both dictionaries.
- **`/admin/status` is guarded by `requireAdminUser()`**, as are Settings → Recent changes and Security. Its three server actions ask `hasAdminRole()`.
  The Settings tile and the environment line on `/releases` ask `perms.isAdmin`.
- **`routes.ts` keeps the entry and gains `adminOnly: true`** (and `activity` becomes optional, absent only on such an entry). The row stays
  because the menu and `check-menu-coverage.mjs` read it; `canOpen()` answers `perms.isAdmin` for it, and a recurring job linked there needs
  no cell a role could hold. The flag names no role and no activity. `check-permission-catalogue.mjs` asserts an `adminOnly` entry names
  no activity and its page calls `requireAdminUser()`.
- The manual topic became `adminOnly: true` (the existing flag) instead of naming the activity; the acceptance-matrix row lost its `needs`.

## Why Admin was not given a card
`CLAUDE.md`: Admin sits outside the card system and is never given cards. The `perms.isAdmin` short-circuit in `can.ts` answers before
reading a cell, which is what "no matter what cards exist" requires; a card-shaped version fails the day a card is added. `can.ts` and
`roles.is_admin` are untouched.

## The consequence, recorded and not re-asked
No shelter can ever delegate the system status page to its own staff. That is what Admin-only means.

## Found, not fixed
- `scripts/check-card-grants.mjs` fails on dev at the role-insert step (`null value in column "shelter_id" of relation "roles"`), since
  `roles.shelter_id` became NOT NULL (#1657). It is unrelated to this change; its cards, includes and 112-role checks pass.
- `check-menu-coverage.mjs` lists `/admin/status` as "NO CARD", which is now the intended truth for an Admin-only page; the check is red on purpose
  until a person accepts each page, and accepting is not this PR's to do.
