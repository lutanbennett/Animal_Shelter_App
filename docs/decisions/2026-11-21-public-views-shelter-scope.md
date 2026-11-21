# #pvws4: the other `public_*` views, measured, and the check that was blind to them

**Status: measured on dev 2026-11-21, no migration needed, `check-public-views.mjs` now goes red on the fault.**

## Mechanism, in one paragraph
A view that is not `security_invoker` runs as its **owner**, so the restrictive `shelter_scope_*` policies of 0392 apply to it only if its
owner obeys row-level security. 0375 re-owned every API-reachable owner-run view to `rls_definer` (no bypass, inherits `authenticated`, so the
restrictive policy, which names `anon, authenticated`, applies through it). A view that is **created or recreated as `postgres`** (the migration
runner, which has BYPASSRLS) is back to answering every shelter's rows to anyone, unless it scopes itself the way 0391 and 0430 do. That is
how `public_site_content` leaked 6 rows with and without the header (#1788). Nothing noticed, because every call `check-public-views.mjs`
made sent the header.

## The 23 views (live definitions and owners read from dev, then each called anonymously)
Every view is owner-run (`reloptions` empty) and owned by `rls_definer`. Every base table any of them reads carries `shelter_id` and has the three
`shelter_scope_*` policies (`relrowsecurity` on, `relforcerowsecurity` off, which is fine for a non-bypass owner). **None reads a table in
`docs/tenancy-shared-tables-registry.json`, so none is correctly installation-level.** Rows are counts on dev (shelter header = Lanna / no header / `test-shelter-2`).

| View | Scoped how | Lanna / none / other |
|---|---|---|
| public_resident_cards, public_shelter_stats, public_site_content | in the view itself (0391, 0391, 0430) | 18/0/1, 1 aggregate (all zero)/1/1, 1/0/1 |
| public_enclosures, public_resident_profiles, public_resident_photos, public_recent_adoptions, public_adoption_updates | by `rls_definer` ownership over `residents`/`attachments`/`enclosures` | 64/0/0, 2/0/0, 0/0/0, 0/0/0, 0/0/0 |
| public_appeals, public_appeal_photos, public_fundraising_events, public_fundraising_event_photos, public_desexing_drives | by ownership over their own tables | 1/0/0, 0/0/0, 1/0/0, 0/0/0, 0/0/0 |
| public_projects, public_project_photos, public_site_pages, public_site_content_photos, public_shelter_friends, public_shop_links | by ownership | 1/0/0, 0/0/0, 8/0/0, 0/0/0, 0/0/0, 0/0/0 |
| public_donation_channels, public_impact_figures, public_merch_products, public_merch_variants | by ownership | 1/0/0, 0/0/0, 3/0/0, 3/0/0 |

**Verdict: none of the 23 is wrong today, so there was nothing to scope and no `0433`.** The brief expected a migration; I did not write one,
because re-creating twenty views to add a filter the owner already enforces would have been a rewrite of the public read path with no leak to fix.
**What this could not distinguish:** 13 views are empty even for Lanna on dev (the check now prints a `note` line for each), so "0 without the header" is
vacuous for them. The same-owner, same-policy, same-tables evidence is what carries them, not the count. `test-shelter-2` holds almost no data, so the
"other shelter" column shows B is not given A's rows, not that A is hidden from B in depth (`check-tenancy-canary.mjs` plants rows for that).

## What changed
`check-public-views.mjs` has a new loop: **every exposed `public_*` view, listed or not, must answer anon with no `x-shelter-id` with nothing**
(`public_shelter_stats` is an aggregate and must read all zeros). This is the generic form the brief asked about, and it was cheap: it reads the
Data API's own list. **Proved red** with a deliberate fixture, a `postgres`-owned `public_zz_pvws4_fixture` over `site_pages` on dev, created, checked and
dropped within a minute: `FAIL public_zz_pvws4_fixture: anon with NO x-shelter-id reads nothing — 40 row(s)` (40 is every shelter's pages), exit 1. The same
view also trips the older "not on PUBLIC_VIEWS" line, which is expected and separate.

## What a future `public_*` view must do
Be created, or re-owned in the same migration, to a non-bypass owner (`rls_definer`, `alter view … owner to rls_definer`) **or** carry
`where (select is_trusted_caller()) or shelter_id = (select current_shelter_id())` (0430), and be listed in `PUBLIC_VIEWS`. A view over a table in the
register is the only exception and is named in `INSTALLATION_LEVEL_VIEWS` in the check (empty today).

## Found, not fixed (for the planner to file)
- `check-public-views.mjs` is behavioural: it cannot see a view's **owner**, because CI has no Management API token. A structural check of
  `pg_class.relowner` for every `public_*` view would catch the leak even where the table is empty. `check-tenancy-catalogue.mjs` reads migrations and
  is the likelier home. I did not extend it.
- It is not established why `public_site_content` leaked at #1788 if it is `rls_definer`-owned now (probably recreated as `postgres` inside 0429's
  harness, before a later re-own); I did not trace it.
