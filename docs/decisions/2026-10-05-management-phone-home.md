# 2026-10-05 — `management-phone-home`: the Director's daytime screen

Built on `home-screens` (2026-10-04), which left Management's home as every page Management can open
(19 tiles). This is the whiteboard's Management column (`docs/roles-and-permissions.md` §8), as a
curated list in `src/lib/home/tiles.ts` (`managementDay`).

## What the screen is

Recurring jobs, Intake, Residents, then My tasks (if she holds `recurring.do_own`). Each tile is shown
only when the role holds its cell, so a Management role edited in Settings loses a tile rather than
getting one that refuses.

## The whiteboard drew five; this is four, on purpose

The board's Vet appts, Res medical and Res details are not pages. A vet visit is booked, and a
resident's medical records and details are read, from the resident (`/residents/[id]/...`): there is no
page that lists visits for Management (`/appointments` is the vet's, by scope). Three more tiles would
all open the Residents list, so they are the Residents tile. If the Director wants a visit list of her own
(visits booked this week), that is a new page and its own backlog item, not a tile.

## Choices

- **Keyed on the role `management`**, so Admin's switch (`/home/management`) shows the same screen.
- **Intake is not in the route registry**: it is a wizard behind `resident.register`, and a registry entry
  would put an Intake tile on every role that holds the cell (Staff's whiteboard column has no Intake).
- **L7 stays open**: which of the other 15 pages she wants on her phone by day. They remain in the
  sidebar; this screen does not remove access, only the tile.
