# 2026-11-15 — Tenancy part 1: shelters, host map, resolution (`#mz75e`)

Migration `0382_shelters_and_host_map.sql`, dev only. Step zero: greenfield measurement held (no `shelter_id`, no `shelters`,
no `current_shelter_id`/`is_trusted_caller`; 0381 was the highest).

## Choices
- **`shelters`**: `id uuid`, `key` (readable slug, unique, `^[a-z0-9]+(-[a-z0-9]+)*$`, the handle later parts reference), `name`, `created_at`. Lanna = key `lanna`. Kept small; Part 2 adds what it needs.
- **`shelter_hosts`**: `host` text PK (stored normalised), `shelter_id` nullable FK (`on delete restrict`). A shelter may have many rows.
- **"No shelter" = an explicit row with `shelter_id` null** (`cooperjaidee.org`, `www.cooperjaidee.org`), not absence. Absence means UNKNOWN. Both resolve to null, but `shelter_host_kind()` returns `shelter` / `front_door` / `unknown`, so Part 4's Worker can serve the front door and refuse an unknown host.
- **Normalised**: trim, lower-case, one `:port`, one trailing dot. **Not done**: no `www.` stripping, no wildcard or label rule, no IPv6 literals. `www.lannacareforanimals.org` is therefore unknown until a row says otherwise (and never Lanna by fallthrough).
- **Access**: RLS on, `rls_definer` policy only, no anon/authenticated grant; `service_role` reads. Functions are security invoker, `service_role` execute only.

## Found, not fixed
- The strict lint flags `table:public.donation_tax_ids` (rule 3, no `definer_all`): from the donation-tax-id stream's 0381, not this PR. My two tables pass.

## Triage of tenant tables (deliverable 8)
Method: `pg_class` relkind r/p in `public` on dev, 2026-11-15 = **123 tables** (matches counting `create table` across migrations). Classified by name and purpose from reading the schema; columns not individually audited.
**Not tenant (9)**: schema_migrations, shelters, shelter_hosts, permission_activities, features, translatable_fields, translatable_labels, frequency, units.
**Ambiguous (21)**: card_features, card_grants, card_includes (card catalogue shared, or per shelter?); procedure_types, blood_test_types, immunization_types, diet_types, diet_ingredients, bill_kinds, donation_channels, group_origins, item_unit_conversions (lookups a shelter may edit); translations, label_sources, label_drafts (shared dictionary vs shelter wording); merch_exchange_rates (rates shared, but set by a shelter); community_places (local places, possibly shared); calendar_sync_state, status_alert_checks, status_alert_runs, status_alert_test_requests (platform plumbing vs per-shelter).
**Tenant (93)**: everything else — residents and their medical, placement, diet, clinic and prescription tables; contacts, supporters, donations, appeals, merch, shop, stock, suppliers, bills, maintenance, recurring jobs, enclosures/maps, site_content/site_pages, media (reels, memes, photos, videos), audit_log, assistant_actions, write_requests, roles, role_cards, role_groups, role_permissions, user_roles, and the rest.
