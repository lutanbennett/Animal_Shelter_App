-- consumer: none
--
-- Schema half of "A colour for each zone, shown as a coloured dot beside its name" (backlog, Lutan 2026-10-05).
-- Zones are known on site by colour (Main Zone blue, House Zone sand, Cat Zone pink), and today the only place
-- to say so is the name, so names carry "(Blue)". This adds the colour; the palette on Settings → Zones and the
-- dot beside every zone name are the next stream, from the updated main. Nothing reads any of this yet, and
-- every change is harmless to today's code (one nullable column, four views that only gain a trailing column).
--
--   zones.colour   nullable text, '#rrggbb' (either case), checked by a constraint. Null = no dot.
--
-- The constraint checks the FORM only, never a list of allowed values: the palette (about ten named swatches,
-- English and Thai names, plus No colour) belongs to the app, and a swatch tuned later for contrast must not
-- need a migration. Any '#rrggbb' the palette picks is accepted.
--
-- No new grant and no policy: zones are read by everyone who reads enclosures (facility.enclosures Read), and
-- the column rides on the table's existing policies and on each view's existing grants and row filter.
-- Not on the public site: public_enclosures does not carry the zone and is left alone.
--
-- Views, checked 2026-10-08 against dev (pg_depend on zones, then pg_get_viewdef): five views read zones.
--   resident_list_view          residents list, resident page, move/placement forms, pickers   + zone_colour
--   resident_who_and_where      the volunteer's resident and enclosure pages                    + zone_colour
--   medication_list_residents   the medication list (medical jobs' resident list)              + zone_colour
--   special_diet_list           the special diets list (medical jobs)                           + zone_colour
--   private.resident_current_state   carries current_zone_id only; readers look the zone up in the table.
-- Each is rewritten from its LIVE definition (resident_list_view now joins private.resident_current_state, not
-- the 0058 text), column for column, with zone_colour appended at the end, which is all `create or replace
-- view` allows. resident_list_view keeps security_invoker: create or replace view replaces a view's options,
-- so it is restated. The other three never had options. Grants and row filters are unchanged (a replaced view
-- keeps its grants). Screens that read the zones TABLE (enclosures list and chips, Settings → Zones, the
-- maintenance board, the facility map) see the column directly.
--
-- The Lifecycle pseudo-zone takes no colour: refuse_lifecycle_map (0142, 0161) refuses it, the same line it
-- draws for a map shape and an order.
--
-- Re-runnable throughout.

-- ===================================================================================================================
-- The column
-- ===================================================================================================================
alter table zones add column if not exists colour text;

alter table zones drop constraint if exists zones_colour_hex;
alter table zones add constraint zones_colour_hex check (colour is null or colour ~ '^#[0-9A-Fa-f]{6}$');

comment on column zones.colour is
  'The zone''s colour on site, as ''#rrggbb'', shown as a dot beside its name. Null = no dot. Form only is checked; the palette lives in the app. Null for the Lifecycle pseudo-zone, which takes no colour (0162).';

-- ===================================================================================================================
-- The Lifecycle refusal: a colour too
-- ===================================================================================================================
-- 0161's function with the colour added to what a zone row is checked for. The map and order messages are
-- unchanged; the colour has its own so the Settings screen can say which field was refused.
create or replace function refuse_lifecycle_map()
returns trigger
language plpgsql
as $$
declare
  v_zone_id uuid;
  v_shape boolean := false;
  v_order boolean := false;
  v_colour boolean := false;
begin
  if tg_table_name = 'zones' then
    v_zone_id := new.id;
    v_shape := new.map_shape is not null;
    v_order := new.sort_order is not null;
    v_colour := new.colour is not null;
  elsif tg_table_name = 'enclosures' then
    v_zone_id := new.zone_id;
    v_shape := new.map_shape is not null;
    v_order := new.sort_order is not null;
  else
    v_zone_id := new.zone_id;
    v_shape := v_zone_id is not null;
  end if;
  if not (v_shape or v_order or v_colour) then return new; end if;
  -- A zone row is checked by its own name too: on insert it is not in the table yet for the lookup to find.
  if (tg_table_name = 'zones' and new.name = 'Lifecycle')
     or exists (select 1 from zones where id = v_zone_id and name = 'Lifecycle') then
    if v_shape then
      raise exception 'The Lifecycle zone is not a physical place and cannot be on the map';
    end if;
    if v_colour then
      raise exception 'The Lifecycle zone is not a physical place and takes no colour';
    end if;
    raise exception 'The Lifecycle zone keeps its fixed place and takes no order';
  end if;
  return new;
end;
$$;

drop trigger if exists zones_refuse_lifecycle_map on zones;
create trigger zones_refuse_lifecycle_map before insert or update of map_shape, sort_order, colour on zones
  for each row execute function refuse_lifecycle_map();

-- ===================================================================================================================
-- The views that carry zone names
-- ===================================================================================================================
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
  z.name_th as zone_name_th,
  z.colour as zone_colour
from residents r
left join private.resident_current_state s on s.resident_id = r.id
left join enclosures e on e.id = s.current_enclosure_id
left join zones z on z.id = e.zone_id;

-- policy-free: the volunteer row filter below is 0134's, unchanged; only the trailing column is new.
create or replace view resident_who_and_where as
select r.id,
       r.name,
       r.thai_name,
       r.resident_code,
       r.species,
       r.sex,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.id as zone_id,
       z.name as zone_name,
       z.name_th as zone_name_th,
       z.colour as zone_colour
from residents r
left join private.resident_current_state s on s.resident_id = r.id
left join enclosures e on e.id = s.current_enclosure_id
left join zones z on z.id = e.zone_id
where current_user_role() = 'volunteer';

create or replace view medication_list_residents as
select r.id,
       r.name,
       r.thai_name,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.name as zone_name,
       z.name_th as zone_name_th,
       z.colour as zone_colour
  from residents r
  left join private.resident_current_state s on s.resident_id = r.id
  left join enclosures e on e.id = s.current_enclosure_id
  left join zones z on z.id = e.zone_id
 where (select has_permission('medical.prescriptions', 'read')) and (select sees_all_clinical());

create or replace view special_diet_list as
select d.id as resident_diet_id,
       r.id as resident_id,
       r.name,
       r.thai_name,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.name as zone_name,
       z.name_th as zone_name_th,
       t.id as diet_type_id,
       t.name as diet_name,
       t.unit as diet_unit,
       d.meals_per_day,
       coalesce(d.daily_quantity,
                case r.size when 'Small' then t.daily_qty_small
                            when 'Medium' then t.daily_qty_medium
                            when 'Large' then t.daily_qty_large end) as daily_quantity,
       d.notes,
       coalesce((select array_agg(rd.key order by rd.sort_order)
                   from resident_diet_rounds x
                   join rounds rd on rd.id = x.round_id
                  where x.resident_diet_id = d.id), array[]::text[]) as round_keys,
       z.colour as zone_colour
  from resident_diets d
  join diet_types t on t.id = d.diet_type_id
  join residents r on r.id = d.resident_id
  left join private.resident_current_state s on s.resident_id = r.id
  left join enclosures e on e.id = s.current_enclosure_id
  left join zones z on z.id = e.zone_id
 where t.is_standard = false
   and d.start_date <= shelter_today()
   and (d.end_date is null or d.end_date >= shelter_today())
   and (select has_permission('medical.diet', 'read'))
   and (select sees_all_clinical());

-- Grants restated as they stand (a replaced view keeps its grants; the runner's grant check asks for them in the
-- file all the same, and it makes a rebuild from the files land in the same place). resident_list_view: select
-- only, writes revoked as 0160 left it. The other three: 0134, 0136 and 0140's revoke-all then select.
revoke insert, update, delete, truncate, references, trigger on resident_list_view from authenticated, anon;
grant select on resident_list_view to authenticated, service_role;

revoke all on resident_who_and_where, medication_list_residents, special_diet_list from anon, authenticated, service_role;
grant select on resident_who_and_where, medication_list_residents, special_diet_list to authenticated, service_role;
