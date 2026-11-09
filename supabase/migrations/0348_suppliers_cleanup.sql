-- consumer: none
-- Final half of backlog item #xkfsv. Decision file: docs/decisions/2026-11-09-suppliers-cleanup.md.
--
-- Drops what the schema half (0335, 0337) kept only until the app half (0338) had settled: stock_receipts.supplier_contact_id,
-- stock_deliveries.supplier_contact_id, suppliers.source_contact_id and the stock_vendors view. Nothing in src/ or worker/ reads any
-- of them. Two stamp functions (0337) still NAME the old columns, so they are rewritten first, without them: a plpgsql body is not
-- checked when its column goes, so leaving them would pass the dry-run and fail on the first delivery saved.
-- Then the Vendor contact rows are ARCHIVED, not deleted (Contacts has hidden them since 0338; their history stays).
-- Re-runnable. NOT reversible once applied to a database that held the old columns.

do $guard$
begin
  -- Refuse, rather than lose a link, if any history still names a contact but not its supplier.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'stock_receipts' and column_name = 'supplier_contact_id') then
    if exists (select 1 from public.stock_receipts where supplier_contact_id is not null and supplier_id is null)
       or exists (select 1 from public.stock_deliveries where supplier_contact_id is not null and supplier_id is null) then
      raise exception '0348 a delivery or bill still names a supplier contact with no supplier_id; the twinning is incomplete, nothing dropped';
    end if;
  end if;
end
$guard$;

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
    new.supplier_id := old.supplier_id;
  end if;
  return new;
end;
$$;

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
        new.supplier_id := v_header.supplier_id;
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

-- Retire the Vendor contacts: archive, keep the row and everything that points at it. Done before source_contact_id goes so the
-- reason can be written only for a row that really has its supplier twin.
update contacts c
   set archived_at = now(),
       archive_reason = 'Moved to Suppliers (0348)'
 where c.type = 'Vendor'
   and c.archived_at is null
   and (not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'suppliers' and column_name = 'source_contact_id')
        or exists (select 1 from suppliers s where to_jsonb(s) ->> 'source_contact_id' = c.id::text));

drop view if exists stock_vendors;
alter table stock_receipts drop column if exists supplier_contact_id;
alter table stock_deliveries drop column if exists supplier_contact_id;
alter table suppliers drop column if exists source_contact_id;

comment on column stock_receipts.supplier_id is 'The supplier this delivery came from (0337).';
comment on column stock_deliveries.supplier_id is 'The supplier that sent this bill (0337).';
comment on table suppliers is
  'A business the shelter buys from (0335). Its own record: Contacts holds only people. Delivered stock and bills name one (0337), and a supplier can be a Shelter Friend (0336).';

notify pgrst, 'reload schema';
