// Rollback harness for 0344_site_content_insert_policy.sql against DEV only. Nothing commits, even on success.
//   node scripts/check-site-content-insert.mjs
// Proves: a login holding the website_content card inserts id=true exactly once; a second insert fails; id=false fails;
// a login without the card is refused. Replays the migration inside the transaction, so it is meaningful before and after apply.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const migration = readFileSync(join(root, "supabase/migrations/0344_site_content_insert_policy.sql"), "utf8");

const sql = `
begin;
create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values ('with', gen_random_uuid()), ('without', gen_random_uuid());
grant select on harness_ids to authenticated;
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0344-' || who || '-' || id || '@example.invalid', '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || who), now(), now()
  from harness_ids;
insert into roles (key, name, kind) values ('harness_0344_with', 'Harness 0344 with', 'custom'), ('harness_0344_without', 'Harness 0344 without', 'custom');
insert into role_permissions (role_id, activity, level) select id, 'website.content', 2 from roles where key = 'harness_0344_with';
insert into role_permissions (role_id, activity, level) select id, 'stock.count', 2 from roles where key = 'harness_0344_without';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'harness_0344_with' where h.who = 'with';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'harness_0344_without' where h.who = 'without';

-- start from the missing state (rolled back, so Test's row is untouched)
delete from site_content;

create function pg_temp.try_insert(p_uid uuid, p_id boolean) returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    insert into site_content (id) values (p_id);
    v := 'ok';
  exception when others then v := 'ERR:' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

${migration}

do $t$
declare
  w uuid := (select id from harness_ids where who = 'with');
  n uuid := (select id from harness_ids where who = 'without');
  r text[];
begin
  r[1] := pg_temp.try_insert(n, true);   -- no card: refused (42501)
  r[2] := pg_temp.try_insert(w, false);  -- card but id=false: refused
  r[3] := pg_temp.try_insert(w, true);   -- card, id=true: allowed
  r[4] := pg_temp.try_insert(w, true);   -- second: refused (23505)
  if r[1] <> 'ERR:42501' then raise exception 'HARNESS-FAIL no card: %', r[1]; end if;
  if r[2] = 'ok' then raise exception 'HARNESS-FAIL id=false inserted'; end if;
  if r[3] <> 'ok' then raise exception 'HARNESS-FAIL with card: %', r[3]; end if;
  if r[4] <> 'ERR:23505' then raise exception 'HARNESS-FAIL second insert: %', r[4]; end if;
  if (select count(*) from site_content) <> 1 then raise exception 'HARNESS-FAIL row count'; end if;
  raise exception 'HARNESS-OK nocard=% idfalse=% withcard=% second=%', r[1], r[2], r[3], r[4];
end $t$;
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
