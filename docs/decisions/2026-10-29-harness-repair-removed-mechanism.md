# Harness repair, removed-mechanism rows: eight resolved, the rest named (2026-10-29)

Stream `harness-repair-removed-mechanism`. Dev server up first (`preview_start` name `dev`, port **3006**, `200` from `/`), every check run from the repo root against the **dev** database (`qxkmhwybjggxvsfxsxbd`). Triage and the two earlier harness decisions (`2026-10-29-harness-restate-permission-checks`, `2026-10-29-harness-rerun-server-rows`) were read first; none of the rows below was already closed by them.

## Fair count of the non-diet "A / ?" rows (17 run): 1 green, 16 red

`dead-schema-drop` was **green, never broken** (the triage red was a deadlock from six checks at once). The other sixteen were red.

## Resolved (8 rows; cap was ten)

| row | outcome | reason |
|---|---|---|
| `dead-schema-drop` | **Green, never broken** | passes alone, exit 0 |
| `contact-visibility` | **Retired** | asserts the `doctor_contacts` view, dropped by `0259`. The address book's reads now follow the `contacts` card; `check-contact-address-fields` (restated 2026-10-29) is the card-shaped cover |
| `volunteer-narrowing` | **Retired** | asserts the `volunteer_contacts` view, dropped by `0259`, and a named-role narrowing that no longer exists. Same cover as above |
| `medical-card-reads-record` | **Retired** | calls `sees_all_residents()`, dropped by `0264`. The question it asked ("does a medical card read the resident record") is now answered by `resident.record` being in the card bundles; `check-home-cards` and `check-card-grants` read those bundles |
| `features-schema` | **Repaired** | hard-coded "28 cards" (there are 40) and demanded a `card_features` row for every card. `0255` says a card with no row is **Not yet sorted by design**, so a missing row was never a fault. Count now comes from `cards.ts`; a null feature or a stray row still fails |
| `home-cards` | **Repaired** | `approve_photos` includes View residents, so its grant is that card's bundle plus publish and manage. The expectation is now derived, not a fixed three-cell list |
| `assistant-refused-client` | **Restated** | signed in a throwaway `volunteer`; now `giveCards(["assistant"])` (the card carrying `assistant.ask`), cleaned up afterwards. Same six assertions, all pass |
| `card-grants` | **Genuinely red, app fault filed** | `card_grants` carries four rows `cards.ts` lacks (`add_medical_photos`, `medical_records`, `view_medical` on `photos.resident_medical`; `medical_records` on `photos.medical_add`), from `0276`/`0279`. The check is right. Filed as its own backlog item; not patched here. `scripts/check-card-grants.mjs` left red on purpose until `cards.ts` and the seed agree |

## Left, and why (not silently dropped)

`unit-conversions` (a duplicate row on dev blocks its unique index; diet-model adjacent), and the nine fixtures that sign in on a named role and run raw SQL as it: `stocktake` (304 lines, five principals, diet tables), `resident-microchip`, `prescription-visit-not-future`, `placement-guards`, `audit-log`, `adoption-updates`, `medical-archive-roles`, `donation-receipts-schema`. Each needs its governing card read from the RPC body and the fixture rewritten; that is a restate per check, not a sweep. They stay red and are named on the backlog item. `check-activity-lists.mjs` not touched; none of the retired scripts was allow-listed there.

## Not touched
Six diet harnesses, `phone-width`, `menu-coverage`, `check-production`, migrations, `docs/card-access-faults.md`. No role is named in any conclusion above except as the old fixture being replaced.
