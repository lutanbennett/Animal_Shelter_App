// Rollback harness for 0285_shop_links.sql against DEV only. One transaction, a deliberate `raise exception` at the end, so
// nothing can commit. Safe to run any number of times.
//
//   node scripts/check-shop-links.mjs     (from the repo root; dev only)
//
// It checks
//   A  http:// refused, https:// accepted, a blank shop title refused, a Friend entry with its own title refused
//   B  public view: a shown shop and a shown entry for a published Friend appear; a hidden shop, an entry for an
//      UNPUBLISHED Friend and an entry for an ARCHIVED Friend's contact do not; the Friend's name and logo come from
//      its own profile, and none of its other fields (blurb, phone) are columns of the view
//   C  anon: reads the view, cannot read or write the table
//   D  a login holding shop.manage (edit) writes; one holding it at read only reads but cannot write; one without it
//      reads nothing and writes nothing
//   E  Admin does all of it, holding no cards
//   F  the photo proxy serves a shown entry's photo and not a hidden one's, and still serves a Friend logo
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
if (!readdirSync(join(root, "supabase/migrations")).some((f) => /^0285_shop_links\.sql$/.test(f))) {
  throw new Error("no 0285_shop_links.sql in supabase/migrations");
}

const sql = `
begin;

create function pg_temp.q(p_uid uuid, p_expr text) returns text language plpgsql as $f$
declare v text; n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    if p_expr ~* '^[[:space:]]*(insert|update|delete)' then
      execute p_expr; get diagnostics n = row_count; v := n::text;
    else
      execute 'select (' || p_expr || ')::text' into v;
    end if;
  exception when others then v := 'ERR:' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

-- same, as the signed-out visitor
create function pg_temp.qa(p_expr text) returns text language plpgsql as $f$
declare v text; n int;
begin
  set local role anon;
  begin
    if p_expr ~* '^[[:space:]]*(insert|update|delete)' then
      execute p_expr; get diagnostics n = row_count; v := n::text;
    else
      execute 'select (' || p_expr || ')::text' into v;
    end if;
  exception when others then v := 'ERR:' || sqlstate;
  end;
  reset role;
  return v;
end $f$;

create function pg_temp.eq(p_label text, p_got text, p_want text) returns void language plpgsql as $f$
begin
  if p_got is distinct from p_want then
    raise exception 'HARNESS-FAIL %: got %, wanted %', p_label, coalesce(p_got, 'null'), coalesce(p_want, 'null');
  end if;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values ('admin', gen_random_uuid()), ('editor', gen_random_uuid()),
  ('reader', gen_random_uuid()), ('none', gen_random_uuid());
grant select on harness_ids to authenticated, anon;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-shop-' || who || '-' || id || '@example.invalid', '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || who), now(), now()
  from harness_ids;

-- Roles hold cells (the union of their cards); no Admin cell is ever written.
insert into roles (key, name, kind) values ('harness_shop_edit', 'Harness shop edit', 'custom'),
  ('harness_shop_read', 'Harness shop read', 'custom'), ('harness_shop_none', 'Harness shop none', 'custom');
insert into role_permissions (role_id, activity, level) select id, 'shop.manage', 2 from roles where key = 'harness_shop_edit';
insert into role_permissions (role_id, activity, level) select id, 'shop.manage', 1 from roles where key = 'harness_shop_read';
insert into role_permissions (role_id, activity, level) select id, 'stock.count', 2 from roles where key = 'harness_shop_none';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'admin' where h.who = 'admin';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'harness_shop_edit' where h.who = 'editor';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'harness_shop_read' where h.who = 'reader';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'harness_shop_none' where h.who = 'none';

do $a$
declare
  v_admin uuid := (select id from harness_ids where who = 'admin');
  v_editor uuid := (select id from harness_ids where who = 'editor');
  v_reader uuid := (select id from harness_ids where who = 'reader');
  v_none uuid := (select id from harness_ids where who = 'none');
  c_live uuid; c_unpub uuid; c_arch uuid;
  f_live uuid; f_unpub uuid; f_arch uuid;
  s_shown uuid; s_hidden uuid; e_live uuid; e_unpub uuid; e_arch uuid;
begin
  -- the card exists and does something; Admin holds none
  perform pg_temp.eq('card grants the activity', (select count(*) from card_grants where card = 'manage_shop_page' and activity = 'shop.manage' and level = 2)::text, '1');
  perform pg_temp.eq('admin holds no cells', (select count(*) from role_permissions rp join roles r on r.id = rp.role_id where r.key = 'admin')::text, '0');

  -- three Friends: published, unpublished, published-but-archived contact
  insert into contacts (name, type, phone) values ('Harness live friend', (enum_range(null::contact_type))[1], '0811111111') returning id into c_live;
  insert into contacts (name, type) values ('Harness unpublished friend', (enum_range(null::contact_type))[1]) returning id into c_unpub;
  insert into contacts (name, type, archived_at) values ('Harness archived friend', (enum_range(null::contact_type))[1], now()) returning id into c_arch;
  insert into shelter_friends (contact_id, blurb, logo_drive_file_id, published, show_phone) values (c_live, 'PRIVATE-BLURB-CHECK', 'h0285logo', true, false) returning id into f_live;
  insert into shelter_friends (contact_id, published) values (c_unpub, false) returning id into f_unpub;
  insert into shelter_friends (contact_id, published) values (c_arch, true) returning id into f_arch;

  -- A. the link and shape checks (as the editor, so RLS is in play too)
  perform pg_temp.eq('A http refused', pg_temp.q(v_editor, $q$ insert into shop_links (title, link_url) values ('x', 'http://shop.test/a') $q$), 'ERR:23514');
  perform pg_temp.eq('A blank title refused', pg_temp.q(v_editor, $q$ insert into shop_links (title, link_url) values ('  ', 'https://shop.test/a') $q$), 'ERR:23514');
  perform pg_temp.eq('A javascript refused', pg_temp.q(v_editor, $q$ insert into shop_links (title, link_url) values ('x', 'javascript:alert(1)') $q$), 'ERR:23514');
  perform pg_temp.eq('A friend with own title refused', pg_temp.q(v_editor, format($q$ insert into shop_links (friend_id, title, link_url) values (%L, 'dup', 'https://shop.test/a') $q$, f_live)), 'ERR:23514');

  -- D. the editor writes
  perform pg_temp.eq('D editor inserts shown shop', pg_temp.q(v_editor, $q$ insert into shop_links (title, link_url, note, price_hint, photo_drive_file_id, shown) values ('Harness shown shop', 'https://shop.test/a', 'a note', 'from 50 baht', 'h0285photo', true) $q$), '1');
  perform pg_temp.eq('D editor inserts hidden shop', pg_temp.q(v_editor, $q$ insert into shop_links (title, link_url, photo_drive_file_id, shown) values ('Harness hidden shop', 'https://shop.test/b', 'h0285hidden', false) $q$), '1');
  perform pg_temp.eq('D editor adds live friend', pg_temp.q(v_editor, format($q$ insert into shop_links (friend_id, link_url, shown) values (%L, 'https://friend.test/ref?x=1', true) $q$, f_live)), '1');
  perform pg_temp.eq('D editor adds unpublished friend', pg_temp.q(v_editor, format($q$ insert into shop_links (friend_id, link_url, shown) values (%L, 'https://friend.test/u', true) $q$, f_unpub)), '1');
  perform pg_temp.eq('D editor adds archived friend', pg_temp.q(v_editor, format($q$ insert into shop_links (friend_id, link_url, shown) values (%L, 'https://friend.test/r', true) $q$, f_arch)), '1');
  perform pg_temp.eq('D one entry per friend', pg_temp.q(v_editor, format($q$ insert into shop_links (friend_id, link_url) values (%L, 'https://friend.test/dup') $q$, f_live)), 'ERR:23505');
  perform pg_temp.eq('D editor updates', pg_temp.q(v_editor, $q$ update shop_links set note = 'edited' where title = 'Harness shown shop' $q$), '1');
  perform pg_temp.eq('D editor reads', pg_temp.q(v_editor, $q$ (select count(*) from shop_links where link_url like 'https://%') $q$), '5');

  -- D. the reader reads, cannot write
  perform pg_temp.eq('D reader reads', pg_temp.q(v_reader, $q$ (select count(*) from shop_links) $q$), '5');
  perform pg_temp.eq('D reader cannot insert', pg_temp.q(v_reader, $q$ insert into shop_links (title, link_url) values ('r', 'https://shop.test/r') $q$), 'ERR:42501');
  perform pg_temp.eq('D reader cannot update', pg_temp.q(v_reader, $q$ update shop_links set note = 'r' $q$), '0');
  perform pg_temp.eq('D reader cannot delete', pg_temp.q(v_reader, $q$ delete from shop_links $q$), '0');

  -- D. no card, nothing
  perform pg_temp.eq('D none reads nothing', pg_temp.q(v_none, $q$ (select count(*) from shop_links) $q$), '0');
  perform pg_temp.eq('D none cannot insert', pg_temp.q(v_none, $q$ insert into shop_links (title, link_url) values ('n', 'https://shop.test/n') $q$), 'ERR:42501');
  perform pg_temp.eq('D none cannot delete', pg_temp.q(v_none, $q$ delete from shop_links $q$), '0');

  -- C. anon
  perform pg_temp.eq('C anon cannot read the table', pg_temp.qa($q$ (select count(*) from shop_links) $q$), 'ERR:42501');
  perform pg_temp.eq('C anon cannot write the table', pg_temp.qa($q$ insert into shop_links (title, link_url) values ('a', 'https://shop.test/a') $q$), 'ERR:42501');
  perform pg_temp.eq('C anon cannot write the view', (substr(pg_temp.qa($q$ update public_shop_links set note = 'a' $q$), 1, 4) = 'ERR:')::text, 'true');

  -- B. the public view
  perform pg_temp.eq('B anon sees exactly two harness entries', pg_temp.qa($q$ (select count(*) from public_shop_links where name like 'Harness%') $q$), '2');
  perform pg_temp.eq('B shown shop is there', pg_temp.qa($q$ (select count(*) from public_shop_links where name = 'Harness shown shop' and note = 'edited' and price_hint = 'from 50 baht') $q$), '1');
  perform pg_temp.eq('B hidden shop is not', pg_temp.qa($q$ (select count(*) from public_shop_links where name = 'Harness hidden shop') $q$), '0');
  perform pg_temp.eq('B live friend: name and logo from its profile', pg_temp.qa(format($q$ (select count(*) from public_shop_links where friend_id = %L and name = 'Harness live friend' and logo_drive_file_id = 'h0285logo' and link_url = 'https://friend.test/ref?x=1') $q$, f_live)), '1');
  perform pg_temp.eq('B unpublished friend is not', pg_temp.qa(format($q$ (select count(*) from public_shop_links where friend_id = %L) $q$, f_unpub)), '0');
  perform pg_temp.eq('B archived friend is not', pg_temp.qa(format($q$ (select count(*) from public_shop_links where friend_id = %L) $q$, f_arch)), '0');
  perform pg_temp.eq('B the view names exactly these columns', (select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'public_shop_links'),
    'id,friend_id,name,logo_drive_file_id,photo_drive_file_id,link_url,note,price_hint,sort_order,translations');
  -- a Friend's profile changes show at once, and unpublishing it removes the entry: nothing was copied
  update contacts set name = 'Harness renamed friend' where id = c_live;
  perform pg_temp.eq('B rename follows', pg_temp.qa(format($q$ (select name from public_shop_links where friend_id = %L) $q$, f_live)), 'Harness renamed friend');
  update shelter_friends set published = false where id = f_live;
  perform pg_temp.eq('B unpublishing removes the entry', pg_temp.qa(format($q$ (select count(*) from public_shop_links where friend_id = %L) $q$, f_live)), '0');
  update shelter_friends set published = true where id = f_live;

  -- F. the photo proxy
  perform pg_temp.eq('F shown photo served', pg_temp.qa($q$ is_public_drive_file('h0285photo') $q$), 'true');
  perform pg_temp.eq('F hidden photo not served', pg_temp.qa($q$ is_public_drive_file('h0285hidden') $q$), 'false');
  perform pg_temp.eq('F friend logo still served', pg_temp.qa($q$ is_public_drive_file('h0285logo') $q$), 'true');
  perform pg_temp.eq('F earlier branches kept (appeal photos)', (select (position('public_appeal_photos' in pg_get_functiondef('is_public_drive_file(text)'::regprocedure)) > 0 and position('public_adoption_updates' in pg_get_functiondef('is_public_drive_file(text)'::regprocedure)) > 0)::text), 'true');

  -- E. Admin does all of it
  perform pg_temp.eq('E admin inserts', pg_temp.q(v_admin, $q$ insert into shop_links (title, link_url, shown) values ('Harness admin shop', 'https://shop.test/admin', true) $q$), '1');
  perform pg_temp.eq('E admin http refused too', pg_temp.q(v_admin, $q$ insert into shop_links (title, link_url) values ('x', 'http://shop.test/a') $q$), 'ERR:23514');
  perform pg_temp.eq('E admin reads', pg_temp.q(v_admin, $q$ (select count(*) from shop_links) $q$), '6');
  perform pg_temp.eq('E admin updates', pg_temp.q(v_admin, $q$ update shop_links set note = 'admin' where title = 'Harness admin shop' $q$), '1');
  perform pg_temp.eq('E admin deletes', pg_temp.q(v_admin, $q$ delete from shop_links where title = 'Harness admin shop' $q$), '1');
  perform pg_temp.eq('E editor deletes', pg_temp.q(v_editor, $q$ delete from shop_links where title = 'Harness hidden shop' $q$), '1');
  -- deleting a Friend takes its entry with it
  delete from shelter_friends where id = f_arch;
  perform pg_temp.eq('cascade', (select count(*) from shop_links where friend_id = f_arch)::text, '0');

  raise exception 'HARNESS-OK 0285_shop_links.sql: all assertions held';
end $a$;
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
await exitWith(/HARNESS-OK/.test(msg) ? 0 : 1);
