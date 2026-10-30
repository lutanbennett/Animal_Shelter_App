# Record a death folded into Manage medical (0282, schema half)

Lutan, 2026-10-29: *"B, fold it into the medical card."* Option A (a resident picker page) is not built.

**What 0282 does.** `placement.death` at edit joins the `medical_records` bundle in `card_grants`. The `record_death` card is **deleted**
(its `role_cards`, `card_grants`, `card_includes` and `card_features` rows), not left empty: a card that grants nothing is forbidden by the
card rule. This is the shape of 0268's retirements. No role is given a card; Admin is untouched.

**Enclosure invariant.** `facility.enclosures` at read still arrives for `medical_records` through `view_medical` -> `view_residents`.
`check-production.mjs card-lifecycle-enclosures --env test`: *Every card that grants a placement activity also grants facility.enclosures at read.*

**Proved on dev in a `begin … rollback` harness** (disposable roles): a login holding exactly `medical_records` gets `placement.death` at
edit (2) and `facility.enclosures` at read or better; a login holding exactly `record_death` gets 0 activities; no `record_death` rows remain
in any of the four tables. Not asserted by the harness: Admin, which `has_permission()` answers by `key = 'admin'` before reading any cell;
0282 does not touch that function.

**Left red on purpose.** `check-card-grants.mjs` against dev reports `card_grants differs from cards.ts` (missing `record_death|placement.death`,
extra `medical_records|placement.death`) until the app half edits `cards.ts`. It cannot run in CI, so no PR turns red meanwhile.

## The two investigations

1. **Could a login holding only `record_death` open the death form?** By reading the code, yes. `/residents/[id]/deceased` calls
   `requireFullResident()`, which asks `resident.record` at read; `record_death` includes `view_residents`, which grants exactly that. So the
   card was not inert, and retirement is justified by Lutan's decision, not by the card doing nothing. **Not driven live:** the card was deleted
   from dev by this migration, so `dev-signin --cards record_death` can no longer be tested; the claim rests on the card definition in `cards.ts`.
2. **Edit controls shown on `/residents` to that one-card login: NOT ESTABLISHED.** Not driven, for the same reason. The app half should drive
   `/residents` with `--cards medical_records` (which inherits `view_residents`) and list every edit control that card cannot perform; any is a
   buttons-follow-cards fault. Nothing filed yet, because nothing has been found.

## Consequence (transient, measured by the planner on production 2026-10-29)
`record_death` is held by two roles and `medical_records` by one role with no users. Lutan chose to proceed and assigns the cards himself in
Settings -> Who does what in the same release. No fallback, no card given by this change.

## Still to do (the app half, next batch)
Remove `record_death` from `cards.ts`, the catalogue, the card walkthrough and the manual; add `placement.death` to the `medical_records`
bundle there so `check-card-grants.mjs` goes green; run the card-shaped drive in investigation 2. The backlog item stays open.
