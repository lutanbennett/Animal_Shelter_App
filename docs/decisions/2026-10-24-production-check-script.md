# The read-only production check script (2026-10-24)

Built from `2026-10-24-read-only-production-checks.md` (Lutan: "Yes keep the read only production check script").

`node scripts/check-production.mjs` lists the checks; `<name>` or `all` runs them against production. `--env test` runs them on dev.
Five checks: `schema-version`, `role-cells`, `role-cards`, `doctor-cells`, `diets-proportion`.

## How read-only is guaranteed (check it in under a minute)

Open `scripts/lib/readonly-checks.mjs`. It is the only file that sends a query.

1. **No SQL comes in from outside.** The script takes a check *name*; the SQL is the fixed text in that file. An unknown name is refused (`constructor` too).
2. **Every query is wrapped in `begin read only; … rollback;`.** Postgres itself then refuses any insert, update, delete or DDL, even from inside a function. Proved on dev on 2026-10-24: an `update` in that wrapper returned `cannot execute UPDATE in a read-only transaction`.
3. **A lint refuses any check that is not one SELECT** (no `;`, no write keyword). `scripts/check-production.test.mjs` runs it over every entry and over known-bad statements, so a bad check fails `npm test`.

## Why the existing guards were left alone

The `is not the dev project` lines in ~130 scripts, including all eight doctor/medical ones, are untouched and still refuse production. A new script with a fixed list is a different thing from relaxing each of them, which would make a deliberate boundary depend on which script someone edited last.

## What it does not change

No migration, no deploy, nothing in CI (a scheduled job reading live data is a separate decision). The production Worker deploy stays Lutan's. Results are counts, role keys, card names and diet names, never residents or people.

## What it answered on production, 2026-10-24

- `0.40.0`: the doctor role holds all 13 cells from `0230`. It now has 5 cards and 9 extras, so a Doctor card has been saved since, and the cells survived.
- `0.39.5`: no role holds a card named for Operations or Management (see `role-cards` output in the PR).
- `0.39.4`: no diet line on production is out of proportion today. That does not say which diets `0250`'s back-fill touched; that part stays not established.
