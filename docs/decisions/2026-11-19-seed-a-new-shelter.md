# 2026-11-19 — A new shelter is seeded with neutral defaults (`#shsed`, migration 0416)

Specification: `2026-11-19-what-a-new-shelter-needs.md`. Step zero: harness `new_shelter_rows.sql` re-run, still zero rows for a new shelter in every table (the gap is real). Proof: `supabase/harness/seed_new_shelter.sql`.

## The four questions

1. **Inside `product_admin_create_shelter` or a sibling?** Both. `seed_shelter_defaults(p_shelter)` is a sibling (idempotent, re-runnable), and `product_admin_create_shelter` now calls it, so creation stays atomic. **`test-shelter-2` and `proof-b` were not touched**: they pre-date this and still hold nothing. A product admin brings one up to date by calling `seed_shelter_defaults(<id>)` (aal2 session); it only adds what is missing. Not done here because the brief says do not repair `test-shelter-2` without saying so.
2. **Defaults or template?** Neutral defaults, not a copy of Lanna. `site_pages` get Lanna's eight slugs (the check constraint fixes the slugs) and titles but **empty bodies**: Lanna's prose is Lanna's. `bill_kinds`, `frequency`, `public_stat_switches` are generic and copied as they are. `group_origins` ("Founder", "Doi Suthep Puppies October 2022") are Lanna's history, so **not seeded**.
3. **`donation_channels`?** Established: its only Lanna row is Lanna's own DonorBox link, so it is **not a default and not seeded**. What the shelter sees when it is absent: not established (needs a page under a second shelter's host).
4. **Receipt function signature:** `product_admin_set_shelter_receipts(p_shelter uuid, p_series text, p_issuers jsonb)`. Series is upper-cased, capitals only, unique across shelters; once set it cannot change (receipts carry it), issuers can be corrected. It creates the `receipt_counters` row at 1. The counter is made here, not by the seed, because its primary key is the series. **No caller exists yet**: the product-admin screen needs a form. That is an app half and was not built (for the planner to file); `#shsed` is therefore ticked for the seeds and function, with that caller reported.

## What was seeded, from which Lanna migration

| table | rows | Lanna source |
|---|---|---|
| `site_pages` | 8, empty bodies | 0059, 0099, 0206 |
| `public_stat_switches` | 4, all on | 0328 |
| `bill_kinds` | 14 (6 under `utilities`) | 0305 |
| `frequency` | 10 | live Lanna rows (no single seed file) |
| `receipt_counters` | 1, via the receipt function | 0395 |

## Left unseeded, and what is seen when absent

`group_origins` (`residents/new` reads it; inferred empty picker, not driven), `donation_channels`, `site_content` (admin shows a create button, 0395 read), and cards (never). Public-page behaviour for a shelter with empty page bodies is **not established**.

## Security

Functions are `security definer`, owned by `rls_definer`, gated by `is_product_admin()` plus aal2, recorded under `outsideTheCardSystem.productAdmin` in the registry. No role read by name, no card seeded.
