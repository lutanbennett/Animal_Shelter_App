-- consumer: src/app/management/merch-shop/page.tsx, src/app/management/merch-shop/actions.ts
--
-- STAFF CAN ADD AND REMOVE A CURRENCY THE MERCHANDISE SHOP QUOTES IN (backlog #p8fwd; docs/decisions/2026-11-14-merch-currency.md).
-- 0374 left the five rates editable but a sixth currency needed a migration. Insert and delete now resolve through
-- has_permission('merch.manage'), the activity the update policy already asks; no new card. Removing is safe: an order stores
-- its own currency as text and the rate it was quoted at (merch_orders.exchange_rate), with no foreign key to this table.
-- The checkout lists whatever rows exist, so an added currency reaches the buyer with nothing else to change.

grant insert, delete on merch_exchange_rates to authenticated;

drop policy if exists merch_exchange_rates_insert_perm on merch_exchange_rates;
create policy merch_exchange_rates_insert_perm on merch_exchange_rates for insert to authenticated
  with check ((select has_permission('merch.manage')));
drop policy if exists merch_exchange_rates_delete_perm on merch_exchange_rates;
create policy merch_exchange_rates_delete_perm on merch_exchange_rates for delete to authenticated
  using ((select has_permission('merch.manage')));

-- The stamp on a new row comes from the session too, never from the form.
create or replace function merch_exchange_rates_stamp_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.set_by := auth.uid();
  new.set_at := now();
  return new;
end;
$$;
revoke execute on function merch_exchange_rates_stamp_insert() from public, anon, authenticated;

drop trigger if exists merch_exchange_rates_stamp_insert on merch_exchange_rates;
create trigger merch_exchange_rates_stamp_insert
  before insert on merch_exchange_rates
  for each row execute function merch_exchange_rates_stamp_insert();
