# Harness restate: the last nine removed-mechanism rows, plus phone-width progress (2026-10-29)

Stream `harness-restate-nine`, finishing what `2026-10-29-harness-repair-removed-mechanism.md` (#1074) named. Dev server up first (`preview_start` name `dev`, port **3002**), every check run from the repo root against the **dev** database (`qxkmhwybjggxvsfxsxbd`), one at a time under `timeout 60`.

## Fair count: 9 run, 0 green at the start, 9 green at the end

All nine were genuinely red before the change, none of them because a server was missing (they talk to the database, not the app). Every one fails for the same family of reason: a fixture that signs in on a **named role** or that **replays an old migration** onto a schema that has moved on. Each is now stated by **cell** (the activity a policy or function actually asks, read from the live `pg_policies` / function body), using throwaway roles holding exactly those cells. Admin signs in as itself and holds no cards.

| row | cause | what it asks now |
|---|---|---|
| `unit-conversions` | **A harness fault, not a dev data fault.** The check replayed 0118, whose one-per-diet-type unique index (`item_unit_conversions_diet_type_purchase_key`) 0199 dropped on purpose; dev legitimately holds several rows for one diet type. Production was never the problem. No dev row was removed. Replaying also failed on `diet_types.daily_qty_*` (dropped by 0239) | stops replaying; tests the live schema. Writes ask `stock.diets`; reads and `record_stocktake` ask `stock.count` |
| `stocktake` | principals were named roles; the guard is `stock.count` | two logins holding `stock.count`, one holding an unrelated cell, a role-less login, anon |
| `resident-microchip` | `set_resident_microchip()` now asks `resident.microchip` only. The clinic scope it used to test (own vs other clinic, unlinked doctor) **is gone**, so those assertions are retired with this reason | holders write and clear; a holder on a deceased resident, malformed, duplicate and non-holders are refused |
| `prescription-visit-not-future` | signed in as a named role | holds `medical.prescriptions` + `medical.visits` (the insert/update and the visit-move door) |
| `placement-guards` | named roles; the insert policy asks a cell **per placement type**, update asks `resident.record` | the mover holds `placement.move`, `placement.hospital`, `placement.rehome`, `placement.death`, `resident.record`; the refused login holds one unrelated cell |
| `audit-log` | named roles | writer holds `resident.record` and the `photos.resident_*` cells the attachment policy asks; two logins hold one unrelated cell and read nothing; Admin reads the log |
| `adoption-updates` | named roles; also asserted the 0108 clinic scope, which 0264 removed | writer holds `resident.adoption_news` + the photo cells; others hold nothing relevant. The doctor-outside-scope case is now just "a login without the cell" |
| `medical-archive-roles` | **Renamed `check-medical-archive-card.mjs`** (its name carried the role problem). The own-clinic / other-clinic split is retired with the clinic scope | archiver = `medical.archive` + the four edit cells; editor = the edit cells without `medical.archive` (refused by the 0187 trigger on all four tables); a third login holds neither |
| `donation-receipts-schema` | found the "management" and "2IC" logins by **role key on real accounts**, so the answer depended on which real login held which card that day | makes its own throwaway logins: one holding `donation.receipt`, one holding an unrelated cell. 82 assertions held |

## One finding about method

Three of these checks quietly relied on a real person's login. Those are the ones to distrust: they pass or fail on data nobody wrote down.

## `check-phone-width.mjs`: progress only

Prints the planned size first, then one line per page view as it is measured (`[n/N] role locale path -> outcome`, always, not behind `--verbose`), and per public page. `N` grows as each login's own nav links are found, and says so. New `--no-public` skips the signed-out pass (there was `--public-only` but no inverse, so `--pages` could not go below ~20 page views). A header note says an unnarrowed run must be backgrounded with output redirected. Nothing it measures changed; the matrix is not narrowed and not card-shaped (layout, outside the card rule). Proven by the narrowed run `--roles=admin --locales=en --pages=/clinics,/enclosures,/residents,/home --no-public`, which completed in under two minutes and exited 0.

## Not touched
Diet-family harnesses, `scripts/lib/`, menu-coverage, check-production, migrations. No app code. `scripts/lib/old-role-shim.mjs` is no longer imported by `check-unit-conversions`; other replaying harnesses still use it.
