# The export proof's empty database is built from the catalogue, and what that does and does not show (#expgp)

2026-11-18. Gap two of `#expgp`. Gap one (staff logins) was answered by Lutan on 2026-11-17: data only. Not re-opened.

**Decision: keep the catalogue rebuild. It is sufficient for what the proof claims, and the limit is recorded here.**

## What the catalogue rebuild proves (checkable)
- Every `insert` the export writes names its columns (`insertSql`, `scripts/lib/shelter-export.mjs`), so the load does not depend on column order. The proof's `schemaSql()` reads columns, enums, primary keys, uniques and public-to-public foreign keys from the live source, so a table or column the export reads is always one the proof creates.
- Row counts, "no row of another shelter", and "every foreign key resolves" are all measured after the load (`--prove`).

## What it does NOT show (the honest limit)
A migration-built database also has triggers, column defaults, RLS and functions. The proof's database has none. So the proof does not show that **a trigger firing during the load would leave rows unchanged**. The cycle group already loads with `session_replication_role = replica`; the other tables do not.

## Why a migrations-built proof was not built
It needs Supabase's `auth`/`storage` stand-ins and a database password dev does not give this machine. Extending `restore-rehearsal.mjs`'s stand-ins is possible but is a larger job than the risk justifies today: the export is a **data-only exit** and is not the disaster-recovery path (that is the encrypted backup, rehearsed by `restore-rehearsal.mjs`).

## Next reader
Loading an export into a real new installation should set `session_replication_role = replica` for the whole load, or the loader should diff row counts afterwards. If a migrations-built proof is ever wanted, start from `restore-rehearsal.mjs`.
