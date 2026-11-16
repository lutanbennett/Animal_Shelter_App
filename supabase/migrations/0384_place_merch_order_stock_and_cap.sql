-- consumer: src/lib/merch/checkout.ts, src/app/shop/merch/checkout/actions.ts
-- 0384: place_merch_order() stops leaking shelf stock and caps open orders per email (#py2b1; docs/decisions/2026-11-16-shop-order-flood-bound.md).
--   1. THE LEAK: in 0373 the stock decrement ran inside the line loop, but a later unavailable line RETURNS (does not raise), so the
--      transaction committed earlier lines decrements with no order row. Now nothing is decremented until every line has passed.
--   2. THE CAP: one email may hold at most 3 unpaid (awaiting) orders; the next returns {"ok": false, "error": "too_many"}.
-- Same signature as 0373, so create or replace; grants restated. Grants nothing (no card). Re-runnable. Undo: re-apply 0373 body.

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
  v_open int;
begin
  -- Open-order cap: one email may hold at most 3 unpaid orders at once.
  select count(*) into v_open from merch_orders where lower(buyer_email) = lower(p_buyer_email) and payment_state = 'awaiting';
  if v_open >= 3 then
    return jsonb_build_object('ok', false, 'error', 'too_many');
  end if;

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
    -- Stock is taken only now, after every line passed and the order row exists, so a refusal can never leave stock taken.
    if v_line ->> 'source' = 'shelter' then
      update merch_variants set shelter_stock = shelter_stock - (v_line ->> 'qty')::int where id = (v_line ->> 'variant_id')::uuid;
    end if;
    insert into merch_order_items (part_id, variant_id, product_name, size, colour, unit_price_thb, quantity)
    values (
      (v_parts ->> (v_line ->> 'source'))::uuid, (v_line ->> 'variant_id')::uuid, v_line ->> 'name',
      v_line ->> 'size', v_line ->> 'colour', (v_line ->> 'price')::numeric, (v_line ->> 'qty')::int);
  end loop;

  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

revoke execute on function place_merch_order(jsonb, text, text, text, text, text, text, text, numeric, text, text) from public, anon, authenticated;
grant execute on function place_merch_order(jsonb, text, text, text, text, text, text, text, numeric, text, text) to service_role;
notify pgrst, 'reload schema';
