-- consumer: none
-- SCHEMA half of backlog item #xkfsv, the Supplier piece: suppliers leave Contacts entirely (Lutan, 2026-11-08,
-- asked directly: "Leave contacts entirely"). Contacts will hold only people. Decision file:
-- docs/decisions/2026-11-08-suppliers-schema.md, which records the columns carried and dropped, the Shelter Friend
-- subject (0336) and the history re-key (0337).
--
-- NOTHING READS THIS YET: every reader under src/ (deliveries, bills, purchasing, carers.ts) still reads the Vendor
-- contacts. The app half re-points them. Until it lands the table is filled once, by the back-fill below.
--
-- NO NEW ACTIVITY AND NO NEW CARD, on purpose. A card must apply the access that lets its activity be performed, and a
-- supplier card with no supplier screen would do nothing. The card belongs to the app half with the screen it opens.
-- So the policies below ask the activities that already guard the same data today: the ones the stock, bills and
-- Shelter Friends screens hold to read a supplier, and contacts.add / contacts.directory to write one (who could file a
-- Vendor before is who can write a supplier now). The app half narrows these to its own activity when it adds the card.
--
-- COLUMNS. Carried from contacts (0001, 0036, 0037, 0054, 0075, 0164): name, phone, email, line_id, messenger_id,
-- whatsapp, address, map_url (with its form check), notes, the three archive columns, created_at. Dropped: type (a
-- supplier is one thing). Added: source_contact_id, the contact the row was copied from, unique so the back-fill is
-- safe to run twice and so 0337 can re-key history by it. The app half drops it with the old columns.
-- Re-runnable. To undo: drop table suppliers (after 0336 and 0337 are undone).

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  line_id text,
  messenger_id text,
  whatsapp text,
  address text,
  map_url text,
  notes text,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  archive_reason text,
  source_contact_id uuid unique references contacts (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint suppliers_map_url_form check (map_url ~* '^https?://[^[:space:]]+$')
);

comment on table suppliers is
  'A business the shelter buys from (0335). Its own record: Contacts holds only people. Delivered stock and bills name one (0337), and a supplier can be a Shelter Friend (0336). source_contact_id is the Vendor contact it was copied from.';
comment on column suppliers.source_contact_id is
  'The Vendor contact this row was copied from by the 0335 back-fill. Unique, so the copy is safe to repeat. Null for a supplier created afterwards.';

create index if not exists suppliers_name_idx on suppliers (lower(name));

alter table suppliers enable row level security;

drop policy if exists suppliers_select_perm on suppliers;
create policy suppliers_select_perm on suppliers for select to authenticated
  using (
    (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'))
    or (select has_permission('bills.general'))
    or (select has_permission('bills.utilities'))
    or (select has_permission('maintenance.bills'))
    or (select has_permission('friends.manage'))
    or (select has_permission('friends.view'))
    or (select has_permission('contacts.directory', 'read'))
  );

drop policy if exists suppliers_insert_perm on suppliers;
create policy suppliers_insert_perm on suppliers for insert to authenticated
  with check ((select has_permission('contacts.add')));

drop policy if exists suppliers_update_perm on suppliers;
create policy suppliers_update_perm on suppliers for update to authenticated
  using ((select has_permission('contacts.directory')))
  with check ((select has_permission('contacts.directory')));

drop policy if exists suppliers_delete_perm on suppliers;
create policy suppliers_delete_perm on suppliers for delete to authenticated
  using ((select has_permission('contacts.directory')));

revoke all on suppliers from anon;
grant select, insert, update, delete on suppliers to authenticated;
grant all on suppliers to service_role;

drop trigger if exists audit_suppliers on suppliers;
create trigger audit_suppliers
  after insert or update or delete on suppliers
  for each row execute function record_audit();

-- Back-fill: every Vendor contact becomes a supplier. contacts.type is a single enum column, so a contact cannot be a
-- Vendor and a Carer or Volunteer at once and no row is ambiguous. Dev held none when this was written. Safe to run
-- twice: source_contact_id is unique and the second run inserts nothing.
insert into suppliers (name, phone, email, line_id, messenger_id, whatsapp, address, map_url, notes,
                       archived_at, archived_by, archive_reason, source_contact_id, created_at)
select c.name, c.phone, c.email, c.line_id, c.messenger_id, c.whatsapp, c.address, c.map_url, c.notes,
       c.archived_at, c.archived_by, c.archive_reason, c.id, c.created_at
  from contacts c
 where c.type = 'Vendor'
on conflict (source_contact_id) do nothing;
