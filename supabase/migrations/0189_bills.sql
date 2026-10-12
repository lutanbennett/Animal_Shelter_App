-- consumer: none (nothing reads these yet; the `bills-inbox` stream reads bills_inbox and the new attachment owners, the `maintenance-bills` stream reads maintenance_bills, maintenance_job_cost and maintenance.bills)
-- Bills, part 2 of 2: the new activity, the inbox, per-job maintenance bills, the job-cost view and
-- the attachment policies for the four owner types 0188 added. Additive; no existing row changes.
-- Re-runnable. To undo: drop the view, the two tables and the two helper functions, drop the activity,
-- restore the four attachments_*_perm policies from 0152.
--
-- A bill photo is an `attachments` row (Drive plumbing unchanged). Matching an inbox photo moves it:
-- the app updates the row's owner_type/owner_id from ('bill_inbox', card) to the visit, delivery or
-- job, then deletes the card. The update check asks the NEW owner's activity too, so a photo cannot be
-- moved onto something its mover may not write.

-- ---------------------------------------------------------------------------
-- 1. The activity: maintenance.bills (yes/no), Management only (Lutan, 2026-10-12). Admin needs no cell.
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('maintenance.bills', 'yesno', 'maintenance', 62)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into role_permissions (role_id, activity, level)
select r.id, 'maintenance.bills', 2
  from roles r
 where r.key = 'management'
on conflict (role_id, activity) do nothing;

-- ---------------------------------------------------------------------------
-- 2. The bills inbox: a photo not yet matched. The photo itself is the attachments row.
-- ---------------------------------------------------------------------------
create or replace function public.can_use_bills_inbox()
  returns boolean
  language sql
  stable
as $$
  select coalesce((select has_permission('stock.delivery')), false)
      or coalesce((select has_permission('medical.visits')), false)
      or coalesce((select has_permission('maintenance.bills')), false);
$$;

revoke all on function public.can_use_bills_inbox() from public, anon;
grant execute on function public.can_use_bills_inbox() to authenticated, service_role;

create table if not exists bills_inbox (
  id uuid primary key default gen_random_uuid(),
  taken_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  bill_date date,
  amount numeric(12, 2) check (amount is null or amount >= 0),
  note text
);

create index if not exists bills_inbox_created_idx on bills_inbox (created_at);

alter table bills_inbox enable row level security;

drop policy if exists bills_inbox_perm on bills_inbox;
create policy bills_inbox_perm on bills_inbox for all to authenticated
  using ((select can_use_bills_inbox()))
  with check ((select can_use_bills_inbox()));

revoke all on bills_inbox from anon, authenticated, service_role;
grant select, insert, update, delete on bills_inbox to authenticated;
grant all on bills_inbox to service_role;

-- ---------------------------------------------------------------------------
-- 3. Maintenance bills: one row per bill, so a job's cost is a sum that cannot drift.
-- ---------------------------------------------------------------------------
create table if not exists maintenance_bills (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references maintenance (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  bill_date date not null default current_date,
  note text,
  added_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists maintenance_bills_job_idx on maintenance_bills (maintenance_id);

alter table maintenance_bills enable row level security;

drop policy if exists maintenance_bills_perm on maintenance_bills;
create policy maintenance_bills_perm on maintenance_bills for all to authenticated
  using ((select has_permission('maintenance.bills')))
  with check ((select has_permission('maintenance.bills')));

revoke all on maintenance_bills from anon, authenticated, service_role;
grant select, insert, update, delete on maintenance_bills to authenticated;
grant all on maintenance_bills to service_role;

-- The job's cost, worked out in the database: the sum of its bills once it has any, otherwise the
-- typed actual_cost. security_invoker, so a login without maintenance.bills sees no bills and gets the
-- typed number (the app hides amounts from them anyway).
create or replace view maintenance_job_cost
  with (security_invoker = true) as
select m.id as maintenance_id,
       b.bill_count,
       b.bills_total,
       m.actual_cost as typed_actual_cost,
       case when b.bill_count > 0 then b.bills_total else m.actual_cost end as actual_cost,
       (b.bill_count > 0) as from_bills
  from maintenance m
  left join lateral (
    select count(*)::int as bill_count, coalesce(sum(mb.amount), 0) as bills_total
      from maintenance_bills mb
     where mb.maintenance_id = m.id
  ) b on true;

revoke all on maintenance_job_cost from anon, authenticated, service_role;
grant select on maintenance_job_cost to authenticated;
grant all on maintenance_job_cost to service_role;

-- ---------------------------------------------------------------------------
-- 4. Attachment policies: the 0152 cells plus the four new owner types.
--    Reading asks Read where the activity has levels; writing asks Edit. Any other owner type: no.
-- ---------------------------------------------------------------------------
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
    else false
  end;
$$;

revoke all on function public.bill_owner_can(attachment_owner_type, boolean) from public, anon;
grant execute on function public.bill_owner_can(attachment_owner_type, boolean) to authenticated, service_role;

drop policy if exists attachments_select_perm on attachments;
create policy attachments_select_perm on attachments for select to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('resident.record', 'read')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests', 'read')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures', 'read')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else (select bill_owner_can(owner_type, false))
    end
  );

drop policy if exists attachments_insert_perm on attachments;
create policy attachments_insert_perm on attachments for insert to authenticated
  with check (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_add')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else (select bill_owner_can(owner_type, true))
    end
  );

drop policy if exists attachments_update_perm on attachments;
create policy attachments_update_perm on attachments for update to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else (select bill_owner_can(owner_type, true))
    end
  )
  with check (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else (select bill_owner_can(owner_type, true))
    end
  );

drop policy if exists attachments_delete_perm on attachments;
create policy attachments_delete_perm on attachments for delete to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else (select bill_owner_can(owner_type, true))
    end
  );

-- record_attachment() (0178) is the app's write path and is definer: it refuses an owner type it does
-- not list. Bills go through it from the later streams, which add their cases there; until then it
-- fails closed for the four new values, as 0174 intended for any new owner type.
