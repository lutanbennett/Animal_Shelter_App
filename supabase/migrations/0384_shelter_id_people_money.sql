-- consumer: none
--
-- Multi-tenancy programme part 2, groups (B) people and money and (C1) the five permission tables (#s50n8, under #ykefa). Same shape
-- as 0383: a nullable shelter_id on each table, NO policy, NO default, NO backfill, NO NOT NULL, so nothing reads it and running code is
-- unchanged. Policies are part 5 (#ujqr5). The table list was read from pg_class on dev, 2026-11-16 (docs/decisions/2026-11-16-tenancy-shelter-id-people-money.md).
-- No trigger writes any of these tables (queue_translations -> translations, record_audit -> audit_log, record_label_sources ->
-- label_sources/label_drafts), so no trigger needs changing here.
--
-- Two unique keys are widened, in 0383's form: NULLS NOT DISTINCT keeps today's guarantee exactly while shelter_id is still null (a plain
-- (shelter_id, x) key would treat every null shelter as different and silently allow duplicates). Each is wrapped so it acts only if
-- today's definition is still there. roles.key and roles_one_admin_idx are (C2) and are NOT touched.
--
-- Re-runnable. To undo: restore donation_receipts_number_key as unique (number) and fixed_outgoings_label_key as unique on
-- (lower(btrim(label))), then drop the columns.

do $$
declare t text;
begin
  foreach t in array array[
    -- (B) people and money
    'contacts', 'supporters', 'shelter_friends', 'shop_links', 'suppliers',
    'donations', 'donation_lines', 'donation_receipts', 'donation_tax_ids', 'receipt_counters',
    'fundraising_events', 'fundraising_event_photos', 'appeals', 'appeal_photos',
    'merch_products', 'merch_variants', 'merch_orders', 'merch_order_items', 'merch_order_parts', 'merch_supplier_emails',
    'stock_counts', 'stock_deliveries', 'stock_receipts',
    'bill_accounts', 'bills_inbox', 'general_bills', 'utility_bills', 'maintenance_bills', 'fixed_outgoings',
    -- (C1) the five permission tables
    'roles', 'role_cards', 'role_groups', 'role_permissions', 'user_roles'
  ] loop
    execute format('alter table public.%I add column if not exists shelter_id uuid references public.shelters(id)', t);
  end loop;
end $$;

-- donation_receipts.number: unique per shelter.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'donation_receipts_number_key' and conrelid = 'public.donation_receipts'::regclass
              and pg_get_constraintdef(oid) = 'UNIQUE (number)') then
    alter table donation_receipts drop constraint donation_receipts_number_key;
    alter table donation_receipts add constraint donation_receipts_number_key unique nulls not distinct (shelter_id, number);
  end if;
end $$;

-- fixed_outgoings label (a unique index, not a constraint): unique per shelter.
do $$
begin
  if exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'fixed_outgoings_label_key'
              and indexdef not ilike '%shelter_id%') then
    drop index public.fixed_outgoings_label_key;
    create unique index fixed_outgoings_label_key on public.fixed_outgoings (shelter_id, lower(btrim(label))) nulls not distinct;
  end if;
end $$;
