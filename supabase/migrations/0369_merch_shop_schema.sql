-- consumer: none
--
-- SCHEMA half of backlog #cjxq0, the online merchandise shop (Lutan, 2026-10-10: built into the website; answers recorded in
-- docs/decisions/2026-11-13-answers-receipts-shop-payments.md; shape in docs/decisions/2026-11-14-merch-shop-schema.md; the specification
-- the two app streams build from is docs/merch-shop.md). Nothing in src/ reads any of this yet.
--
-- NOT the affiliate-links page (0285, shop_links, /shop). That is a different feature and is untouched.
--
--   merch_products          what is sold: price and BOTH postage prices (Thailand, overseas), one optional supplier, shown flag.
--   merch_variants          size / colour of a product and the stock the SHELTER holds of it.
--   merch_orders            one customer order: buyer, region, currency, totals, manual payment state.
--   merch_order_parts       one order is split into PARTS, one per source (a supplier, or the shelter's own shelf); each has its own
--                           status, tracking and "sent to supplier" mark.
--   merch_order_items       the lines of a part, with the product name, size and price copied at the time of sale.
--   merch_supplier_emails   one row per daily email actually sent to a supplier; the parts it carried point back to it.
--   suppliers.delivery_method  NEW column on the existing suppliers table (0335): how that supplier is sent its parts. Only 'daily_email' today.
--   merch.manage            NEW level activity, and the NEW card run_merch_shop that carries it (read / edit).
--   public_merch_products / public_merch_variants   what anon reads: shown rows, named columns, no stock count, no supplier.
--
-- NO PAYMENT GATEWAY and no payment-provider column: payment is manual (PromptPay, Wise), staff mark an order paid.
-- Designed for an EMPTY catalogue: no row is inserted here.
-- Re-runnable. To undo: drop the two views, the six tables (children first), suppliers.delivery_method, the card_grants / card_features
-- rows for run_merch_shop, the permission_activities row merch.manage, and restore is_public_drive_file() from 0314 and suppliers' policies from 0335.

-- 1. The activity and the card ------------------------------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('merch.manage', 'level', 'management', 92)
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

insert into card_grants (card, activity, level)
values ('run_merch_shop', 'merch.manage', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'run_merch_shop', f.id from features f where f.key = 'website_public_pages'
on conflict (card) do nothing;

-- 2. Products and variants ------------------------------------------------------------------------------------------------------
create table if not exists merch_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_thb numeric(10, 2) not null check (price_thb >= 0),
  postage_thailand_thb numeric(10, 2) not null default 0 check (postage_thailand_thb >= 0),
  postage_overseas_thb numeric(10, 2) not null default 0 check (postage_overseas_thb >= 0),
  supplier_id uuid references suppliers (id) on delete restrict,
  photo_drive_file_id text,
  sort_order int not null default 0,
  shown boolean not null default false,
  archived_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint merch_products_name_present check (btrim(name) <> '')
);
create index if not exists merch_products_order_idx on merch_products (sort_order, created_at);

comment on table merch_products is
  'A product in the merchandise shop (0369). Prices are in baht; an overseas buyer is quoted in their own currency at order time (merch_orders.currency). supplier_id null = no supplier chosen, only shelter stock can be sold. Anon reads public_merch_products only.';
comment on column merch_products.postage_thailand_thb is 'Postage added to a Thailand order for ONE of this product, set when the product is added (Director, via Lutan, 2026-11-13).';
comment on column merch_products.postage_overseas_thb is 'Postage added to an overseas order for one of this product.';
comment on column merch_products.shown is 'false keeps it off the shop: absent from public_merch_products, not filtered by the app. Default false.';

create table if not exists merch_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references merch_products (id) on delete cascade,
  size text,
  colour text,
  shelter_stock int not null default 0 check (shelter_stock >= 0),
  shown boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists merch_variants_unique_idx
  on merch_variants (product_id, coalesce(size, ''), coalesce(colour, ''));

comment on table merch_variants is
  'A size / colour of a product (0369). shelter_stock is how many the shelter itself holds on its shelf; stock at a supplier is not counted. A one-size, one-colour product has one row with both null.';

-- 3. Orders, parts and items ----------------------------------------------------------------------------------------------------
create sequence if not exists merch_order_no_seq;

create table if not exists merch_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default ('M-' || lpad(nextval('merch_order_no_seq')::text, 5, '0')),
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  ship_country text not null check (ship_country ~ '^[A-Z]{2}$'),
  ship_address text not null,
  region text not null check (region in ('thailand', 'overseas')),
  currency text not null default 'THB' check (currency ~ '^[A-Z]{3}$'),
  exchange_rate numeric(14, 6) check (exchange_rate > 0),
  subtotal_thb numeric(10, 2) not null check (subtotal_thb >= 0),
  postage_thb numeric(10, 2) not null check (postage_thb >= 0),
  total_thb numeric(10, 2) not null check (total_thb >= 0),
  total_charged numeric(12, 2) not null check (total_charged >= 0),
  payment_method text not null check (payment_method in ('promptpay', 'wise_transfer', 'wise_link')),
  payment_state text not null default 'awaiting' check (payment_state in ('awaiting', 'paid', 'cancelled')),
  paid_at timestamptz,
  paid_by uuid references auth.users (id),
  payment_reference text,
  buyer_note text,
  staff_note text,
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint merch_orders_paid_stamped check (payment_state <> 'paid' or (paid_at is not null and paid_by is not null)),
  constraint merch_orders_thb_rate check (currency = 'THB' or exchange_rate is not null),
  constraint merch_orders_region_method check (region = 'overseas' or payment_method = 'promptpay')
);
create index if not exists merch_orders_state_idx on merch_orders (payment_state, created_at desc);

comment on table merch_orders is
  'One customer order (0369). NO payment gateway: the buyer pays by PromptPay (thailand) or a Wise transfer / link (overseas, in their own currency); staff confirm the money arrived and set payment_state to paid, which stamps paid_at and paid_by. total_charged is the amount in `currency`; total_thb is the baht value. exchange_rate (baht per one unit of currency) is fixed by staff when the order is quoted. Returns are exchange only, so there is no refunded state. Rows are created by the server (service role) at checkout; there is no anon policy.';

create table if not exists merch_supplier_emails (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers (id) on delete restrict,
  sent_to text not null,
  part_count int not null check (part_count > 0),
  body text not null,
  sent_at timestamptz not null default now()
);
create index if not exists merch_supplier_emails_supplier_idx on merch_supplier_emails (supplier_id, sent_at desc);

comment on table merch_supplier_emails is
  'One row per daily email actually sent to a supplier (0369): who, to what address, how many parts, and the text sent. The parts it carried point back here (merch_order_parts.supplier_email_id).';

create table if not exists merch_order_parts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references merch_orders (id) on delete cascade,
  fulfilment text not null check (fulfilment in ('supplier', 'shelter')),
  supplier_id uuid references suppliers (id) on delete restrict,
  status text not null default 'new' check (status in ('new', 'sent_to_supplier', 'shipped', 'delivered', 'cancelled')),
  supplier_email_id uuid references merch_supplier_emails (id) on delete restrict,
  sent_to_supplier_at timestamptz,
  carrier text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint merch_order_parts_source check ((fulfilment = 'supplier') = (supplier_id is not null)),
  constraint merch_order_parts_shelter_not_sent check (fulfilment = 'supplier' or (sent_to_supplier_at is null and supplier_email_id is null and status <> 'sent_to_supplier')),
  constraint merch_order_parts_sent_marked check (status <> 'sent_to_supplier' or sent_to_supplier_at is not null)
);
create index if not exists merch_order_parts_order_idx on merch_order_parts (order_id);
-- The daily email's question, "which parts has this supplier not been sent yet", is answered from this index.
create index if not exists merch_order_parts_unsent_idx on merch_order_parts (supplier_id) where fulfilment = 'supplier' and sent_to_supplier_at is null and status = 'new';

comment on table merch_order_parts is
  'One order is split into parts, one per source (0369): fulfilment supplier (supplier_id set) or shelter (taken from merch_variants.shelter_stock). Each part has its own status and tracking. Sent to a supplier = sent_to_supplier_at set and supplier_email_id pointing at the email; a part with sent_to_supplier_at null and status new is what the next daily email lists, and once marked it never appears again.';

create table if not exists merch_order_items (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references merch_order_parts (id) on delete cascade,
  variant_id uuid references merch_variants (id) on delete set null,
  product_name text not null,
  size text,
  colour text,
  unit_price_thb numeric(10, 2) not null check (unit_price_thb >= 0),
  quantity int not null check (quantity > 0)
);
create index if not exists merch_order_items_part_idx on merch_order_items (part_id);

comment on table merch_order_items is
  'A line of an order part (0369). Product name, size, colour and price are COPIED at the time of sale, so later catalogue edits never change a past order. variant_id is kept for stock but nulls if the variant is removed.';

-- 4. The supplier's delivery method (extends 0335; no second suppliers table) --------------------------------------------------------
alter table suppliers add column if not exists delivery_method text not null default 'daily_email';
alter table suppliers drop constraint if exists suppliers_delivery_method_known;
alter table suppliers add constraint suppliers_delivery_method_known check (delivery_method in ('daily_email'));

comment on column suppliers.delivery_method is
  'How this supplier is sent the merchandise order parts (0369). Today only daily_email: one email a day to suppliers.email listing every part not yet sent. A further method (a file, a link, the supplier''s own system) is added later by widening suppliers_delivery_method_known and adding a sender, with no change to the shop tables.';

-- Whoever holds merch.manage may read and set a supplier's delivery method (the supplier screen of the shop). Everything else in the
-- policies of 0335 is kept as it was.
drop policy if exists suppliers_select_perm on suppliers;
create policy suppliers_select_perm on suppliers for select to authenticated
  using (
    (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'))
    or (select has_permission('bills.general'))
    or (select has_permission('bills.utilities'))
    or (select has_permission('maintenance.bills'))
    or (select has_permission('friends.manage'))
    or (select has_permission('friends.view'))
    or (select has_permission('contacts.directory', 'read'))
    or (select has_permission('merch.manage', 'read'))
  );

drop policy if exists suppliers_update_perm on suppliers;
create policy suppliers_update_perm on suppliers for update to authenticated
  using ((select has_permission('contacts.directory')) or (select has_permission('merch.manage')))
  with check ((select has_permission('contacts.directory')) or (select has_permission('merch.manage')));

-- 5. Access: merch.manage on every table; the stamps come from the session ----------------------------------------------------------
alter table merch_products enable row level security;
drop policy if exists merch_products_select_perm on merch_products;
create policy merch_products_select_perm on merch_products for select to authenticated
  using ((select has_permission('merch.manage', 'read')));
drop policy if exists merch_products_insert_perm on merch_products;
create policy merch_products_insert_perm on merch_products for insert to authenticated
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_products_update_perm on merch_products;
create policy merch_products_update_perm on merch_products for update to authenticated
  using ((select has_permission('merch.manage')))
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_products_delete_perm on merch_products;
create policy merch_products_delete_perm on merch_products for delete to authenticated
  using ((select has_permission('merch.manage')));
revoke all on merch_products from anon, authenticated, service_role;
grant select, insert, update, delete on merch_products to authenticated, service_role;

alter table merch_variants enable row level security;
drop policy if exists merch_variants_select_perm on merch_variants;
create policy merch_variants_select_perm on merch_variants for select to authenticated
  using ((select has_permission('merch.manage', 'read')));
drop policy if exists merch_variants_insert_perm on merch_variants;
create policy merch_variants_insert_perm on merch_variants for insert to authenticated
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_variants_update_perm on merch_variants;
create policy merch_variants_update_perm on merch_variants for update to authenticated
  using ((select has_permission('merch.manage')))
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_variants_delete_perm on merch_variants;
create policy merch_variants_delete_perm on merch_variants for delete to authenticated
  using ((select has_permission('merch.manage')));
revoke all on merch_variants from anon, authenticated, service_role;
grant select, insert, update, delete on merch_variants to authenticated, service_role;

alter table merch_orders enable row level security;
drop policy if exists merch_orders_select_perm on merch_orders;
create policy merch_orders_select_perm on merch_orders for select to authenticated
  using ((select has_permission('merch.manage', 'read')));
drop policy if exists merch_orders_insert_perm on merch_orders;
create policy merch_orders_insert_perm on merch_orders for insert to authenticated
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_orders_update_perm on merch_orders;
create policy merch_orders_update_perm on merch_orders for update to authenticated
  using ((select has_permission('merch.manage')))
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_orders_delete_perm on merch_orders;
create policy merch_orders_delete_perm on merch_orders for delete to authenticated
  using ((select has_permission('merch.manage')));
revoke all on merch_orders from anon, authenticated, service_role;
grant select, insert, update, delete on merch_orders to authenticated, service_role;

alter table merch_order_parts enable row level security;
drop policy if exists merch_order_parts_select_perm on merch_order_parts;
create policy merch_order_parts_select_perm on merch_order_parts for select to authenticated
  using ((select has_permission('merch.manage', 'read')));
drop policy if exists merch_order_parts_insert_perm on merch_order_parts;
create policy merch_order_parts_insert_perm on merch_order_parts for insert to authenticated
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_order_parts_update_perm on merch_order_parts;
create policy merch_order_parts_update_perm on merch_order_parts for update to authenticated
  using ((select has_permission('merch.manage')))
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_order_parts_delete_perm on merch_order_parts;
create policy merch_order_parts_delete_perm on merch_order_parts for delete to authenticated
  using ((select has_permission('merch.manage')));
revoke all on merch_order_parts from anon, authenticated, service_role;
grant select, insert, update, delete on merch_order_parts to authenticated, service_role;

alter table merch_order_items enable row level security;
drop policy if exists merch_order_items_select_perm on merch_order_items;
create policy merch_order_items_select_perm on merch_order_items for select to authenticated
  using ((select has_permission('merch.manage', 'read')));
drop policy if exists merch_order_items_insert_perm on merch_order_items;
create policy merch_order_items_insert_perm on merch_order_items for insert to authenticated
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_order_items_update_perm on merch_order_items;
create policy merch_order_items_update_perm on merch_order_items for update to authenticated
  using ((select has_permission('merch.manage')))
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_order_items_delete_perm on merch_order_items;
create policy merch_order_items_delete_perm on merch_order_items for delete to authenticated
  using ((select has_permission('merch.manage')));
revoke all on merch_order_items from anon, authenticated, service_role;
grant select, insert, update, delete on merch_order_items to authenticated, service_role;

alter table merch_supplier_emails enable row level security;
drop policy if exists merch_supplier_emails_select_perm on merch_supplier_emails;
create policy merch_supplier_emails_select_perm on merch_supplier_emails for select to authenticated
  using ((select has_permission('merch.manage', 'read')));
drop policy if exists merch_supplier_emails_insert_perm on merch_supplier_emails;
create policy merch_supplier_emails_insert_perm on merch_supplier_emails for insert to authenticated
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_supplier_emails_update_perm on merch_supplier_emails;
create policy merch_supplier_emails_update_perm on merch_supplier_emails for update to authenticated
  using ((select has_permission('merch.manage')))
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_supplier_emails_delete_perm on merch_supplier_emails;
create policy merch_supplier_emails_delete_perm on merch_supplier_emails for delete to authenticated
  using ((select has_permission('merch.manage')));
revoke all on merch_supplier_emails from anon, authenticated, service_role;
grant select, insert, update, delete on merch_supplier_emails to authenticated, service_role;

grant usage, select on sequence merch_order_no_seq to authenticated, service_role;

create or replace function merch_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_table_name = 'merch_products' and tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  elsif tg_table_name = 'merch_products' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  if tg_table_name <> 'merch_variants' then
    new.updated_by := auth.uid();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function merch_stamp() from public, anon, authenticated;

drop trigger if exists merch_products_stamp on merch_products;
create trigger merch_products_stamp before insert or update on merch_products for each row execute function merch_stamp();
drop trigger if exists merch_variants_stamp on merch_variants;
create trigger merch_variants_stamp before insert or update on merch_variants for each row execute function merch_stamp();
drop trigger if exists merch_orders_stamp on merch_orders;
create trigger merch_orders_stamp before insert or update on merch_orders for each row execute function merch_stamp();
drop trigger if exists merch_order_parts_stamp on merch_order_parts;
create trigger merch_order_parts_stamp before insert or update on merch_order_parts for each row execute function merch_stamp();

-- 6. Thai through the translations queue (the shop's own words; buyer data is never translated) ---------------------------------------------
insert into translatable_fields (table_name, column_name, tier) values
  ('merch_products', 'name', 'reviewed'),
  ('merch_products', 'description', 'reviewed')
on conflict do nothing;

drop trigger if exists merch_products_queue_translations on merch_products;
create trigger merch_products_queue_translations
  after insert or update on merch_products
  for each row execute function queue_translations();
drop trigger if exists merch_products_drop_translations on merch_products;
create trigger merch_products_drop_translations
  after delete on merch_products
  for each row execute function drop_translations();

-- 7. What anon reads --------------------------------------------------------------------------------------------------------------------
-- EXPOSED: id, name, description, price and both postage prices, photo, sort_order, translations, and `available`. NOT EXPOSED: supplier,
-- stock counts, created/updated by, archived. A hidden or archived product, and any variant of it, is absent.
-- `available` = the shelter holds some, or a supplier is set (stock at a supplier is not counted).
create or replace view public_merch_products as
select p.id,
       p.name,
       p.description,
       p.price_thb,
       p.postage_thailand_thb,
       p.postage_overseas_thb,
       p.photo_drive_file_id,
       p.sort_order,
       private.approved_translations('merch_products'::text, p.id) as translations
  from merch_products p
 where p.shown and p.archived_at is null;

create or replace view public_merch_variants as
select v.id,
       v.product_id,
       v.size,
       v.colour,
       v.sort_order,
       (p.supplier_id is not null or v.shelter_stock > 0) as available
  from merch_variants v
  join merch_products p on p.id = v.product_id
 where v.shown and p.shown and p.archived_at is null;

comment on view public_merch_products is
  'The merchandise products the public shop shows (0369). Owner-run: `where shown and not archived` is what keeps a hidden product from anon.';
comment on view public_merch_variants is
  'Sizes and colours of shown products, with an `available` flag and NO stock count or supplier (0369).';

grant select on public_merch_products, public_merch_variants to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_merch_products, public_merch_variants from anon, authenticated;

-- 8. The photo proxy may serve a shown product's photo (is_public_drive_file as in 0314, plus one line) ------------------------------------------
create or replace function is_public_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public_site_content where hero_drive_file_id = p_drive_file_id
      or donate_photo_drive_file_id = p_drive_file_id
      or foster_photo_drive_file_id = p_drive_file_id
      or volunteer_photo_drive_file_id = p_drive_file_id
      or about_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_site_content_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_projects where cover_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_profiles where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_recent_adoptions where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_cards where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_donation_channels where qr_drive_file_id = p_drive_file_id
    union all
    select 1 from public_appeal_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_adoption_updates where drive_file_id = p_drive_file_id
    union all
    select 1 from public_shop_links where photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_fundraising_event_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_merch_products where photo_drive_file_id = p_drive_file_id
  );
$$;
revoke execute on function is_public_drive_file(text) from public;
grant execute on function is_public_drive_file(text)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
