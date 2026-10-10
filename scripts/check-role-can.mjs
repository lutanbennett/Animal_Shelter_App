// Rollback harness for 0133_role_can.sql against DEV only. One transaction: the
// live tables and 0132's seed, role_can() asked as each kind of login, a replay
// of the file, then a deliberate `raise exception` carrying the evidence, so
// nothing can commit. Safe to run any number of times.
//
//   node scripts/check-role-can.mjs     (from the repo root; dev only)
//
// It checks
//   A  parity: role_can(role, activity, level) equals has_permission(activity,
//      level) asked under a login of that role, for every role x every activity
//      x read / edit (600 answers: 5 roles x 60 activities since 0168/0169 added donation.receipt and community.outings), and for the four "answers no" cases (a
//      missing cell, an unknown activity, an archived role, a person with no
//      role) plus an unknown role key, null arguments and a mistyped level
//   B  Admin is yes for everything, an activity the catalogue does not know
//      included, and still no for a mistyped level or a null
//   C  who may ask: Management (and Admin) about any role; the service role;
//      anyone about their OWN role. Doctor, volunteer, public viewer, a
//      login with no role, an archived person, an archived role's holder and
//      anon are REFUSED (42501) about any other role, and answered about their own
//   D  the door follows the matrix: remove Management's recurring.manage cell and
//      Management is refused; give the volunteer one and the volunteer is let in
//   E  the file replays and the grants hold
//
// No live staff login or Staff principal: 0173 retired the role (its roles row is archived, so
// role_can('staff', ...) now answers no). The cases that asked about 'staff' as a live role ask
// about 'management' instead; the archived staff person stays.
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^\d+_role_can\.sql$/.test(f));
if (!file) throw new Error("no *_role_can.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;

create function pg_temp.q(p_uid uuid, p_expr text, p_aal text default 'aal1', p_pgrole text default 'authenticated')
returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims',
    case when p_uid is null then json_build_object('role', p_pgrole)::text
         else json_build_object('sub', p_uid, 'role', p_pgrole, 'aal', p_aal)::text end, true);
  execute format('set local role %I', p_pgrole);
  begin
    execute 'select (' || p_expr || ')::text' into v;
  exception when others then v := 'ERR:' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create function pg_temp.eq(p_label text, p_got text, p_want text) returns void language plpgsql as $f$
begin
  if p_got is distinct from p_want then
    raise exception 'HARNESS-FAIL %: got %, wanted %', p_label, coalesce(p_got, 'null'), coalesce(p_want, 'null');
  end if;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values
  ('admin', gen_random_uuid()), ('management', gen_random_uuid()),
  ('doctor', gen_random_uuid()), ('volunteer', gen_random_uuid()), ('public_viewer', gen_random_uuid()),
  ('norole', gen_random_uuid()), ('archperson', gen_random_uuid()), ('archrole', gen_random_uuid());
grant select on harness_ids to authenticated, service_role;

do $setup$
declare r record;
begin
  for r in select * from harness_ids loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-rolecan-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role)
  select id, who::app_role from harness_ids
   where who in ('admin', 'management', 'doctor', 'volunteer', 'public_viewer');
  insert into user_roles (user_id, role, archived_at)
  select id, 'staff', now() from harness_ids where who = 'archperson';
end $setup$;

-- A configured role that holds one cell and is archived.
-- (borrows 'management': it borrowed 'staff' until 0173 retired that role; and since 0173's trigger
-- refuses a live login on an archived role, the holder is given it first and the role archived after)
insert into roles (key, name, kind, legacy_role) values ('harness_archived', 'Harness archived', 'custom', 'management');
insert into role_permissions (role_id, activity, level)
select id, 'stock.count', 2 from roles where key = 'harness_archived';
insert into user_roles (user_id, role_id, role)
select h.id, r.id, 'management' from harness_ids h, roles r where h.who = 'archrole' and r.key = 'harness_archived';
update roles set archived_at = now() where key = 'harness_archived';

do $h$
declare
  v_report text := '';
  v_admin uuid := (select id from harness_ids where who = 'admin');
  v_mgmt  uuid := (select id from harness_ids where who = 'management');
  v_vol   uuid := (select id from harness_ids where who = 'volunteer');
  v_none  uuid := (select id from harness_ids where who = 'norole');
  v_archp uuid := (select id from harness_ids where who = 'archperson');
  v_archr uuid := (select id from harness_ids where who = 'archrole');
  v_role text;
  v_uid uuid;
  v_act text;
  v_lvl text;
  v_got text;
  v_want text;
  v_checked int := 0;
  v_who text;
begin
  -- A: parity with has_permission(), every role x activity x level, asked by Admin.
  for v_role in select unnest(array['admin','management','doctor','volunteer','public_viewer']) loop
    v_uid := (select id from harness_ids where who = v_role);
    for v_act in select key from permission_activities loop
      foreach v_lvl in array array['read', 'edit'] loop
        v_got  := pg_temp.q(v_admin, format('role_can(%L, %L, %L)', v_role, v_act, v_lvl));
        v_want := pg_temp.q(v_uid, format('has_permission(%L, %L)', v_act, v_lvl));
        perform pg_temp.eq(format('A %s %s %s', v_role, v_act, v_lvl), v_got, v_want);
        v_checked := v_checked + 1;
      end loop;
    end loop;
  end loop;
  perform pg_temp.eq('A count', v_checked::text, '600');
  -- the four "answers no" cases, from a caller who is allowed to ask
  perform pg_temp.eq('A missing cell', pg_temp.q(v_admin, 'role_can(''volunteer'', ''stock.purchasing'', ''edit'')'), 'false');
  perform pg_temp.eq('A unknown activity', pg_temp.q(v_admin, 'role_can(''management'', ''no.such_activity'', ''read'')'), 'false');
  perform pg_temp.eq('A archived role', pg_temp.q(v_admin, 'role_can(''harness_archived'', ''stock.count'', ''edit'')'), 'false');
  perform pg_temp.eq('A archived role matches has_permission', pg_temp.q(v_archr, 'has_permission(''stock.count'', ''edit'')'), 'false');
  perform pg_temp.eq('A person with no role matches has_permission', pg_temp.q(v_none, 'has_permission(''stock.count'', ''edit'')'), 'false');
  perform pg_temp.eq('A no such role key', pg_temp.q(v_admin, 'role_can(''no_such_role'', ''stock.count'', ''edit'')'), 'false');
  perform pg_temp.eq('A null role', pg_temp.q(v_admin, 'role_can(null, ''stock.count'', ''edit'')'), 'false');
  perform pg_temp.eq('A null activity', pg_temp.q(v_admin, 'role_can(''management'', null, ''edit'')'), 'false');
  perform pg_temp.eq('A null level', pg_temp.q(v_admin, 'role_can(''management'', ''stock.count'', null)'), 'false');
  perform pg_temp.eq('A mistyped level', pg_temp.q(v_admin, 'role_can(''management'', ''stock.count'', ''write'')'), 'false');
  perform pg_temp.eq('A default level is edit', pg_temp.q(v_admin, 'role_can(''management'', ''stock.count'')'), 'true');
  perform pg_temp.eq('A read-only cell is no for edit', pg_temp.q(v_admin, 'role_can(''volunteer'', ''resident.record'', ''edit'')'), 'false');
  perform pg_temp.eq('A read-only cell is yes for read', pg_temp.q(v_admin, 'role_can(''volunteer'', ''resident.record'', ''read'')'), 'true');
  v_report := v_report || 'A: 600 answers equal has_permission() under each role''s own login; missing cell, unknown activity, archived role, no-role person, unknown key, nulls, mistyped level all no | ';

  -- B: Admin.
  perform pg_temp.eq('B admin unknown activity', pg_temp.q(v_admin, 'role_can(''admin'', ''no.such_activity'', ''edit'')'), 'true');
  perform pg_temp.eq('B admin has no rows', (select count(*) from role_permissions rp join roles r on r.id = rp.role_id where r.key = 'admin')::text, '0');
  perform pg_temp.eq('B admin bad level', pg_temp.q(v_admin, 'role_can(''admin'', ''stock.count'', ''write'')'), 'false');
  perform pg_temp.eq('B admin null activity', pg_temp.q(v_admin, 'role_can(''admin'', null, ''edit'')'), 'false');
  perform pg_temp.eq('B public_viewer has nothing', pg_temp.q(v_admin, 'role_can(''public_viewer'', ''resident.record'', ''read'')'), 'false');
  v_report := v_report || 'B: Admin yes without a row, unknown activity included; no for bad level or null | ';

  -- C: who may ask.
  perform pg_temp.eq('C management asks about volunteer', pg_temp.q(v_mgmt, 'role_can(''volunteer'', ''resident.record'', ''read'')'), 'true');
  perform pg_temp.eq('C management asks about admin', pg_temp.q(v_mgmt, 'role_can(''admin'', ''stock.count'', ''edit'')'), 'true');
  perform pg_temp.eq('C management asks about doctor', pg_temp.q(v_mgmt, 'role_can(''doctor'', ''stock.count'', ''edit'')'), 'false');
  perform pg_temp.eq('C service role', pg_temp.q(null, 'role_can(''volunteer'', ''resident.record'', ''read'')', 'aal1', 'service_role'), 'true');
  perform pg_temp.eq('C anon refused', pg_temp.q(null, 'role_can(''volunteer'', ''stock.count'', ''edit'')', 'aal1', 'anon'), 'ERR:42501');
  for v_who in select unnest(array['doctor','volunteer','public_viewer','norole','archperson','archrole']) loop
    v_uid := (select id from harness_ids where who = v_who);
    foreach v_role in array array['volunteer', 'management', 'admin'] loop
      if v_role = v_who then continue; end if;
      perform pg_temp.eq(format('C %s refused about %s', v_who, v_role),
        pg_temp.q(v_uid, format('role_can(%L, ''stock.count'', ''edit'')', v_role)), 'ERR:42501');
    end loop;
    perform pg_temp.eq(format('C %s refused about an unknown role', v_who), pg_temp.q(v_uid, 'role_can(''no_such_role'', ''stock.count'', ''edit'')'), 'ERR:42501');
    perform pg_temp.eq(format('C %s refused with a null role', v_who), pg_temp.q(v_uid, 'role_can(null, ''stock.count'', ''edit'')'), 'ERR:42501');
  end loop;
  -- own role: answered, and equal to has_permission()
  foreach v_who in array array['doctor', 'volunteer', 'public_viewer'] loop
    v_uid := (select id from harness_ids where who = v_who);
    for v_act in select key from permission_activities loop
      perform pg_temp.eq(format('C own role %s %s', v_who, v_act),
        pg_temp.q(v_uid, format('role_can(%L, %L, ''edit'')', v_who, v_act)),
        pg_temp.q(v_uid, format('has_permission(%L, ''edit'')', v_act)));
    end loop;
  end loop;
  -- an archived person or an archived role's holder may not claim a role
  perform pg_temp.eq('C archived person cannot claim staff', pg_temp.q(v_archp, 'role_can(''staff'', ''stock.count'', ''edit'')'), 'ERR:42501');
  perform pg_temp.eq('C archived role holder cannot claim it', pg_temp.q(v_archr, 'role_can(''harness_archived'', ''stock.count'', ''edit'')'), 'ERR:42501');
  v_report := v_report || 'C: management, admin and the service role answered; doctor, volunteer, public viewer, no-role, archived person, archived-role holder and anon refused (42501) about any other role, answered about their own | ';

  -- D: the door follows the matrix.
  delete from role_permissions rp using roles r
   where rp.role_id = r.id and r.key = 'management' and rp.activity = 'recurring.manage';
  perform pg_temp.eq('D management loses the door', pg_temp.q(v_mgmt, 'role_can(''volunteer'', ''stock.count'', ''edit'')'), 'ERR:42501');
  perform pg_temp.eq('D admin keeps it', pg_temp.q(v_admin, 'role_can(''management'', ''stock.count'', ''edit'')'), 'true');
  insert into role_permissions (role_id, activity, level)
  select id, 'recurring.manage', 2 from roles where key = 'volunteer';
  perform pg_temp.eq('D volunteer given the cell is let in', pg_temp.q(v_vol, 'role_can(''management'', ''stock.count'', ''edit'')'), 'true');
  v_report := v_report || 'D: the door is recurring.manage, so an edit to that cell moves it | ';

  -- restore the cells, then replay.
  delete from role_permissions rp using roles r
   where rp.role_id = r.id and r.key = 'volunteer' and rp.activity = 'recurring.manage';
  insert into role_permissions (role_id, activity, level)
  select id, 'recurring.manage', 2 from roles where key = 'management';
  create temp table harness_report as select v_report as r;
end;
$h$;

${migration}

do $h2$
begin
  perform pg_temp.eq('E replay still answers', pg_temp.q((select id from harness_ids where who = 'management'), 'role_can(''volunteer'', ''resident.record'', ''read'')'), 'true');
  perform pg_temp.eq('E replay still refuses', pg_temp.q((select id from harness_ids where who = 'volunteer'), 'role_can(''management'', ''stock.count'', ''edit'')'), 'ERR:42501');
  perform pg_temp.eq('E one function', (select count(*) from pg_proc where proname = 'role_can')::text, '1');
  perform pg_temp.eq('E anon cannot execute', (select has_function_privilege('anon', 'public.role_can(text,text,text)', 'execute'))::text, 'false');
  perform pg_temp.eq('E authenticated can execute', (select has_function_privilege('authenticated', 'public.role_can(text,text,text)', 'execute'))::text, 'true');
  raise exception '%', format('HARNESS-OK %s asserted live | %s| E: the file replays and the grants hold', ${JSON.stringify(file).replace(/"/g, "'")}, (select r from harness_report));
end;
$h2$;
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
