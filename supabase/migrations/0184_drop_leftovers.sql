-- consumer: src/app/enclosures/page.tsx, src/app/admin/facility-map/actions.ts, scripts/check-doctor-resident-scope.mjs
-- 0184: three subjects, one file (CLAUDE.md: two streams needing schema share one schema PR).
--   A. drop 0175's three map-room leftovers (map_rooms.kind itself stays: actions.ts still selects it).
--   B. let every viewer who can see a room read its approved translation (the description in Thai).
--   C. drop the four read-only vets / vet_doctors / vet_doctor_clinics / vet_appointments views (0172).
-- Drops cannot be undone by redeploying the app.

-- A
alter table map_rooms drop constraint if exists map_rooms_one_per_kind;
drop trigger if exists map_rooms_name_from_kind on map_rooms;
drop function if exists map_rooms_name_from_kind();
drop function if exists map_room_kind_name(text, boolean);

-- B: only approved translations of map_rooms rows, to anyone map_rooms_read already admits.
drop policy if exists map_rooms_translations_read on translations;
create policy map_rooms_translations_read on translations for select to authenticated
  using (table_name = 'map_rooms' and status = 'approved' and (select private.has_app_access()));

-- C
drop view if exists vet_appointments;
drop view if exists vet_doctor_clinics;
drop view if exists vet_doctors;
drop view if exists vets;
