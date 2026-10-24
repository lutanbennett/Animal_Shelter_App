-- consumer: none
--
-- One shelter-wide record of which public website pages and menu sections are hidden. SCHEMA ONLY: nothing in
-- src/ or worker/ reads it yet (the app half is a later stream), so applying this hides nothing.
--
--   site_content.hidden_public_pages text[] not null default '{}'
--
-- A column on the settings singleton rather than a table: the app asks "is this hidden?" on every public
-- request, and a one-row array read is one value the Worker already fetches with the rest of the site settings
-- (public_site_content). A table would be a second read per request for a list that is a dozen entries long.
--
-- KEYS. Every entry is 'page:<key>' or 'section:<key>' (the prefix keeps the Adopt page and the Adopt section
-- apart). Pages: adopt, adopt-international, foster, volunteer, donate, appeals, friends, friends-join, desexing,
-- our-work, about. Sections: adopt, get-involved, services. Home and Privacy are NOT in the vocabulary, and
-- /r/ and /e/ are not either, so the database refuses them: a typo or a hand edit cannot hide the Home page or
-- the page Google's sign-in links to. Adding a page to the public site later means adding its key here.
--
-- WRITE: unchanged. site_content is written under admin_update_site_content (website.content, 0163), so only
-- people who can already change Admin -> Website can set it. No new role test.
-- READ: site_content itself is not readable by visitors (0195). The public reads the column through
-- public_site_content, which runs as its owner and is granted to anon (0237); the view is appended to here.
-- AUDIT: record_audit() cannot sit on site_content (boolean id, cast to uuid), so a small dedicated trigger
-- writes the same audit_log shape for this one column, as 0254 does for the Stocktaking switches.

alter table site_content add column if not exists hidden_public_pages text[] not null default '{}';

alter table site_content drop constraint if exists site_content_hidden_public_pages_check;
alter table site_content add constraint site_content_hidden_public_pages_check
  check (hidden_public_pages <@ array[
    'page:adopt', 'page:adopt-international', 'page:foster', 'page:volunteer', 'page:donate', 'page:appeals',
    'page:friends', 'page:friends-join', 'page:desexing', 'page:our-work', 'page:about',
    'section:adopt', 'section:get-involved', 'section:services'
  ]::text[]);

comment on column site_content.hidden_public_pages is
  'Public pages and menu sections hidden from visitors (0256): page:<key> or section:<key>. Empty = everything shown. Home and Privacy cannot be listed. Written under website.content; audited. Nothing reads it until the app half lands.';

create or replace function site_content_hidden_pages_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_named text;
begin
  if new.hidden_public_pages is not distinct from old.hidden_public_pages then
    return null;
  end if;

  v_actor := auth.uid();
  if v_actor is null then
    v_named := current_setting('app.actor', true);
    if v_named ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_actor := v_named::uuid;
    end if;
  end if;

  insert into audit_log (table_name, row_id, op, actor, old_row, new_row)
  values (
    'site_content',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'UPDATE',
    v_actor,
    jsonb_build_object('hidden_public_pages', old.hidden_public_pages),
    jsonb_build_object('hidden_public_pages', new.hidden_public_pages)
  );
  return null;
end;
$$;

revoke execute on function site_content_hidden_pages_audit() from public, anon, authenticated;

drop trigger if exists site_content_hidden_pages_audit on site_content;
create trigger site_content_hidden_pages_audit after update on site_content
  for each row execute function site_content_hidden_pages_audit();

-- The public view, with the new column appended (never reordered).
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
  preferred_channels,
  donate_photo_drive_file_id,
  donate_photo_alt,
  donate_photo_alt_th,
  foster_photo_drive_file_id,
  foster_photo_alt,
  foster_photo_alt_th,
  volunteer_photo_drive_file_id,
  volunteer_photo_alt,
  volunteer_photo_alt_th,
  about_photo_drive_file_id,
  about_photo_alt,
  about_photo_alt_th,
  registration_text,
  registration_text_th,
  contact_address_th,
  gift_split_year,
  gift_split_unit,
  gift_split_food,
  gift_split_vet,
  gift_split_sterilisation,
  gift_split_running,
  hidden_public_pages
from site_content;

grant select on public_site_content to anon, authenticated, service_role;

notify pgrst, 'reload schema';
