# Tile groups on a role's home: the app half

2026-10-21, `claude/tile-groups-app`. Schema half: `0241_role_groups.sql`
(`docs/decisions/2026-10-21-bills-inbox-and-role-groups-schema.md`). Option (b), decided by Lutan 2026-10-20.

## What was built

- **Who does what** (`src/app/admin/who-does-what/`): the role's column is split into *On the home screen* and
  one box per group. Admin adds a group (English name, Thai name, icon from a fixed list), drags a card into a
  box or picks the box from a *Where it shows* list beside the card (the phone's way, since a phone cannot drag),
  moves a card up and down among the cards in the same box, and moves or removes a group. Removing a group puts
  its cards back on the home (the foreign key's `on delete set null`); the role keeps every card.
- **The home** (`cardTilesFor` in `src/lib/home/tiles.ts`): loose cards first, in order, then one doorway tile
  per group in the groups' order. The tile opens `/home/group/<id>`, which draws the tiles inside.
- **The two landing pages**: `/operations` and `/management` put the cards of the role's group of that name first,
  in the group's order, then the rest of their own list.
- **`check-menu-coverage.mjs`** reads `role_groups` and counts a card in a group as reached through the group's tile.

## Choices worth knowing

1. **A group grants nothing, by construction rather than by a check.** The group page draws its tiles by calling
   the same `cardTilesFor` the home uses, against the reader's own permissions, and takes the group's `inside`
   list from that. So a card the reader's cells do not cover draws no tile inside a group either, and every page
   a tile opens still runs its own guard. No group action calls `set_role_cards()`, so `role_permissions` cannot
   change when groups do. Proved by a scripted case (a group holding a card whose cells are absent draws nothing).
2. **An empty group draws nothing.** 0241 seeded an Operations and/or Management group on several roles with no
   cards in them. Showing those would put a dead tile on homes on the day this ships; hiding them is what makes
   "nothing moves on the day" true. Admin still sees them on the board, where they are filled.
3. **Groups come after the loose cards.** Keeping the cards that stay on the home in their present places means
   moving two cards into a group changes the home only where those two were.
4. **The landing pages lead with the group; they do not become only the group.** A landing is also how a role
   reaches pages no card opens (Translations, Who does what, Shelter Friends), and the menu-coverage check counts
   them reachable from it. Replacing the list with the group would take those away the day someone fills a
   group, which is a regression the item explicitly forbids. When the orphans work gives those pages cards,
   the fixed list can shrink; that is batch 3's `orphans-landing-and-my-work`, not this.
5. **A group is matched to a landing by its English name** (`Operations`, `Management`, as seeded), not its icon.
   A group renamed to something else is simply a group of its own.
6. **Who may open a group's page:** someone holding the group's role, or Admin (who sees it as that role sees it,
   as `/home/<role>` does). Anyone else gets *not found*, so a group id never reveals another role's group name.
7. **The icon is a key into a fixed list** (`src/lib/home/group-icons.ts`), which is the whole choice Admin is
   offered. A key the list does not know draws a folder rather than nothing.
8. **Counts.** The My tasks and Maintenance numbers and the photos-waiting number go on the tile inside the group,
   on the group's page, not on the doorway. A sum on the doorway would be a reasonable later addition.

## Not done, and why

- **`role_groups` is not audited.** 0241 added no audit trigger, and this stream carries no migration. Moving a
  card into or out of a group *is* audited (it updates `role_cards`, which `record_audit()` already covers);
  adding, removing or reordering a group is not. A one-line trigger in a later schema PR closes it.
- **No rename.** A group is removed and added again; its cards fall back to the home in between. Rename is small
  and can come with the audit trigger.
- **The left-hand menu stays**, and the orphan rulings are not built: both are later items by the brief.
- Menu coverage: **66 unexplained orphans before and after**, both with every group empty and with two of the
  2IC's cards inside its Management group (the grouped pages then show as reached via the group). This change
  neither worsens nor improves the count; the orphans are pages no card opens, which groups cannot reach.
