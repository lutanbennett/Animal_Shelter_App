-- Thai names for zones and enclosures (backlog, Facility).
--
-- Zone and enclosure names are labels, not prose: unique keys, Drive
-- folder path components (Enclosure Maintenance/<Zone>/<Enclosure>/), and
-- the Lifecycle zone's pseudo-enclosures are matched by name in
-- resident_current_state and the placement functions. So they get the
-- paired-column treatment (`residents.thai_name`, `project_folders.name_th`),
-- not a `translations` row: `name` stays the key everywhere, `name_th` is
-- display only, picked by locale in the app with the English as fallback.
-- Managed on Admin → Zones / Enclosures; a new enclosure is built a few
-- times a year at most, so there is no queue for these.
--
-- resident_list_view gains the two Thai columns on the end (create or
-- replace keeps the existing column order); the maintenance and enclosure
-- pages read them through their own embedded selects.

alter table zones add column if not exists name_th text;
alter table enclosures add column if not exists name_th text;

-- The Lifecycle pseudo-rows are system rows the admin pages won't edit,
-- so their Thai names are seeded here, matching the status labels the
-- app already uses. Only fills blanks, so a later manual edit sticks.
update zones set name_th = 'สถานะ' where name = 'Lifecycle' and name_th is null;
update enclosures e
   set name_th = v.name_th
  from (values
    ('Unassigned', 'ยังไม่ระบุกรง'),
    ('Hospital', 'โรงพยาบาล'),
    ('Fostered', 'อุปถัมภ์ชั่วคราว'),
    ('Adopted', 'รับเลี้ยงแล้ว'),
    ('Deceased', 'เสียชีวิตแล้ว')
  ) as v(name, name_th)
  join zones z on z.name = 'Lifecycle'
 where e.zone_id = z.id and e.name = v.name and e.name_th is null;

-- 0012's definition (column renamed by 0046) plus the two Thai names.
create or replace view resident_list_view
with (security_invoker = on)
as
select
  r.id as resident_id,
  r.name,
  r.thai_name,
  r.other_names,
  r.species,
  r.breed,
  s.current_status,
  e.id as enclosure_id,
  e.name as enclosure_name,
  z.id as zone_id,
  z.name as zone_name,
  z.internal as zone_internal,
  r.resident_code,
  e.name_th as enclosure_name_th,
  z.name_th as zone_name_th
from residents r
left join resident_current_state s on s.resident_id = r.id
left join enclosures e on e.id = s.current_enclosure_id
left join zones z on z.id = e.zone_id;

notify pgrst, 'reload schema';
