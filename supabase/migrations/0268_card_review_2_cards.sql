-- consumer: src/lib/permissions/cards.ts, src/lib/permissions/catalogue.ts, src/lib/permissions/routes.ts, src/lib/permissions/who-does-what.ts, src/app/admin/who-does-what/page.tsx, src/app/admin/who-does-what/details/page.tsx, src/app/admin/website/actions.ts
--
-- CARD REVIEW 2, THE SCHEMA HALF (clause (a) of the backlog items "cards 11-21" and "cards 22-29"; Lutan, 2026-10-26).
-- docs/decisions/2026-10-26-card-review-2-schema.md has the reasoning, the counts and what was left out; the app half is a later stream.
-- One file on purpose: the card count (scripts/check-cards-count.mjs) moves once, 30 -> 32, and the card set reaches its final shape here.
--
-- WHAT THIS DOES (every change is a card's grant, a card, or the one policy the Website photo-strip split needs; Admin is untouched)
--   1. TWO CARDS REPLACE ONE, twice. The existing key stays as the "manage" half, so no role needs re-pointing and no tile moves:
--        medical_records  (now "Manage medical")   + NEW view_medical    (read of every medical table, and the clinic list)
--        contacts         (now "Manage contacts")  + NEW view_contacts    (look people up, clinics, Shelter Friends read only)
--      and a THIRD split out of contacts: NEW publish_shelter_friends (friends.manage). THE ONE-WAY DOORS, in this file: the only holders
--      today are staff (medical_records) and management (contacts); neither loses a cell. Manage medical includes View medical and adds
--      visit.book; Manage contacts includes View contacts; every role holding Manage contacts is given Publish Shelter Friends, so
--      management still publishes. The cell union for each holder is unchanged or larger (the report at the end lists it).
--   2. Book clinic visits: the clinic list (through View medical), edit and cancel a visit it booked (medical.visits at edit; no delete
--      policy exists on clinic_visits, so there is no delete), and the resident's medical history at READ (through View medical).
--   3. Dashboard reads what it counts (who-and-where, clinic visits, maintenance jobs, all at read). Donations and receipts: resident
--      who-and-where and project folders at read. Bills: maintenance jobs at read. Enclosures, Meme library, Assistant: resident
--      who-and-where at read (Assistant also the enclosure read, and LOSES assistant.record: a decrease). Add Shelter Photos swaps
--      resident.record (the whole table) for resident.who_and_where. Approve photos includes View residents (the wider read, his words).
--      Run fundraising appeals includes View residents (read only). NOT granted, on purpose: any medical read on Run appeals ("potentially"
--      is not a yes; it goes back to him).
--   4. Who does what is READ ONLY in the grant: roles.view becomes a level activity and the card holds it at read.
--   5. A second Website card: NEW website_photos (website.content at read so the page opens, and NEW website.gallery). Writing the photo
--      strip (site_content_photos) now asks website.gallery instead of website.content, so the Website card no longer adds a public photo.
--      The hero photo lives in a site_content column that only website.content may write; moving it is the app half and is recorded.
--   6. DELETED: operations_landing and management_landing ("it is a grouping, not a card"). Neither grants anything and no role holds
--      either (read from production 2026-10-26). The landings and menu links are derived from opensAnyIn, not from these cards.
--
-- Nothing is granted to Admin. Re-runnable: on conflict / where not exists / delete where. A NOTICE per role lists cells added and removed.

create temp table pre_0268 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

-- ---------------------------------------------------------------------------
-- 1. Activities
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('website.gallery', 'yesno', 'settings', 70)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- Who does what is read only, so its activity is a level and the card holds it at read.
insert into permission_activities (key, kind, area, sort)
values ('roles.view', 'level', 'settings', 68)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- The photo strip is written under its own activity. Reading stays public / website.content as before.
alter policy admin_write_site_content_photos on site_content_photos
  using ((select has_permission('website.gallery'))) with check ((select has_permission('website.gallery')));

-- ---------------------------------------------------------------------------
-- 2. Delete the two landing cards (no holder; nothing to move)
-- ---------------------------------------------------------------------------
delete from role_cards where card in ('operations_landing', 'management_landing');
delete from card_grants where card in ('operations_landing', 'management_landing');
delete from card_includes where card in ('operations_landing', 'management_landing') or included_card in ('operations_landing', 'management_landing');
delete from card_features where card in ('operations_landing', 'management_landing');

-- ---------------------------------------------------------------------------
-- 3. New cards: view_medical, view_contacts, publish_shelter_friends, website_photos
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level)
values
  ('view_medical', 'medical.visits', 1),
  ('view_medical', 'medical.procedures', 1),
  ('view_medical', 'medical.blood_tests', 1),
  ('view_medical', 'medical.prescriptions', 1),
  ('view_medical', 'medical.immunizations', 1),
  ('view_medical', 'medical.weight', 1),
  ('view_medical', 'medical.diet', 1),
  ('view_medical', 'clinics.list', 1),
  ('view_contacts', 'contacts.browse', 2),
  ('view_contacts', 'contacts.directory', 1),
  ('view_contacts', 'clinics.list', 1),
  ('view_contacts', 'friends.view', 2),
  ('publish_shelter_friends', 'friends.manage', 2),
  ('website_photos', 'website.content', 1),
  ('website_photos', 'website.gallery', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_includes (card, included_card)
values
  ('view_medical', 'view_residents'),
  ('publish_shelter_friends', 'view_contacts')
on conflict do nothing;

insert into card_features (card, feature_id)
select m.card, f.id
  from (values
    ('view_medical', 'medical_information'),
    ('view_contacts', 'people_and_contacts'),
    ('publish_shelter_friends', 'people_and_contacts'),
    ('website_photos', 'website_public_pages')
  ) as m(card, feature)
  join features f on f.key = m.feature
on conflict (card) do nothing;

-- ---------------------------------------------------------------------------
-- 4. The splits (THE ONE-WAY DOORS) and the existing cards' grants
-- ---------------------------------------------------------------------------
-- Manage medical: includes View medical (which includes View residents), and books visits.
insert into card_grants (card, activity, level) values ('medical_records', 'visit.book', 2)
on conflict (card, activity) do update set level = excluded.level;
insert into card_includes (card, included_card) values ('medical_records', 'view_medical') on conflict do nothing;
delete from card_includes where card = 'medical_records' and included_card = 'view_residents';

-- Manage contacts: includes View contacts; the browse and Shelter Friends cells move to the new cards.
insert into card_includes (card, included_card) values ('contacts', 'view_contacts') on conflict do nothing;
delete from card_grants where card = 'contacts' and activity in ('contacts.browse', 'friends.view', 'friends.manage');

-- Every role holding Manage contacts keeps publishing Shelter Friends: it is given Publish Shelter Friends, last in its list.
insert into role_cards (role_id, card, position)
select rc.role_id, 'publish_shelter_friends', coalesce((select max(x.position) from role_cards x where x.role_id = rc.role_id), 0) + 1
  from role_cards rc
  join roles r on r.id = rc.role_id
 where rc.card = 'contacts'
   and r.kind <> 'fixed'
   and not exists (select 1 from role_cards y where y.role_id = rc.role_id and y.card = 'publish_shelter_friends');

-- Book clinic visits: through View medical it reads the clinic list and the medical history; it edits and cancels the visits it books.
insert into card_grants (card, activity, level) values ('book_clinic_visits', 'medical.visits', 2)
on conflict (card, activity) do update set level = excluded.level;
insert into card_includes (card, included_card) values ('book_clinic_visits', 'view_medical') on conflict do nothing;
delete from card_includes where card = 'book_clinic_visits' and included_card = 'view_residents';

-- Reads other cards need to do their job
insert into card_grants (card, activity, level)
values
  ('dashboard', 'resident.who_and_where', 1),
  ('dashboard', 'medical.visits', 1),
  ('dashboard', 'maintenance.jobs', 1),
  ('donations_receipts', 'resident.who_and_where', 1),
  ('donations_receipts', 'projects.folders', 1),
  ('bills', 'maintenance.jobs', 1),
  ('assistant', 'resident.who_and_where', 1),
  ('assistant', 'facility.enclosures', 1),
  ('enclosures', 'resident.who_and_where', 1),
  ('meme_library', 'resident.who_and_where', 1),
  ('add_photos', 'resident.who_and_where', 1),
  ('who_does_what', 'roles.view', 1)
on conflict (card, activity) do update set level = excluded.level;

-- Decreases
delete from card_grants where card = 'assistant' and activity = 'assistant.record';
delete from card_grants where card = 'add_photos' and activity = 'resident.record';
delete from card_grants where card = 'approve_photos' and activity = 'resident.record';

-- Approve photos and Run appeals read the whole non-medical resident record through View residents
insert into card_includes (card, included_card)
values ('approve_photos', 'view_residents'), ('run_appeals', 'view_residents')
on conflict do nothing;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 5. The record: what every role gained and lost
-- ---------------------------------------------------------------------------
do $report$
declare
  r record;
  gained text;
  lost text;
begin
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(rp.activity || ':' || rp.level, ', ' order by rp.activity) into gained
      from public.role_permissions rp
     where rp.role_id = r.id
       and not exists (select 1 from pre_0268 p where p.role_id = r.id and p.activity = rp.activity and p.level = rp.level);
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0268 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level = p.level);
    if gained is not null or lost is not null then
      raise notice '0268 % | now: % | no longer: %', r.key, coalesce(gained, '-'), coalesce(lost, '-');
    end if;
  end loop;
end
$report$;
