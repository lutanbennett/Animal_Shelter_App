-- consumer: none
--
-- Non-resident rooms on the facility map, schema only (backlog: "Non-resident rooms on the
-- facility map"; the Director and Lutan decided 2026-10-07 that the map shows the Medical room,
-- the Kitchen and Storage). The map and the place-on-map editor read and write this in the next PR.
--
--   map_rooms   one row per room drawn on a plan: which plan image (facility_maps), which of the
--               three rooms (kind), and its outline as [[x,y], ...] in percent of that image, the
--               same encoding as enclosures.map_shape (map_shape_valid, 0142).
--
-- Why a table and not enclosures/zones: a room has no resident, no capacity and nothing to open,
-- and an enclosure row would turn up in every list, count and placement picker that reads
-- enclosures. A room is not on any of them, so it lives here and nothing else sees it.
--
-- kind is a fixed list on purpose (no room editor was asked for); the label is not stored, the app
-- has it in both dictionaries (staff read the map in Thai). Adding a fourth room later is one
-- changed check constraint. One row per kind: each room exists once on the site.
--
-- Additive and re-runnable; nothing reads any of it yet. Read: any signed-in login (anon, i.e.
-- the public site, never). Write: admin and management, as for facility_maps.

create table if not exists map_rooms (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references facility_maps (id) on delete cascade,
  kind text not null check (kind in ('medical', 'kitchen', 'storage')),
  shape jsonb not null check (map_shape_valid(shape)),
  created_at timestamptz not null default now(),
  constraint map_rooms_one_per_kind unique (kind)
);
create index if not exists map_rooms_map_id on map_rooms (map_id);

alter table map_rooms enable row level security;
drop policy if exists map_rooms_read on map_rooms;
create policy map_rooms_read on map_rooms for select to authenticated using (true);
drop policy if exists management_rw_map_rooms on map_rooms;
create policy management_rw_map_rooms on map_rooms for all to authenticated
  using (current_user_role() in ('admin', 'management'))
  with check (current_user_role() in ('admin', 'management'));

-- Data API grants (docs/decisions.md, 2026-09-24: Supabase no longer adds them)
grant select, insert, update, delete on map_rooms to authenticated, service_role;
