# Role home tiles: the Home screen panel and the home reading the table

2026-10-19. Part (2) of *Choose each role's home tiles in Settings*. Builds on `2026-10-19-role-home-tiles-schema.md`.

## What it does

- **The home reads `role_home_tiles`.** `homeTilesBase` draws a role's saved paths in position order when it has rows, each still tested with `canOpen` / the three outside-registry tests, so a tile never grants access and a removed cell hides the tile exactly as before. No rows: the role keeps its card or derived home. Multi-role logins (`homeTilesForRoles`) apply this per role.
- **Home screen panel** (`HomeScreenPanel.tsx`, own file, section of `/admin/who-does-what` under the cards board; `CardBoard.tsx` is untouched). Up/down, Remove, Add from every registry page plus `/residents`, `/bills`, `/assistant`. A page the role cannot open says what is missing and offers the one cell as a button, which goes through the existing `addExtra` (prerequisite checks, audit, reason filled in) and then adds the tile. Clinic-scope pages and Bills offer no grant, because no single cell opens them. A saved tile the role can no longer open shows greyed with why.
- **Admin only, 2-step.** `home-tiles-actions.ts` checks `hasAdminRole()` and `hasTwoStep()` and runs as the admin's own session. Confirmed against `0225`: its policy is `is_admin()` for every write plus restrictive aal2 policies on insert, update and delete, so the database already says so and no policy was added. Management, the Director and the 2IC cannot edit, including their own role (Lutan, 2026-10-19).
- **Audit.** `role_home_tiles` added to `AUDITED_TABLES`, the Recent changes label in both dictionaries, the row name (the path), and `undo.ts`'s `permissions` group.

## Choices worth knowing

- **No migration, so no atomic replace function.** A save upserts every wanted page at its position, then deletes the rest. A failure part-way leaves a superset of old and new, never fewer tiles. A SQL function would make it one call; not worth a schema PR for a screen Admin uses rarely.
- **A role with no rows shows the home it derives, and the first change saves that list.** Otherwise the first Add would turn a six-tile home into one tile. Removing the last tile is refused (an empty set means "derived", which the panel would then misdescribe).
- **Tile words.** A saved tile uses the label of a card the role covers that opens that page, else the page's own title, so a seeded home reads as before. Jobs (`JOBS_OF_ROLE`) are not offered: cards superseded them as the meaning of a tile (see the schema decision).
- **Management's curated home** (`managementDay`) is no longer reached for Management once it has rows, and it has them. It stays as the fallback and `check-home-screens.mjs` still guards it.
- **Production:** `0225` must be applied before this release, or the home's read of `role_home_tiles` fails. Production's `role_cards` seeds it, so homes are unchanged on the day.

## Not done, by instruction

Part (3), removing `NavPane` for non-Admin. The menu is unchanged for every login. The panel does not make the menu look redundant; it has no effect on it.
