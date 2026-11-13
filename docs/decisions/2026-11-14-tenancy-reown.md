# Re-own the owner-run views and definer functions to `rls_definer` (2026-11-14)

Backlog `#ykefa`, one part of it (hardening that must ship with multi-tenancy, built early so it is already proved). Migration
`0375_reown_definers.sql`; instrument `scripts/check-tenancy-catalogue.mjs`; proof `scripts/regress-tenancy-reown.mjs`.
"Role" below always means a **Postgres** role, never an app role; nothing here touches cards or permissions.

## Step zero

- **`create role` works on dev today** through the Management API, which is the path `apply-migrations.mjs` uses: connected as
  `postgres` with `rolcreaterole`, `begin; create role zz_probe_definer nologin inherit nobypassrls; …; rollback;` returned
  `rolbypassrls=false`. The 2026-11-13 `42501` was a different path (the lint's rollback harness); this one is not refused.
- No `shelter_id` column and no `shelters` table exist; the gap was open. `grep "create role" supabase/migrations/` returned nothing
  before this: 0375 is the first migration to create a role.

## Measured counts (dev `qxkmhwybjggxvsfxsxbd`)

Before: 107 flagged (47 views, 60 functions). After the apply: **0 flagged, 2 allowed by name, 0 stale**
(`check-tenancy-catalogue.mjs --env test --strict --tenant-role rls_definer` exits 0).

## The role: `rls_definer`

`nologin inherit nobypassrls nosuperuser nocreatedb nocreaterole noreplication`, member of `authenticated` (that inheritance is how
definer code reaches `auth.uid()`/`auth.jwt()`), granted to `postgres` so it can hand objects over. Name chosen because it says what
the identity *is for*: owner-run code that still obeys row-level security. `app_*` was rejected (collides with the app's own
"role" vocabulary) and `spike_definer` was a harness name. A code decision, not a product one.

## Survivors on the allow-list (stay `postgres`-owned), with the reason

- `view:private.app_users`: already recorded (joins `auth.users`).
- `function:public.login_display_name`: reads `auth.users`.
- `function:public.label_translations`: **found by the regression proof, not predicted.** First harness run showed
  `admin:label_translations()` go from 879 rows to `ERR 42501 permission denied for table users`. Added to the allow-list and to the
  migration's exclusion; second run clean.
Both functions must take the tenant filter by hand when the tenancy build lands, as `app_users` does.

## The regression proof (deliverable 4)

`scripts/regress-tenancy-reown.mjs`: for **90 objects** (67 readable by a Lanna admin, 23 by anon: views, materialised views,
anon-readable tables, and the 12 zero-argument stable definer functions each can call), hash count + md5 of the whole output
before and after. **Rolled-back harness: 0 differences. Real apply on dev: 0 differences.** How I know it read something: 61 of the
90 returned rows, **1,575 rows hashed**; 0 objects errored before or after, and the harness was seen to FAIL once (the
`label_translations` case above), so a blind pass is not what it prints. **Limit, stated plainly:** definer functions that take
arguments or write cannot be exercised generically, so they are proved only by the lint (owner) and by `check-public-views.mjs`,
not by output. `check-public-views.mjs` output before and after is identical. The ×2.3 sweep-time cost the spike measured was **not
re-measured** here.
Planted/changed on dev: nothing planted; the snapshot runs inside `begin; … rollback;`.

## Answers to the four open questions

1. **Name and attributes:** above.
2. **One migration or two:** **one.** The policies, grants and re-own are one atomic idea, a failure in the second half must not
   leave a role with policies and no owners, and as one file `--dry-run` validates it end to end (it did, `ok`).
3. **An object added later:** Postgres cannot default an owner, so a new view or definer function silently comes back as
   `postgres`-owned. 0375 also sets `alter default privileges … to rls_definer` so a *new* re-owned object fails loudly, not blank.
   **How it is caught: by hand, by running `node scripts/check-tenancy-catalogue.mjs --env <env> --strict --tenant-role rls_definer`
   at release time**; it is not in CI (no token, by an earlier decision) and I did not invent a mechanism. It should be written into
   `docs/release-procedure.md`, which is the planner's/release manager's to edit. A new RLS table also needs its `definer_all`
   policy: re-running 0375's policy loop does that (it is re-runnable). *For the planner to file:* a lint rule for "RLS table with no
   `definer_all` policy".
4. **Does `apply-migrations.mjs` survive an ownership change:** yes; it ran 0375 and recorded it (`376 applied` → 377). It does not
   run as any re-owned object. `check-migration-grants.mjs` is run before merge (see the PR).

## Applied to dev at

**2026-11-13 23:40:37Z to 23:40:44Z (06:40 Thai, 2026-11-14).** A sudden new failure in a card check after this time may be this.

## Rollback (production or dev)

Run as `postgres`:

```sql
do $$ declare r record; begin
  for r in select n.nspname, c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where c.relkind in ('v','m') and pg_get_userbyid(c.relowner) = 'rls_definer'
  loop execute format('alter %s %I.%I owner to postgres', case r.relkind when 'm' then 'materialized view' else 'view' end, r.nspname, r.relname); end loop;
  for r in select p.oid::regprocedure f from pg_proc p where pg_get_userbyid(p.proowner) = 'rls_definer'
  loop execute format('alter function %s owner to postgres', r.f); end loop;
end $$;
alter default privileges for role postgres in schema public revoke select, insert, update, delete on tables from rls_definer;
alter default privileges for role postgres in schema public revoke usage, select on sequences from rls_definer;
alter default privileges for role postgres in schema public revoke execute on functions from rls_definer;
drop owned by rls_definer;   -- drops its definer_all policies and grants
drop role rls_definer;
```

Re-owning back to `postgres` restores exactly the old behaviour (everything was `postgres`-owned), so the website cannot stay blank.
Production is **not** applied by this PR.
