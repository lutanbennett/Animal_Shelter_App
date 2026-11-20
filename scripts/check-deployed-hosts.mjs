// Fails when a host an environment is deployed on has no row in that environment's own shelter_hosts (#hostx).
//
//   node scripts/check-deployed-hosts.mjs [--env test|uat|production]     (default test = the dev project)
//
// Reads APP_HOST and PUBLIC_HOST for the environment from wrangler.jsonc, then asks that environment's database
// (read-only select through the Management API, project from NEXT_PUBLIC_SUPABASE_URL as apply-migrations.mjs does)
// which hosts are registered. Exit 1 names every host that is missing. PLATFORM_HOST is listed, not required:
// it serves the operator console and needs no shelter.
// Different from scripts/check-site-hosts.mjs, which asserts a host is pinned into the BUILD, not that it has a ROW.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { readWranglerConfig } from "./lib/wrangler.mjs";
import { deployedHosts, missingHosts } from "./lib/deployed-hosts.mjs";
import { exitWith, runMain } from "./lib/exit.mjs";

await runMain(async () => {
  const { name } = parseEnvArg(process.argv.slice(2));
  const wranglerEnv = name === "test" ? "test" : name;
  const vars = readWranglerConfig().env?.[wranglerEnv]?.vars ?? {};
  const deployed = deployedHosts(vars);
  const env = loadEnv(name);
  const ref = projectRef(env);
  console.log(`check-deployed-hosts: ${name} (project ${ref})`);
  if (!deployed.length) {
    console.error(`FAIL: wrangler.jsonc sets no APP_HOST or PUBLIC_HOST for ${name}.`);
    return exitWith(1);
  }
  if (!env.SUPABASE_ACCESS_TOKEN) {
    console.error("FAIL: SUPABASE_ACCESS_TOKEN is not set, so the database cannot be read.");
    return exitWith(1);
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "select host from public.shelter_hosts" }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`FAIL: could not read shelter_hosts (HTTP ${res.status}): ${text.slice(0, 200)}`);
    return exitWith(1);
  }
  const registered = (text ? JSON.parse(text) : []).map((r) => r.host);
  const missing = missingHosts(deployed, registered);
  for (const d of deployed) console.log(`  ${missing.includes(d) ? "MISSING" : "ok     "} ${d.host} (${d.var})`);
  if (vars.PLATFORM_HOST) console.log(`  not checked: ${vars.PLATFORM_HOST} (PLATFORM_HOST serves the operator console)`);
  if (missing.length) {
    console.error(`FAIL: ${missing.length} deployed host(s) have no shelter_hosts row in ${name}: ${missing.map((m) => m.host).join(", ")}. Every sign-in there is refused.`);
    return exitWith(1);
  }
  console.log(`ok: every deployed host has a shelter_hosts row in ${name}.`);
  return exitWith(0);
});
