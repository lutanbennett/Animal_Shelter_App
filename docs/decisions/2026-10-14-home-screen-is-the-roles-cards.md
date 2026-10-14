# The home screen is the role's cards (2026-10-14)

Stream 3 of 4 of the cards work (schema 0194 / PR 602, Who does what page PR 609).

- **A role that has cards shows exactly those, one tile each, in `role_cards.position` order.** The tile is derived
  from the card definition in `cards.ts` (label, page it opens), never described a second time: `cardTilesFor()` in
  `src/lib/home/tiles.ts`. Adding card twenty-two stays a one-file change.
- **A tile is drawn only if the role's cells cover the card's whole bundle and its page opens** (`canOpen`, or the
  page's own test for the three pages outside the route registry: Residents, Bills, Assistant). By construction the
  seeded cards pass, so this is a second lock, not a filter that ever hides a card; `scripts/check-home-cards.mjs`
  proves it per role, in both languages, and fails if a held card has no tile or a tile has no card.
- **A card another held card includes and shares its page with has no tile of its own** (View residents under
  Residents). Medical records and Residents both open `/residents` and keep a tile each: they are different jobs.
- **A role with no cards keeps the derived home** (the roles a shelter creates). Admin's phone/desk rule is unchanged.
- **Extras give no tile**, by design: no card, so no page to open.
- **Re-ordering is Stream 2's Move up / Move down on Who does what**, which writes `role_cards.position`: the order on
  that page is the order on the phone. Up/down, not drag, because drag on a phone is the interaction most likely to
  disappoint, and the page already has the buttons at 44px. No second ordering control on Home.
- **`role_cards` is Admin-read-only (0194), so Home reads it with the service role** (`loadRoleCards`), for the one role
  key already settled by the caller. No migration.
- **Known change for Management:** its hand-curated home (`CURATED_HOME`) also showed an intake shortcut and My tasks;
  from cards it shows Recurring jobs and Residents. Intake stays one tap in Residents. The curated code now only
  serves a Management that has no cards.
- **Not done, deliberately:** a person holding several roles (the union of their roles' cards) — `my_permissions()`
  gives one role today; the left menu is untouched (stream 4).
