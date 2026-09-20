-- Short, human-friendly per-resident identifier for use in Google Drive
-- folder names and anywhere staff need to distinguish residents that share
-- a name (UUIDs are unusable for this — too long to read/write by hand).
-- Sequential, assigned at intake, permanent for the animal's life, has no
-- meaning beyond intake order (deliberately not species/year-coded, since
-- either would break or need reassignment if corrected later).

create sequence residents_animal_number_seq;

alter table residents add column animal_code text;

-- Backfill any existing rows in intake order, then advance the sequence
-- past however many were just assigned so new intakes continue the count
-- rather than restarting at 1.
with numbered as (
  select id, row_number() over (order by created_at) as rn
  from residents
)
update residents r
set animal_code = 'A-' || lpad(numbered.rn::text, 4, '0')
from numbered
where numbered.id = r.id;

-- `is_called = false` when there are no residents yet: setval() rejects 0 as
-- a "last used" value, so on a fresh database (no rows to backfill) the
-- sequence is instead set to "1, not yet used" and the first intake gets
-- A-0001.
select setval(
  'residents_animal_number_seq',
  greatest((select count(*) from residents), 1),
  (select count(*) > 0 from residents)
);

alter table residents
  alter column animal_code set default ('A-' || lpad(nextval('residents_animal_number_seq')::text, 4, '0')),
  alter column animal_code set not null;

alter table residents add constraint residents_animal_code_key unique (animal_code);

-- Add to the resident list view (Postgres requires CREATE OR REPLACE VIEW to
-- keep existing columns in place, so the new column goes at the end).
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
  r.animal_code
from residents r
left join resident_current_state s on s.resident_id = r.id
left join enclosures e on e.id = s.current_enclosure_id
left join zones z on z.id = e.zone_id;
