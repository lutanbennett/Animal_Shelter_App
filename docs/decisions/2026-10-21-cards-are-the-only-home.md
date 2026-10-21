# Cards are the only way to set a role's home; the Home screen panel is retired

2026-10-21. Lutan: the Home screen panel goes; cards are the only way to set a home. Condition, in his words: do not regress from the tile-groups goal.

**Supersedes `2026-10-19-role-home-tiles-panel.md`** (the panel, and the home reading `role_home_tiles`). The schema record `2026-10-19-role-home-tiles-schema.md` stays true as history.

## Why

The board (`role_cards`) and the panel (`role_home_tiles`) were two lists for one thing. Once the home read the panel's rows first, editing the board stopped changing the home, and a page added in the panel showed a tile the board knew nothing about.

## What changed

- `homeTilesBase` no longer takes saved paths. A role with cards draws its cards in board order (`cardTilesFor`); a role without keeps the derived home. This is the one function groups will extend: a parent level over the same ordered cards (`role_cards.group_id`, `role_groups`, 0241), nothing else to rework. Nothing reads `role_groups` yet.
- Removed: the panel, its actions and data loader, `loadRoleHomeTiles`/`loadHomeTilesByRole`, `savedTilesFor`, `outsideLabel`/`OUTSIDE_PATHS`, and `scripts/check-role-home-tiles.mjs` (it compared the panel's rows to the cards).
- **Not changed:** `role_home_tiles` stays in the database, unread. Dropping it is a cleanup migration for a later stream. The audit labels and undo group for the table stay so old Recent changes rows still read.
- Operations and Management landing pages are untouched.
- Only Admin manages tiles; no role edits its own (answered 2026-10-19).

## Rows the cards do not explain (dev, read 2026-10-21)

Comparing each role's panel rows with what its cards draw: every role matches except **Management**, whose rows include `/enclosures`, which none of its cards open. After this change Management's home loses the Enclosures tile. If wanted, give Management the Enclosures card on Who does what. Production was seeded the same way on the day 0225 went in; check its rows the same way before release.
