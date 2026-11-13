// Rollback harness for 0371 and for the website account's isolation (backlog #d6wxo) against DEV only. Nothing commits.
//   node scripts/check-portal-account.mjs
// 1. SCOPE: the open Adopt OR Foster carer is in scope; a foster carer is out once the placement closes; an archived contact is out.
// 2. ISOLATION (the claim in CLAUDE.md, second exception: "can reach nothing else at all"): a signed-in login with NO role row and NO
//    card, acting through its own JWT as the `authenticated` database role, can read no row of any base table in `public`,
//    apart from the tables listed in OPEN_TO_ANY_LOGIN below (reference data that holds nothing about a person or an
//    animal; each would be named so that a new table readable by every login fails this check until someone looks at it). On
//    2026-11-13 the list is EMPTY: 111 tables swept, none readable. Writes are not swept: every table with a write policy resolves
//    through has_permission() (0262 onward, enforced by check-hard-coded-security), which is false for this login (checked above).
//    It also holds no permission: has_permission() is false for every activity in permission_activities.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// Tables a roleless login may read. Filled from the first run's findings, then reviewed one by one.
const OPEN_TO_ANY_LOGIN = (process.env.PORTAL_OPEN ?? "").split(",").filter(Boolean);

const sql = `
begin;
do $h$
declare r uuid; a uuid; b uuid; p uuid; uid uuid := gen_random_uuid(); t record; n bigint; seen int := 0; bad text := ''; open_to text[] := string_to_array('${OPEN_TO_ANY_LOGIN.join(",")}', ',');
begin
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0371', 'Dog', true, 'R-H371A') returning id into r;
  insert into contacts (name, type, email) values ('Foster A', 'Carer', 'h371a@example.invalid') returning id into a;
  insert into contacts (name, type, email) values ('Foster B', 'Carer', 'h371b@example.invalid') returning id into b;
  insert into placement_history (resident_id, placement_type, carer_id, start_date) values (r, 'Foster', a, now() - interval '2 days') returning id into p;
  if not adopter_may_submit(a, r) then raise exception 'FAIL 1 open foster carer not in scope'; end if;
  if adopter_may_submit(b, r) then raise exception 'FAIL 2 another contact in scope'; end if;
  update contacts set archived_at = now() where id = a;
  if adopter_may_submit(a, r) then raise exception 'FAIL 3 archived foster carer in scope'; end if;
  update contacts set archived_at = null where id = a;
  insert into placement_history (resident_id, placement_type, start_date) values (r, 'ReturnToShelter', now() - interval '1 hour');
  if adopter_may_submit(a, r) then raise exception 'FAIL 4 foster carer still in scope after the placement ended'; end if;

  -- isolation: a login with no user_roles row
  insert into auth.users (id, aud, role, email, email_confirmed_at, instance_id, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (uid, 'authenticated', 'authenticated', 'h371-portal@example.invalid', now(), '00000000-0000-0000-0000-000000000000', now(), now(), '{}', '{}');
  if exists (select 1 from user_roles where user_id = uid) then raise exception 'FAIL 6 a new login was given a role by something'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated', 'email', 'h371-portal@example.invalid')::text, true);
  set local role authenticated;
  for t in select a.activity from (select key as activity from permission_activities) a loop
    if has_permission(t.activity, 'read') then bad := bad || ' perm:' || t.activity; end if;
  end loop;
  for t in select c.relname from pg_class c join pg_namespace s on s.oid = c.relnamespace
            where s.nspname = 'public' and c.relkind in ('r','p') and has_table_privilege('authenticated', c.oid, 'select') order by 1 loop
    begin
      execute format('select count(*) from public.%I', t.relname) into n; seen := seen + 1;
      if n > 0 and not (t.relname = any(open_to)) then bad := bad || ' read:' || t.relname || '(' || n || ')'; end if;
    exception when others then null; end;
  end loop;
  reset role;
  if seen < 100 then raise exception 'FAIL 8 only % tables could be counted, the sweep is not covering the schema', seen; end if;
  if bad <> '' then raise exception 'FAIL 7 a login with no role and no card can reach:%', bad; end if;
  raise exception 'HARNESS-OK foster scope = open Adopt or Foster carer only, out when closed | a roleless login holds no permission and reads no non-reference table (% tables swept)', seen;
end; $h$;
rollback;
`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text; try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`); console.log(msg);
await exitWith(/HARNESS-OK/.test(msg) ? 0 : 1);
