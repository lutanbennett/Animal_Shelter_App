-- consumer: none
-- Bills, one invoice with several items (schema half). Docs: docs/decisions/2026-11-03-bills-lines-schema.md.
--
-- THE FAULT: stock_receipts is one row per delivery of ONE item and stock_receipts_one_item (0096) allowed exactly
-- one of medication_id / diet_type_id, so a bill for dog food, a flea treatment and a bag of rice attached to the
-- first item and the rest were recorded with no bill. This file gives a delivery a PARENT (the invoice) and makes a
-- line either a stock item or a typed description.
--
-- WHAT IT ADDS (additive, nothing seeded, no existing row changes):
--   stock_deliveries    the invoice header: when, from whom, the bill's total, and the site / kind / account
--                       dimensions 0304 and 0305 added. The bill's photos hang HERE, so they belong to every line.
--   stock_receipts      gains delivery_id (nullable: every old row stays a delivery of its own with no header),
--                       description, and promoted_medication_id / promoted_diet_type_id (the nullable link a typed
--                       line gains when somebody accepts the offer to add it to the list).
--   stock_receipts_one_item is REPLACED by stock_receipts_one_shape: a line is exactly one of a medication line, a
--                       diet line, or a described line. A described line counts toward NO stock figure.
--   stock_delivery_totals  the bill's amount against the lines added up. A mismatch is shown, never blocked.
--   attachment owner type 'stock_delivery', allowed by the same activity as a delivery (stock.delivery).
--
-- NO NEW ACTIVITY AND NO NEW CARD: recording asks stock.delivery as the delivery form does now. NOTHING IS GRANTED TO A ROLE.
-- Re-runnable. To undo: drop the view, restore the 0096-era item_kind check and stock_receipts_one_item, restore the
-- 0143 stamp, the 0235 cost-only trigger, item_latest_delivery_cost (0199), bill_owner_can (0305) and record_attachment
-- (0306), drop the four stock_receipts columns and the stock_deliveries table. The enum value cannot be dropped.
-- String literals carry no semicolon and no double dash (scripts/check-migration-grants.mjs splits on both).

-- ---------------------------------------------------------------------------
-- 1. The owner type for the invoice's photos. Referenced below only through ::text or inside plpgsql bodies,
--    which resolve at run time, so it can be added and used by the functions in one file.
-- ---------------------------------------------------------------------------
alter type attachment_owner_type add value if not exists 'stock_delivery';

-- ---------------------------------------------------------------------------
-- 2. The invoice header
-- ---------------------------------------------------------------------------
create table if not exists stock_deliveries (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  supplier_contact_id uuid references contacts (id) on delete set null,
  bill_date date,
  amount numeric(12, 2) check (amount is null or amount >= 0),
  kind_id uuid references bill_kinds (id),
  premises_id uuid references premises (id),
  account_id uuid references bill_accounts (id),
  note text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists stock_deliveries_received_idx on stock_deliveries (received_at);
create index if not exists stock_deliveries_premises_idx on stock_deliveries (premises_id) where premises_id is not null;
comment on table stock_deliveries is
  'One bill or invoice for goods received, with its lines in stock_receipts.delivery_id (0308). The bill photos hang here (attachment owner stock_delivery) so they belong to every line. amount is the bill total as printed and is checked against the lines in stock_delivery_totals, never enforced.';
comment on column stock_deliveries.received_at is
  'When the goods arrived. Copied onto every line by the stamp trigger so the stocktake interval rule (0096) sees one instant. Fixed once saved.';

-- Who and when come from the database. received_at and supplier are fixed once saved, as a delivery's are (0235).
create or replace function stock_deliveries_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.recorded_by := auth.uid();
    new.created_at := now();
  else
    new.recorded_by := old.recorded_by;
    new.created_at := old.created_at;
    new.received_at := old.received_at;
    new.supplier_contact_id := old.supplier_contact_id;
  end if;
  return new;
end;
$$;

drop trigger if exists stock_deliveries_stamp on stock_deliveries;
create trigger stock_deliveries_stamp
  before insert or update on stock_deliveries
  for each row execute function stock_deliveries_stamp();

drop trigger if exists stock_deliveries_account_premises on stock_deliveries;
create trigger stock_deliveries_account_premises before insert or update on stock_deliveries
  for each row execute function public.bill_account_premises_in_step();

drop trigger if exists audit_stock_deliveries on stock_deliveries;
create trigger audit_stock_deliveries
  after insert or update or delete on stock_deliveries
  for each row execute function record_audit();

alter table stock_deliveries enable row level security;

drop policy if exists stock_deliveries_select_perm on stock_deliveries;
create policy stock_deliveries_select_perm on stock_deliveries for select to authenticated
  using ((select has_permission('stock.delivery')) or (select has_permission('stock.purchasing')));

drop policy if exists stock_deliveries_insert_perm on stock_deliveries;
create policy stock_deliveries_insert_perm on stock_deliveries for insert to authenticated
  with check ((select has_permission('stock.delivery')));

drop policy if exists stock_deliveries_update_perm on stock_deliveries;
create policy stock_deliveries_update_perm on stock_deliveries for update to authenticated
  using ((select has_permission('stock.delivery')))
  with check ((select has_permission('stock.delivery')));

-- Deleting a delivery is Admin only, as for its lines (0265).
drop policy if exists stock_deliveries_delete_perm on stock_deliveries;
create policy stock_deliveries_delete_perm on stock_deliveries for delete to authenticated
  using ((select public.is_admin()));

revoke all on stock_deliveries from public, anon, authenticated;
grant select, insert, update, delete on stock_deliveries to authenticated;
grant all on stock_deliveries to service_role;

-- ---------------------------------------------------------------------------
-- 3. The lines: stock_receipts gains the parent, the typed description and the promotion link
-- ---------------------------------------------------------------------------
alter table stock_receipts add column if not exists delivery_id uuid references stock_deliveries (id);
alter table stock_receipts add column if not exists description text;
alter table stock_receipts add column if not exists promoted_medication_id uuid references medication (id) on delete set null;
alter table stock_receipts add column if not exists promoted_diet_type_id uuid references diet_types (id) on delete set null;

create index if not exists stock_receipts_delivery_idx on stock_receipts (delivery_id) where delivery_id is not null;
create index if not exists stock_receipts_described_idx
  on stock_receipts ((lower(btrim(description)))) where item_kind = 'described';

comment on column stock_receipts.delivery_id is
  'The invoice this line belongs to. Null on every row recorded before 0308, each of which is a delivery of its own with no header.';
comment on column stock_receipts.description is
  'A line typed as words instead of picked from the list (item_kind described). Counts toward no stock figure, no stocktake, no reorder warning and no purchasing list.';
comment on column stock_receipts.promoted_medication_id is
  'Set when a described line was linked to a real medication. Provenance only: a linked line still counts toward no stock figure, stock starts from the next count of the new item.';
comment on column stock_receipts.promoted_diet_type_id is
  'As promoted_medication_id, for a diet.';

-- item_kind learns the third kind, and stock_receipts_one_item is REPLACED, not relaxed: each kind carries
-- exactly its own columns and none of the others.
alter table stock_receipts drop constraint if exists stock_receipts_item_kind_check;
alter table stock_receipts drop constraint if exists stock_receipts_item_kind_known;
alter table stock_receipts add constraint stock_receipts_item_kind_known
  check (item_kind in ('medication', 'diet_type', 'described'));

alter table stock_receipts drop constraint if exists stock_receipts_one_item;
alter table stock_receipts drop constraint if exists stock_receipts_one_shape;
alter table stock_receipts add constraint stock_receipts_one_shape check (
  (item_kind = 'medication'
     and medication_id is not null and diet_type_id is null
     and description is null and promoted_medication_id is null and promoted_diet_type_id is null)
  or (item_kind = 'diet_type'
     and diet_type_id is not null and medication_id is null
     and description is null and promoted_medication_id is null and promoted_diet_type_id is null)
  or (item_kind = 'described'
     and medication_id is null and diet_type_id is null
     and length(btrim(coalesce(description, ''))) > 0
     and length(btrim(coalesce(unit, ''))) > 0
     and not (promoted_medication_id is not null and promoted_diet_type_id is not null))
);

-- The stamp (0143, definer) now leaves a described line's typed unit alone and copies the header's instant and
-- supplier onto a line that has one, so the lines of one bill cannot disagree about when they arrived.
create or replace function stock_receipts_stamp()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_header stock_deliveries;
begin
  if new.item_kind = 'described' then
    null;
  elsif tg_op = 'INSERT'
     or new.medication_id is distinct from old.medication_id
     or new.diet_type_id is distinct from old.diet_type_id then
    new.unit := case new.item_kind
      when 'medication' then (select m.dose_unit from medication m where m.id = new.medication_id)
      else (select d.unit from diet_types d where d.id = new.diet_type_id)
    end;
  else
    new.unit := old.unit;
  end if;

  if tg_op = 'INSERT' then
    new.recorded_by := auth.uid();
    new.created_at := now();
    if new.delivery_id is not null then
      select * into v_header from stock_deliveries where id = new.delivery_id;
      if found then
        new.received_at := v_header.received_at;
        new.supplier_contact_id := v_header.supplier_contact_id;
      end if;
    end if;
  else
    new.recorded_by := old.recorded_by;
    new.created_at := old.created_at;
    if new.item_kind = 'described' then
      new.unit := old.unit;
    end if;
  end if;

  return new;
end;
$$;

-- 0235 said a delivery is never edited, only its cost. A described line additionally lets the promotion link be set
-- or cleared (and the foreign key's set-null on a deleted item pass through), and nothing else.
create or replace function stock_receipts_cost_only()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_open text[] := case when old.item_kind = 'described'
                        then array['cost', 'promoted_medication_id', 'promoted_diet_type_id']
                        else array['cost'] end;
begin
  if (to_jsonb(new) - v_open) is distinct from (to_jsonb(old) - v_open) then
    raise exception 'A delivery cannot be edited: delete it and record it again. Only its cost can be changed.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- A described line has no item to price against, so the latest-price view must not group the typed lines together.
create or replace view item_latest_delivery_cost
with (security_invoker = true) as
select distinct on (item_kind, coalesce(medication_id, diet_type_id))
       item_kind, medication_id, diet_type_id,
       cost / quantity as cost_per_base_unit,
       received_at
  from stock_receipts
 where cost > 0 and quantity > 0 and item_kind <> 'described'
 order by item_kind, coalesce(medication_id, diet_type_id), received_at desc, created_at desc;

revoke insert, update, delete, truncate, references, trigger on item_latest_delivery_cost from authenticated, anon;
grant select on item_latest_delivery_cost to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. The bill against its lines. security_invoker: it shows nobody more than the two tables do.
-- ---------------------------------------------------------------------------
create or replace view stock_delivery_totals with (security_invoker = true) as
select d.id as delivery_id,
       d.amount,
       count(l.id) as lines,
       count(l.id) filter (where l.cost is null) as unpriced_lines,
       sum(l.cost) as lines_cost,
       case
         when d.amount is null or count(l.id) = 0 or count(l.id) filter (where l.cost is null) > 0 then null
         else d.amount - sum(l.cost)
       end as difference
  from stock_deliveries d
  left join stock_receipts l on l.delivery_id = d.id
 group by d.id, d.amount;

comment on view stock_delivery_totals is
  'A bill''s printed amount against its lines added up. difference is amount minus the lines'' cost, null when the bill has no amount, no lines, or a line with no cost. Shown to the person, never blocks a save (0308).';

revoke all on stock_delivery_totals from public, anon, authenticated;
grant select on stock_delivery_totals to authenticated;
grant all on stock_delivery_totals to service_role;

-- ---------------------------------------------------------------------------
-- 5. The invoice's photos: the owner type is allowed by the delivery activity, as stock_receipt is
-- ---------------------------------------------------------------------------
create or replace function public.bill_owner_can(p_owner_type attachment_owner_type, p_write boolean)
  returns boolean
  language sql
  stable
as $$
  select case p_owner_type::text
    when 'clinic_visit' then coalesce((select has_permission('medical.visits', case when p_write then 'edit' else 'read' end)), false)
    when 'stock_receipt' then coalesce((select has_permission('stock.delivery')), false)
    when 'stock_delivery' then coalesce((select has_permission('stock.delivery')), false)
    when 'bill_inbox' then coalesce((select can_use_bills_inbox()), false)
    when 'maintenance_bill' then coalesce((select has_permission('maintenance.bills')), false)
    when 'utility_bill' then coalesce((select has_permission('bills.utilities')), false)
    when 'general_bill' then coalesce((select has_permission('bills.general')), false)
    else false
  end;
$$;

-- record_attachment(), rebuilt from 0306 with one added case. The signature is unchanged, so this replaces it in place.
create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null,
  p_purpose text default 'bill',
  p_media_kind text default 'photo'
)
returns table(attachment attachments, is_profile boolean)
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_allowed boolean;
  v_medical boolean := lower(btrim(coalesce(p_sub_folder, ''), E' \t\r\n\f\v')) = 'medical';
  v_is_picture boolean;
begin
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;

  if p_media_kind is null or p_media_kind not in ('photo', 'video') then
    raise exception 'Not a valid media kind.';
  end if;
  v_is_picture := p_media_kind = 'photo' and coalesce(p_file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$';

  v_allowed := case p_owner_type::text
    when 'resident' then coalesce((select has_permission('photos.resident_add')), false)
                      or coalesce((select has_permission('photos.shelter_add')), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_delivery' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'utility_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'general_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end;

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  if p_owner_type::text = 'resident' and v_medical
     and not coalesce((select has_permission('photos.medical_add')), false) then
    raise exception 'This login may not add photos to the Medical folder.';
  end if;

  if p_owner_type::text = 'resident'
     and not v_medical
     and not (select can_publish_resident_photos())
     and not (
       p_adoption_update_id is null
       and lower(btrim(coalesce(p_sub_folder, ''))) = 'shelter'
       and coalesce((select has_permission('photos.shelter_add')), false)
     ) then
    raise exception 'This login can add photos to the Shelter folder only.';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type::text = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id, purpose, media_kind)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id, p_purpose, p_media_kind)
  returning * into v_attachment;

  if p_owner_type::text = 'resident' and v_attachment.approved_at is not null and not v_medical and v_is_picture then
    update residents
    set profile_photo_drive_file_id = p_drive_file_id
    where id = p_owner_id
      and profile_photo_drive_file_id is null;

    if found then
      v_is_profile := true;
    end if;
  end if;

  return query select v_attachment, v_is_profile;
end;
$$;

revoke all on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text, text) from public, anon;
grant execute on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
