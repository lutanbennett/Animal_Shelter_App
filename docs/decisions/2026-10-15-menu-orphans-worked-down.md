# Menu orphans, worked down: what was fixed and what was left (2026-10-15)

Stream `menu-coverage-orphans`, part of part (3) of the left-menu item. The left-hand menu is NOT removed and no card was
added (the set stays at twenty-one). Fresh run of `scripts/check-menu-coverage.mjs` on dev: **80** unexplained orphans
(the brief's 82 was 2026-10-14's). After this PR: **68**.

## Fixed
- **Manual and Release notes** (12 orphans, two per role, six roles). Both open for every login that opens the app and
  only `NavPane` reached them. They are now links in the account menu, declared in `CHROME` with the file and string that
  prove it. No permission changed.

## Left, and which of the three kinds each is
1. **Needs a card the role does not hold (a data change in Who does what, not code).** The role already holds the cells,
   so assigning the card adds a tile and no power. Examples: Management has 2 cards on dev and so no tile for Clinics,
   Contacts, Donations, Dashboard, Outreach, Projects, Deliveries, Maintenance, Stocktake, the medical jobs, Add photos;
   2IC lacks Contacts, Dashboard, the medical jobs and Add photos; the Head of Medical and Head of Maintenance, and the
   Doctor, have no View residents card, so `/residents` and `/residents/[id]` are orphans. Production's cards are set by
   the Director in the app, so a migration seeding them was deliberately not written here.
2. **A landing nothing links to.** `/management` (Management, 2IC) and `/operations` (every role that holds an operations
   cell) are reached only from the menu. Their children (about 20 of Management's) become reachable the moment the landing
   does. A tile needs a card, so this is Lutan's call: a twenty-second card, a link from somewhere, or accepting them in
   `ACCEPTED`. Not decided here.
3. **My tasks (`/my`)** for card homes has no tile (already noted in the 2026-10-14 decision). Same call as above.

## Permissions findings (not changed)
- **Doctor's home is broken**: sign-in sends it to `/appointments`, which its cells do not open. Needs a cell or a
  different `home_path`.

Nothing was declared in `DEEP` for links that only exist behind a parent that is itself an orphan: they would not move the
number and would read as coverage on paper.
