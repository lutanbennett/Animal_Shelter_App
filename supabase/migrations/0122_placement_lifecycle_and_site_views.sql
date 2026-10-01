-- Placement lifecycle guard (backlog DB-9) and fixed-column views for the
-- public site's three base tables (the live half of DB-10).
--
-- DB-9. Status logic finds the Lifecycle zone and its five pseudo-enclosures
-- (Unassigned, Hospital, Fostered, Adopted, Deceased) by NAME: resident_current_
-- state (0001, 0026), record_intake (0008...), the deceased workflow (0026),
-- the placement-target guard (0119). Renaming "Deceased" raises nothing; it
-- silently detaches the status machine from its target. Deleting one fails
-- only while a placement points at it. /admin/zones and /admin/enclosures let
-- an admin do both.
--
-- A `protected` flag on zones and enclosures, set on those six rows and
-- enforced by trigger, rather than a hard-coded name check: the flag survives
-- a rename the project does want (a migration lifts it with the logic that
-- matches the name, in the same file), and a name check would have to be kept
-- in step with every function that matches one. A protected row refuses
-- DELETE, refuses a change of name, refuses a move to another zone, and refuses
-- the flag being cleared. Everything else about it (capacity, notes, name_th,
-- internal) is still editable. Like the other trigger-enforced invariants
-- (0026's on-death lock, 0112's source flag, 0119's placement guards) it binds
-- every role including the table owner; a migration that really must change
-- one disables the trigger around that statement.
--
-- DB-10. site_content, site_pages and site_content_photos were base tables
-- granted `select` to anon (0077), so any column added to them was
-- world-readable the moment it existed. It had already happened:
-- site_content carries vet_visit_estimate (0071), an internal figure
-- (src/lib/site/content.ts says so) that anon could read straight from
-- /rest/v1/site_content. Anon now reads fixed-column views instead and loses
-- the base tables:
--
--   public_site_content          the columns src/lib/site/content.ts lists
--                                (SITE_CONTENT_COLUMNS) plus the id the
--                                singleton lookup filters on
--   public_site_content_photos   id, drive_file_id, alt, sort_order
--   public_site_pages            already exists (0059): fixed columns
--
-- A new column on a base table is private until it is added to its view.
-- scripts/check-migration-grants.mjs now also refuses `grant … to anon` on
-- anything not named public_* / site_*, so the next table cannot be exposed
-- by a grant either. Staff keep the base tables: `authenticated` is
-- untouched.
--
-- Additive and re-runnable.

-- =========================================================================
-- DB-9. protected flag
-- =========================================================================

alter table zones add column if not exists protected boolean not null default false;
alter table enclosures add column if not exists protected boolean not null default false;

create or replace function guard_protected_zone()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'The % zone is protected: status logic finds it by name, so it cannot be deleted', old.name;
  end if;
  if new.name is distinct from old.name then
    raise exception 'The % zone is protected: status logic finds it by name, so it cannot be renamed', old.name;
  end if;
  if new.protected is distinct from old.protected then
    raise exception 'The % zone is protected: the flag cannot be removed', old.name;
  end if;
  return new;
end;
$$;

create or replace function guard_protected_enclosure()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'The % pseudo-enclosure is protected: status logic finds it by name, so it cannot be deleted', old.name;
  end if;
  if new.name is distinct from old.name or new.zone_id is distinct from old.zone_id then
    raise exception 'The % pseudo-enclosure is protected: status logic finds it by name and zone, so it cannot be renamed or moved', old.name;
  end if;
  if new.protected is distinct from old.protected then
    raise exception 'The % pseudo-enclosure is protected: the flag cannot be removed', old.name;
  end if;
  return new;
end;
$$;

-- Only a row that is protected is held to it: the trigger fires for every
-- row but the `when` keeps an ordinary zone's rename a plain update.
drop trigger if exists zones_guard_protected on zones;
create trigger zones_guard_protected
  before update or delete on zones
  for each row when (old.protected)
  execute function guard_protected_zone();

drop trigger if exists enclosures_guard_protected on enclosures;
create trigger enclosures_guard_protected
  before update or delete on enclosures
  for each row when (old.protected)
  execute function guard_protected_enclosure();

-- Flip the flag after the triggers exist: false -> true passes the guards
-- (they only run for rows already protected), and a re-run changes nothing.
update zones set protected = true where name = 'Lifecycle' and not protected;

update enclosures e
set protected = true
from zones z
where z.id = e.zone_id
  and z.name = 'Lifecycle'
  and e.name in ('Unassigned', 'Hospital', 'Fostered', 'Adopted', 'Deceased')
  and not e.protected;

comment on column zones.protected is
  'True for the Lifecycle pseudo-zone, which status logic matches by name (0122). Cannot be renamed, deleted or unflagged.';
comment on column enclosures.protected is
  'True for the five Lifecycle pseudo-enclosures, which status logic matches by name (0122). Cannot be renamed, moved, deleted or unflagged.';

-- =========================================================================
-- DB-10. fixed-column views for anon
-- =========================================================================

-- Owner-rights views, like the other public_* views: anon needs no grant on
-- the base table, and the base table's `using (true)` read policy is no longer
-- what stands between a visitor and a new column. A column is public only
-- when it is named here.
create or replace view public_site_content as
select
  id,
  hero_drive_file_id,
  hero_alt,
  hero_alt_th,
  tagline,
  tagline_th,
  contact_email,
  contact_address,
  contact_phone,
  contact_line,
  contact_map_url,
  facebook_url,
  instagram_url,
  messenger_url,
  whatsapp_number,
  x_url,
  visiting_hours,
  visiting_hours_th,
  featured_resident_id,
  preferred_channels
from site_content;

create or replace view public_site_content_photos as
select id, drive_file_id, alt, sort_order
from site_content_photos;

grant select on public_site_content, public_site_content_photos
  to anon, authenticated, service_role;
revoke insert, update, delete, truncate, references, trigger
  on public_site_content, public_site_content_photos from anon, authenticated;

-- The base tables go back to staff only. public_site_pages (0059) already
-- reads site_pages as its owner.
revoke all on site_content, site_content_photos, site_pages from anon;

notify pgrst, 'reload schema';
