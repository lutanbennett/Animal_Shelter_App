-- consumer: src/lib/permissions/cards.ts, src/lib/permissions/catalogue.ts, src/app/bills/actions.ts, src/lib/bills/access.ts, src/app/maintenance/bills-actions.ts
-- Bills, sites and kinds, part 2 of 2. Docs: docs/decisions/2026-11-03-bills-sites-schema.md.
--
-- "SITE" HERE MEANS A PREMISES: A PLACE THE SHELTER PAYS BILLS FOR (the shelter itself, a second property, ...).
-- It has NOTHING to do with 0059_site_pages.sql, which is the public WEBSITE's pages. To keep the two apart
-- this file never uses "sites" as a table name: the table is `premises`.
--
-- WHAT IT ADDS (all additive, nothing seeded for premises or accounts, no count of premises in code):
--   premises          a place bills are paid for. Data, added without a deploy.
--   bill_accounts     an account at a supplier, optionally at one premises (a water account, an electricity account).
--   bill_kinds        what an invoice is for. Data. One catalogue: utility types are CHILD kinds of Utilities.
--   utility_bills     cost only (no units, no meter reading) for the month a utility bill covers.
--   general_bills     a bill of any kind with no table of its own: materials, cleaning, Other.
--   premises_id, account_id (nullable) on bills_inbox and maintenance_bills, kind_id (nullable) on bills_inbox.
-- EVERY FOREIGN KEY A KIND IMPLIES IS OPTIONAL: an Other bill (domain renewal, accountant) belongs to no
-- premises, no account, no visit, no delivery and no job and has no item lines.
--
-- THREE NEW ACTIVITIES, THREE NEW CARDS, NO ROLE IS GIVEN ANYTHING: bills.utilities, bills.general, bills.sites.
-- Who holds them is Settings -> Who does what. Admin sits outside the card system.
-- Re-runnable. To undo: drop the five tables, the trigger function, the new columns, the three activities and
-- their card_grants rows, and restore can_use_bills_inbox() and bill_owner_can() from 0189.
-- String literals carry no semicolon and no double dash (scripts/check-migration-grants.mjs splits on both).

-- ---------------------------------------------------------------------------
-- 1. The activities, and the two helper functions that must now know them
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort) values
  ('bills.utilities', 'yesno', 'maintenance', 76),
  ('bills.general', 'yesno', 'maintenance', 77),
  ('bills.sites', 'yesno', 'maintenance', 78)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- Who may use the bills page at all: the old three plus the two new bill-writing activities.
create or replace function public.can_use_bills_inbox()
  returns boolean
  language sql
  stable
as $$
  select coalesce((select has_permission('stock.delivery')), false)
      or coalesce((select has_permission('medical.visits')), false)
      or coalesce((select has_permission('maintenance.bills')), false)
      or coalesce((select has_permission('bills.utilities')), false)
      or coalesce((select has_permission('bills.general')), false);
$$;

-- Anything that lets a login SEE the catalogue (premises, accounts, kinds) it fills in on a bill.
create or replace function public.can_see_bill_catalogue()
  returns boolean
  language sql
  stable
as $$
  select coalesce((select can_use_bills_inbox()), false)
      or coalesce((select has_permission('bills.sites')), false);
$$;

revoke all on function public.can_see_bill_catalogue() from public, anon;
grant execute on function public.can_see_bill_catalogue() to authenticated, service_role;

create or replace function public.bill_owner_can(p_owner_type attachment_owner_type, p_write boolean)
  returns boolean
  language sql
  stable
as $$
  select case p_owner_type::text
    when 'clinic_visit' then coalesce((select has_permission('medical.visits', case when p_write then 'edit' else 'read' end)), false)
    when 'stock_receipt' then coalesce((select has_permission('stock.delivery')), false)
    when 'bill_inbox' then coalesce((select can_use_bills_inbox()), false)
    when 'maintenance_bill' then coalesce((select has_permission('maintenance.bills')), false)
    when 'utility_bill' then coalesce((select has_permission('bills.utilities')), false)
    when 'general_bill' then coalesce((select has_permission('bills.general')), false)
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 2. premises: places bills are paid for. Nothing seeded.
-- ---------------------------------------------------------------------------
create table if not exists premises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  note text,
  archived_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create unique index if not exists premises_name_uniq on premises (lower(btrim(name)));
comment on table premises is 'A place the shelter pays bills for. NOT the website pages (site_pages, 0059).';

alter table premises enable row level security;
drop policy if exists premises_select_perm on premises;
create policy premises_select_perm on premises for select to authenticated
  using (
    (select has_permission('stock.delivery')) or (select has_permission('medical.visits'))
    or (select has_permission('maintenance.bills')) or (select has_permission('bills.utilities'))
    or (select has_permission('bills.general')) or (select has_permission('bills.sites'))
  );
drop policy if exists premises_write_perm on premises;
create policy premises_write_perm on premises for all to authenticated
  using ((select has_permission('bills.sites')))
  with check ((select has_permission('bills.sites')));

revoke all on premises from anon, authenticated, service_role;
grant select, insert, update, delete on premises to authenticated;
grant all on premises to service_role;

-- ---------------------------------------------------------------------------
-- 3. bill_kinds: what an invoice is for. One catalogue; a utility type is a CHILD kind of Utilities.
-- ---------------------------------------------------------------------------
create table if not exists bill_kinds (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (length(btrim(label)) > 0),
  parent_id uuid references bill_kinds (id),
  sort integer not null default 100,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists bill_kinds_parent_idx on bill_kinds (parent_id);
comment on table bill_kinds is 'The catalogue of invoice kinds is data. What each kind asks for on the form is code, keyed by bill_kinds.key.';

alter table bill_kinds enable row level security;
drop policy if exists bill_kinds_select_perm on bill_kinds;
create policy bill_kinds_select_perm on bill_kinds for select to authenticated
  using (
    (select has_permission('stock.delivery')) or (select has_permission('medical.visits'))
    or (select has_permission('maintenance.bills')) or (select has_permission('bills.utilities'))
    or (select has_permission('bills.general')) or (select has_permission('bills.sites'))
  );
drop policy if exists bill_kinds_write_perm on bill_kinds;
create policy bill_kinds_write_perm on bill_kinds for all to authenticated
  using ((select has_permission('bills.sites')))
  with check ((select has_permission('bills.sites')));

revoke all on bill_kinds from anon, authenticated, service_role;
grant select, insert, update, delete on bill_kinds to authenticated;
grant all on bill_kinds to service_role;

-- The starting catalogue. The first three are what the inbox matches today and are kept. Lutan's list is open
-- (he said etc twice), so more are added as data. These are kinds, not premises: no place is seeded.
insert into bill_kinds (key, label, sort) values
  ('vet_appointment', 'Vet appointment', 10),
  ('food', 'Food', 20),
  ('medicine', 'Medicine', 30),
  ('maintenance', 'Maintenance', 40),
  ('materials', 'Materials and equipment', 50),
  ('cleaning_products', 'Cleaning products', 60),
  ('utilities', 'Utilities', 70),
  ('other', 'Other', 900)
on conflict (key) do nothing;

insert into bill_kinds (key, label, parent_id, sort)
select v.key, v.label, p.id, v.sort
  from (values
    ('utility_water', 'Water', 10),
    ('utility_electricity', 'Electricity', 20),
    ('utility_internet', 'Internet', 30),
    ('utility_phone', 'Phone', 40),
    ('utility_gas', 'Gas', 50),
    ('utility_waste', 'Waste', 60)
  ) as v (key, label, sort)
  cross join (select id from bill_kinds where key = 'utilities') p
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. bill_accounts: an account at a supplier, at one premises or none.
-- ---------------------------------------------------------------------------
create table if not exists bill_accounts (
  id uuid primary key default gen_random_uuid(),
  premises_id uuid references premises (id),
  kind_id uuid references bill_kinds (id),
  supplier text not null check (length(btrim(supplier)) > 0),
  account_ref text,
  note text,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists bill_accounts_premises_idx on bill_accounts (premises_id);

alter table bill_accounts enable row level security;
drop policy if exists bill_accounts_select_perm on bill_accounts;
create policy bill_accounts_select_perm on bill_accounts for select to authenticated
  using (
    (select has_permission('stock.delivery')) or (select has_permission('medical.visits'))
    or (select has_permission('maintenance.bills')) or (select has_permission('bills.utilities'))
    or (select has_permission('bills.general')) or (select has_permission('bills.sites'))
  );
drop policy if exists bill_accounts_write_perm on bill_accounts;
create policy bill_accounts_write_perm on bill_accounts for all to authenticated
  using ((select has_permission('bills.sites')))
  with check ((select has_permission('bills.sites')));

revoke all on bill_accounts from anon, authenticated, service_role;
grant select, insert, update, delete on bill_accounts to authenticated;
grant all on bill_accounts to service_role;

-- A bill that names an account takes that account's premises, and may not name a different one. Plain trigger,
-- not definer, and it grants nothing: it only keeps two columns of one row in step.
create or replace function public.bill_account_premises_in_step()
  returns trigger
  language plpgsql
as $$
declare
  v_premises uuid;
begin
  if new.account_id is not null then
    select premises_id into v_premises from bill_accounts where id = new.account_id;
    if v_premises is not null then
      if new.premises_id is null then
        new.premises_id := v_premises;
      elsif new.premises_id <> v_premises then
        raise exception 'This account belongs to a different place than the one chosen.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. utility_bills: cost only. No units, no meter reading (Lutan, 2026-11-03).
-- ---------------------------------------------------------------------------
create table if not exists utility_bills (
  id uuid primary key default gen_random_uuid(),
  kind_id uuid not null references bill_kinds (id),
  premises_id uuid references premises (id),
  account_id uuid references bill_accounts (id),
  bill_date date not null default current_date,
  covers_month date not null check (covers_month = date_trunc('month', covers_month)::date),
  amount numeric(12, 2) not null check (amount >= 0),
  note text,
  added_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
comment on column utility_bills.covers_month is 'The first day of the month the bill covers.';
create index if not exists utility_bills_premises_idx on utility_bills (premises_id, covers_month);
create index if not exists utility_bills_kind_idx on utility_bills (kind_id);

-- ---------------------------------------------------------------------------
-- 6. general_bills: any kind with no table of its own. Everything but kind and amount is optional.
--    An Other bill is a row here with premises_id and account_id null.
-- ---------------------------------------------------------------------------
create table if not exists general_bills (
  id uuid primary key default gen_random_uuid(),
  kind_id uuid not null references bill_kinds (id),
  premises_id uuid references premises (id),
  account_id uuid references bill_accounts (id),
  bill_date date not null default current_date,
  amount numeric(12, 2) not null check (amount >= 0),
  note text,
  added_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists general_bills_premises_idx on general_bills (premises_id);
create index if not exists general_bills_kind_idx on general_bills (kind_id);

alter table utility_bills enable row level security;
drop policy if exists utility_bills_perm on utility_bills;
create policy utility_bills_perm on utility_bills for all to authenticated
  using ((select has_permission('bills.utilities')))
  with check ((select has_permission('bills.utilities')));
revoke all on utility_bills from anon, authenticated, service_role;
grant select, insert, update, delete on utility_bills to authenticated;
grant all on utility_bills to service_role;

alter table general_bills enable row level security;
drop policy if exists general_bills_perm on general_bills;
create policy general_bills_perm on general_bills for all to authenticated
  using ((select has_permission('bills.general')))
  with check ((select has_permission('bills.general')));
revoke all on general_bills from anon, authenticated, service_role;
grant select, insert, update, delete on general_bills to authenticated;
grant all on general_bills to service_role;

-- ---------------------------------------------------------------------------
-- 7. Additive nullable columns on the two bill tables that exist already. Existing rows have no place or kind.
--    maintenance_bills gets a place of its own: a job has only a zone, which is not a premises.
-- ---------------------------------------------------------------------------
alter table bills_inbox add column if not exists kind_id uuid references bill_kinds (id);
alter table bills_inbox add column if not exists premises_id uuid references premises (id);
alter table bills_inbox add column if not exists account_id uuid references bill_accounts (id);
alter table maintenance_bills add column if not exists premises_id uuid references premises (id);
alter table maintenance_bills add column if not exists account_id uuid references bill_accounts (id);

drop trigger if exists bills_inbox_account_premises on bills_inbox;
create trigger bills_inbox_account_premises before insert or update on bills_inbox
  for each row execute function public.bill_account_premises_in_step();
drop trigger if exists maintenance_bills_account_premises on maintenance_bills;
create trigger maintenance_bills_account_premises before insert or update on maintenance_bills
  for each row execute function public.bill_account_premises_in_step();
drop trigger if exists utility_bills_account_premises on utility_bills;
create trigger utility_bills_account_premises before insert or update on utility_bills
  for each row execute function public.bill_account_premises_in_step();
drop trigger if exists general_bills_account_premises on general_bills;
create trigger general_bills_account_premises before insert or update on general_bills
  for each row execute function public.bill_account_premises_in_step();

-- ---------------------------------------------------------------------------
-- 8. The cards. Nothing is given to a role.
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level) values
  ('utility_bills', 'bills.utilities', 2),
  ('general_bills', 'bills.general', 2),
  ('bill_sites', 'bills.sites', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select c.card, cf.feature_id
  from (values ('utility_bills'), ('general_bills'), ('bill_sites')) c (card)
  cross join (select feature_id from card_features where card = 'bills') cf
on conflict (card) do update set feature_id = excluded.feature_id;

do $report$
begin
  if (select count(*) from public.card_grants where card in ('utility_bills', 'general_bills', 'bill_sites')) <> 3 then
    raise exception '0305 the three new cards do not each grant exactly their one activity';
  end if;
end
$report$;

notify pgrst, 'reload schema';
