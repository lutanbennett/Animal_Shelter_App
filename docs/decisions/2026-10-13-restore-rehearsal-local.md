# Restore rehearsal: done locally, and what that leaves unproved

2026-10-13, `claude/restore-rehearsal`. Backlog: *Rehearse a restore from a production backup*.

## Why a local PostgreSQL server rather than a Supabase project

The item asks for a restore into a scratch Supabase project. Lutan was offered
three targets and chose the laptop's own PostgreSQL 17, for three reasons: it
costs nothing, both of the organisation's free Supabase projects are in use
(dev and production), and nothing leaves the machine. A third project would
mean a paid plan, which the zero-cost rule excludes.

## What the local rehearsal proves, and what it does not

**Proved:** a production backup decrypts with the key Lutan holds, restores
with only two known-harmless errors, and every table, row, view, function,
access policy and trigger in the archive comes back. Rows are compared table
by table with the counts inside the archive, not with an expectation. This also
proves the Pi's backups are encrypted to the key Lutan actually holds.

**Not proved:** that a Supabase project comes back. Roles, ownership, grants,
Supabase's own `auth` set-up, `session_replication_role` permission for the
`postgres` user, and signing in exist only on Supabase. The rehearsal creates
empty stand-in roles so the dump's policies resolve, and restores with
`--no-owner --no-privileges`, which throws exactly that information away. The
Supabase half is a separate backlog item.

## What it found

1. **`backup.mjs` never backed up the `private` schema.** `private` holds no
   rows, only six views and a few functions moved there by `0082` and `0086`,
   but about fifteen `public` views and four policies are built on them. A
   restore of any backup made before this branch returns every record and
   38 errors, with `resident_current_state` and its dependents missing. Fixed
   by adding `private` to `SCHEMAS`. A fresh production backup taken with the
   fix (with Lutan's permission, `--local`, not uploaded) restores clean. The
   Pi runs released code, so its nightly backups include `private` only from
   the next release.
2. **The Supabase recipe ran in the wrong order.** Restoring `public` before
   `auth`'s rows creates the twenty foreign keys to `auth.users` against an
   empty table. They fail, the rows still load, and the database is left
   without those checks: a quiet failure. Corrected to `auth` rows first,
   with `session_replication_role=replica` because `auth.identities` sorts
   before `auth.users` in the dump.
3. **`pg_restore --schema=X` restores the objects in X but never X itself**,
   so `private` must be created by hand on a fresh project.
4. The laptop's PostgreSQL had only `bin` and `lib` unpacked (as the README
   said was enough to back up). A server also needs `share`. Added from the
   same EDB 17.11 zip.

Items 2 and 3 were found by running the corrected recipe against a local
stand-in for a fresh Supabase project: `auth` restored schema-only first, so
its tables exist and are empty. That checks the order and the flags, not
Supabase.

## Why a script, not a README recipe

The quarterly repeat needs checks that a person will not do by hand.
`pg_restore` exits 1 on every good restore of these dumps, so its exit status
tells you nothing. `scripts/restore-rehearsal.mjs` decrypts in memory and
pipes into `pg_restore`, so no plaintext dump is written. It then compares
every count against the archive, accepts only the two known errors, and
deletes the scratch server whatever the result. Lutan ran it himself on
2026-10-13 and it passed. Run against the pre-fix backup, it fails and names
the missing objects, which is the behaviour wanted.

## No dev rehearsal first

The brief asked for a dev dump first. The dev database password is not stored
on the laptop, and Lutan chose to skip resetting it: every step was run
privately on the production dump before being shown to him, and all of it
happened on the laptop.
