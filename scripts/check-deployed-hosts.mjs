// Fails when a host an environment is deployed on has no row in that environment's own shelter_hosts (#hostx).
//
//   node scripts/check-deployed-hosts.mjs [--env test|uat|production]     (default test = the dev project)
//
// Reads the addresses the environment answers on (wrangler.jsonc vars through siteHosts(): APP_HOST, PUBLIC_HOST,
// PLATFORM_HOST and the www. form of each, because the Worker looks a host up literally), then asks that environment's database
// (read-only select through the Management API, project from NEXT_PUBLIC_SUPABASE_URL as apply-migrations.mjs does)
// which hosts are registered. Exit 1 names every host that is missing. 
// Second question, same addresses (#aucbk): the Management API's GET /v1/projects/<ref>/config/auth gives `uri_allow_list`
// and `site_url`; every address needs an /auth/callback entry there, or Supabase silently sends that sign-in to site_url.
// Changes no setting. Different from scripts/check-site-hosts.mjs, which asserts a host is pinned into the BUILD, not that it has a ROW.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { readWranglerConfig, routeHosts } from "./lib/wrangler.mjs";
import { addressesAnsweredOn, missingHosts, missingCallbacks, googleClientProject } from "./lib/deployed-hosts.mjs";
import { runMain } from "./lib/exit.mjs";

await runMain(async () => {
  const { name } = parseEnvArg(process.argv.slice(2));
  const wranglerEnv = name === "test" ? "test" : name;
  const vars = readWranglerConfig().env?.[wranglerEnv]?.vars ?? {};
  const deployed = addressesAnsweredOn(vars, routeHosts(readWranglerConfig(), wranglerEnv));
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
  // #9l7xf: a live shelter with addresses and none flagged primary is left out of my_shelters(), so the chooser lists nothing for it.
  const pr = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "select s.key from public.shelters s where s.archived_at is null and exists (select 1 from public.shelter_hosts h where h.shelter_id = s.id) and not exists (select 1 from public.shelter_hosts h where h.shelter_id = s.id and h.is_primary)" }),
    signal: AbortSignal.timeout(30_000),
  });
  const prText = await pr.text();
  if (!pr.ok) { console.error(`FAIL: could not read primary hosts (HTTP ${pr.status}): ${prText.slice(0, 200)}`); return 1; }
  const noPrimary = (prText ? JSON.parse(prText) : []).map((r) => r.key);
  if (noPrimary.length) {
    console.error(`FAIL: shelter(s) with addresses but no primary one in ${name}: ${noPrimary.join(", ")}. The chooser omits them. Run: node scripts/set-primary-hosts.mjs --env ${name}`);
    return 1;
  }
  const missing = missingHosts(deployed, registered);
  for (const h of deployed) console.log(`  ${missing.includes(h) ? "MISSING" : "ok     "} ${h}`);
  if (missing.length) {
    console.error(`FAIL: ${missing.length} deployed host(s) have no shelter_hosts row in ${name}: ${missing.join(", ")}. Every sign-in there is refused.`);
    return 1;
  }
  console.log(`ok: every deployed host has a shelter_hosts row in ${name}.`);

  const authRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(30_000),
  });
  const authText = await authRes.text();
  if (!authRes.ok) {
    console.error(`FAIL: could not read the auth config (HTTP ${authRes.status}): ${authText.slice(0, 200)}`);
    return 1;
  }
  const auth = JSON.parse(authText);
  if (typeof auth.uri_allow_list !== "string") {
    console.error(`FAIL: the auth config has no uri_allow_list string (keys: ${Object.keys(auth).join(", ")}).`);
    return 1;
  }
  const noCallback = missingCallbacks(deployed, auth.uri_allow_list);
  console.log(`sign-in redirect allow-list in ${name}: ${auth.uri_allow_list || "(empty)"}`);
  console.log(`site_url (where an unlisted sign-in is thrown): ${auth.site_url}`);
  // #gidty: which Google project signs people in here. Information only, never a failure; the secret is never read out.
  const gid = typeof auth.external_google_client_id === "string" ? auth.external_google_client_id : "";
  console.log(`Google sign-in in ${name}: ${auth.external_google_enabled ? "enabled" : "DISABLED"}, client ${gid || "(none)"} (${googleClientProject(gid)})`);
  for (const h of deployed) console.log(`  ${noCallback.includes(h) ? "NO CALLBACK" : "ok         "} https://${h}/auth/callback`);
  if (noCallback.length) {
    console.error(`FAIL: ${noCallback.length} address(es) have no /auth/callback entry in ${name}'s Supabase allow-list: ${noCallback.join(", ")}. Signing in there lands on ${auth.site_url}. Add them by hand; this check changes nothing.`);
    return 1;
  }
  console.log(`ok: every deployed address has an /auth/callback entry in ${name}.`);
  return 0;
});
