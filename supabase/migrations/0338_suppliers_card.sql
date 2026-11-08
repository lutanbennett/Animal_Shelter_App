-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/app/management/suppliers/page.tsx, src/app/management/suppliers/actions.ts, src/app/suppliers/[id]/page.tsx, src/app/deliveries/page.tsx, src/app/deliveries/actions.ts, src/lib/management/purchasing.ts, src/app/management/purchasing/page.tsx, src/app/management/shelter-friends/actions.ts
--
-- THE APP HALF OF #xkfsv (suppliers leave Contacts; Lutan, 2026-11-08: "Leave contacts entirely"). 0335 made the table, 0336 let a
-- Shelter Friend be a supplier, 0337 re-keyed history. They deliberately added NO activity and NO card, so the policies on `suppliers`
-- asked activities that already guarded the same data. This file adds the one activity and the one card that go with the screen
-- (/management/suppliers) built in the same PR, and narrows the write policies to it, as docs/decisions/2026-11-08-suppliers-schema.md
-- said the app half would. A card must apply the access that lets its activity be performed, and there must be no card that does
-- nothing, so the card and its screen land together.
--
-- THE ACTIVITY: suppliers.directory (level). Read opens the supplier list and a supplier's page; Edit adds, changes, archives and
-- restores. Nothing deletes a supplier: the cost-only trigger on stock_receipts (0235) would refuse a delete once a delivery names
-- one, and a supplier with no deliveries is kept anyway, so suppliers are archived (as contacts are), and the delete policy is dropped.
--
-- THE CARD: suppliers, holding suppliers.directory at edit and nothing else, filed under the same feature as the Contacts card.
-- Equal to src/lib/permissions/cards.ts cell for cell (scripts/check-card-grants.mjs fails when they differ).
--
-- THE POLICIES. Insert and update now ask suppliers.directory (they asked contacts.add / contacts.directory). Select keeps every
-- screen that has to NAME a supplier (deliveries, purchasing, bills, Shelter Friends) and gains suppliers.directory at read; it loses
-- contacts.directory, because Contacts holds only people now.
--
-- NO REGRESSION. Whoever held the Contacts card could file a Vendor, and so could write a supplier under 0335. Every role holding the
-- Contacts card is given the Suppliers card, so nobody loses it. Lutan rebuilds the card assignments himself later. Nothing is
-- granted to Admin, which sits outside the card system.
--
-- SHELTER FRIENDS ON A VENDOR CONTACT move with it: their shelter_friends row is re-pointed at the supplier (see the update near the foot).
--
-- THE CATCH-UP BACK-FILL. A Vendor contact filed after 0335 has no supplier row (the type stayed in the enum so Contacts could still
-- file one until this PR hides it). The 0335 insert is repeated, then the two history statements of 0337 are repeated. All three are
-- safe to run twice: source_contact_id is unique and the updates touch only rows still without supplier_id. Dev held no Vendor
-- contacts when this was written, so on dev it moves nothing; the harness proves it on a row it makes itself.
--
-- Additive and re-runnable. To undo: restore 0335's four policies, delete the card rows, then the activity row.

insert into permission_activities (key, kind, area, sort)
values ('suppliers.directory', 'level', 'contacts', 86)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into card_grants (card, activity, level)
values ('suppliers', 'suppliers.directory', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'suppliers', cf.feature_id from card_features cf where cf.card = 'contacts'
on conflict (card) do update set feature_id = excluded.feature_id;

insert into role_cards (role_id, card)
select distinct rc.role_id, 'suppliers' from role_cards rc where rc.card = 'contacts'
on conflict do nothing;

drop policy if exists suppliers_select_perm on suppliers;
create policy suppliers_select_perm on suppliers for select to authenticated
  using (
    (select has_permission('suppliers.directory', 'read'))
    or (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'))
    or (select has_permission('bills.general'))
    or (select has_permission('bills.utilities'))
    or (select has_permission('maintenance.bills'))
    or (select has_permission('friends.manage'))
    or (select has_permission('friends.view'))
  );

drop policy if exists suppliers_insert_perm on suppliers;
create policy suppliers_insert_perm on suppliers for insert to authenticated
  with check ((select has_permission('suppliers.directory')));

drop policy if exists suppliers_update_perm on suppliers;
create policy suppliers_update_perm on suppliers for update to authenticated
  using ((select has_permission('suppliers.directory')))
  with check ((select has_permission('suppliers.directory')));

-- Suppliers are archived, never deleted (see above).
drop policy if exists suppliers_delete_perm on suppliers;

-- Catch-up back-fill (0335, repeated), then 0337's two history statements (repeated).
insert into suppliers (name, phone, email, line_id, messenger_id, whatsapp, address, map_url, notes,
                       archived_at, archived_by, archive_reason, source_contact_id, created_at)
select c.name, c.phone, c.email, c.line_id, c.messenger_id, c.whatsapp, c.address, c.map_url, c.notes,
       c.archived_at, c.archived_by, c.archive_reason, c.id, c.created_at
  from contacts c
 where c.type = 'Vendor'
on conflict (source_contact_id) do nothing;

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

-- A Shelter Friend whose subject is a Vendor contact now has a supplier twin (above): point the Friend at the supplier and let go of the
-- contact, so Contacts really holds only people and the Friend keeps its profile, its translations (keyed by the Friend's own id), its
-- Shop links and its place on /friends. public_shelter_friends reads either subject (0336). Only Friends whose contact is a Vendor.
update shelter_friends f
   set supplier_id = s.id,
       contact_id = null
  from contacts c
  join suppliers s on s.source_contact_id = c.id
 where f.contact_id = c.id
   and c.type = 'Vendor'
   and f.supplier_id is null;

do $report$
begin
  if exists (select 1 from public.shelter_friends f join public.contacts c on c.id = f.contact_id where c.type = 'Vendor') then
    raise exception '0338 a Shelter Friend is still attached to a Vendor contact after the re-point';
  end if;
  if not exists (select 1 from public.card_grants
                  where card = 'suppliers' and activity = 'suppliers.directory' and level = 2) then
    raise exception '0338 the suppliers card does not grant suppliers.directory at edit after this file ran';
  end if;
  if exists (select 1 from public.card_grants where card = 'suppliers' and activity <> 'suppliers.directory') then
    raise exception '0338 the suppliers card grants something besides suppliers.directory, which it must never do';
  end if;
  if not exists (select 1 from public.card_features where card = 'suppliers') then
    raise exception '0338 the suppliers card is not filed under a feature, so it would read Not yet sorted';
  end if;
  if exists (select 1 from pg_policies where tablename = 'suppliers' and cmd in ('DELETE', 'ALL')) then
    raise exception '0338 suppliers still has a delete or for-all policy';
  end if;
  if exists (select 1 from public.contacts c where c.type = 'Vendor'
              and not exists (select 1 from public.suppliers s where s.source_contact_id = c.id)) then
    raise exception '0338 a Vendor contact still has no supplier row after the catch-up';
  end if;
end
$report$;

notify pgrst, 'reload schema';
