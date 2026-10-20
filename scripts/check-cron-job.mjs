// READ-ONLY: is the nightly assistant-retention job scheduled and active?
//
//   node scripts/check-cron-job.mjs --env production
//
// pg_cron runs inside the database, so applying 0227 IS the install and nothing
// reports whether it took. This runs two SELECTs (cron.job, pg_proc) and nothing
// else: no writes, no DDL, no --apply path. Exits 0 only when exactly one job
// named purge-assistant-actions exists, is active, runs '17 3 * * *' and calls
// public.purge_assistant_actions(), and that function exists.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const ref = projectRef(env);

const sql = `select
  (select coalesce(json_agg(json_build_object('schedule', schedule, 'active', active, 'command', command)), '[]'::json)
     from cron.job where jobname = 'purge-assistant-actions') as jobs,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'purge_assistant_actions') as fns`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let row;
try { row = JSON.parse(text)[0]; } catch { /* reported below */ }
if (!res.ok || !row) {
  console.error(`check-cron-job: query failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  process.exitCode = 1;
} else {
  const jobs = row.jobs ?? [];
  const problems = [];
  if (jobs.length !== 1) problems.push(`expected 1 job named purge-assistant-actions, found ${jobs.length}`);
  else {
    if (jobs[0].active !== true) problems.push("job exists but active = false");
    if (jobs[0].schedule !== "17 3 * * *") problems.push(`schedule is ${jobs[0].schedule}, expected 17 3 * * *`);
    if (!/purge_assistant_actions\(\)/.test(jobs[0].command)) problems.push(`command does not call purge_assistant_actions(): ${jobs[0].command}`);
  }
  if (Number(row.fns) !== 1) problems.push(`expected 1 public.purge_assistant_actions(), found ${row.fns}`);
  if (problems.length) {
    console.error(`check-cron-job (${envName}): NOT RIGHT`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
  } else {
    console.log(`check-cron-job (${envName}): ok — purge-assistant-actions is active, 17 3 * * *, and the function exists.`);
  }
}
