# Cards are what a role is given (schema, 0194)

Lutan, 2026-10-13: the most urgent work in the backlog. A role is given **cards** ("View residents",
"Residents", "Do the Purchasing" …); each card brings the permissions under it, and later the tile on the home
screen. This is the schema half. The Who does what page, the home screen and the menu removal are three later
streams; nothing here changes what anyone can do.

## What was decided

- **Twenty-one cards**: the eight jobs already in `jobs.ts`, twelve new ones, and Enclosures (added 2026-10-13,
  deliberately narrow: Read on `facility.enclosures`, not bundled with Do Maintenance). The facility map and rooms
  belong to no card, by agreement; whoever holds them keeps them as extras.
- **Definitions stay in code** (`src/lib/permissions/cards.ts`), as the 2026-10-04 ruling requires; **which cards a
  role has is data** (`role_cards`). The database holds no copy of a bundle: `set_role_cards()` is handed the bundle
  that `cards.ts` computes. So card twenty-two is one entry in `cards.ts` plus its title in both dictionaries, with
  no second list and no migration. `scripts/check-cards-schema.mjs` fails if the database and the file ever disagree.
- **Enforcement does not move.** `role_permissions` is still what `has_permission()`, every policy and `can()` read.
  It is now the union of the role's cards' bundles plus its `role_extras`, recomputed by
  `recompute_role_permissions()`, which writes only the rows that change, so Recent changes shows the cells a card
  change really moved.
- **Levels flow down** with `includes`: Residents includes View residents; Medical records and Book clinic visits
  include it too. Overlaps are fine, and removing a card keeps whatever another card or an extra still gives.
- **Extras** are single activities a role holds that no card gives, each with a reason, so moving to cards changed
  nothing for anyone. Writes are Admin at 2-step; both tables are audited.

## It supersedes

- the home-tiles item's separate tile table: a card is the tile *and* the permissions, so a role can never be
  given a tile it cannot open, or a permission with no way in;
- `2026-10-06-home-screen-belongs-to-a-role.md`'s "keyed on the role's key" (`CURATED_HOME`): a home becomes the
  role's cards in order. That is the stream after the page; until it lands `CURATED_HOME` and `JOBS_OF_ROLE` are
  unchanged and still drive the home.

## The seed, and what it found

Nobody's access changes. Per role, `role_permissions` was hashed before and after the apply on dev and is identical
(doctor 2 cells, head_of_maintenance 8, head_of_medical 9, management 57, second_in_command 22, staff 39,
volunteer 5), and the migration itself raises and rolls back if cards plus extras differ by one cell.

- The three configured roles got their jobs, Management its curated four (Recurring jobs and Residents), Admin
  nothing, and every other role the cards its cells already fully give.
- **Finding: the first Residents bundle included `placement.death_withdraw`, which Management does not hold.**
  Giving Management the card would have granted it. It was not "fixed" by changing the expectation: the card does
  not include it, and it stays a single activity.
- **Finding: Management keeps 43 extras.** Most of them are whole cards it already could use (Contacts, Dashboard,
  Donations and receipts, Bills, Website, Outreach notes, Assistant, Medical records, Book clinic visits, Enclosures)
  that the curated four tiles simply do not show. Adding those cards to Management in the next stream changes no
  access; it is what turns the extras into tiles. What no card covers at all, for anyone: `facility.map`,
  `maintenance.photos`, `stock.correct`, `projects.*`, `reference.add_while_recording`, `translations.*`,
  `resident.microchip` where Residents is not held, `medical.*` where Medical records is not held.

## No down migration

Additive, and `role_permissions` is correct at every point, so leaving it in place loses nothing. To revert, drop the
four functions and two tables and remove `role_cards` and `role_extras` from `AUDITED_TABLES`.
