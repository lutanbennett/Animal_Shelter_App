-- consumer: src/lib/medical/residents.ts, src/app/medical/ResidentPicker.tsx, src/app/medical/photos/page.tsx, src/app/medical/weight/page.tsx
-- resident_who_and_where returned rows only to a role whose scope_residents is 'who_and_where'
-- (on_volunteer_floor()), so a role with the WHOLE record (Admin, Management) got an empty
-- resident picker. The view's columns are a strict subset of what those roles already read in
-- residents, so the filter becomes "floor role, or a role that reads every resident".
-- Still refused: a vet/clinic login (scope own_clinic, so both tests are false), a public viewer
-- and signed-out (no role). Same columns, same order: create or replace keeps grants.
-- Re-runnable. To undo: restore the 0180 body (where public.on_volunteer_floor()).

create or replace view public.resident_who_and_where as
select r.id, r.name, r.thai_name, r.resident_code, r.species, r.sex, r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id, e.name as enclosure_name, e.name_th as enclosure_name_th,
       z.id as zone_id, z.name as zone_name, z.name_th as zone_name_th, z.colour as zone_colour
  from public.residents r
  left join private.resident_current_state s on s.resident_id = r.id
  left join public.enclosures e on e.id = s.current_enclosure_id
  left join public.zones z on z.id = e.zone_id
 where public.on_volunteer_floor() or public.sees_all_residents();

grant select on public.resident_who_and_where to authenticated, service_role;
