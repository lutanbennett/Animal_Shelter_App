# Seed the cards that replace the automatic home tiles (schema half)

Lutan, 2026-10-23: *"why has the operations tile been added to the volunteer role, I did not authorise that"* and then *"The rule is no
hard coded items."* The code was adding tiles to a role's home outside Who does what (`landingTiles()` and `RULED_CARDS` in
`src/lib/home/tiles.ts`). The app half removes that code; this half is the data that keeps the tiles Lutan wants, as ordinary
`role_cards` rows he can see and take away.

**The list, read from dev only, with Lutan's answer:**

- Operations and Management: **dropped for every role** (including the Volunteer's Operations tile, the one that started this).
- My tasks: volunteer, head of maintenance, head of medical, management, second in command.
- View residents: head of maintenance, head of medical.
- Bills, Special diets, Medical photos, Weight: management; the last three also second in command.

Lutan answered the Operations and Management lines directly; he did not object to the other lines when they were put to him as
recommendations ("keep"). If he meant otherwise, those are rows to delete on Who does what.

The two landings become cards (`operations_landing`, `management_landing`) in the app half and are seeded for nobody.

**Why this is safe to apply before the app half:** it only inserts `role_cards` rows, appended after a role's existing cards, and
touches no `role_permissions`. Each tile was drawn only where the role's cells already covered the card, so no role gains access.
The old code skips a tile a card already draws, so nothing shows twice. Proven on dev: `check-home-cards.mjs` prints identical
`role_permissions` hashes for every role before and after, and no failures.

**Production was not read.** The seed is keyed on role keys, so a role that does not exist there is skipped. Whether production's
roles hold the same cells is not established. The production apply and the Worker deploy are Lutan's, and the seed must go on
production **before** the app half.
