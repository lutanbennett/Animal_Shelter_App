-- consumer: none
-- SCHEMA half of backlog item #xkfsv, deliverable "re-key the history, additively". Decision file:
-- docs/decisions/2026-11-08-suppliers-schema.md.
--
-- Exactly two columns in the schema name a supplier contact (grep of supabase/migrations, 2026-11-08): stock_receipts
-- (0096) and stock_deliveries (0308), both supplier_contact_id. Each gains supplier_id, a reference to suppliers (0335).
-- The OLD COLUMNS STAY and keep working, because every reader still uses them. The app half's final PR drops
-- supplier_contact_id from both, once nothing reads it.
--
-- Until the app half lands, writers still send only supplier_contact_id, so the two stamp functions below also fill
-- supplier_id from it. They are 0308's functions with that and nothing else added: stock_deliveries_stamp also keeps
-- supplier_id fixed once saved, as the supplier already is, and stock_receipts_stamp copies the header's supplier_id
-- onto a line with the supplier_contact_id it already copied.
-- A Vendor contact filed AFTER 0335 has no supplier row yet, so its deliveries get a null supplier_id until the app
-- half's catch-up back-fill (the 0335 insert, run again) creates the row and the statements at the foot of this file
-- are repeated. Both are safe to repeat.
-- Re-runnable. To undo: restore 0308's two functions and drop the two columns.

alter table stock_receipts add column if not exists supplier_id uuid references suppliers (id) on delete set null;
alter table stock_deliveries add column if not exists supplier_id uuid references suppliers (id) on delete set null;

comment on column stock_receipts.supplier_id is
  'The supplier this delivery came from (0337). Replaces supplier_contact_id, which stays until the app half drops it.';
comment on column stock_deliveries.supplier_id is
  'The supplier that sent this bill (0337). Replaces supplier_contact_id, which stays until the app half drops it.';

create index if not exists stock_receipts_supplier_id_idx on stock_receipts (supplier_id);
create index if not exists stock_deliveries_supplier_id_idx on stock_deliveries (supplier_id);

create or replace function stock_deliveries_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.recorded_by := auth.uid();
    new.created_at := now();
    if new.supplier_id is null and new.supplier_contact_id is not null then
      new.supplier_id := (select s.id from suppliers s where s.source_contact_id = new.supplier_contact_id);
    end if;
  else
    new.recorded_by := old.recorded_by;
    new.created_at := old.created_at;
    new.received_at := old.received_at;
    new.supplier_contact_id := old.supplier_contact_id;
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
        new.supplier_contact_id := v_header.supplier_contact_id;
        new.supplier_id := v_header.supplier_id;
      end if;
    end if;
    if new.supplier_id is null and new.supplier_contact_id is not null then
      new.supplier_id := (select s.id from suppliers s where s.source_contact_id = new.supplier_contact_id);
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

-- Back-fill the history. The user triggers are switched off for these two statements only: the cost-only trigger
-- (0235) refuses any edit but cost, the stamp would put supplier_id back, and the audit trigger would log a change
-- nobody made. Both switches are inside this file's transaction, so a failure leaves them as they were.
alter table stock_receipts disable trigger user;
alter table stock_deliveries disable trigger user;

update stock_receipts r
   set supplier_id = s.id
  from suppliers s
 where s.source_contact_id = r.supplier_contact_id
   and r.supplier_id is null;

update stock_deliveries d
   set supplier_id = s.id
  from suppliers s
 where s.source_contact_id = d.supplier_contact_id
   and d.supplier_id is null;

alter table stock_receipts enable trigger user;
alter table stock_deliveries enable trigger user;
