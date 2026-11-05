-- consumer: src/app/management/expenses/page.tsx, src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/lib/permissions/catalogue.ts
--
-- ONE CARD FOR AN OUTSIDE ACCOUNTANT TO READ THE SHELTER'S EXPENSES (Lutan, 2026-11-04: "basic reports that show expenses by type and
-- date / Month and links to the receipts", "And could all be one card"). docs/decisions/2026-11-05-accountant-card-expenses.md is the paper.
--
-- WHY A NEW LEVELLED ACTIVITY: bills.utilities, bills.general, bills.sites and donation.receipt are yes/no, so a card carrying one lets its
-- holder WRITE the money, never just read it. reports.expenses is declared the way reports.cashflow is (0132): level, read opens the screen.
--
-- WHAT THIS FILE ADDS
--   1. the activity reports.expenses (level) and the card view_expenses that holds it at read (1), in the Finances and reports feature.
--   2. expense_report(from, to) and expense_waiting_count(): security definer, each asking has_permission('reports.expenses', 'read') first,
--      because the bill tables are readable only to the activities that WRITE them. A holder of this card reads nothing else.
--   3. bill_owner_can() rebuilt from 0308 with ONE addition: READING (p_write false) a utility, general, maintenance or delivery bill's photo is
--      also allowed to a holder of reports.expenses. Writing is unchanged. Without this the receipt links would be dead for the accountant.
--
-- HOW EACH SOURCE IS COUNTED (never twice): utility_bills, general_bills and maintenance_bills by bill_date; stock_deliveries (the invoice header)
-- by bill_date, falling back to the day the goods arrived when no bill date was typed; a stock_receipts LINE only when it has NO header
-- (delivery_id null, every row older than 0308), by its own cost and the day received. A line under a header is never counted: its header is.
-- fixed_outgoings is a forecast, not spending, and is not read. Money coming in (donation_receipts) is out. Clinic visit costs are out of v1.
--
-- Nothing is given to any role and Admin gets nothing: who holds the card is an assignment in Settings then Who does what. Re-runnable.
-- String literals carry no semicolon and no double dash (scripts/check-migration-grants.mjs splits on both).

insert into permission_activities (key, kind, area, sort)
values ('reports.expenses', 'level', 'management', 82)
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

insert into card_grants (card, activity, level)
values ('view_expenses', 'reports.expenses', 1)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'view_expenses', f.id from features f where f.key = 'finances_and_reports'
on conflict (card) do update set feature_id = excluded.feature_id;

-- ---------------------------------------------------------------------------
-- Receipts: reading a bill's photo is also allowed to a holder of reports.expenses.
-- ---------------------------------------------------------------------------
create or replace function public.bill_owner_can(p_owner_type attachment_owner_type, p_write boolean)
  returns boolean
  language sql
  stable
as $$
  select case p_owner_type::text
    when 'clinic_visit' then coalesce((select has_permission('medical.visits', case when p_write then 'edit' else 'read' end)), false)
    when 'stock_receipt' then coalesce((select has_permission('stock.delivery')), false)
      or (not p_write and coalesce((select has_permission('reports.expenses', 'read')), false))
    when 'stock_delivery' then coalesce((select has_permission('stock.delivery')), false)
      or (not p_write and coalesce((select has_permission('reports.expenses', 'read')), false))
    when 'bill_inbox' then coalesce((select can_use_bills_inbox()), false)
    when 'maintenance_bill' then coalesce((select has_permission('maintenance.bills')), false)
      or (not p_write and coalesce((select has_permission('reports.expenses', 'read')), false))
    when 'utility_bill' then coalesce((select has_permission('bills.utilities')), false)
      or (not p_write and coalesce((select has_permission('reports.expenses', 'read')), false))
    when 'general_bill' then coalesce((select has_permission('bills.general')), false)
      or (not p_write and coalesce((select has_permission('reports.expenses', 'read')), false))
    else false
  end;
$$;

revoke all on function public.bill_owner_can(attachment_owner_type, boolean) from public, anon;
grant execute on function public.bill_owner_can(attachment_owner_type, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The report. One row per bill (or per headerless line), newest first. No resident, medical or personal column is read.
-- ---------------------------------------------------------------------------
create or replace function public.expense_report(p_from date, p_to date)
  returns table (
    source text,
    row_id uuid,
    bill_date date,
    kind_id uuid,
    kind_label text,
    parent_label text,
    amount numeric,
    covers_month date,
    note text,
    receipt_file_id text,
    receipt_count integer
  )
  language plpgsql
  stable
  security definer
  set search_path = public
as $$
begin
  if not coalesce((select has_permission('reports.expenses', 'read')), false) then
    raise exception 'reports.expenses is needed to read the expense report' using errcode = '42501';
  end if;

  return query
  with rows as (
    select 'utility_bill'::text as src, u.id as rid, u.bill_date as d, u.kind_id as k, u.amount as amt, u.covers_month as cm, u.note as nt
      from utility_bills u
    union all
    select 'general_bill', g.id, g.bill_date, g.kind_id, g.amount, null::date, g.note
      from general_bills g
    union all
    select 'maintenance_bill', m.id, m.bill_date, (select bk.id from bill_kinds bk where bk.key = 'maintenance'), m.amount, null::date, m.note
      from maintenance_bills m
    union all
    select 'stock_delivery', s.id, coalesce(s.bill_date, (s.received_at at time zone 'Asia/Bangkok')::date), s.kind_id, s.amount, null::date, s.note
      from stock_deliveries s
    union all
    select 'stock_receipt', r.id, (r.received_at at time zone 'Asia/Bangkok')::date,
           (select bk.id from bill_kinds bk where bk.key = case r.item_kind when 'medication' then 'medicine' else 'food' end),
           r.cost, null::date, r.note
      from stock_receipts r
     where r.delivery_id is null and r.cost is not null
  )
  select x.src, x.rid, x.d, x.k, bk.label, pk.label, x.amt, x.cm, x.nt,
         (select a.drive_file_id from attachments a where a.owner_type::text = x.src and a.owner_id = x.rid order by a.uploaded_at limit 1),
         (select count(*)::int from attachments a where a.owner_type::text = x.src and a.owner_id = x.rid)
    from rows x
    left join bill_kinds bk on bk.id = x.k
    left join bill_kinds pk on pk.id = bk.parent_id
   where x.amt is not null
     and x.k is not null
     and x.d >= p_from and x.d <= p_to
   order by x.d desc, x.rid;
end;
$$;

-- How many bills are not in the figures yet: photos still waiting in the Bills inbox, and invoices with no type chosen.
create or replace function public.expense_waiting_count()
  returns integer
  language plpgsql
  stable
  security definer
  set search_path = public
as $$
begin
  if not coalesce((select has_permission('reports.expenses', 'read')), false) then
    raise exception 'reports.expenses is needed to read the expense report' using errcode = '42501';
  end if;
  return (select count(*)::int from bills_inbox)
       + (select count(*)::int from stock_deliveries where kind_id is null);
end;
$$;

revoke all on function public.expense_report(date, date) from public, anon;
grant execute on function public.expense_report(date, date) to authenticated, service_role;
revoke all on function public.expense_waiting_count() from public, anon;
grant execute on function public.expense_waiting_count() to authenticated, service_role;

do $report$
begin
  if exists (select 1 from public.card_grants where card = 'view_expenses' and activity <> 'reports.expenses') then
    raise exception '0317 the expenses card grants something besides reports.expenses, which it must never do';
  end if;
end
$report$;

notify pgrst, 'reload schema';
