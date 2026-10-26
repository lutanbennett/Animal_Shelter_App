-- consumer: src/lib/permissions/cards.ts, src/lib/permissions/catalogue.ts, src/lib/residents/who-and-where.ts, src/lib/medical/residents.ts, src/app/residents/page.tsx, src/app/residents/[id]/page.tsx, src/app/residents/[id]/deceased/page.tsx, src/app/residents/[id]/move/page.tsx, src/app/residents/[id]/rehome/page.tsx, src/lib/contacts/carers.ts, src/app/deliveries/actions.ts, src/app/deliveries/page.tsx
--
-- CARD REVIEW 1, THE SCHEMA HALF (clause (a) of the backlog item; Lutan, 2026-10-26: "make each card do its job and nothing more").
-- docs/decisions/2026-10-26-card-review-1-schema.md has the reasoning and what was found on the way; the app half is a later stream.
--
-- WHAT THIS DOES (every change is a card's grant, or the one policy that decides who deletes a delivery; Admin is untouched and given nothing)
--   1. A who-and-where resident read. New level activity resident.who_and_where: the resident_who_and_where view (name, code, species,
--      sex, photo, status, enclosure, zone) and nothing wider. Administer medication, Record weight, Add medical photos and Feed
--      special diets hold it INSTEAD OF resident.record at read (which is the whole residents table since 0259); so does nobody else yet.
--   2. Do maintenance loses resident.record at read ("take away the resident record": the enclosure page is what the job needs). It
--      keeps facility.enclosures at read, and "Assigned to" is untouched (that decrease was REJECTED).
--   3. View residents gains facility.enclosures at read, so the Enclosure column fills. Residents includes View residents, so it gets
--      the enclosure lookup its move / foster / adopt forms need through the include, and no card gains a write to an enclosure.
--      View residents keeps resident.record at read: the whole non-medical record (medical records live in their own tables behind
--      medical.*), and the spreadsheet stays. The narrowing was REJECTED for this card.
--   4. Residents gains contacts.directory at READ: picker_contacts, id / name / type / archived_at, which is the Foster carer list.
--      It does not open contacts (that is contacts.browse, or contacts.directory at edit).
--   5. Residents hands photos.resident_publish to photos.shelter_add: its uploads wait for Approve photos instead of going straight to
--      the public website.
--   6. A new card, record_death, in Medical information: placement.death at yes, and it includes view_residents (the page needs the
--      resident and the Deceased enclosure). Residents loses placement.death. THE ONE-WAY DOOR: every role holding Residents is given
--      Record a death in this same file, BEFORE Residents loses the grant, so no role loses a power it has today.
--   7. Deleting a delivery is Admin only. The delete policy asked stock.delivery, the activity that also records one, so a card that
--      records a delivery could remove any. It now asks is_admin(). (Deleting a maintenance job needed no change: it asks
--      maintenance.delete, which Do maintenance has never held; the job page only promised it.)
--
-- Nothing is granted to Admin. Re-runnable: on conflict / where not exists / drop ... if exists. A NOTICE per role at the end lists the
-- cells added and removed (activity names only), as 0257 did.

create temp table pre_0265 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

-- ---------------------------------------------------------------------------
-- 1. The activity, and the question every resident-and-where surface asks
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('resident.who_and_where', 'level', 'residents', 69)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- 0263's list, with the new activity added. Nothing else in it changes.
create or replace function private.works_with_residents()
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $fn$
  select current_user::text not in ('anon', 'authenticated')
      or public.has_permission('resident.who_and_where', 'read')
      or public.has_permission('resident.record', 'read')
      or public.has_permission('resident.register', 'read')
      or public.has_permission('resident.microchip', 'read')
      or public.has_permission('resident.adoption_news', 'read')
      or public.has_permission('medical.visits', 'read')
      or public.has_permission('medical.procedures', 'read')
      or public.has_permission('medical.blood_tests', 'read')
      or public.has_permission('medical.prescriptions', 'read')
      or public.has_permission('medical.immunizations', 'read')
      or public.has_permission('medical.weight', 'read')
      or public.has_permission('medical.diet', 'read')
      or public.has_permission('medical.archive', 'read')
      or public.has_permission('visit.book', 'read')
      or public.has_permission('placement.move', 'read')
      or public.has_permission('placement.hospital', 'read')
      or public.has_permission('placement.rehome', 'read')
      or public.has_permission('placement.death', 'read')
      or public.has_permission('placement.death_withdraw', 'read')
      or public.has_permission('photos.resident_add', 'read')
      or public.has_permission('photos.resident_manage', 'read')
      or public.has_permission('photos.shelter_add', 'read')
      or public.has_permission('photos.approve', 'read')
      or public.has_permission('appeal.run', 'read')
      or public.has_permission('appeal.medical_photo', 'read')
      or public.has_permission('assistant.ask', 'read')
      or public.has_permission('reports.dashboard', 'read')
      or public.has_permission('stock.usage', 'read')
      or public.has_permission('stock.diets', 'read')
      or public.has_permission('stock.medications', 'read');
$fn$;
revoke all on function private.works_with_residents() from public, anon;
grant execute on function private.works_with_residents() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1b. Deleting a delivery is Admin only
-- ---------------------------------------------------------------------------
drop policy if exists stock_receipts_delete_perm on stock_receipts;
create policy stock_receipts_delete_perm on stock_receipts for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 2. The new card: Record a death
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level)
values ('record_death', 'placement.death', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_includes (card, included_card)
values ('record_death', 'view_residents')
on conflict do nothing;

insert into card_features (card, feature_id)
select 'record_death', f.id from features f where f.key = 'medical_information'
on conflict (card) do nothing;

-- THE ONE-WAY DOOR. Every role that holds Residents gets Record a death, last in its list, before Residents loses the grant.
-- Fixed roles hold no cards and are never touched.
insert into role_cards (role_id, card, position)
select rc.role_id, 'record_death', coalesce((select max(x.position) from role_cards x where x.role_id = rc.role_id), 0) + 1
  from role_cards rc
  join roles r on r.id = rc.role_id
 where rc.card = 'residents'
   and r.kind <> 'fixed'
   and not exists (select 1 from role_cards y where y.role_id = rc.role_id and y.card = 'record_death');

-- ---------------------------------------------------------------------------
-- 3. The grants
-- ---------------------------------------------------------------------------
-- Cards 1-4: who and where, not the whole resident table.
delete from card_grants
 where activity = 'resident.record'
   and card in ('administer_medication', 'record_weight', 'add_medical_photos', 'feed_special_diets', 'do_maintenance');

insert into card_grants (card, activity, level)
select c, 'resident.who_and_where', 1
  from unnest(array['administer_medication', 'record_weight', 'add_medical_photos', 'feed_special_diets']) as c
on conflict (card, activity) do update set level = excluded.level;

-- View residents: the enclosure read (and, through card_includes, Residents too).
insert into card_grants (card, activity, level)
values ('view_residents', 'facility.enclosures', 1)
on conflict (card, activity) do update set level = excluded.level;

-- Residents: the carer list is a names-only read; its photos go through approval; the death moved to its own card.
insert into card_grants (card, activity, level)
values ('residents', 'contacts.directory', 1), ('residents', 'photos.shelter_add', 2)
on conflict (card, activity) do update set level = excluded.level;

delete from card_grants where card = 'residents' and activity in ('photos.resident_publish', 'placement.death');

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 4. The record: what every role gained and lost
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
       and not exists (select 1 from pre_0265 p where p.role_id = r.id and p.activity = rp.activity and p.level = rp.level);
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0265 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level = p.level);
    if gained is not null or lost is not null then
      raise notice '0265 % | now: % | no longer: %', r.key, coalesce(gained, '-'), coalesce(lost, '-');
    end if;
  end loop;
end
$report$;
