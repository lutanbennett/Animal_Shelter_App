// Rollback harness for 0076_shelter_friends.sql against DEV only.
// One transaction: the migration, assertions against real rows, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-shelter-friends.mjs     (from the repo root; dev only)
//
// The point of 0076 is what an anonymous visitor cannot see, so the view
// is read with `set local role anon`, as the website reads it: an
// unpublished Friend, an archived contact's Friend and every contact
// detail nobody opted into must all be invisible.
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0076_shelter_friends.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

-- What anon sees of one Friend, as json (null when the row is not visible).
create function pg_temp.anon_view(p_id uuid) returns jsonb language plpgsql as $f$
declare v jsonb;
begin
  set local role anon;
  select to_jsonb(p) into v from public_shelter_friends p where p.id = p_id;
  reset role;
  return v;
end $f$;

do $h$
declare
  v_contact uuid; v_friend uuid; v_other uuid; v_user uuid;
  v_row jsonb; v_n int; v_rejected boolean;
begin
  insert into contacts (name, type, phone, email, line_id, address)
  values ('Harness 0076 Feed Shop', 'Vendor', '053-000-000', 'shop@example.test', '@harnessshop', '12 Moo 3, Mae Rim')
  returning id into v_contact;
  insert into contacts (name, type) values ('Harness 0076 Hardware', 'Vendor') returning id into v_other;

  -- A. defaults: a new profile is unpublished with every detail opted out
  insert into shelter_friends (contact_id, blurb, help_kind, discount_note, website_url, facebook_url, logo_drive_file_id)
  values (v_contact, 'Gives us cat litter every month.', 'Donates goods',
          '10% off for adopters, show your adoption card', 'https://shop.example.test',
          'https://facebook.com/harnessshop', 'harness0076logo')
  returning id into v_friend;
  select count(*) into v_n from shelter_friends
   where id = v_friend and not published and not show_phone and not show_email
     and not show_line and not show_address and not show_map;
  if v_n <> 1 then raise exception 'FAIL A new profile is not unpublished / opted out by default'; end if;

  -- B. unpublished → invisible to anon
  if pg_temp.anon_view(v_friend) is not null then raise exception 'FAIL B unpublished Friend visible to anon'; end if;

  -- C. published, nothing opted in → name, prose and links only; every contact detail null
  update shelter_friends set published = true where id = v_friend;
  v_row := pg_temp.anon_view(v_friend);
  if v_row is null then raise exception 'FAIL C published Friend not visible to anon'; end if;
  if v_row ->> 'name' <> 'Harness 0076 Feed Shop' or v_row ->> 'website_url' is null or v_row ->> 'blurb' is null
    then raise exception 'FAIL C public fields missing: %', v_row; end if;
  if coalesce(v_row ->> 'phone', v_row ->> 'email', v_row ->> 'line_id', v_row ->> 'address', v_row ->> 'map_location') is not null
    then raise exception 'FAIL C a detail nobody opted into reached anon: %', v_row; end if;
  -- nothing private from contacts is a column of the view at all
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'public_shelter_friends'
     and column_name in ('notes', 'messenger_id', 'whatsapp', 'type', 'contact_id', 'archived_at', 'archive_reason', 'published');
  if v_n <> 0 then raise exception 'FAIL C % private columns on the view', v_n; end if;

  -- D. each opt-in releases exactly its own field
  update shelter_friends set show_phone = true where id = v_friend;
  v_row := pg_temp.anon_view(v_friend);
  if v_row ->> 'phone' <> '053-000-000' or coalesce(v_row ->> 'email', v_row ->> 'line_id', v_row ->> 'address', v_row ->> 'map_location') is not null
    then raise exception 'FAIL D show_phone released more or less than phone: %', v_row; end if;
  update shelter_friends set show_phone = false, show_map = true where id = v_friend;
  v_row := pg_temp.anon_view(v_friend);
  if v_row ->> 'map_location' <> '12 Moo 3, Mae Rim' or coalesce(v_row ->> 'phone', v_row ->> 'email', v_row ->> 'line_id', v_row ->> 'address') is not null
    then raise exception 'FAIL D show_map released more or less than the pin: %', v_row; end if;
  update shelter_friends set show_map = false, show_email = true, show_line = true, show_address = true where id = v_friend;
  v_row := pg_temp.anon_view(v_friend);
  if v_row ->> 'email' is null or v_row ->> 'line_id' is null or v_row ->> 'address' is null
     or coalesce(v_row ->> 'phone', v_row ->> 'map_location') is not null
    then raise exception 'FAIL D email/line/address opt-ins wrong: %', v_row; end if;

  -- E. archiving the contact drops the Friend; restoring brings it back
  select id into v_user from auth.users limit 1;
  update contacts set archived_at = now(), archived_by = v_user, archive_reason = 'harness' where id = v_contact;
  if pg_temp.anon_view(v_friend) is not null then raise exception 'FAIL E archived contact''s Friend visible to anon'; end if;
  update contacts set archived_at = null, archived_by = null, archive_reason = null where id = v_contact;
  if pg_temp.anon_view(v_friend) is null then raise exception 'FAIL E restored contact''s Friend not visible'; end if;

  -- F. anon cannot go around the view
  v_rejected := false;
  begin
    set local role anon;
    perform 1 from shelter_friends limit 1;
    reset role;
  exception when insufficient_privilege then v_rejected := true; reset role; end;
  if not v_rejected then raise exception 'FAIL F anon can select shelter_friends directly'; end if;
  v_rejected := false;
  begin
    set local role anon;
    update public_shelter_friends set name = 'x' where id = v_friend;
    reset role;
  -- 42501 no privilege, or 55000 not updatable (a join view): either way refused
  exception when insufficient_privilege or object_not_in_prerequisite_state then v_rejected := true; reset role; end;
  if not v_rejected then raise exception 'FAIL F anon can update through the view'; end if;

  -- G. one profile per contact; links must be http(s)
  v_rejected := false;
  begin insert into shelter_friends (contact_id) values (v_contact);
  exception when unique_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL G second profile for one contact accepted'; end if;
  v_rejected := false;
  begin insert into shelter_friends (contact_id, website_url) values (v_other, 'javascript:alert(1)');
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL G javascript: website_url accepted'; end if;

  -- H. translations queued for all three prose fields, labelled in the queue
  select count(*) into v_n from translation_queue
   where table_name = 'shelter_friends' and row_id = v_friend and status = 'pending'
     and record_label = 'Shelter Friend · Harness 0076 Feed Shop'
     and record_path = '/contacts/' || v_contact;
  if v_n <> 3 then raise exception 'FAIL H % of 3 queue rows (blurb, help_kind, discount_note)', v_n; end if;

  -- I. the photo proxy knows the logo
  if not is_known_drive_file('harness0076logo') then raise exception 'FAIL I logo unknown to the photo proxy'; end if;
  if not is_known_drive_file((select drive_file_id from attachments limit 1)) and exists (select 1 from attachments)
    then raise exception 'FAIL I proxy lost an existing attachment'; end if;

  -- J. deleting the contact deletes the profile and its translations
  delete from contacts where id = v_contact;
  select count(*) into v_n from shelter_friends where id = v_friend;
  select count(*) + v_n into v_n from translations where table_name = 'shelter_friends' and row_id = v_friend;
  if v_n <> 0 then raise exception 'FAIL J % profile/translation rows outlived the contact', v_n; end if;

  raise exception 'HARNESS-OK defaults unpublished + opted out | anon: unpublished hidden, published shows name/prose/links with every detail null, no private columns | each show_* releases only its field (map without address) | archived contact hidden, restored shown | anon refused on table and on view write | unique contact, http(s) links | 3 translations queued with label+path | proxy knows logo | contact delete cascades | file ran twice';
end;
$h$;
rollback;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
