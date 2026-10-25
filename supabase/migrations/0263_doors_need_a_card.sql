-- consumer: src/lib/auth/app-users.ts, src/lib/residents/who-and-where.ts, src/app/enclosures/page.tsx, src/app/api/facility-maps/[...path]/route.ts, src/lib/translations/queries.ts, src/lib/prescriptions/options.ts, src/lib/unit-list-server.ts
--
-- ALL VIEWS AND DOORS NEED A CARD (Lutan, 2026-10-25: "all views / doors need to require a card"). Until now these surfaces were
-- guarded only by the front door, private.has_app_access() ("does this role hold any card at all?"), or by nothing, so a login holding
-- ANY card read them: every resident's name and place, every login's email, the facility maps, the translation queue, the rounds and
-- the units. Each now asks for the card that does the work. docs/decisions/2026-10-25-doors-need-a-card.md has the list.
--   * The front door itself is NOT touched (it keeps public_viewer out) and the 18 public_* views are NOT touched: anon reads
--     those on purpose, that is how lannacare.org renders.
--   * No new activity and no card_grants row was needed: every surface is gated by the existing rights of the forms that read it
--     (a surface several activities read is gated by any of them, as picker_zones already is), so no card's grants change and no
--     form loses a list it had. current_user not in (anon, authenticated) keeps server-side work (service role) working, as
--     has_app_access() does.
-- DEPLOY ORDER: schema and app go together; the app change is one line in the facility-plan image route.
-- Re-runnable: create or replace / drop ... if exists.

-- Who may read the residents-and-where views: a right that works with a resident. Several activities read them, so any one of those rights opens them (as picker_zones already does).
create or replace function private.works_with_residents()
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $fn$
  select current_user::text not in ('anon', 'authenticated')
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

-- Who may read immunisation compliance: the immunisation right, or the resident record it is shown on.
create or replace function private.works_with_immunizations()
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $fn$
  select current_user::text not in ('anon', 'authenticated')
      or public.has_permission('medical.immunizations', 'read')
      or public.has_permission('resident.record', 'read');
$fn$;
revoke all on function private.works_with_immunizations() from public, anon;
grant execute on function private.works_with_immunizations() to authenticated, service_role;

-- Who may list the logins (email, display name, role key): the activities that pick or name a person.
create or replace function private.works_with_logins()
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $fn$
  select current_user::text not in ('anon', 'authenticated')
      or public.has_permission('maintenance.jobs', 'read')
      or public.has_permission('maintenance.bills', 'read')
      or public.has_permission('stock.delivery', 'read')
      or public.has_permission('recurring.manage', 'read')
      or public.has_permission('recurring.do_any', 'read')
      or public.has_permission('recurring.do_own', 'read')
      or public.has_permission('photos.approve', 'read')
      or public.has_permission('roles.view', 'read');
$fn$;
revoke all on function private.works_with_logins() from public, anon;
grant execute on function private.works_with_logins() to authenticated, service_role;

-- Who may read the translation queue.
create or replace function private.works_with_translations()
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $fn$
  select current_user::text not in ('anon', 'authenticated')
      or public.has_permission('translations.view', 'read')
      or public.has_permission('translations.manage', 'read');
$fn$;
revoke all on function private.works_with_translations() from public, anon;
grant execute on function private.works_with_translations() to authenticated, service_role;

create or replace view app_users with (security_barrier = true) as
 SELECT id,
    email,
    display_name,
    archived_at,
    role_key
   FROM private.app_users
  WHERE (select private.works_with_logins());

create or replace view current_placement as
 SELECT id,
    resident_id,
    placement_type,
    start_date,
    end_date,
    zone_id,
    enclosure_id,
    previous_enclosure_id,
    carer_id,
    notes,
    created_by,
    created_at
   FROM private.current_placement
  WHERE (select private.works_with_residents()) AND NOT on_volunteer_floor() AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR (resident_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

create or replace view resident_current_state as
 SELECT resident_id,
    name,
    current_placement_id,
    current_enclosure_id,
    current_zone_id,
    current_carer_id,
    active_hospital_previous_enclosure,
    current_status,
    is_deceased,
    date_of_death
   FROM private.resident_current_state
  WHERE (select private.works_with_residents()) AND NOT on_volunteer_floor() AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR (resident_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

create or replace view immunization_compliance as
 SELECT resident_id,
    resident_name,
    immunization_type_id,
    immunization_type_name
   FROM private.immunization_compliance
  WHERE (select private.works_with_immunizations()) AND NOT on_volunteer_floor() AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR (resident_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

create or replace view immunization_duplicate_check as
 SELECT resident_id,
    immunization_type_id,
    date_administered,
    count
   FROM private.immunization_duplicate_check
  WHERE (select private.works_with_immunizations()) AND NOT on_volunteer_floor() AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR (resident_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

create or replace view translation_queue as
 SELECT id,
    table_name,
    row_id,
    column_name,
    tier,
    source_lang,
    target_lang,
    source_text,
    reviewed_source_text,
    text,
    status,
    engine,
    reviewed_by,
    reviewed_at,
    created_at,
    updated_at,
    record_label,
    record_path
   FROM private.translation_queue
  WHERE (select private.works_with_translations()) AND NOT on_volunteer_floor() AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR table_name <> 'residents'::text OR (row_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

-- The worst door: its gate was on_volunteer_floor() OR sees_all_residents(), constants false and true since 0259, so it read
-- 'where true' and any login read every resident. The card check REPLACES them as the gate; the stubs themselves are left for
-- inert-security-leftovers.
create or replace view resident_who_and_where as
 SELECT r.id,
    r.name,
    r.thai_name,
    r.resident_code,
    r.species,
    r.sex,
    r.profile_photo_drive_file_id,
    s.current_status,
    e.id AS enclosure_id,
    e.name AS enclosure_name,
    e.name_th AS enclosure_name_th,
    z.id AS zone_id,
    z.name AS zone_name,
    z.name_th AS zone_name_th,
    z.colour AS zone_colour
   FROM residents r
     LEFT JOIN private.resident_current_state s ON s.resident_id = r.id
     LEFT JOIN enclosures e ON e.id = s.current_enclosure_id
     LEFT JOIN zones z ON z.id = e.zone_id
  WHERE (select private.works_with_residents());

-- rounds and units were readable by anyone (using true). Now: the cards whose forms list them.
drop policy if exists rounds_read on rounds;
create policy rounds_read on rounds for select using (
  (select has_permission('medical.prescriptions', 'read')) or (select has_permission('medical.diet', 'read'))
  or (select has_permission('stock.diets', 'read')) or (select has_permission('stock.medications', 'read'))
  or (select has_permission('reference.types', 'read'))
);

drop policy if exists units_select_perm on units;
create policy units_select_perm on units for select using (
  (select has_permission('medical.prescriptions', 'read')) or (select has_permission('medical.diet', 'read'))
  or (select has_permission('medical.immunizations', 'read'))
  or (select has_permission('stock.diets', 'read')) or (select has_permission('stock.medications', 'read'))
  or (select has_permission('stock.delivery', 'read')) or (select has_permission('stock.count', 'read'))
  or (select has_permission('stock.purchasing', 'read')) or (select has_permission('stock.usage', 'read'))
  or (select has_permission('reference.types', 'read'))
);

-- The facility map: the Enclosures card (facility.enclosures at read) reads it, as the editor's writes already ask.
drop policy if exists facility_maps_read on facility_maps;
create policy facility_maps_read on facility_maps for select using ((select has_permission('facility.enclosures', 'read')));
drop policy if exists map_rooms_read on map_rooms;
create policy map_rooms_read on map_rooms for select using ((select has_permission('facility.enclosures', 'read')));
drop policy if exists map_room_placements_read on map_room_placements;
create policy map_room_placements_read on map_room_placements for select using ((select has_permission('facility.enclosures', 'read')));
drop policy if exists map_rooms_translations_read on translations;
create policy map_rooms_translations_read on translations for select using (
  table_name = 'map_rooms' and status = 'approved'::translation_status and (select has_permission('facility.enclosures', 'read'))
);

-- Which columns are translated: the translation rights. (The write side is Admin-only and unchanged.)
drop policy if exists app_read_translatable_fields on translatable_fields;
create policy app_read_translatable_fields on translatable_fields for select using (
  (select has_permission('translations.view', 'read')) or (select has_permission('translations.manage', 'read'))
);
