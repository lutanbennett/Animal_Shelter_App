-- consumer: src/app/management/expenses/page.tsx
-- Vet visit costs join the expense report, as ONE type (Veterinary). Lutan, 2026-11-05: every visit counts as one type; the
-- per-reason breakdown was offered and declined. No column is added anywhere. clinic_visits has no kind_id, so a visit row comes
-- back with kind_id and kind_label null and source 'clinic_visit', and the page prints the (translated) heading.
-- What a visit row exposes: its date and its cost, nothing else. No resident, no reason, no note, and NO receipt: attachments on a
-- visit are medical documents as often as invoices, and bill_owner_can() rightly asks medical.visits for them. The page says the
-- invoice is kept on the visit record. Counted: visits not archived, not cancelled, with a cost, by appointment day (Bangkok).
-- Otherwise identical to 0317's expense_report. Re-runnable.

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
    union all
    select 'clinic_visit', v.id, (v.appointment_date at time zone 'Asia/Bangkok')::date, null::uuid, v.cost, null::date, null::text
      from clinic_visits v
     where v.archived_at is null and v.status <> 'cancelled' and v.cost is not null
  )
  select x.src, x.rid, x.d, x.k, bk.label, pk.label, x.amt, x.cm, x.nt,
         case when x.src = 'clinic_visit' then null::text
              else (select a.drive_file_id from attachments a where a.owner_type::text = x.src and a.owner_id = x.rid order by a.uploaded_at limit 1) end,
         case when x.src = 'clinic_visit' then 0
              else (select count(*)::int from attachments a where a.owner_type::text = x.src and a.owner_id = x.rid) end
    from rows x
    left join bill_kinds bk on bk.id = x.k
    left join bill_kinds pk on pk.id = bk.parent_id
   where x.amt is not null
     and (x.k is not null or x.src = 'clinic_visit')
     and x.d >= p_from and x.d <= p_to
   order by x.d desc, x.rid;
end;
$$;
