// 0193 (can_see_drive_file) proved equivalent to the seven selects the photo route used to run, on dev, keeping nothing.
//
//   node scripts/check-can-see-drive-file.mjs
//
// For one live login of every role, plus anon and service_role, and for every Drive id the seven sources hold (plus ids
// that do not exist), the function must answer exactly what "any of the seven selects returns a row" answers under the
// same session. Prints how many ids each role may see, so a vacuous pass (everyone sees nothing) is visible.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
// The route's seven selects: a branch the session has no privilege on returns an error and no rows (supabase-js
// gives { data: null, error }), which the route counts as "no" for that branch while the others still count.
const BRANCHES = [
  ["attachments", "drive_file_id"], ["project_photos", "drive_file_id"], ["maintenance_photos", "drive_file_id"],
  ["community_outing_photos", "drive_file_id"], ["shelter_friends", "logo_drive_file_id"],
  ["medication", "label_drive_file_id"], ["stock_medications", "label_drive_file_id"],
];
const oldBody = BRANCHES.map(([t, c]) => `begin if exists (select 1 from ${t} where ${c} = p_id) then return true; end if; exception when insufficient_privilege then null; end;`).join(" ");
const sql = `
begin;
create temp table ids (id text);
insert into ids select distinct drive_file_id from (
  select drive_file_id from attachments union all select drive_file_id from project_photos
  union all select drive_file_id from maintenance_photos union all select drive_file_id from community_outing_photos
  union all select logo_drive_file_id from shelter_friends union all select label_drive_file_id from medication
  union all select label_drive_file_id from stock_medications) s where drive_file_id is not null;
insert into ids values ('no-such-file-id-0000'), ('');
grant all on ids to anon, authenticated, service_role;
create temp table r (n serial, who text, total int, old_yes int, new_yes int, mismatches int);
grant all on r to anon, authenticated, service_role;
create function pg_temp.old_see(p_id text) returns boolean language plpgsql as $f$
begin
  ${oldBody}
  return false;
end $f$;
grant execute on function pg_temp.old_see(text) to anon, authenticated, service_role;
create function pg_temp.new_see(p_id text) returns text language plpgsql as $f$
begin return can_see_drive_file(p_id)::text; exception when others then return 'ERR:' || sqlstate; end $f$;
grant execute on function pg_temp.new_see(text) to anon, authenticated, service_role;
create function pg_temp.cmp(p_label text, p_uid uuid, p_pgrole text) returns void language plpgsql as $f$
declare t int; o int; nw int; mm int;
begin
  perform set_config('request.jwt.claims', case when p_uid is null then json_build_object('role', p_pgrole)::text
    else json_build_object('sub', p_uid, 'role', p_pgrole, 'aal', 'aal1')::text end, true);
  execute format('set local role %I', p_pgrole);
  select count(*), count(*) filter (where pg_temp.old_see(id)), count(*) filter (where pg_temp.new_see(id) = 'true'),
    count(*) filter (where pg_temp.old_see(id)::text is distinct from (case when p_pgrole = 'anon' and pg_temp.new_see(id) = 'ERR:42501' then 'false' else pg_temp.new_see(id) end)) into t, o, nw, mm from ids;
  reset role;
  insert into r (who, total, old_yes, new_yes, mismatches) values (p_label, t, o, nw, mm);
end $f$;
do $$
declare rec record;
begin
  perform pg_temp.cmp('anon', null, 'anon');
  perform pg_temp.cmp('service_role', null, 'service_role');
  for rec in select distinct on (x.key) x.key, ur.user_id from user_roles ur join roles x on x.id = ur.role_id
             where ur.archived_at is null order by x.key, ur.user_id loop
    perform pg_temp.cmp(rec.key, rec.user_id, 'authenticated');
  end loop;
  perform pg_temp.cmp('authenticated, no role', gen_random_uuid(), 'authenticated');
end $$;
do $$ begin raise exception 'RESULT%RESULT', (select json_agg(json_build_object('who', who, 'total', total, 'old', old_yes, 'new', new_yes, 'mm', mismatches) order by n) from r); end $$;
`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const body = await res.json().catch(() => null);
const msg = body?.message ?? JSON.stringify(body);
const m = msg.match(/RESULT(\[[\s\S]*\])RESULT/);
if (!m) { console.log(res.status, msg.slice(0, 2000)); process.exit(1); }
let bad = 0;
for (const x of JSON.parse(m[1])) {
  if (x.mm || x.old !== x.new) bad++;
  console.log(`${x.mm ? "FAIL" : "ok  "} ${x.who.padEnd(24)} ids ${x.total}  old-path may see ${x.old}  rpc may see ${x.new}  disagreements ${x.mm}`);
}
console.log(bad ? `${bad} FAILED` : "old path and rpc agree for every role (rolled back, nothing kept)");
process.exitCode = bad ? 1 : 0;
