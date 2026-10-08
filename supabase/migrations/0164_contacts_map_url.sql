-- consumer: src/app/contacts/, src/app/management/contacts/, src/app/management/shelter-friends/, src/components/FriendCard.tsx, src/lib/contacts/, src/lib/shelter-friends/, src/app/admin/facility-map/actions.ts
--
-- Schema half of two backlog items (Lutan, 2026-10-08), which both said to do it together:
--   "Contacts: separate 'Address' and 'Map link' fields, so the written address is never a URL", and
--   parts (1)/(2) of "Maps on contacts and Shelter Friends: … store the real location (a pin)".
-- The second item said "a map_url or the pin columns — decide which in the schema PR, and do not build both".
-- This file is the decision: a map_url, no latitude/longitude. Why, in
-- docs/decisions/2026-10-08-contacts-map-url-not-pin.md. The forms, the contact page and the Friend card are
-- the next stream, from the updated main.
--
--   contacts.map_url   nullable text: the Google Maps link for the place, kept apart from `address`, which is
--                      the written address for reading and for post. Null = no map link (the app then falls
--                      back to reading `address` as it does today).
--
-- The constraint checks the FORM only: http(s), and no whitespace anywhere, so the column holds exactly one
-- link and never "link, space, written address" — the stopgap 0036's one field forced, and suspect (a) of the
-- 404 item. Whether a link leads to a place is the app's to judge (map-preview.ts follows it), never the
-- database's. Same idea as 0120's check on site_content.contact_map_url, one step stricter.
--
-- No rows are moved here. Today's code reads the map from `address` (splitAddress), so emptying the link out
-- of `address` now would take every map off the screens until the feature ships. The move ("link to map_url,
-- the text after it stays as the address") belongs with the feature that reads the new column.
--
-- Who can read it. The column rides on contacts' existing policies (staff and above read the whole row). A
-- vet and a volunteer read contacts only through vet_contacts / volunteer_contacts (0126), which list their
-- columns, so map_url is private to them, as `address` is. Nothing else reads contacts by `*`.
--
-- The public site. public_shelter_friends.map_location is now the friend's map_url, falling back to the
-- address while map_url is empty, and is still released only when the friend opted in (show_map, 0076).
-- `address` stays under show_address. The fallback keeps today's /friends map exactly as it is until rows
-- are moved; once they are, a friend with a written address and no link still gets the address-search map
-- they have today. The view keeps its shape (same columns, same order), so `create or replace` is enough,
-- and is rewritten from its LIVE definition on dev (2026-10-08, pg_get_viewdef), which reads
-- private.approved_translations — moved there after 0076 was written. No options (not security_invoker).
-- public_viewer and anon gain no column: map_location already existed.
--
-- Re-runnable: add column if not exists, drop constraint if exists then add, create or replace view.

alter table contacts add column if not exists map_url text;

alter table contacts drop constraint if exists contacts_map_url_form;
alter table contacts add constraint contacts_map_url_form
  check (map_url ~* '^https?://[^[:space:]]+$');

comment on column contacts.map_url is
  'The Google Maps link for this contact''s place (what Share in the Maps app copies), apart from the written address. One link, no spaces (contacts_map_url_form). Null = no link. 0164.';

create or replace view public_shelter_friends as
select sf.id,
       c.name,
       sf.blurb,
       sf.help_kind,
       sf.discount_note,
       sf.website_url,
       sf.facebook_url,
       sf.logo_drive_file_id,
       sf.friend_since,
       sf.sort_order,
       case when sf.show_phone then c.phone end as phone,
       case when sf.show_email then c.email end as email,
       case when sf.show_line then c.line_id end as line_id,
       case when sf.show_address then c.address end as address,
       case when sf.show_map then coalesce(c.map_url, c.address) end as map_location,
       private.approved_translations('shelter_friends'::text, sf.id) as translations
  from shelter_friends sf
  join contacts c on c.id = sf.contact_id
 where sf.published
   and c.archived_at is null;

-- Grants restated as they stand (a replaced view keeps its grants): select for anon and authenticated, the
-- public site's read; every write revoked, as 0076 left it.
grant select on public_shelter_friends to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_shelter_friends from anon, authenticated;

-- ===================================================================================================================
-- Also folded in (Lutan, 2026-10-08, from the facility-map-upload stream; one schema PR in flight at a time):
-- adding a facility plan for a ZONE failed with 42703 `record "new" has no field "name"`.
-- ===================================================================================================================
-- 0162's refuse_lifecycle_map() tested `(tg_table_name = 'zones' and new.name = 'Lifecycle')`. PL/pgSQL still
-- resolves new.name there, so on facility_maps, which has no name column, every insert with a zone_id died before the
-- real check. The overview (zone_id null) and replacing a plan returned earlier and were fine. The name is now read
-- only inside the zones branch. Body otherwise unchanged from 0162 (checked against the live definition on dev): same
-- three messages, same triggers; create or replace keeps the grants, and 0161's revoke is restated.
create or replace function refuse_lifecycle_map()
returns trigger
language plpgsql
as $$
declare
  v_zone_id uuid;
  v_shape boolean := false;
  v_order boolean := false;
  v_colour boolean := false;
  v_is_lifecycle boolean := false;
begin
  if tg_table_name = 'zones' then
    v_zone_id := new.id;
    v_shape := new.map_shape is not null;
    v_order := new.sort_order is not null;
    v_colour := new.colour is not null;
    -- A zone row is checked by its own name too: on insert it is not in the table yet for the lookup to find.
    v_is_lifecycle := new.name = 'Lifecycle';
  elsif tg_table_name = 'enclosures' then
    v_zone_id := new.zone_id;
    v_shape := new.map_shape is not null;
    v_order := new.sort_order is not null;
  else
    v_zone_id := new.zone_id;
    v_shape := v_zone_id is not null;
  end if;
  if not (v_shape or v_order or v_colour) then return new; end if;
  if v_is_lifecycle or exists (select 1 from zones where id = v_zone_id and name = 'Lifecycle') then
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

revoke all on function refuse_lifecycle_map() from public, anon;

notify pgrst, 'reload schema';
