# From-zero rehearsal, and the schema-drift check

2026-10-22, stream `production-rehearsal`. Source: `docs/database-review-2026-10-13.md`, F1.

## What was run

A throwaway free-tier Supabase project (empty, disposable) had every migration
applied in order from `0001`, then `main`'s `0246` after it merged: **247 files, 247
`ok`, no SQL error.** `0159` updated nothing on the empty project, as expected, and
`0173` could not trip.

`scripts/check-schema-drift.mjs` then compared `information_schema.columns`
(public schema: type, nullability, default) dev vs the rebuilt project:
**1354 columns each, no differences.** The two hand-edited columns the item started
from (`immunization_types.interval_months`, `zones.internal`) agree, so `0213` did
its job. One difference showed first (`role_groups.name_th`); it was only that the
rebuilt project lacked `0246` yet, and vanished once applied.

**So production can be rebuilt from the files, at column level.** Views, functions,
policies and grants are not compared by the script.

## What the drift check compares, and does not

Columns only, read-only, `schema_migrations` excluded. Run it after the cutover:
`node scripts/check-schema-drift.mjs --env production --against-env test`. A project
under a different Supabase account needs `REHEARSAL_SUPABASE_ACCESS_TOKEN` in
`.env.local` for the `--against` side. It complements `apply-migrations --drift`,
which compares which files ran, not what they produced.

## Findings (written down, not fixed here)

1. **`apply-migrations.mjs` refuses the full history.** Its grants check flags 57
   objects and 32 findings in early files (`0059`, `0060`, `0063`..`0076` and others
   that predate the 2026-09-24 grants rule) and has no bypass, so nothing applies.
   This rehearsal ran a temporary copy with that one `if` disabled. A real rebuild
   needs a deliberate flag (e.g. `--all-history`), or the check limited to files
   newer than a cut-off. Whether those early objects end up with the right grants
   was **not** checked; the drift script does not see grants.
2. **`import-appsheet.mjs` cannot load into a from-zero project.** In order:
   - It stops with `no active admin in user_roles` until `scripts/bootstrap-admin.mjs`
     has run. Cutover steps must say so.
   - After a fake admin was created, the dry-run failed in the load:
     `Foster placement cannot target the Lifecycle pseudo-enclosure "Unassigned"`
     (`check_placement_lifecycle_target`, `0119`). The importer predates that guard.
   - The same dry-run against dev could not confirm it: dev already holds 99
     residents, and `--replace --dry-run` fails earlier on a row still referenced
     from `appeals`.
   Net: **the import has not been proved against today's schema.** It needs its own
   stream before the real import.

## Not done

No migration or app code was changed. The backlog item is **not ticked**: the
rehearsal and drift script are done, the import dry-run is not.
