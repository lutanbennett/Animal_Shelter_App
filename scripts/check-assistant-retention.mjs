// Rollback harness for 0227_assistant_retention.sql against DEV only.
// Run AFTER the migration is applied.
//
//   node scripts/check-assistant-refused.mjs     (from the repo root; dev only)
//
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
  v_user uuid; v_left text; v_n int; v_jobs int; v_ex boolean;
begin
  select id into v_user from auth.users limit 1;
  delete from assistant_actions;
  insert into assistant_actions (user_id, request_text, status, created_at) values
    (v_user, 'old-confirmed', 'confirmed', now() - interval '3 days'),
    (v_user, 'new-confirmed', 'confirmed', now() - interval '1 day'),
    (v_user, 'old-cancelled', 'cancelled', now() - interval '3 days'),
    (v_user, 'unmatched-30d', 'unmatched', now() - interval '30 days'),
    (v_user, 'unmatched-100d', 'unmatched', now() - interval '100 days'),
    (v_user, 'refused-30d', 'refused', now() - interval '30 days'),
    (v_user, 'refused-100d', 'refused', now() - interval '100 days');
  v_n := public.purge_assistant_actions();
  select string_agg(request_text, ',' order by request_text) into v_left from assistant_actions;
  if v_n <> 4 or v_left <> 'new-confirmed,refused-30d,unmatched-30d' then raise exception 'FAIL purged %, left %', v_n, v_left; end if;
  select count(*) into v_jobs from cron.job where jobname = 'purge-assistant-actions';
  if v_jobs <> 1 then raise exception 'FAIL cron jobs %', v_jobs; end if;
  select has_function_privilege('authenticated', 'public.purge_assistant_actions()', 'execute') into v_ex;
  if v_ex then raise exception 'FAIL authenticated can execute'; end if;
  raise exception 'HARNESS-OK purged 4 of 7, kept new-confirmed + 30d unmatched/refused; cron job scheduled; authenticated cannot run it';
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
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
