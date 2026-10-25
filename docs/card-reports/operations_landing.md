---
card: operations_landing
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (read back first: 1 card, 0 permission cells), then as a login holding it together with Do Stocktaking, compared with Do Stocktaking alone (dev: 265 applied, 0 pending)
---

## Purpose

Meant to put an **Operations** tile on a person's home screen, a doorway to the day-to-day pages (medication list, stocktake, maintenance and so on). It gives no access of its own: it carries no permissions at all, so on its own it opens nothing.

## Gives access to

### Pages

- **Held on its own, nothing.** A login holding only this card is sent to the **public website** from every staff address tried: Home, My tasks, Operations, Management, Residents and the Medication list. It has no menu and no tile. It can open "Change password" and nothing else.
- **Held with another card, one extra home tile.** With Do Stocktaking added, the home screen showed two tiles, Do Stocktaking and **Operations**. The Operations page it opens listed only the Stocktake tile, the same as for Do Stocktaking alone.

### Tables

- None.

### Forms

- None.

## Major restrictions

- **It does nothing alone.** No permissions, so a person given only this card is signed in and looking at the public website. The card "applies" no access, which is exactly the state the rule says must not exist.
- **It is not what opens Operations.** Do Stocktaking alone already showed an Operations entry in the left menu and opened the Operations page. The card changes only whether a tile for it is drawn on the home screen. Take the card away and the page and menu entry remain.
- **It does not list locked doors.** The Operations page showed only what the holder's other cards open, so this card is not a menu of pages the person cannot enter. It is a harmless tile, not a trap.
- **Nobody holds it,** and the card has no grants, so the coverage check that asks which roles hold a card that does nothing is silent about it.

## Recommendation

- **Decide (yours): should this be a card at all?** My advice: no. It grants nothing, and the page and the menu entry it appears to unlock open without it. What it controls is one tile. If a home-screen tile is wanted, it is a setting on the role's home screen, not a card that gives access. Proposing or removing a card is Card review 2; nothing was changed.
- **If it stays:** it should say plainly that it only adds a tile, and Who does what should not present it as a way to give someone Operations.
