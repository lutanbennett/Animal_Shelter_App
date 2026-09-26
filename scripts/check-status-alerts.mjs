// Rollback harness for 0098_status_alerts.sql against DEV only. One
// transaction: the migration twice (re-runnable), the writes the alert run
// makes, the checks that keep bad rows out, and the refusal of every role a
// signed-in user or a visitor holds — then a deliberate `raise exception`
// carrying the evidence, so nothing can commit.
//
//   node scripts/check-status-alerts.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0098_status_alerts.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

do $$
declare
  v_n integer;
  v_report text := '';
begin
  -- S1 what a run writes: an upsert per check, a run row
  insert into status_alert_checks (check_key, state, error, fail_runs)
    values ('harness-drive', 'fail', 'Drive said no', 1)
    on conflict (check_key) do update set state = excluded.state, fail_runs = status_alert_checks.fail_runs + 1;
  insert into status_alert_checks (check_key, state, error, fail_runs)
    values ('harness-drive', 'fail', 'Drive said no', 1)
    on conflict (check_key) do update set state = excluded.state, fail_runs = status_alert_checks.fail_runs + 1,
      alerted_at = now();
  select fail_runs into v_n from status_alert_checks where check_key = 'harness-drive';
  if v_n <> 2 then raise exception 'S1 fail_runs is %, not 2', v_n; end if;
  insert into status_alert_runs (trigger, failing, mailed, sent, skipped)
    values ('cron', '{harness-drive}', '{"failed":["harness-drive"],"recovered":[]}',
            '{a@example.invalid}', '[{"address":"b@example.invalid","reason":"E_UNVERIFIED"}]');
  insert into status_alert_runs (trigger) values ('manual'), ('test');
  select count(*) into v_n from status_alert_runs where failing = '{}' and skipped = '[]'::jsonb and sent = '{}';
  if v_n < 2 then raise exception 'S1 run defaults did not apply'; end if;
  v_report := v_report || ' | S1 upsert counts consecutive fails, run rows default empty';

  -- S2 checks
  begin
    insert into status_alert_checks (check_key, state) values ('harness-x', 'red');
    raise exception 'S2 state red accepted';
  exception when check_violation then null;
  end;
  begin
    insert into status_alert_checks (check_key, state, fail_runs) values ('harness-y', 'ok', -1);
    raise exception 'S2 negative fail_runs accepted';
  exception when check_violation then null;
  end;
  begin
    insert into status_alert_runs (trigger) values ('webhook');
    raise exception 'S2 trigger webhook accepted';
  exception when check_violation then null;
  end;
  v_report := v_report || ' | S2 unknown state, negative fail_runs, unknown trigger refused';

  -- S3 nobody but the service role
  set local role authenticated;
  begin
    perform 1 from status_alert_checks;
    reset role;
    raise exception 'S3 authenticated read status_alert_checks';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into status_alert_runs (trigger) values ('manual');
    reset role;
    raise exception 'S3 authenticated wrote status_alert_runs';
  exception when insufficient_privilege then null;
  end;
  reset role;
  set local role anon;
  begin
    perform 1 from status_alert_runs;
    reset role;
    raise exception 'S3 anon read status_alert_runs';
  exception when insufficient_privilege then null;
  end;
  reset role;
  set local role service_role;
  select count(*) into v_n from status_alert_runs;
  insert into status_alert_runs (trigger) values ('cron');
  update status_alert_checks set fail_runs = 0, alerted_at = null where check_key = 'harness-drive';
  delete from status_alert_runs where trigger = 'test';
  reset role;
  if v_n < 3 then raise exception 'S3 service_role sees % run rows', v_n; end if;
  v_report := v_report || ' | S3 authenticated and anon refused by the grant, service_role reads, inserts, updates, deletes';

  raise exception 'HARNESS-OK 0098 twice%', v_report;
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
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
