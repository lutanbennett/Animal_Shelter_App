# 2026-10-24: Who does what groups the Available cards by feature (app half of 0255)

Lutan, 2026-10-24: *"Yes build it now as it will help me in completing the PDF."* The schema half is `0255` (see `2026-10-24-features-table-and-card-features.md`). This is the screen. **No migration, no change to `cards.ts`, and the held-cards side and tile groups (0241) are untouched.**

## How the sections work

- The Available column (the role's cards it does *not* hold) is split into one `<details open>` per feature, in `features.position` order, each titled with its name and a count. Sections can be closed; the open state is the browser's own, so it survives the refresh after a change. A feature with no cards in the list (or none matching the search box) is not drawn.
- **Not yet sorted** is always last and holds any card with no `card_features` row, a null `feature_id`, or a feature id that is not in the list. It is computed on the page, never stored: a card added to `cards.ts` later lands there on its own. Every card is in exactly one section (checked on dev: 28 held + available for a role, once each).
- Feature names come from the rows (Thai name when the language is Thai and one exists, else English). Only the chrome (headings, buttons, notes) is in the dictionaries, so none of the 13 names is typed into `en.ts` or `th.ts`.

## The Features panel (Admin at 2-step)

Add (English, optional Thai), rename (both names), up and down, delete, and a list of all cards each with a feature selector; the same selector sits on every Available tile. A card's feature is one row, so moving it moves it for every role. Server actions are in `actions.ts` (`addFeature`, `renameFeature`, `moveFeature`, `removeFeature`, `setCardFeature`) behind the same Admin plus 2-step guard as the cards, and the tables' own policies enforce it again. None calls `set_role_cards()`, so nothing a role can do changes.

- **Deleting a feature** relies on `on delete set null`: its cards become Not yet sorted and none is lost. The button's label says so.
- **A new feature's key** is made from the English name (lower case, digits, underscores), made unique with a numeric suffix, and `feature_<…>` if it would not start with a letter. The key is a stable handle; renaming never changes it.
- Reordering renumbers all features from 1, as groups do, so a gap or a tie cleans itself up.

## Audit

`features` and `card_features` are in `AUDITED_TABLES`, labelled in both dictionaries, and named in Recent changes' record column (`card_features` shows the card key). Undo says "elsewhere" for them, which is right: it is a setting, not a record.

## The four guessed mappings

Left exactly as `0255` seeded them: `donations_receipts` (Finances and reports), `add_medical_photos` (Photos, videos and social media), `operations_landing` and `management_landing` (Settings and administration). Each is now a two-click move on the screen, so no code corrects them.

## Limits

The dev sign-in is aal1, so the board opens but the Admin-at-2-step writes could not be driven from the browser; see the test plan's manual table. The unsorted case was exercised by deleting `assistant`'s `card_features` row on dev and restoring it.
