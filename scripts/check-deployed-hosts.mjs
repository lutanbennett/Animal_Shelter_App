// Fails when a host an environment is deployed on has no row in that environment's own shelter_hosts (#hostx).
//
//   node scripts/check-deployed-hosts.mjs [--env test|uat|production]     (default test = the dev project)
//
// Reads the addresses the environment answers on (wrangler.jsonc vars through siteHosts(): APP_HOST, PUBLIC_HOST,
// PLATFORM_HOST and the www. form of each, because the Worker looks a host up literally), then asks that environment's database
// (read-only select through the Management API, project from NEXT_PUBLIC_SUPABASE_URL as apply-migrations.mjs does)
// which hosts are registered. Exit 1 names every host that is missing. 
// Different from scripts/check-site-hosts.mjs, which asserts a host is pinned into the BUILD, not that it has a ROW.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { readWranglerConfig } from "./lib/wrangler.mjs";
import { addressesAnsweredOn, missingHosts } from "./lib/deployed-hosts.mjs";
import { runMain } from "./lib/exit.mjs";

await runMain(async () => {
  const { name } = parseEnvArg(process.argv.slice(2));
  const wranglerEnv = name === "test" ? "test" : name;
  const vars = readWranglerConfig().env?.[wranglerEnv]?.vars ?? {};
  const deployed = addressesAnsweredOn(vars);
  const env = loadEnv(name);
  const ref = projectRef(env);
  console.log(`check-deployed-hosts: ${name} (project ${ref})`);
  if (!deployed.length) {
    console.error(`FAIL: wrangler.jsonc sets no APP_HOST, PUBLIC_HOST or PLATFORM_HOST for ${name}.`);
    return 1;
  }
  if (!env.SUPABASE_ACCESS_TOKEN) {
    console.error("FAIL: SUPABASE_ACCESS_TOKEN is not set, so the database cannot be read.");
    return 1;
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
    return 1;
  }
  const registered = (text ? JSON.parse(text) : []).map((r) => r.host);
  const missing = missingHosts(deployed, registered);
  for (const h of deployed) console.log(`  ${missing.includes(h) ? "MISSING" : "ok     "} ${h}`);
  if (missing.length) {
    console.error(`FAIL: ${missing.length} deployed host(s) have no shelter_hosts row in ${name}: ${missing.join(", ")}. Every sign-in there is refused.`);
    return 1;
  }
  console.log(`ok: every deployed host has a shelter_hosts row in ${name}.`);
  return 0;
});
