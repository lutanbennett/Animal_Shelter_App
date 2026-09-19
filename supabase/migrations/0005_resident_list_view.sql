-- Backs the main resident list page: one row per resident with everything
-- needed for the table (full name, current enclosure/zone, status,
-- internal/external) plus the fields the search box filters on.
--
-- security_invoker = on: without it, a view defaults to running with the
-- view owner's privileges, which in Supabase typically bypasses the
-- underlying tables' RLS entirely. This view must respect the querying
-- user's role same as querying residents/enclosures/zones directly would.

create view resident_list_view
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
  z.internal as zone_internal
from residents r
left join resident_current_state s on s.resident_id = r.id
left join enclosures e on e.id = s.current_enclosure_id
left join zones z on z.id = e.zone_id;
