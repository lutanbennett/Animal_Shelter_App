# 2026-10-19: restore drill into a real Supabase project

**Decision:** the backup-restore recipe in README "Backups" is now proved
against a real Supabase project, and corrected with what that took.

## What was run

A fresh production backup (`backup.mjs --env production --local`,
`lannacare-production-2026-10-19T0845Z.dump.age`, 1.26 MB, newest migration
0225) was decrypted with the held key and restored into a throwaway Supabase
project (ref `ffaqchioswdmloaclhxu`, session pooler, us-east-1). `restore-rehearsal.mjs`
passed locally on the same file first (100 tables, 6,458 rows).

## What it found

1. **`postgres` cannot set `session_replication_role` on Supabase.** The
   recipe's step 1 loaded `users` but `identities` failed its foreign key.
   Fix: restore `auth` `--table=users`, then `--table=identities`, as separate
   data-only calls.
2. `auth.schema_migrations` fails with permission denied: expected, harmless
   (Supabase owns it).
3. Step 3 logs about 493 errors, all `DROP … IF EXISTS` on things a fresh
   project does not have. Harmless; the README now says how to tell noise
   (failed DROP) from real (failed CREATE/COPY/ALTER/ADD CONSTRAINT).
4. It is slow over the internet (minutes for 1.26 MB); a 120 s timeout cuts it off.
5. Result: 82 public base tables, 53 views (public + private), 324 policies,
   304 residents, `schema_migrations` 226 rows, `auth.users` 5, identities 7.
6. **The open question is answered:** default privileges gave
   `anon`/`authenticated`/`service_role` access to all 82 public tables with
   no manual grants.
7. RLS behaved: a simulated staff user saw 304 residents and 304 rows of
   `resident_current_state`; anon saw 0; a user with an archived role saw 0.
8. A real password sign-in (`/auth/v1/token`, then `/rest/v1/residents`)
   returned 304 of 304. To do it, one password in the scratch project was set by
   hand.

## Consequences for a real disaster

- Restored password hashes are real people's, so nobody can sign in without
  knowing their old password: send password-reset emails to everyone.
  MFA/TOTP is not restored by design; everyone re-enrols.
- Connection-string traps: a password containing `@` is parsed badly; error
  messages can echo part of it (always redact); the database password is not
  the Supabase account password.

## Not covered

- `apply-migrations.mjs --status` was not run against the scratch project. The
  226-row `schema_migrations` matches the backup, nothing more.
- The app itself was not pointed at the scratch project.
- **Storage buckets and files are not in a `pg_dump`.** Uploaded files are a
  disaster-recovery gap with no backup path today.

No secrets, passwords or connection strings are recorded here.
