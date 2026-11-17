# Tenancy: the 29 tables `0392` skipped, each judged (#tnc10)

**Status: built and applied to dev 2026-11-17 (`0396`). In no release yet.**

**Step zero:** none of the ten had a `shelter_id` column; nothing already built. **`diet_types` answer: it gains the column.** `0395` correctly added none (`diet_types.is_standard` was dropped by `0243`), but nobody had asked whether the table holds one shelter's diets. It does, so it is scoped here.

## Judgement per table (29 skipped by `0392`)

**Gain `shelter_id`, backfilled to Lanna, default `current_shelter_id()`, and `0392`'s three policies re-run (`0396`), ten tables:**
`diet_ingredients`, `item_unit_conversions`, `merch_exchange_rates`, `donation_channels` (bank and PromptPay details), `community_places`, `diet_types`, `translations`, `label_drafts`, `label_sources` (mirror tenant rows by `(table_name, row_id)`), `calendar_sync_state` (a cursor per calendar, which a second shelter will own).
**`calendar_sync_state`:** went the column way, so `tenancy-part7-filters-2`'s registry entry for it may say a column is coming; it now exists. The call sites that write it still need the filter (their stream's, not edited here).

**Deliberately shared, 19, recorded with reasons in `docs/tenancy-shared-tables-registry.json`:** `shelters`, `schema_migrations`, the three `status_alert_*`, the card catalogue (`permission_activities`, `card_features`, `card_grants`, `card_includes`, `features`), `translatable_fields`, `translatable_labels`, and the seven lookup lists (`bill_kinds`, `blood_test_types`, `immunization_types`, `procedure_types`, `frequency`, `units`, `group_origins`).
**The seven lists are shared-for-now, not safe forever:** a column needs per-shelter values and possibly unique-constraint changes, and nobody owns a row in them yet (no leak today). The gap is that shelter two editing a value changes it for shelter one.

## The register covers all 29, not only the judged
The check lists every public table with no `shelter_id` and fails if one is not recorded, so a future table added with no column is caught. (Scoped tables need no record.) `node scripts/check-tenancy-shared-tables.mjs --env test` reads dev live: 105 scoped, 19 unscoped, 19 recorded.

## For the planner to file
- Seven lookup lists: per-shelter values (group c).
- `card_grants` / `card_includes` hold assignments: Part 10 (`#omt6u`), untouched.
- Wire the new check into CI / the nightly job (needs the dev token, so nightly like the catalogue lint, not the PR path).
- A `retention_runs` row with a null `shelter_id` appeared once in `check-null-shelter-id.mjs` and was gone on re-run: a headerless writer, Part 7's.

Not done: `NOT NULL`, INSERT policies, any `src/` call site.
