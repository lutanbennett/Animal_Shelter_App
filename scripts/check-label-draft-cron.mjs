// READ-ONLY. Asserts the Thai label-draft cron is scoped and watched (#lblcr).
//
//   node scripts/check-label-draft-cron.mjs --env test      (test = the dev database)
//
// SCOPED  (1) propose_label_th() on the live database names shelter_id in its insert, so a draft takes the shelter of
//             the row it labels (0408); (2) worker/translations.mjs sends x-shelter-id on every rpc it makes, because
//             without it the login holds no card at all (measured 2026-11-18).
// WATCHED (3) scheduled_writer_runs and record_scheduled_writer_run() exist, and neither is reachable by anon or a
//             signed-in login; (4) worker/index.mjs reports the label run; (5) the job's last reported run is not a
//             failure two runs deep (the same threshold src/lib/status/health.ts turns red on).
// ACTIVE  "never reported" is printed as a WARNING, not a failure: an environment that has not deployed the Worker, or
//         has no label login, has nothing to report, and "skipped" counts as healthy.
// Exit 0 = all asserted; 1 = a fault; 2 = could not read. Cannot see the Pi, production (--env production is Lutan's PC), or
// whether the Worker's trigger is firing: the 15-minute heartbeat (worker/heartbeat.mjs) answers that.
import { readFileSync } from "node:fs";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const sql = `select
  (select prosrc from pg_proc where proname = 'propose_label_th' and pronamespace = 'public'::regnamespace) as propose_src,
  to_regclass('public.scheduled_writer_runs') is not null as has_table,
  (select relrowsecurity from pg_class where oid = to_regclass('public.scheduled_writer_runs')) as rls_on,
  (select oid is not null from pg_proc where proname = 'record_scheduled_writer_run' and pronamespace = 'public'::regnamespace) as has_fn,
  coalesce(has_function_privilege('anon', 'public.record_scheduled_writer_run(text,text,text)', 'execute'), false)
    or coalesce(has_function_privilege('authenticated', 'public.record_scheduled_writer_run(text,text,text)', 'execute'), false) as fn_open,
  coalesce(has_table_privilege('anon', 'public.scheduled_writer_runs', 'select'), false)
    or coalesce(has_table_privilege('authenticated', 'public.scheduled_writer_runs', 'select'), false) as table_open,
  case when to_regclass('public.scheduled_writer_runs') is null then '[]'::json
       else (select coalesce(json_agg(r), '[]'::json) from (select job, last_outcome, last_detail, last_ran_at, fail_runs from public.scheduled_writer_runs order by job) r) end as runs`;
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let row;
try { row = JSON.parse(text)[0]; } catch { /* reported below */ }
if (!res.ok || !row) {
  console.error(`check-label-draft-cron: query failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  await exitWith(2);
}

let bad = 0;
const assert = (ok, name, why) => { if (!ok) bad++; console.log(`${ok ? "ok   " : "FAIL "} ${name}${ok ? "" : `: ${why}`}`); };
const strip = (s) => s.replace(/--[^\n]*/g, "");
const insert = /insert\s+into\s+label_drafts\s*\(([^)]*)\)/i.exec(strip(row.propose_src ?? ""));
assert(Boolean(insert) && /\bshelter_id\b/i.test(insert[1]), "propose_label_th stamps shelter_id from the row it labels", "its insert into label_drafts does not name shelter_id, so the draft takes whatever header the caller sent (apply 0408)");

const worker = readFileSync(new URL("../worker/translations.mjs", import.meta.url), "utf8");
const labelFn = worker.slice(worker.indexOf("export async function runLabelDrafts"));
assert(/"x-shelter-id":\s*shelter/.test(labelFn), "the label run sends x-shelter-id on every rpc", "worker/translations.mjs runLabelDrafts no longer sends the shelter header; the login would hold no card");
const index = readFileSync(new URL("../worker/index.mjs", import.meta.url), "utf8");
assert(/reportWriterRun\(env,\s*"label-drafts"/.test(index), "the Worker reports the label run", "worker/index.mjs does not call reportWriterRun for label-drafts, so a failure is only a log line");

assert(row.has_table && row.rls_on, "scheduled_writer_runs exists with row security on", "table missing or RLS off (apply 0408)");
assert(row.has_fn, "record_scheduled_writer_run() exists", "function missing (apply 0408)");
assert(!row.fn_open && !row.table_open, "neither is reachable by anon or a signed-in login", "anon or authenticated holds a grant on the writer-run table or function");

const label = (row.runs ?? []).find((r) => r.job === "label-drafts");
if (!label) console.log("warn  label-drafts has never reported on this database (Worker not deployed here, or no label login); not a fault");
else {
  const age = ((Date.now() - Date.parse(label.last_ran_at)) / 36e5).toFixed(1);
  assert(!(label.last_outcome === "failed" && label.fail_runs >= 2), `label-drafts last run is ${label.last_outcome} (${age}h ago)`, `failed ${label.fail_runs} runs in a row: ${label.last_detail}`);
}
await exitWith(bad ? 1 : 0);
