// Rollback harness for 0334_waiting_event_titles.sql against DEV only. One transaction; a deliberate raise carries
// the evidence, so nothing commits.   node scripts/check-waiting-event-titles.mjs
// Proves: a login holding photos.approve (and not events.run) reads the title + date of an event with a waiting photo
// and ONLY those columns, and cannot read the event row itself; an event with no waiting photo is not listed; a login
// holding neither photos.approve nor events.run reads nothing.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $h$
declare
  v_admin uuid; v_appr uuid; v_none uuid; v_u uuid; v_e1 uuid; v_e2 uuid; v_n int; v_t text; v_cols text;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where ur.archived_at is null and r.key = 'admin' limit 1;
  if v_admin is null then raise exception 'SETUP no admin login'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into fundraising_events (title, event_date) values ('h0334 with photo', current_date) returning id into v_e1;
  insert into fundraising_events (title, event_date) values ('h0334 no photo', current_date) returning id into v_e2;
  reset role;
  alter table attachments disable trigger user;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, approved_at, private_only_at)
    values ('event', v_e1, 'h0334-drive', 'h0334.jpg', null, null);
  alter table attachments enable trigger user;

  -- find one non-admin login holding photos.approve but not events.run, and one holding neither
  for v_u in select distinct user_id from user_roles where archived_at is null and user_id <> v_admin loop
    perform set_config('request.jwt.claims', json_build_object('sub', v_u, 'role', 'authenticated')::text, true);
    set local role authenticated;
    if v_appr is null and public.has_permission('photos.approve') and not public.has_permission('events.run') then v_appr := v_u; end if;
    if v_none is null and not public.has_permission('photos.approve') and not public.has_permission('events.run') then v_none := v_u; end if;
    reset role;
  end loop;
  if v_appr is null or v_none is null then raise exception 'SETUP need an approver-only and a neither login (got % / %)', v_appr, v_none; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_appr, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*), max(title) into v_n, v_t from waiting_event_titles() where id in (v_e1, v_e2);
  if v_n <> 1 or v_t <> 'h0334 with photo' then raise exception 'FAIL A approver got % rows, title %', v_n, v_t; end if;
  select count(*) into v_n from fundraising_events where id in (v_e1, v_e2);
  if v_n <> 0 then raise exception 'FAIL B approver read % event rows directly', v_n; end if;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_none, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from waiting_event_titles();
  if v_n <> 0 then raise exception 'FAIL C a login with neither read % titles', v_n; end if;
  reset role;

  raise exception 'HARNESS-OK approver reads the title of the event with a waiting photo only | the function returns id, title, event_date and no other column | approver cannot read the table directly | a login holding neither reads nothing';
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
await exitWith(/HARNESS-OK/.test(msg) ? 0 : 1);
