# Tenancy part 2, groups (B) and (C1): nullable shelter_id on people/money and the five permission tables (0384)

Item `#s50n8` (four streams; (A) merged as 0383, this is (B)+(C1), (C2) is batch 3's). Same shape as 0383: nullable, no default, no backfill, no NOT NULL, no policy. `src/` untouched. Number: `check-migration-numbers.mjs` gave `0384`.

## Tables, read from pg_class on dev (project qxkmhwybjggxvsfxsxbd), 2026-11-16 — 123 tables
**(C1), 5, confirmed live:** roles, role_cards, role_groups, role_permissions, user_roles.
**(B), 29** (the item names a group, not a list; this is the list, by purpose): contacts, supporters, shelter_friends, shop_links, suppliers; donations, donation_lines, donation_receipts, donation_tax_ids, receipt_counters; fundraising_events, fundraising_event_photos, appeals, appeal_photos; merch_products, merch_variants, merch_orders, merch_order_items, merch_order_parts, merch_supplier_emails; stock_counts, stock_deliveries, stock_receipts; bill_accounts, bills_inbox, general_bills, utility_bills, maintenance_bills, fixed_outgoings.
Judgement calls: `fundraising_events`/`_photos` (money, not named in the item), `maintenance_bills` (a bill, though maintenance is (C)), `shelter_friends`/`shop_links` (the shop's people). Easy to move if the planner reads them otherwise.

## Triggers: none is ours
`queue_translations` writes `translations`, `record_audit` writes `audit_log`, `record_label_sources` writes `label_sources`/`label_drafts` (bodies read on dev). None writes a (B) or (C1) table, so nothing needed `NEW.shelter_id` copied.

## Unique keys
Widened, `nulls not distinct`, guarded to act only on today's definition (so a plain key cannot silently allow duplicates while every shelter is null):
- `donation_receipts_number_key`: `(shelter_id, number)`.
- `fixed_outgoings_label_key` (a unique index on `lower(btrim(label))`): `(shelter_id, lower(btrim(label))) nulls not distinct`.
Not mine, left alone: the other 17 of the 19 (zones, medication, diet_types, frequency, immunization_types, procedure_types, blood_test_types, community_places, maintenance.job_code, site_pages.slug, impact_baselines.key, rounds.key/sort_order, roles.key, root project_folders names); `roles.key` and `roles_one_admin_idx` are (C2).
**Found in (B), not in the 19, NOT widened (for the planner):** `merch_orders.order_no`, `shelter_friends.contact_id`/`supplier_id`, `shop_links.friend_id`, `merch_variants_unique_idx`, `receipt_counters.series` (primary key; the receipt counter is one global series, so two shelters would draw numbers from one sequence — harmless to uniqueness, but a decision for the pooling design).

## Ambiguous tables met and stepped around
bill_kinds, donation_channels, merch_exchange_rates, item_unit_conversions, group_origins, card_features/card_grants/card_includes, translations/label_sources/label_drafts.

## TENANT tables in no group (for the planner to file; not adopted)
animal_reports, bulk_appointments, clinics, doctors, doctor_clinics, desexing_drives, desexing_drive_signups, diets, medication, rounds, premises, community_dog_outings, community_outing_photos, resident_note_sources, foundation_documents, impact_baselines, public_stat_switches, website_drafts, social_shares. (Media-like tables — attachments, pending_photos, video_uploads, project_folders, project_photos — read as group (C).)

## What the harness proved (begin … rollback, dev, nothing kept)
Existing rows have null shelter_id; an insert with no shelter works; a duplicate on each widened key is refused while null (fixed_outgoings incl. case/space variant; donation_receipts.number); the same value is allowed in two shelters and refused within one. Ended on a deliberate `raise exception`.
