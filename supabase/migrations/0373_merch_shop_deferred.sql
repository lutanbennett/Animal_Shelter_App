-- consumer: src/lib/merch/checkout.ts, src/lib/public-pages.ts, src/lib/audit/recent-changes.ts
--
-- THE THREE MERCHANDISE-SHOP PIECES 0369 LEFT FOR LATER (backlog #m3kpq; docs/decisions/2026-11-13-merch-shop-deferred.md).
--
--   1. place_merch_order(): the checkout's write as ONE database transaction. src/lib/merch/checkout.ts wrote the order in
--      several service-role statements and undid them by hand when one failed, so an interrupted write (the Worker dying
--      between the stock decrement and the order insert) could leave stock taken for an order that never existed. A plpgsql
--      function is one transaction: any failure rolls the lot back, nothing to undo by hand.
--   2. 'page:shop-merch': a hide key of its own for /shop/merch, so the Director can switch the merchandise shop off
--      without switching off Shop for the shelter (page:shop, 0290). Restated exactly as 0290 and 0328 did: the check is
--      dropped and re-added with the WHOLE list as it stands after 0328 plus the one new key, so every value stored today
--      is still accepted.
--   3. Audit triggers on merch_products, merch_orders and merch_order_parts (record_audit(), 0195). 0369 left them to the
--      PR that adds the screens. merch_orders carries the buyer's name, email, phone, address and note, so those five
--      columns are named to record_audit() as columns to leave out of the log: the log says WHO changed WHAT order and when,
--      and the buyer's details stay in merch_orders where only merch.manage reads them.
--
-- ACCESS TO place_merch_order(): SECURITY INVOKER, executable by service_role only. It is not a security definer function and
-- grants nothing: the checkout already calls it with the service role (no merch_* table is open to anon, 0369), and the
-- service role already holds every privilege the function uses. Revoking execute from public, anon and authenticated means
-- the browser can never call it, so the function adds no way in. Nothing about who may do what moves into SQL.
--
-- Additive and re-runnable (create or replace / drop ... if exists). To undo: drop function place_merch_order, drop the three
-- audit_merch_* triggers, and restore 0328's check on site_content.hidden_public_pages.

-- 1. The order, in one transaction -------------------------------------------------------------------------------------------
-- p_lines: [{"variant_id": uuid, "quantity": int}, ...], already capped by the caller. Everything else about a line (name,
-- price, postage, source) is re-read here from the real tables; nothing from the browser is trusted but ids and quantities.
-- Returns {"ok": true, "order_id": uuid} or {"ok": false, "error": "empty" | "unavailable"}. Any other failure (a check
-- constraint, say) raises, the transaction rolls back, and the caller reports "failed", as it did before.
create or replace function place_merch_order(
  p_lines jsonb,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_ship_country text,
  p_ship_address text,
  p_region text,
  p_currency text,
  p_exchange_rate numeric,
  p_payment_method text,
  p_buyer_note text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  l record;
  r record;
  v_plan jsonb := '[]'::jsonb;
  v_source text;
  v_subtotal numeric := 0;
  v_postage numeric := 0;
  v_total numeric;
  v_charged numeric;
  v_order_id uuid;
  v_part_id uuid;
  v_parts jsonb := '{}'::jsonb;
  v_line jsonb;
begin
  -- The same variant twice is one line. Rows are locked in id order so two checkouts cannot deadlock on each other.
  for l in
    select (e ->> 'variant_id')::uuid as variant_id, sum((e ->> 'quantity')::int) as qty
      from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) e
     group by 1
    having sum((e ->> 'quantity')::int) > 0
     order by 1
  loop
    select v.shelter_stock, v.shown as v_shown, v.size, v.colour,
           p.name, p.price_thb, p.postage_thailand_thb, p.postage_overseas_thb, p.supplier_id,
           p.shown as p_shown, p.archived_at
      into r
      from merch_variants v
      join merch_products p on p.id = v.product_id
     where v.id = l.variant_id
       for update of v;
    if not found or not r.v_shown or not r.p_shown or r.archived_at is not null then
      return jsonb_build_object('ok', false, 'error', 'unavailable');
    end if;
    -- The shelter if its shelf holds enough, else the product's supplier, else refuse the line.
    if r.shelter_stock >= l.qty then
      v_source := 'shelter';
      update merch_variants set shelter_stock = shelter_stock - l.qty where id = l.variant_id;
    elsif r.supplier_id is not null then
      v_source := r.supplier_id::text;
    else
      return jsonb_build_object('ok', false, 'error', 'unavailable');
    end if;
    v_subtotal := v_subtotal + l.qty * r.price_thb;
    v_postage := v_postage + l.qty * case when p_region = 'thailand' then r.postage_thailand_thb else r.postage_overseas_thb end;
    v_plan := v_plan || jsonb_build_object(
      'variant_id', l.variant_id, 'qty', l.qty, 'source', v_source,
      'name', r.name, 'size', r.size, 'colour', r.colour, 'price', r.price_thb);
  end loop;

  if jsonb_array_length(v_plan) = 0 then
    return jsonb_build_object('ok', false, 'error', 'empty');
  end if;

  v_total := round(v_subtotal + v_postage, 2);
  -- Overseas: quoted in the buyer's own currency at the dated rate the buyer is shown (p_exchange_rate, set by the caller).
  v_charged := case when p_exchange_rate is not null then round(v_total / p_exchange_rate, 2) else v_total end;

  insert into merch_orders (
    buyer_name, buyer_email, buyer_phone, ship_country, ship_address, region, currency, exchange_rate,
    subtotal_thb, postage_thb, total_thb, total_charged, payment_method, buyer_note)
  values (
    p_buyer_name, p_buyer_email, p_buyer_phone, p_ship_country, p_ship_address, p_region, p_currency, p_exchange_rate,
    v_subtotal, v_postage, v_total, v_charged, p_payment_method, p_buyer_note)
  returning id into v_order_id;

  -- One part per source: a supplier, or the shelter's own shelf.
  for v_source in select distinct e ->> 'source' from jsonb_array_elements(v_plan) e loop
    if v_source = 'shelter' then
      insert into merch_order_parts (order_id, fulfilment) values (v_order_id, 'shelter') returning id into v_part_id;
    else
      insert into merch_order_parts (order_id, fulfilment, supplier_id) values (v_order_id, 'supplier', v_source::uuid) returning id into v_part_id;
    end if;
    v_parts := v_parts || jsonb_build_object(v_source, v_part_id);
  end loop;

  for v_line in select e from jsonb_array_elements(v_plan) e loop
    insert into merch_order_items (part_id, variant_id, product_name, size, colour, unit_price_thb, quantity)
    values (
      (v_parts ->> (v_line ->> 'source'))::uuid, (v_line ->> 'variant_id')::uuid, v_line ->> 'name',
      v_line ->> 'size', v_line ->> 'colour', (v_line ->> 'price')::numeric, (v_line ->> 'qty')::int);
  end loop;

  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

comment on function place_merch_order(jsonb, text, text, text, text, text, text, text, numeric, text, text) is
  'Places a merchandise order in one transaction (0373): re-reads every line from the real tables, takes shelter stock, writes the order, its parts and its items, or changes nothing. SECURITY INVOKER and executable by service_role only: the public checkout calls it with the service role; it grants nothing.';

revoke execute on function place_merch_order(jsonb, text, text, text, text, text, text, text, numeric, text, text)
  from public, anon, authenticated;
grant execute on function place_merch_order(jsonb, text, text, text, text, text, text, text, numeric, text, text)
  to service_role;

-- 2. The merchandise shop's own hide key --------------------------------------------------------------------------------------
alter table site_content drop constraint if exists site_content_hidden_public_pages_check;
alter table site_content add constraint site_content_hidden_public_pages_check
  check (hidden_public_pages <@ array[
    'page:adopt', 'page:adopt-international', 'page:foster', 'page:volunteer', 'page:donate', 'page:appeals',
    'page:friends', 'page:friends-join', 'page:desexing', 'page:our-work', 'page:about', 'page:shop',
    'page:events', 'page:shop-merch',
    'section:adopt', 'section:get-involved', 'section:services'
  ]::text[]);

comment on column site_content.hidden_public_pages is
  'Public pages and menu sections hidden from visitors (0256, page:shop added by 0290, page:events by 0328, page:shop-merch by 0373): page:<key> or section:<key>. Empty = everything shown. Home and Privacy cannot be listed. Written under website.content; audited.';

-- 3. Audit triggers ---------------------------------------------------------------------------------------------------------------
drop trigger if exists audit_merch_products on merch_products;
create trigger audit_merch_products
  after insert or update or delete on merch_products
  for each row execute function record_audit();

-- The buyer's details are named so record_audit() leaves them out of audit_log (see the header).
drop trigger if exists audit_merch_orders on merch_orders;
create trigger audit_merch_orders
  after insert or update or delete on merch_orders
  for each row execute function record_audit('buyer_name', 'buyer_email', 'buyer_phone', 'ship_address', 'buyer_note');

drop trigger if exists audit_merch_order_parts on merch_order_parts;
create trigger audit_merch_order_parts
  after insert or update or delete on merch_order_parts
  for each row execute function record_audit();

notify pgrst, 'reload schema';
