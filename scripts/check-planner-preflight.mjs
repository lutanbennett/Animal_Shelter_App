// WHAT CAN THIS SESSION ACTUALLY REACH? Run it at the top of every /plan-day.
//
//   node scripts/check-planner-preflight.mjs                 (dev)
//   node scripts/check-planner-preflight.mjs --env production (also probes production)
//
// WHY THIS EXISTS. On 2026-11-04 `#ubejc` moved SUPABASE_ACCESS_TOKEN out of every
// .env.local into a Windows user environment variable that sessions' shells do not
// have. From that moment NO session could apply a migration or read either database
// — and nobody found out for nine hours, until a stream needed 0315 and asked Lutan
// to put the secret back in a file. He lost the evening to it.
//
// The planner is the only role that can read production, and `.claude/skills/plan-day`
// makes "run the command an item names" a standing job. A planner that has silently
// lost that ability will instead ASK HIM to check things — which is exactly how three
// settled confirmations were put back on his list the same night.
//
// So: prove what is reachable before planning anything, and say plainly what is not.
// It only reads. It never prints a secret, only whether one is present and its length.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { exitWith } from "./lib/exit.mjs";

const root = process.cwd();
const { loadEnv, parseEnvArg, projectRef } = await import(
  pathToFileURL(join(root, "scripts/lib/env.mjs")).href
);
const { name } = parseEnvArg(process.argv.slice(2));
const env = loadEnv("test");

let failed = 0;
const say = (ok, msg, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}${detail ? ` — ${detail}` : ""}`);
};

// ---------------------------------------------------------------- credentials
// Presence and length only. A value is never printed.
for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
]) {
  const v = env[key];
  say(!!v, `${key} is available to this session`, v ? `${v.length} characters` : "missing");
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const ref = url ? projectRef(env) : null;

// ------------------------------------------------------------------ dev reads
// The REST interface answers with the service role key. This is the credential a
// planner still has when the Management API token has gone, and on 2026-11-04 the
// planner spent an evening saying "I cannot read the database" without checking it.
if (url && env.SUPABASE_SERVICE_ROLE_KEY) {
  const svc = env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(`${url}/rest/v1/residents?select=id&limit=1`, {
    headers: { apikey: svc, Authorization: `Bearer ${svc}` },
  });
  say(r.ok, `dev REST reads with the service role key (${ref})`, r.ok ? "" : `HTTP ${r.status}`);
} else {
  say(false, "dev REST reads with the service role key", "no url or no service role key");
}

// ------------------------------------------------- the Management API (migrations)
// This is what apply-migrations.mjs needs. If it is missing, NO migration can be
// applied by anyone, which is the fault this whole script exists to catch.
const probeManagement = async (label, projectReference) => {
  if (!env.SUPABASE_ACCESS_TOKEN) {
    say(false, `${label}: Management API (apply-migrations needs this)`, "SUPABASE_ACCESS_TOKEN missing");
    return;
  }
  const r = await fetch(`https://api.supabase.com/v1/projects/${projectReference}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "select 1 as ok" }),
  });
  const body = r.ok ? "" : (await r.text()).slice(0, 120);
  say(r.ok, `${label}: Management API (apply-migrations needs this)`, body);
};

if (ref) await probeManagement(`dev ${ref}`, ref);

if (name === "production") {
  const prod = loadEnv("production");
  const prodRef = projectRef(prod);
  await probeManagement(`production ${prodRef}`, prodRef);
} else {
  console.log("note  production not probed — re-run with --env production to include it");
}

console.log("");
if (failed) {
  console.log(`${failed} thing(s) this session CANNOT reach.`);
  console.log("Say so in the plan, and do NOT ask Lutan to check what you have simply lost the ability to read.");
} else {
  console.log("Everything a planner needs is reachable.");
}
await exitWith(failed ? 1 : 0);
