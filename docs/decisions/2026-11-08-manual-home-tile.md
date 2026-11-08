# The user manual's home tile is a fixed doorway, not a card tile

**2026-11-08, `#ce6ec`, branch `claude/manual-home-tile`.**

## What was asked

The Director went looking for the user manual on a login whose role has the left menu off, and concluded there
was no way in. The manual was in fact reachable from the account menu (`src/app/AccountMenu.tsx`), which every
signed-in login gets, so this is **findability, not access**. Lutan was given two options, a home tile or a card,
and chose the tile. **No card for reading the manual exists or should exist**: a card would make the manual
something a role can lack.

## What the tile is instead of a `cardTile()`

The tile is `manualTile()` in `src/lib/home/tiles.ts`, added by `withManualTile()`. It is **a fixed doorway that
every home carries**: it is not derived from any card, any cell or the route registry (`/manual` is in neither
`routes.ts` nor `OUTSIDE_REGISTRY`), so there is nothing for `cardTile()`'s page-rule check, `tileBlock()`, to
test it against and nothing that can veto it. That is correct rather than a gap, because `/manual` loads for every
signed-in login and narrows its own topics to the reader's cards (`src/app/manual/page.tsx`). It grants nothing.
`withManualTile()` adds it last, once (it never adds a second if one is already there), and it runs **outside
`withCounts()`**, so no part of a home's numbers can affect it. Label `t.nav.manual` (both dictionaries already had
it, so no new string), icon `NAV_ICONS.manual`, the same book the account menu and the left menu use.

## Every function that builds a home (the brief's open question, answered)

The brief suggested putting the tile beside `withApprovalTile()`, inside `withCounts()`. **That would have repeated
the fault one function over:** `withCounts()` returns at its first line when no `counts` are passed, and several
callers pass none. So the tile is added in the three exported builders themselves:

| Function | Draws | Gets the tile |
|---|---|---|
| `homeTilesFor()` | `/home/[role]` (Admin viewing another role's home); every test and check script | yes, last |
| `homeTilesForRoles()` | merged home of a multi-role login (scripts only today) | yes, once |
| `homeGroupsForRoles()` | `/home`, the home every non-Admin login lands on | yes, in **every** group |
| `homeTilesBase()` | private; called only by the three above | via them |
| `cardTilesFor()` | the body of a card home, a group's page (`/home/group/[id]`), and a group's landing (`src/lib/home/landing.ts`) | **no, on purpose** |

**Every group, not only the main role's:** on a phone a multi-role login sees one group at a time and the choice is
kept for the day, so a tile in the main group alone would vanish while the cover's tab is showing. It follows the
existing rule that a tile two roles both give is in each group.

**Not in `cardTilesFor()`:** a group's page is the set of cards an Admin put in that group, reached *from* a home
that already has the manual's tile; adding it there would put a non-card tile inside a group of cards. Admin on a
phone lands on `/home/<management>`, which is `homeTilesFor()` and so shows the tile; at a desk Admin lands on
`/admin` (Settings), which is not a home screen, and Admin always keeps the left menu.

## The empty home

A role whose cards draw nothing used to show "Nothing here yet" in place of tiles. With the manual on every home,
`tiles.length > 0` would always be true and that notice would never show, hiding a real finding about the role's
cards. So both pages now test `hasJobTiles()` (any tile besides the manual's) for the notice, and still draw the
tiles under it, so even that login has the way to the manual.

## What changed alongside

- The icon library (`src/lib/home-icons/catalogue.ts`) lists the manual, because its rule is that every tile a
  home can show has an icon (and its test asserts exactly that).
- Tests and `scripts/check-home-screens.mjs` that pinned a home's exact tile list now include `/manual` with a
  one-line note; the rule they guard ("a home is exactly its cards; nothing is added by role or cell") stands,
  since this tile is the same for every login. `src/lib/home/manual-tile.test.mjs` asserts the tile's own
  guarantees, including that no card opens `/manual`.
- One sentence in the manual's *Signing in* topic says the last tile is always User manual.
