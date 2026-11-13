# The tenancy catalogue lint, built against today's tree (2026-11-13)

Stream `tenancy-catalogue-lint`, one part of `#ykefa`. **It reports and changes nothing**: no migration, no re-owning,
no policy, no `shelter_id`. Nothing in `#ykefa` is ticked.

## Step zero

Tenancy has **not** started: no `shelter_id` anywhere in `supabase/migrations/`, no `shelters` table.

**The spike's counts (2026-10-09) no longer hold.** Measured on dev `qxkmhwybjggxvsfxsxbd`, 2026-11-13:

| | spike | dev today |
|---|---|---|
| views (public + private schemas) | 58 (51 in the build) | 62 |
| views not `security_invoker` (owner-run) | 38–39 | **53** (9 are invoker) |
| `security definer` functions | 53 / 58 | **92** (60 executable by anon or authenticated) |
| `public_*` views anon can select | 13 | **23** |

The re-own the next stream does is therefore bigger than the spike priced: roughly 53 views and 92 functions, not 38 and 58.

## What was built

`scripts/check-tenancy-catalogue.mjs`, with its rules in `scripts/lib/tenancy-catalogue.mjs` (pure, unit-tested in
`scripts/check-tenancy-catalogue.test.mjs`). **A new script, not an extension of `check-public-views.mjs`**: that one
asks the API what anon can do and uses only the service key; ownership lives in `pg_catalog`, which PostgREST does not
expose, so this needs the Management API. Mixing the two would have made the CI check depend on a token CI lacks.

1. Every view that anon or authenticated can `select` (and whose schema they can use) is `security_invoker` or owned by the tenant role.
2. Every `security definer` function they can execute is owned by the tenant role.
3. The allow-list is by name with a reason, as in `check-thai-dictionary.mjs`; an entry whose object no longer exists is reported STALE.

The tenant role does not exist yet, so `--tenant-role <role>` is how the re-own stream names it.

## Allow-list's first entry

`view:private.app_users`: it joins `auth.users` (RLS on, no policies, and `postgres` cannot add one because Supabase owns
`auth`), so a re-owned role reads 0 rows. It stays `postgres`-owned and takes the tenant filter by hand in its join
(spike, "What fought back" 2). **Today it is not API-reachable** (`private` schema), so it would not be flagged anyway; the entry is
there so the day it is, or the day re-own lands, the exception is already a named record.
The spike's `current_shelter_id()` and `is_trusted_caller()` do not exist yet; they are added with the tenancy columns.

## False-positive measurement (dev, 2026-11-13)

Flags **107**: 47 views and 60 functions. Each is a **true positive by construction**: every flagged object is
`postgres`-owned (the only owner in the catalogue) and, today, no tenant role exists, so each *is* a BYPASSRLS object.
None is a false positive in the sense of misreading the catalogue, but **none is a defect today either**: there is one
tenant. They are the re-own stream's worklist. (The brief's 38/58 vs the lint's 47/60 differ because the lint counts only
API-reachable objects; owner-run views in total are 53.)

## Proof it fires (rollback harness on dev, nothing kept)

One `begin; …` transaction created four objects, read the catalogue with the lint's own SQL, then ended with
`raise exception 'HARNESS-OK …'` so nothing committed:

- `zz_lint_bad_view` (owner-run, granted to anon) and `zz_lint_bad_fn` (security definer, executable by authenticated): **both flagged**.
- Negative controls `zz_lint_ok_view` (`security_invoker=true`) and `zz_lint_ok_fn` (security invoker): **not flagged**.

The tenant-role-passes case was tried in the harness but dev refused `create role` (42501), so it is covered by the unit
test only. **Planted on shared dev: nothing persisted**, because the transaction aborts; a re-run of the lint afterwards
still read 107 flags and no `zz_lint_*` object.

## Report-only, not blocking

**Report-only.** It flags 107 on the real tree, all expected, so blocking it now would turn every build red for work
that is the next stream's. It says `REPORT-ONLY: this does not fail the build.` in its output. `--strict` exits 1 and is for
`tenancy-reown` to use once a tenant role exists, at which point the target is zero flags.
If it cannot read the catalogue (no token, empty answer) it exits 2 with `NOT CHECKED`, never a clean pass.

## CI: not wired, and why

`public-views` reaches the test project with its URL, anon key and service-role key. None of those can read
`pg_class`/`pg_proc` ownership; that needs `SUPABASE_ACCESS_TOKEN`, which CI does not hold. Wiring a job without it would
check nothing, the outcome the brief calls worst. So **it is a script someone runs**: `node scripts/check-tenancy-catalogue.mjs --env test`.
Giving CI the token is a separate decision about a secret, not taken here.
