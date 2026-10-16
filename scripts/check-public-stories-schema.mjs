// Rollback harness for 0214_public_stories_and_refused_insert.sql against DEV only. Run AFTER it is applied.
//
//   node scripts/check-public-stories-schema.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing: ends in a `raise`.
// Exits 0 when every assertion held. Writes nothing: ends in a `raise`.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $h$
declare
  ua uuid; ub uuid; v_res uuid; v_upd uuid;
  v_total int; v_shared int; v_anon int; v_n int; v_cols text;
begin
  select user_id into ua from user_roles where archived_at is null order by user_id limit 1;
  select user_id into ub from user_roles where archived_at is null and user_id <> ua order by user_id limit 1;
  update user_roles set role_id = (select id from roles where key = 'volunteer') where user_id = ua;
  update user_roles set role_id = (select id from roles where key = 'management') where user_id = ub;

  -- A1. nothing existing is publishable: count rows, rows ticked, rows anon sees
  select count(*) into v_total from adoption_updates;
  select count(*) into v_shared from adoption_updates where share_publicly;
  set local role anon;
  select count(*) into v_anon from public_adoption_updates;
  reset role;
  if v_shared <> 0 or v_anon <> 0 then raise exception 'FAIL A1 shared %, anon sees %', v_shared, v_anon; end if;

  -- A2. a fresh update defaults to not shared and stays invisible to anon even with photo + words
  select r.id into v_res from residents r
    where coalesce((select s.current_status from private.resident_current_state s where s.resident_id = r.id),'Resident') <> 'Deceased' limit 1;
  update residents set is_public_visible = true where id = v_res;
  insert into adoption_updates (resident_id, received_on, channel, note, public_story, public_first_name)
    values (v_res, current_date, 'line', 'PRIVATE staff note', 'Lucky loves it here', 'Somchai') returning id into v_upd;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, adoption_update_id)
    values ('resident', v_res, 'h-file-1', 'a.jpg', v_upd), ('resident', v_res, 'h-file-2', 'b.jpg', v_upd);
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, adoption_update_id)
    values ('resident', v_res, 'h-med', 'c.jpg', 'Medical', v_upd);
  if (select share_publicly from adoption_updates where id = v_upd) then raise exception 'FAIL A2 default is true'; end if;
  set local role anon;
  select count(*) into v_anon from public_adoption_updates where id = v_upd;
  reset role;
  if v_anon <> 0 then raise exception 'FAIL A2 anon sees unticked update'; end if;

  -- A3. ticked: two photos (Medical one excluded), only the five named columns
  update adoption_updates set share_publicly = true where id = v_upd;
  set local role anon;
  select count(*) into v_anon from public_adoption_updates where id = v_upd;
  reset role;
  if v_anon <> 2 then raise exception 'FAIL A3 anon sees % rows, want 2', v_anon; end if;
  select string_agg(column_name, ',' order by ordinal_position) into v_cols
    from information_schema.columns where table_name = 'public_adoption_updates';
  if v_cols <> 'id,resident_id,drive_file_id,public_story,public_first_name' then raise exception 'FAIL A3 columns %', v_cols; end if;

  -- A4. not public resident => gone; two-word first name refused
  update residents set is_public_visible = false where id = v_res;
  set local role anon;
  select count(*) into v_anon from public_adoption_updates where id = v_upd;
  reset role;
  if v_anon <> 0 then raise exception 'FAIL A4 non-public resident still visible'; end if;
  begin
    update adoption_updates set public_first_name = 'Somchai Jaidee' where id = v_upd;
    raise exception 'FAIL A4 surname accepted';
  exception when check_violation then null; end;

  -- B. policy, as real callers
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into assistant_actions (user_id, request_text, status) values (ua, 'delete rex', 'refused');
  begin insert into assistant_actions (user_id, request_text, status) values (ua, 'x', 'confirmed');
    raise exception 'FAIL B1 volunteer inserted confirmed';
  exception when insufficient_privilege then null; end;
  begin insert into assistant_actions (user_id, request_text, status) values (ub, 'x', 'refused');
    raise exception 'FAIL B2 volunteer inserted for someone else';
  exception when insufficient_privilege then null; end;
  select count(*) into v_n from assistant_actions;
  if v_n <> 0 then raise exception 'FAIL B3 volunteer reads % rows', v_n; end if;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into assistant_actions (user_id, request_text, status) values (ub, 'x', 'confirmed');
  reset role;

  raise exception 'HARNESS-OK existing rows % ticked 0 anon 0; fresh default false; ticked shows 2 photos (Medical excluded) with columns %; non-public resident hidden; surname refused; volunteer: refused own ok, confirmed refused, other-user refused, reads 0; management confirmed still ok', v_total, v_cols;
end
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
