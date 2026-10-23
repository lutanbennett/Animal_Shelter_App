# A role's home is only its cards and groups (supersedes the automatic part of 2026-10-21-landing-and-my-tasks-tiles)

Lutan, 2026-10-23: *"why has the operations tile been added to the volunteer role, I did not authorise that"*, then *"The rule is no
hard coded items."* He chose a **quick patch now**; the full removal of every hard-coded role rule is the later rebuild.

**What changed.** `landingTiles()` and `RULED_CARDS` in `src/lib/home/tiles.ts` are deleted. They added the Operations, Management and
My tasks tiles (and extra cards for four role keys) after a role's own cards, with no row Who does what could show or remove. A card
home is now `cardTilesFor(cards, groups)` and nothing else.

**Operations and Management become cards** (`operations_landing`, `management_landing`, cards 27 and 28 in `cards.ts`), like My tasks
already was. Each has an empty bundle, so giving one grants no access: the tile is drawn only if the role's own cells already open a
page in that section (`OUTSIDE_REGISTRY`, `opensAnyIn`). No role holds either: Lutan dropped them for every role.

**The tiles that stay** were seeded as ordinary `role_cards` rows by `0251` (see `2026-10-23-seed-cards-for-removed-automatic-tiles.md`).
Order matters: that migration must be on production **before** this code is deployed, or the roles lose those tiles until it is.

**The test** (`src/lib/home/landing-tiles.test.mjs`, `ruled-cards.test.mjs`): a role's home is exactly its cards however wide its cells
are, no role key earns a tile its cards do not name, and taking a card away takes the tile away. A new page under `/operations` or
`/management` changes nobody's home.

**Not touched, on purpose (the rebuild's list):** `JOBS_OF_ROLE`, `CURATED_HOME`, `OUTSIDE_REGISTRY`, `FIXED_FOR_NOW`, role-key
ordering, and the fallback home a role with **no cards** gets. Those still decide a home in code for a role with no cards.

**Cost, stated.** Pages a role can open but no tile now leads to rise: `check-menu-coverage.mjs` on dev goes from 25 to 107 unexplained
orphans (the 107 includes disposable `dev_signin_cards_*` roles). Access did not change, only the shortcut. Each is a card for Lutan
to give or not; none was acted on.
