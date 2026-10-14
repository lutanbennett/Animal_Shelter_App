# Who does what is a page of cards; the grid moved to Details (2026-10-14)

Stream 2 of 4 of the cards work (schema was 0194 / PR 602). Lutan's rulings of 2026-10-13 are the brief:
the first set of 21 cards is agreed, a card is tapped to see what it gives, and the 56-row grid must not share
the page with the cards.

## What was decided

- **`/admin/who-does-what` is a role's cards.** A row of role buttons, then that role's cards in order, each
  with its one-sentence description and "includes X". **Tap a card** and its detail opens at the top of the same
  page (`?role=…&card=…`, anchored to `#card-detail`): what it lets someone do, which cards it includes (each a
  link), and the activities and levels it gives as a short list. The same detail opens from the *Add a card*
  list **before** the card is added, with *Add this card* beside it. One page, no sheet or modal: at 375 px a
  detail that is a section above the list scrolls like everything else, works with the Back button and a shared
  link, and needs no client state.
- **The detail list is generated from `cards.ts`**, never typed. Only the one-sentence description per card is
  hand-written (dictionary `admin.whoDoesWhat.cardsView.description`, keyed by `CardKey`, so a new card fails the
  type check until it has one, in both languages).
- **The grid moved one tap away** to `/admin/who-does-what/details`, behind a *See every activity (Details)*
  button, and is **read-only**. It is not dropped (Lutan's call, not ours). It was editable before; an edited box
  would now be undone by the next card change, because `role_permissions` is recomputed as the union of the
  role's cards and extras. The per-box editor (`CellSelect`, `setCell`) is gone; changing a role is changing its
  cards.
- **Also allowed** is the home for extras: a short list under the cards, each with its reason, so they are not
  discoverable only through the grid. Admin can remove one or allow one more thing (activity, how much, and a
  required reason).
- **Extras a held card already covers stay stored and are hidden from the list.** First version deleted them when a
  card covering them was added; testing showed that removing the card later then silently took away a power the role
  had been given singly (the 2IC lost the microchip and photo boxes: 22 boxes became 20). Keeping the row means
  *removing a card takes away only what the card gave*, the same promise the schema makes between two cards.
- **Enforcement did not move.** Every change calls `set_role_cards()` (0194) as the admin's own session, so RLS
  (Admin at 2-step) and the audit triggers apply. `has_permission()`, the policies and `can()` are untouched.
- Management sees the same page with no buttons and the note "Only an Admin can give or remove cards."

## Consequences worth knowing

- Management's 43 extras (whole cards its curated tiles do not show) all appear under *Also allowed* until
  someone gives Management those cards; giving a card hides the extras it covers and changes no access.
- The Details page keeps the sticky headings, CSV and Print, and the fixed-for-now footnotes.
- Adding card 22 is still one entry in `cards.ts`, its key and label, and one description in both dictionaries.
- The home screen as the role's cards (stream 3) and the left-menu removal (stream 4) are not started.
