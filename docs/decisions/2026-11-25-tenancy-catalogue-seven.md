# #tnycl: the seven product-console definer functions, re-owned or listed (2026-11-25)

`0436` and `0438` left seven `product_admin_*` definer functions owned by `postgres` (BYPASSRLS) with no `ALLOWED` entry. The brief's
test was "does it read `auth.users`?". **That test was not enough**, and measuring on dev showed why.

| Function | Reads `auth.users`? | Reads | Fate |
|---|---|---|---|
| `product_admin_set_shelter_site` | no | `public.shelters` (writes it); sets the shelter header itself | **re-owned to `rls_definer`** (`0440`) |
| `product_admin_shelter_access` | **yes** (left join, email) | `user_roles`, `roles`, `auth.users` | stays `postgres`, `ALLOWED` |
| `product_admin_access_add` | **yes** (email lookup) | `auth.users`, `roles`, `user_roles` | stays `postgres`, `ALLOWED` |
| `product_admin_shelter_roles` | no | `public.roles` | stays `postgres`, `ALLOWED` (tenant filter) |
| `product_admin_access_would_lock_out` | no | `user_roles`, `roles` | stays `postgres`, `ALLOWED` (tenant filter) |
| `product_admin_access_set_role` | no | `roles`, `user_roles` | stays `postgres`, `ALLOWED` (tenant filter) |
| `product_admin_access_remove` | no | `user_roles` | stays `postgres`, `ALLOWED` (tenant filter) |

**Why the four non-`auth.users` readers could not be re-owned.** `rls_definer` is a member of `authenticated` (`0375`), so the restrictive
`shelter_scope_select` policy on `roles` and `user_roles` applies to it, and that policy shows only rows of the shelter in the request header.
The console's header names its own shelter, and the readers set no header for `p_shelter` (the writers `0414`/`0436` do). Re-owned, they see
nothing for any other shelter. Measured on dev, same transaction, an aal2 product administrator: `shelter_roles` returned **0 rows under
`rls_definer`, 1 under `postgres`**, and `access_set_role` failed with `no such role in this shelter` under `rls_definer`, passed under `postgres`.
Fixing it means setting the header in each body, which the brief forbids ("do not change any function's body"), so it is a follow-up.

**The harness did not see this.** `regress-tenancy-reown.mjs --harness` reported `DIFFERENCES: 0` for the five-function version, because it
snapshots zero-argument functions only. It is the wrong instrument for an argument-taking definer; the rolled-back exercise was the proof.

**Exercised on dev** (rolled-back transaction, product administrator with aal2): all seven answered; `set_shelter_site` ran under `rls_definer`
and wrote nothing observable (same value). `check-tenancy-catalogue.mjs --tenant-role rls_definer`: 0 flagged, 9 allowed, 0 stale.
Not exercised: the console screens in a browser (the DB-level call is the same code path), and production.
Migration numbering: `0439` was taken by `my-shelters-blank`; the first draft of this migration was applied to dev as `0439_..._three`, forgotten
with `--forget` and replaced by `0440`. Two migrations in one batch is the planner's decision: a security re-own and a chooser rewrite are unrelated.
Dev's `0439` stale ledger row is gone; the four functions the first draft moved were put back to `postgres` by hand on dev.
