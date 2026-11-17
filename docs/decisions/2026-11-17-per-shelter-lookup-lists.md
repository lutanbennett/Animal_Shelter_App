# Seven lookup lists become per-shelter (`#lklst`, migration 0402)

**All seven get the same answer: a `shelter_id` column.** `bill_kinds`, `blood_test_types`, `immunization_types`, `procedure_types`, `frequency`, `units`, `group_origins`.

## Why none stayed shared
- `immunization_types.cost` is a price; one shelter's. That alone settles it for that table.
- `units` and `frequency` looked like they might be universal, but each is an editable admin list (`/admin/units`, `frequency` is the dosing vocabulary a shelter picks from) with a name the shelter chooses; shelter two renaming "tablet" would rename it for shelter one. Nothing treats the lists as a closed set: no check, seed or fixture enumerates their rows (grepped `src`, `worker`, `scripts`), and the only `on conflict` uses are in old seed migrations that ran before this file.
- The other twelve registry tables remain installation-owned and are untouched.

## What 0402 does (the 0390 + 0397 pattern)
1. Adds `shelter_id` with `current_shelter_id()` as default.
2. Stamps today's rows **Lanna by an explicit named statement** (user triggers off for the update), then refuses to continue if any row is still null, then `NOT NULL`. There is no state in which these seven have a nullable `shelter_id`.
3. Enables RLS and creates 0392's three restrictive `shelter_scope_*` policies (select/update/delete). Inserts take the header's shelter by default.
4. **Unique keys become per shelter**: `(shelter_id, key|name|label)`, and `(shelter_id, lower(btrim(name)))` for units. Without this a second shelter could not have its own "Rabies".

## What scopes each list now
The restrictive policies filter every API read and write; app code is unchanged because every insert is request-scoped and picks up the default. Service-role writers are trusted callers and write with an explicit shelter or the header.

## Registry and export
The seven were removed from both `tables` and `exportTreatment` in `docs/tenancy-shared-tables-registry.json`, in this PR (otherwise the nightly check would report them STALE). `scripts/shelter-export.mjs` derives scoped tables from the live column, so the export now takes only the shelter's own rows of the seven with no code change; its `--prove` re-import was re-run.

## Proof
Inside a rolled-back harness on dev: a second shelter holds its own `Rabies` at cost 999 beside Lanna's at 250 (same name accepted); an Admin session scoped to shelter one saw 0 of shelter two's rows, edited 0, and shelter two's cost stayed 999 while Lanna's stayed 250. The mirror case (shelter two editing) could not be driven from a session: no login holds permissions in a second shelter yet, and a Lanna Admin sees nothing under shelter two's header, which is the same filter from the other side.
