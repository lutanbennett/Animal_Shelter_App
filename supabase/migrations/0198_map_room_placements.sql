-- consumer: none
--
-- Schema half of "Map rooms: one room placed on several maps". Nothing reads map_room_placements
-- yet; the app half (a later PR) reads and writes it. This file is not usable on its own.
--
-- A room is PLACED on a plan, not owned by one. map_rooms (0157, 0175) holds what the room is: its
-- name, Thai name and description. map_room_placements holds where it is drawn: one row per
-- (room, plan) with that plan's outline. This supersedes 0157's one-map row. A room may sit once on
-- a plan (unique pair), never twice.
--
-- map_rooms.map_id and .shape are made nullable and otherwise left in place: the live editor and map
-- still read and write them. Dropping them is a later file, after the app half ships.
--
-- Policies are the ones map_rooms has now, not 0157's: read behind the app-access gate (0170 s3,
-- after the 2026-10-09 finding that the original `using (true)` answered public_viewer, roleless and
-- archived logins), writes on facility.enclosures (0158). Copying 0157's read policy would have
-- re-opened that finding on the new table.
--
-- Additive and re-runnable. The back-fill inserts one placement per room that has a map and a shape
-- and does nothing for rooms already placed.

create table if not exists map_room_placements (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references map_rooms (id) on delete cascade,
  map_id uuid not null references facility_maps (id) on delete cascade,
  shape jsonb not null check (map_shape_valid(shape)),
  created_at timestamptz not null default now(),
  constraint map_room_placements_room_map_key unique (room_id, map_id)
);
create index if not exists map_room_placements_map_id on map_room_placements (map_id);

alter table map_rooms alter column map_id drop not null;
alter table map_rooms alter column shape drop not null;

insert into map_room_placements (room_id, map_id, shape)
select id, map_id, shape from map_rooms
where map_id is not null and shape is not null
on conflict (room_id, map_id) do nothing;

alter table map_room_placements enable row level security;
drop policy if exists map_room_placements_read on map_room_placements;
create policy map_room_placements_read on map_room_placements for select to authenticated
  using ((select private.has_app_access()));
drop policy if exists map_room_placements_insert_perm on map_room_placements;
drop policy if exists map_room_placements_update_perm on map_room_placements;
drop policy if exists map_room_placements_delete_perm on map_room_placements;
create policy map_room_placements_insert_perm on map_room_placements for insert to authenticated
  with check ((select has_permission('facility.enclosures')));
create policy map_room_placements_update_perm on map_room_placements for update to authenticated
  using ((select has_permission('facility.enclosures')))
  with check ((select has_permission('facility.enclosures')));
create policy map_room_placements_delete_perm on map_room_placements for delete to authenticated
  using ((select has_permission('facility.enclosures')));

-- Data API grants (docs/decisions.md, 2026-09-24)
grant select, insert, update, delete on map_room_placements to authenticated, service_role;
