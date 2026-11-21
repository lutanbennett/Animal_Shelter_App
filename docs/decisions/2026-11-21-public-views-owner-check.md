# #m52yp: why public_site_content "leaked" at #1788, and the guard that was actually missing

**Status: measured on dev 2026-11-21. Ownership DOES scope a view. The #1788 reading was most likely a trusted-mode harness artefact.
One real gap (a new view nobody re-owns, on the PR path) is closed by `scripts/check-view-owners.mjs`, in `npm run lint`. No migration.**

## 2. The #1788 leak, explained
Four rolled-back experiments on dev (a throwaway view over `site_content`, `grant select … to anon`, `set local role anon`):

| Caller | Owner | No header | Header |
|---|---|---|---|
| **trusted** (no jwt claims, which is what the Management API and 0429's harness send) | rls_definer | 7 | – |
| **trusted** | postgres | 7 | – |
| **untrusted** (`request.jwt.claims = {"role":"anon"}`, what PostgREST sends) | rls_definer | **0** | **1** |
| **untrusted** | postgres | **7** | **7** |

- `is_trusted_caller()` (0383) is true when there are no jwt claims, and 0392's restrictive policy lets a trusted caller through. So a read
  made with no claims sees **every** row whatever the view's owner. 0430 says it measured "inside 0429's harness" with anon and no header:
  that is the **trusted** row. **The 6 rows at #1788 are explained by the harness, not by ownership failing**; `public_site_content` was
  `rls_definer`-owned all along (0375 re-owned it; `create or replace view` in 0429 and 0430 keeps the owner, which is also why the
  planner's doubt about the decision file was fair). I cannot prove what the owner was on 2026-11-20 (nothing recorded it), so "most likely".
- **Ownership is the thing that scopes**, so an owner guard guards the right property. The planner's hypothesis does not hold:
  `definer_all` (0382/0375) is on **every** tenant table (`site_content` has it), and `rls_definer` inherits `authenticated`, so the
  restrictive policy, which names `anon, authenticated`, does bind it. The 0430 filter is therefore belt and braces, not the fix.
- **Consequence for #pvws4:** its verdict holds, its stated mechanism ("recreated as postgres") is not what happened to this view. It also
  means a headerless anon read through PostgREST, which is what `check-public-views.mjs` now does, is a valid test; the same read through the
  Management API is not (it is trusted).

## 3. Re-test of "scoped by ownership" on views whose table is not empty
`check-tenancy-canary.mjs --untrusted --strict` on dev: 23 objects, 0 findings (but it plants only `residents` and `attachments`).
For the rest I moved every row of the view's base tables to `test-shelter-2` as postgres inside one rolled-back transaction and read as untrusted anon:

| View | Lanna header before / after the move | other-shelter header | no header |
|---|---|---|---|
| public_fundraising_events | 1 / 0 | 1 | 0 |
| public_projects | 1 / 0 | 1 | 0 |
| public_donation_channels | 1 / 0 | 1 | 0 |
| public_merch_products | 3 / 0 | 3 | 0 |
| public_appeals | 1 / 0 | 0 (joins `residents`, which I did not move) | 0 |

Non-vacuous: rows appear for the shelter that owns them and for nobody else. **Not tested:** `public_site_pages` (the other shelter already
has its own rows, a slug clash), anything over `residents`/`attachments` beyond the canary, and the 13 views empty on dev (no row to move).
For those the evidence stays the same-owner, same-policy argument. Nothing created survived (rollback); nothing outside a transaction was written.

## 4. What each instrument covers
| Instrument | Catches | When / where |
|---|---|---|
| `check-public-views.mjs` headerless loop (#1796) | a leaking view **with rows** | every PR, **test** project (needs repo secrets; skips with a warning on forks) |
| `check-tenancy-canary.mjs --untrusted` | leak in depth, for `residents`/`attachments` | nightly, dev |
| `check-tenancy-catalogue.mjs --strict --tenant-role rls_definer` | any API view not invoker and not `rls_definer`-owned, **empty or not** | nightly, dev; deliberately not on PRs (token) |
| **`check-view-owners.mjs` (new)** | a view a migration creates and nobody re-owns, **empty or not** | every PR, in `npm run lint`, files only |

**The gap, and it was real:** a PR adding `create view public_x` runs as postgres, so it leaks, and the only PR-time guard sees it only if
its base table has rows; the owner lint says so the next morning. Nothing before today read the migrations for it. No view has been created
since 0375, so the guard is prospective.

## The guard
`scripts/lib/view-owners.mjs` folds the migrations in order: `create view` and `drop` then `create` set the owner to postgres, `create or
replace` keeps it, `alter view … owner to` sets it, 0375 (a DO loop it cannot execute) is modelled as re-owning everything existing. A view
passes if it ends `rls_definer`, `security_invoker`, or filters by `current_shelter_id()` (0430). `scripts/check-view-owners.mjs` is the
CLI, `scripts/check-view-owners.test.mjs` the proof: a new unowned view and a drop-and-create are RED, the fixed forms green, comments and
function bodies ignored, and the real tree clean. **Limits:** a view created inside a DO block or function is invisible to it (the nightly
catalogue lint still sees it); it assumes the runner is postgres.

## 7. What a future `public_*` view must do (corrects the earlier wording on one point)
Same as `2026-11-21-public-views-shelter-scope.md`, with two additions: **in the same migration** that runs `create view`, add
`alter view <name> owner to rls_definer;` (**`create or replace` on an existing view needs nothing**, and `check-view-owners` now fails the PR
otherwise); and **test a scoping claim through PostgREST or with `request.jwt.claims = '{"role":"anon"}'`**, never with a bare SQL harness,
which is trusted and reads everything. The earlier file's "how it leaked" sentence should read: a postgres-owned view leaks; #1788's 6 rows
were a trusted-mode reading.

## Not done
No migration, no change to the nightly job, its token or `--strict`, nothing loosened in `check-public-views.mjs`.
