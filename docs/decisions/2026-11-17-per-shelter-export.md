# Per-shelter export (#sxyw3, part 11 of the tenancy programme)

**Why:** pooling every shelter in one database means a bad migration, a runaway query or a restore hits all of them,
and a shelter leaving has no database of its own to take. `scripts/shelter-export.mjs` is the answer to both:
one command exports one named shelter's rows and nothing else's, encrypted.

**Step zero:** neither `scripts/backup.mjs` nor `scripts/restore-rehearsal.mjs` is shelter-aware (the only "shelter" in
`backup.mjs` is its header comment). They are not changed. Encryption, "no plaintext mode" and pruning are untouched.

## How it works

- Reads through the Management API (the dev project has no database password on this machine, and `pg_dump` cannot filter
  rows anyway). Per table: a count, then pages of `to_jsonb` rows in `ctid` order; fetched must equal counted or it stops.
- Output is **data-only SQL**: `insert ... select from jsonb_populate_recordset(null::table, <json>)`, so every column keeps
  its own type. Built in memory and written only as age ciphertext (`.sql.age`). A new shelter's database gets its tables
  from the migrations, as any new database would.
- **Ordering:** parents before children, from the public-to-public foreign keys (Kahn's algorithm, self-references ignored).
  **Cycles:** any table left over is loaded last under `session_replication_role = replica` and then checked by an explicit
  orphan query. Dev has **no** cycles (0 of 121 tables), so that path is exercised only by the offline fixture.

## The three judgements

1. **The shared tables (the 19 in `docs/tenancy-shared-tables-registry.json`).** Recorded as `exportTreatment` in the
   registry, one of `all | own-row | none`, so a new shared table must make the choice or the check fails.
   - `all` (15): the seven shelter-chosen lookup lists (`bill_kinds`, `blood_test_types`, `immunization_types`,
     `procedure_types`, `frequency`, `units`, `group_origins`) because a shelter's rows point at them and the values are
     the shelter's; the card catalogue (`permission_activities`, `card_features`, `features`, `card_grants`,
     `card_includes`) and schema metadata (`translatable_fields`, `translatable_labels`, `schema_migrations`) because
     they are identical for every shelter and scoped rows depend on them, and `schema_migrations` records which schema
     the export was taken against. None of these names another shelter's people or animals.
   - `own-row` (1): `shelters`, only the named shelter's row (the foreign key target of every scoped table).
   - `none` (3): `status_alert_*`, installation monitoring that no shelter owns.
   - **Known gap, not new:** the seven lookup lists are still shared, so another shelter's edit to one is in this
     shelter's export and vice versa. That is the registry's own recorded gap (a column plus per-shelter values), for the
     planner to file; nothing here widens it.
2. **A row with a null `shelter_id`: refuse and name the table and count.** Dropping it loses data and including it leaks;
   the operator who can tell whose it is must say. Proved on dev: `retention_runs` had one such row (from a headerless
   writer) and the first run refused, naming it. I then gave that row to Lanna so the proof could run.
3. **How the check asserts it:** offline. `scripts/check-shelter-export.mjs` runs the real planning code against a fixture
   catalogue (parent/child, a cycle, each treatment) and the real registry, and fails if a scoped table is read without
   `shelter_id = '<shelter>'`, a `none` table is read, a parent loads after its child, a null-shelter look-up is missing,
   the registry lacks a treatment, or the CLI builds a filter of its own. It cannot know the live schema matches the
   fixture; that is what `--prove` is for, which needs a dev database with a second shelter and a local PostgreSQL 17.
   It was shown to fail by breaking the filter to `true`.

## Left, and what is not proved

- **`auth.users` is not exported.** 101 foreign keys from public tables point at it. A login belongs to the installation,
  not a shelter, and its password hashes should not travel in a shelter's export; the importing side recreates logins.
  A shelter that needs its staff accounts carried across is a separate item (for the planner to file).
- The proof's empty database gets its structure rebuilt from the source catalogue (columns, primary/unique keys, public
  foreign keys), not from the migrations: dev has no database password here, so `pg_dump --schema-only` was unavailable,
  and the 397 migrations assume Supabase's own schemas. It proves rows, isolation and key resolution, not the migrations.
- Production was not touched and cannot be from a worktree; a production export is the operator's command.

## What was proved (dev, 2026-11-17)

Source: dev with Lanna (`lanna`) and a disposable second shelter `proof-b` (3 contacts, 2 residents, 2 clinic visits).
`node scripts/shelter-export.mjs --shelter lanna --prove`, loaded into an empty throwaway PostgreSQL 17 server, ephemeral
age key, nothing on disk:

- (a) 121 tables, 4590 rows: loaded count equals the source count for Lanna, table by table.
- (b) 0 rows with a different `shelter_id` in the 105 scoped tables; `shelters` holds 1 row. `proof-b`'s rows are absent.
- (c) 240 public-to-public foreign keys, 0 child rows without a parent. 101 keys to `auth.users` are out of scope (above).

The first two attempts failed for the script's own faults (a use-before-declare, a dropped connection); retries were added.
