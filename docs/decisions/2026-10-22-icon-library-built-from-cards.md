# The home-screen icon library is built from the cards as well as the registry

Date: 2026-10-22. Backlog item: BUG, the library had no Bills icon (Lutan: "I am missing Bills from the icon library").

`iconCatalogue` listed only the route registry, but a card can open a page outside it (`OUTSIDE_REGISTRY` in
`src/lib/home/tiles.ts`: `/bills`, `/residents`, `/assistant`, `/my`), so those tiles had no icon.

- **Registry first, then cards.** Registry entries keep their labels, so file names already in the shared Drive
  folder do not change; every card page not already listed is added with the card's label and the icon its tile uses.
  So `/residents` is labelled "View residents" (the first card that opens it), as on the Management home.
- **Per viewer, the same open test as the home:** with permissions, a card's page is added only when `cardTile()` draws it,
  so a role without Bills has no Bills icon. With none (the Drive sync) it is the full set.
- **`OUTSIDE_REGISTRY` is now exported** from `tiles.ts` (the only change there) so the two lists cannot drift.
- **Enforced by `src/lib/home-icons/catalogue.test.mjs`:** every card's page has an icon for a role whose cells cover the
  card, and every tile a home draws has an icon.
