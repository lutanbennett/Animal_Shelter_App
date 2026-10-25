# Who does what opens on a card (2026-10-25)

**Decided by Lutan, 2026-10-24/25:** only a card gives an ability; Admin alone sits outside the card system.

## What changed

- **A new activity, `roles.view`** (yes/no, area settings, sort 68): see which cards each role holds on Settings → Who does what. Read only. Editing stays Admin at 2-step and is not this.
- **A new card, `who_does_what`** (card twenty-nine), requiring `roles.view`. It opens `/admin/who-does-what`.
- **`opensWhoDoesWhat()` is now `can(perms, "roles.view")`.** Admin passes by the `isAdmin` short-circuit, as everywhere. The page also appears in the route registry, so `/admin/who-does-what` is guarded by `requirePermission("roles.view")` like every other registered page; `/details` keeps its pin.
- **Migration `0262`** adds the activity, the `card_grants` row, and gives the card to the Management role.
- The rule's record is deleted from `docs/hard-coded-security-registry.json`; nothing was registered.

## Why the migration and the app ship together

The migration grants Management the card; the app starts requiring it. App alone: Management loses the page. Migration alone: a card nothing asks for. `0261` records the same failure mode in the other direction. This departs from "schema first, own PR" on purpose.

## Admin

Admin is not given the card (Settled 2026-10-25). Verified with an Admin login, not by reading `can.ts`.

## Observation, not changed: the page reads every role's cards with the service role

The Who does what page loads every role's cards with the service role, which ignores the database's own rules. **The app gate is the whole lock for that read; the database does not back it up.** Not changed here (scope). Filed as a backlog item.

## Count of cards

The agreed set is now twenty-nine, not twenty-eight: this card was needed by this item. `check-cards-count.mjs` and `cards.test.mjs` say so. The "28-card rerun" therefore covers twenty-nine.
