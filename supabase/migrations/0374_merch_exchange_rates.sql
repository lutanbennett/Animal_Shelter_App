-- consumer: src/lib/merch/checkout.ts, src/app/management/merch-shop/page.tsx, src/app/management/merch-shop/actions.ts
--
-- THE MERCHANDISE SHOP'S EXCHANGE RATES, AS DATA (backlog #r4ktv; docs/decisions/2026-11-13-merch-exchange-rate.md).
-- They were a dated constant in src/lib/merch/shop.ts. One row per currency an overseas buyer may be quoted in: baht per
-- one unit, who set it and when. Seeded with the five figures the constant held (dated 2026-11-13), so the shop behaves
-- identically the moment this lands. Staff edit a rate on /management/merch-shop (merch.manage at edit); there is no paid
-- rate service (zero ongoing cost).
--
-- ACCESS: read and update resolve through has_permission('merch.manage'), the activity the rest of the staff shop asks.
-- No insert or delete policy: a currency is added by a migration, not by a screen (nothing asked for that). The checkout
-- reads it with the service role, as it reads every merch_* table; the table is closed to anon.

create table if not exists merch_exchange_rates (
  currency     text primary key check (currency ~ '^[A-Z]{3}$'),
  thb_per_unit numeric(12, 4) not null check (thb_per_unit > 0),
  set_by       uuid references auth.users (id),
  set_at       timestamptz not null default now()
);

-- record_audit() (0195) names the row by its uuid id, so the table carries one beside the currency key.
alter table merch_exchange_rates add column if not exists id uuid not null default gen_random_uuid();

comment on table merch_exchange_rates is
  'Baht per one unit of each currency the merchandise shop quotes an overseas buyer in (0374). Edited by staff holding merch.manage; the buyer is shown the rate and its date. An order keeps the rate it was quoted at (merch_orders.exchange_rate).';

insert into merch_exchange_rates (currency, thb_per_unit, set_at) values
  ('USD', 35, '2026-11-13'),
  ('EUR', 38, '2026-11-13'),
  ('GBP', 44, '2026-11-13'),
  ('AUD', 23, '2026-11-13'),
  ('SGD', 26, '2026-11-13')
on conflict (currency) do nothing;

alter table merch_exchange_rates enable row level security;
revoke all on merch_exchange_rates from anon;
grant select, update on merch_exchange_rates to authenticated;
grant select on merch_exchange_rates to service_role;

drop policy if exists merch_exchange_rates_select_perm on merch_exchange_rates;
create policy merch_exchange_rates_select_perm on merch_exchange_rates for select to authenticated
  using ((select has_permission('merch.manage', 'read')));
drop policy if exists merch_exchange_rates_update_perm on merch_exchange_rates;
create policy merch_exchange_rates_update_perm on merch_exchange_rates for update to authenticated
  using ((select has_permission('merch.manage')))
  with check ((select has_permission('merch.manage')));

-- The stamp comes from the session, never from the form.
create or replace function merch_exchange_rates_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.currency := old.currency;
  new.set_by := auth.uid();
  new.set_at := now();
  return new;
end;
$$;
revoke execute on function merch_exchange_rates_stamp() from public, anon, authenticated;

drop trigger if exists merch_exchange_rates_stamp on merch_exchange_rates;
create trigger merch_exchange_rates_stamp
  before update on merch_exchange_rates
  for each row execute function merch_exchange_rates_stamp();

drop trigger if exists audit_merch_exchange_rates on merch_exchange_rates;
create trigger audit_merch_exchange_rates
  after insert or update or delete on merch_exchange_rates
  for each row execute function record_audit();
