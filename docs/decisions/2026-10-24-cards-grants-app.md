# 2026-10-24: the app reads what a card gives from the database (app half of 0257)

App half of `2026-10-24-cards-grants-in-the-database.md`. No migration. Lutan's ruling stands: *"all security restrictions should be driven by cards only"*.

## The shape chosen for `cards.ts`

**`cards.ts` stays, but only as structure and seed; what a card GIVES is read from `card_grants` and `card_includes` by one server function, `loadCardGrants()` (`src/lib/permissions/card-grants.ts`).**

- **Why not make `cards.ts` itself read the database.** It is pure and client-safe, and it is imported by the home screen's tile code, the icon catalogue and client components. Making it async or server-only would drag a database read into every one of those, to answer a question none of them asks. Only two things ever needed the *grants*: Who does what (what a card gives, what it includes) and the old save (which sent the bundle). The rest need the card's key, label, page and which cards stand for which, none of which is access.
- **No cache, and no fallback.** The function reads fresh on every call, so an Admin edit shows on the next load. A failed read throws; it never quietly shows the seed. A screen that shows the code's copy while the database says otherwise is exactly the fault this removes. A "cold read" therefore means an error page, not a wrong page.
- **`bundle` and `includes` in `cards.ts` are now the seed only.** They are still read by the check scripts (`check-card-grants.mjs` proves the seed equals the table) and by `cards.test.mjs`. They no longer decide what anyone may do.
- **`includes` are honoured the same way the database does:** followed transitively from `card_includes` (`includedBy`). The home screen's "stands for" test (`isSubsumed`, a tile question, not an access one) still uses the code's `includes`; that is a layout rule and is not security.

## What changed

- **The save sends cards only.** `set_role_cards` is called with `p_role` and `p_cards`; `p_bundle` is gone from the call (the signature is unchanged and the database ignores it). `bundleJson` is deleted.
- **Also allowed is gone**, the screen and the actions behind it (`addExtra`, `removeExtra`), because an extra no longer grants anything. **`role_extras` is not dropped**; nothing in the app reads it now, so dropping it is unblocked. It stays a later cleanup.
- **`card_grants` and `card_includes` are in `AUDITED_TABLES`** and labelled in Recent changes (and in both dictionaries).
- **`cardTile` no longer checks that the role's cells cover the card's code bundle.** The database now guarantees they do, and that check was a hard-coded copy of the grants on the home screen's hot path. What remains is whether the page opens.
- **The "cannot open the page" warning names the page and the rule.** `tileBlock()` returns the page and which non-card rule refuses it: the `OUTSIDE_REGISTRY` test, a `routes.ts` page activity or clinical scope, or a page in neither list. **No new hard-coded rule was added, and none was patched around.**
- **`role-cards-coverage` and `cards-union` read `card_grants`** (through `card_closure`, so includes count) instead of a literal built from `cards.ts`. `scripts/lib/card-bundles.mjs` is deleted. Before `0257` is applied to a database these two report a missing table, which is the same finding.
- **`scripts/check-cards-schema.mjs` is retired (deleted), not rewritten.** Its part 1 compared the database with the code plus extras, which is now false by design; its part 2 assumed the bundle came from the caller. `check-card-grants.mjs` proves the same things for the new model (seed equals code, every role equals the union of its cards, the rolled-back function tests, both photo-approver refusals). A rewrite would have been a second copy of it. The code half stays in CI as `check-cards-count.mjs`.
- **`docs/card-access-faults.md`** is the log Lutan reviews at the end of the card-access work, seeded with the three faults established on 2026-10-24.

## Hard-coded rules that can still block a card's page (listed, not patched)

`routes.ts` page activities and clinical scopes, `OUTSIDE_REGISTRY` in `tiles.ts`, `roles.scope_*`, `opens_app`. They belong to the security rebuild. The warning now says which one fired.

## Release note

Written for what an Admin sees (Also allowed has gone). The note that a role *does exactly what its cards say* is **not** written: it becomes true only when `0257` is applied to production, a release step.
