// Rollback harness for 0226_status_alert_test_requests.sql against DEV only.
// One transaction, ends in a deliberate `raise exception` so nothing commits.
//
//   node scripts/check-status-alert-test-requests.mjs     (repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $$
declare
  v_status text;
  v_n integer;
  v_run bigint;
begin
  delete from status_alert_test_requests;
  -- R1 an insert can only ask: forged result columns are overwritten
  insert into status_alert_test_requests (requested_by_name, status, picked_up_at, note)
    values ('Harness', 'sent', now(), 'forged');
  select status into v_status from status_alert_test_requests;
  if v_status <> 'pending' then raise exception 'R1 forged status kept: %', v_status; end if;
  select count(*) into v_n from status_alert_test_requests where picked_up_at is null and note is null and run_id is null;
  if v_n <> 1 then raise exception 'R1 forged fields kept'; end if;
  -- R2 a second press while one is pending is refused (unique violation)
  begin
    insert into status_alert_test_requests (requested_by_name) values ('Harness again');
    raise exception 'R2 second pending request accepted';
  exception when unique_violation then null;
  end;
  -- R3 once handled, a new request is allowed
  insert into status_alert_runs (trigger, sent) values ('test', array['a@b.c']) returning id into v_run;
  update status_alert_test_requests set status = 'sent', picked_up_at = now(), run_id = v_run;
  insert into status_alert_test_requests (requested_by_name) values ('Harness third');
  select count(*) into v_n from status_alert_test_requests;
  if v_n <> 2 then raise exception 'R3 expected 2 rows, got %', v_n; end if;
  -- R4 signed-in users and visitors cannot touch it
  set local role authenticated;
  begin
    perform 1 from status_alert_test_requests;
    reset role;
    raise exception 'R4 authenticated read';
  exception when insufficient_privilege then null;
  end;
  reset role;
  raise exception 'HARNESS-OK 0226 forged-ignored, one-pending, re-ask-after-handled, authenticated-refused';
end $$;
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
