-- consumer: none
--
-- Facility map, step 1 of 3 (docs/facility-map-scope.md): the schema only. The read-only map on
-- /enclosures and the admin place-on-map editor are the next two PRs and read and write this.
--
--   facility_maps       one row per plan image: kind 'overview' (the whole site, zone_id null, at
--                       most one) or 'zone' (zone_id set, at most one per zone). Two zones may
--                       point at the SAME image_path: the Cat Zone is drawn on the Main Zone
--                       plan and appears on both, with the same coordinates, because shapes
--                       are % of the image.
--   enclosures.map_shape  [[x,y], ...] in percent of the zone's plan image, null = not on the map.
--   zones.map_shape       the same, for the zone's outline on the overview.
--
-- Shapes are stored as percentages (0-100) so they scale with the image on any screen.
-- width/height are the image's pixel size, so the viewer can reserve its aspect ratio before
-- the file loads.
--
-- The Lifecycle pseudo-zone and its pseudo-enclosures are not physical (0001, 0119): a trigger
-- refuses a shape or a plan for them, the same line 0119 draws for placements.
--
-- Additive and re-runnable; nothing reads any of it yet. Read: any signed-in login (anon, i.e.
-- the public site, never). Write: admin and management.

-- ---------------------------------------------------------------------------
-- 1. Shape validity: an array of at least 3 [x, y] pairs, each 0-100
-- ---------------------------------------------------------------------------
create or replace function map_shape_valid(shape jsonb)
returns boolean
language sql
immutable
as $$
  select shape is null or (
    jsonb_typeof(shape) = 'array'
    and jsonb_array_length(shape) >= 3
    and not exists (
      select 1
      from jsonb_array_elements(shape) p
      where jsonb_typeof(p) <> 'array'
         or jsonb_array_length(p) <> 2
         or jsonb_typeof(p -> 0) <> 'number'
         or jsonb_typeof(p -> 1) <> 'number'
         or (p ->> 0)::numeric not between 0 and 100
         or (p ->> 1)::numeric not between 0 and 100
    )
  );
$$;

alter table zones add column if not exists map_shape jsonb;
alter table enclosures add column if not exists map_shape jsonb;

alter table zones drop constraint if exists zones_map_shape_valid;
alter table zones add constraint zones_map_shape_valid check (map_shape_valid(map_shape));
alter table enclosures drop constraint if exists enclosures_map_shape_valid;
alter table enclosures add constraint enclosures_map_shape_valid check (map_shape_valid(map_shape));

-- ---------------------------------------------------------------------------
-- 2. The plan images
-- ---------------------------------------------------------------------------
create table if not exists facility_maps (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('overview', 'zone')),
  zone_id uuid references zones (id) on delete cascade,
  image_path text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  created_at timestamptz not null default now(),
  constraint facility_maps_kind_zone check ((kind = 'overview') = (zone_id is null))
);
-- one overview, one plan per zone
create unique index if not exists facility_maps_one_overview on facility_maps ((true)) where kind = 'overview';
create unique index if not exists facility_maps_one_per_zone on facility_maps (zone_id) where zone_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Nothing physical about Lifecycle
-- ---------------------------------------------------------------------------
create or replace function refuse_lifecycle_map()
returns trigger
language plpgsql
as $$
declare
  v_zone_id uuid;
begin
  if tg_table_name = 'zones' then
    v_zone_id := new.id;
    if new.map_shape is null then return new; end if;
  elsif tg_table_name = 'enclosures' then
    v_zone_id := new.zone_id;
    if new.map_shape is null then return new; end if;
  else
    v_zone_id := new.zone_id;
    if v_zone_id is null then return new; end if;
  end if;
  if exists (select 1 from zones where id = v_zone_id and name = 'Lifecycle') then
    raise exception 'The Lifecycle zone is not a physical place and cannot be on the map';
  end if;
  return new;
end;
$$;

drop trigger if exists zones_refuse_lifecycle_map on zones;
create trigger zones_refuse_lifecycle_map before insert or update of map_shape on zones
  for each row execute function refuse_lifecycle_map();
drop trigger if exists enclosures_refuse_lifecycle_map on enclosures;
create trigger enclosures_refuse_lifecycle_map before insert or update of map_shape, zone_id on enclosures
  for each row execute function refuse_lifecycle_map();
drop trigger if exists facility_maps_refuse_lifecycle_map on facility_maps;
create trigger facility_maps_refuse_lifecycle_map before insert or update of zone_id on facility_maps
  for each row execute function refuse_lifecycle_map();

-- ---------------------------------------------------------------------------
-- 4. Access
-- ---------------------------------------------------------------------------
alter table facility_maps enable row level security;
drop policy if exists facility_maps_read on facility_maps;
create policy facility_maps_read on facility_maps for select to authenticated using (true);
drop policy if exists management_rw_facility_maps on facility_maps;
create policy management_rw_facility_maps on facility_maps for all to authenticated
  using (current_user_role() in ('admin', 'management'))
  with check (current_user_role() in ('admin', 'management'));

-- ---------------------------------------------------------------------------
-- 5. Data API grants (docs/decisions.md, 2026-09-24: Supabase no longer adds them)
-- ---------------------------------------------------------------------------
revoke all on function map_shape_valid(jsonb) from public, anon;
grant execute on function map_shape_valid(jsonb) to authenticated, service_role;
revoke all on function refuse_lifecycle_map() from public, anon;
grant select, insert, update, delete on facility_maps to authenticated, service_role;
