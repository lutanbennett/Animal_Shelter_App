# 2026-11-19 — What a brand-new shelter needs before it works (`#shrow`, the read)

## Method (re-runnable)

`node scripts/run-harness.mjs supabase/harness/new_shelter_rows.sql` (dev). Inside one `begin … rollback`: places a throwaway `product_admins` row, sets an `aal2` JWT claim, calls `public.product_admin_create_shelter('zz-shrow', …)` as `authenticated`, then counts rows per `public` base table that has a `shelter_id` column for the new shelter, for `lanna`, and for any other. Nothing survives; `test-shelter-2` and `proof-b` were only counted as "other", never touched.

**Gate finding (the brief's open question):** a harness through the Management API **does** pass `product_admin_create_shelter`. `is_product_admin()` is satisfied by a `product_admins` row inserted inside the same rolled-back transaction, and the `aal2` check reads `auth.jwt() ->> 'aal'`, which `set_config('request.jwt.claims', …)` supplies. No policy weakened, no `aal2` session stood up (the same route `0415`'s harness uses).

## Result, measured

- `shelters` has **no trigger**, so creating a shelter creates exactly one row, in `shelters`. **All 115 tables carrying `shelter_id` hold 0 rows for the new shelter.** `0397` made `shelter_id` NOT NULL, so absence is a missing row, never a hidden one.
- After the screen's other steps, what exists: `shelter_hosts` (`product_admin_map_host`), `roles`+Admin (`product_admin_create_shelter_admin_role`, 0415, no cards by design), `user_roles` (`product_admin_link_shelter_admin`).

## The list: tables Lanna holds config rows in, and what creates them for a new shelter

| Table / column | Lanna rows | Created today by | Seen when absent |
|---|---|---|---|
| `shelters.receipt_series`, `receipt_issuers` | set (0395) | **nothing** (migration or service role only) | Issuing a receipt raises *No receipt issuer for country X* (`issue_donation_receipt`, 0395, read in the SQL) |
| `receipt_counters` | 1 | **nothing** | Receipt raises *Receipt counter … is missing* once a series exists |
| `site_content` | 1 | screen: `CreateSiteContentRow` on Admin → Website | Website admin shows "nothing set up" with a create button (read in `admin/website/page.tsx`). Public home/footer take `content` as nullable; **not established by loading a page** |
| `site_pages` | 8 | **nothing** (seeded by migrations 0059/0099/0206 for Lanna only) | not established: public page reads and the admin editor were not loaded |
| `public_stat_switches` | 4 | **nothing** (0328 seeded) | not established |
| `donation_channels` | 1 | **nothing found** | not established |
| `role_groups` | 2 | screen: Who does what (`role_groups` insert) | not established |
| `merch_exchange_rates` | 5 | screen: Merch shop (insert) | not established |
| `blood_test_types`, `immunization_types`, `procedure_types`, `diet_types`, `diets` | 9 / 7 / 11 / 7 / 3 | screens under `/admin/*` (one per list) | list pickers empty; forms offering them cannot be completed (not driven) |
| `bill_kinds`, `frequency`, `group_origins` | 14 / 10 / 2 | **nothing**: no screen (also noted in the runbook) | `/bills` reads `bill_kinds` and shows an empty kind list; `residents/new` reads `group_origins`; not driven |
| `translations`, `item_unit_conversions`, `label_sources` | 33 / 5 / 102 | screens exist for translations and units; `label_sources` not checked | not established |
| `shelter_drive_credentials`, `shelter_calendar_credentials`, `shelters.drive_root_folder_id` | 0 / 0 / set | scripts (`connect-shelter-drive.mjs`, populate script) | per `2026-11-17-per-shelter-settings.md`: the root folder id **falls back to the environment's** (a known hole, Part 9) |
| `units`, `enclosures`, `zones`, `facility_maps`, `map_rooms`, `clinics`, `doctors` | many | screens (the shelter's own premises) | an empty shelter, by nature |

The remaining tables are transactional (residents, bills, donations, audit, …) and are rightly empty.

## What is NOT established

Public-page behaviour for a shelter with no `site_pages`/`site_content` (needs a second host serving a page); the empty-state of the lookup pickers; whether `site_pages`, `public_stat_switches`, `donation_channels` and the three lookup lists need creating in onboarding or merely tolerate absence. All three need a page loaded under a second shelter's host.

## Is anything owed as a BUILD? Yes, for the planner to file (not built here)

1. **Seed-on-create:** extend `product_admin_create_shelter` (or a sibling) to give a new shelter its default `site_pages`, `public_stat_switches`, `receipt_counters` row and the three screenless lookup lists (`bill_kinds`, `frequency`, `group_origins`). Receipts also need `receipt_series`/`receipt_issuers` set, which no login can write: needs a definer function taking those values. Needs a migration.
2. **Screens or a seed for the three screenless lookup lists** if they should be per-shelter editable.
3. Walk a second shelter's public site and admin to turn the *not established* rows into measured ones.

Three wrong names in the backlog item, for the planner: `scripts/check-tenancy-lint.mjs` does not exist (real: `check-tenancy-catalogue.mjs`); `0392` is `0392_per_shelter_restrictive_policies.sql`; `0414`/`0415` are `0414_product_admin_shelter_writes.sql` and `0415_product_admin_shelter_admin_role.sql`.

`check-tenancy-catalogue.mjs --env test --strict --tenant-role rls_definer`: **0 flagged, 0 stale.**

`#shrow` is **half closed**: the list exists; absent-row consequences are recorded for receipts and `site_content` only. Not ticked.
