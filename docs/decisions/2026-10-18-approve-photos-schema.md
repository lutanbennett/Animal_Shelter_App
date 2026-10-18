# Approve photos: the schema half (`0221`) and cross-role card dependencies

2026-10-18. Schema half of *"An Approve photos card, assignable to any role, and Add resident photos cannot be given out until some role can approve"*. **The feature is not usable when this merges.** The Approve photos card, its tile, and the Who does what screen are the app half (`approve-photos-app`). The backlog item is **not** ticked, and there is **no** release note: nothing a user can see has changed.

## Decided by Lutan (2026-10-18)

**Admin does not count as the approver.** At least one non-Admin role must hold approval before Add resident photos can be given out. Admin is the night-time desk; the point is that someone on site approves by day. Admin is a fixed role holding no cells, so this falls out of the query rather than needing a special case.

## Choice: the guard counts the activity, not a card name

`set_role_cards(uuid, text[], jsonb)` (signature unchanged from `0194`) asks: does any role other than the one being edited hold `photos.resident_publish` in `role_permissions`, or does the edited role's new bundle include it? Reasons:

- The Approve photos card does not exist yet; the activity does (`0217`).
- Residents must keep counting, and an extra counts too. Every route to the cell ends in `role_permissions`, so one query covers cards, extras and any future card.
- The rule needs no change when the app half adds the card.

The edited role is counted by the bundle it is being handed (the after-state), so a role given Residents and Add resident photos in one call approves for itself.

## What it refuses (both `check_violation`)

1. Giving a role `add_photos` it did not already hold, while no approver exists: *"Give a role the Approve photos card first, so someone can approve these photos."*
2. Taking approval away from a role that has it, while no other approver exists and a role holds `add_photos` after the call: *"This is the last role that can approve photos, and these roles still add resident photos: <names>. Take Add resident photos off them first, or give another role the Approve photos card."*

**Deliberately permissive:** if an approver exists after the call, the function behaves exactly as in `0194`. An already-inconsistent state never blocks an unrelated edit, re-saving a role that already holds Add resident photos is silent, and removing `add_photos` is always allowed. Only the two moves above can be refused, so Settings cannot be locked by a pre-existing gap.

## Finding: a retired role also approves

On dev, `photos.resident_publish` is held by `management` **and the retired `staff` role**, both through Residents. No extras hold it. `staff` counts as an approver (a non-fixed role holding the cell), so removing Residents from Management is **not** refused today. This is reported, not papered over. If retired roles should not count, that is a separate decision (retire them properly, or exclude them in the query).

## Code-level dependency map

`Card.requiresCardSomewhere?: readonly string[]` in `src/lib/permissions/cards.ts`, set to `["approve_photos"]` on `add_photos`. `CARD_SATISFIED_BY` maps `approve_photos` to `["residents"]`. It is typed `string` rather than `CardKey` only because the card is not defined until the app half. **Nothing reads it yet**: the database is the enforcement, and the map is what the screen will read.

## What the app half must do

- **Function:** `set_role_cards(p_role uuid, p_cards text[], p_bundle jsonb)`, unchanged. Catch `check_violation` and show `error.message` as it is; both messages are written for the user.
- **Add the card:** `approve_photos` in `CardKey`, `NEW_CARDS` and both dictionaries; bundle `photos.resident_publish` plus `resident.record` at Read plus whatever Remove needs; opens `/photos/approve`; waiting count on its tile. The card **must bundle `photos.resident_publish`**: the database guard keys on that activity.
- **Dependency:** narrow `requiresCardSomewhere` to `readonly CardKey[]` and add `approve_photos: ["approve_photos", "residents"]` to `CARD_SATISFIED_BY`. On Who does what, disable the **+** with *"Needs a role that can approve photos"* when no non-Admin role holds the activity, and show who currently approves. Use the same "holds the activity" test as the database, not a card-only test, or an extra will disagree with the refusal.
- **Update** the `add_photos` comment in `cards.ts` that names Management.
- **Tests:** the refusals are covered by the rolled-back harness at the end of `scripts/check-cards-schema.mjs`. Add the screen's own check to `check-home-cards.mjs`.

## What I did not do

- No card, no UI, no manual or release-note text, no backlog tick.
- Did not give the Approve photos card to any role (Lutan's step).
- Did not read `requiresCardSomewhere` anywhere in app code.
- No down-migration: re-applying `0194`'s function body restores the old behaviour, and nothing else depends on the new one.

## Production

Apply `0221` with the release. It only adds refusals; no data moves, and no code reads it yet.
