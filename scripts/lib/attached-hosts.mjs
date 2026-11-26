// The hosts a deploy must re-assert as custom domains (#hstau, step 2).
//
// A `wrangler deploy` DELETES every custom domain absent from the config it deploys (measured on test, #1899).
// So a host the console attached to this environment's Worker would go dark on the next deploy. The console
// records such a host with `shelter_hosts.attach_to_worker = true` (0445) in the environment's OWN database,
// and deploy.mjs passes each one as `--domain <host>`, which wrangler APPENDS to the config's routes as
// `{ pattern, custom_domain: true }` (docs/decisions/2026-11-26-host-attach-deploy.md).

/** Hosts to pass as --domain: flagged rows not already among wrangler.jsonc's routes, deduped and sorted. */
export function domainsToReassert(flagged, routeHostList) {
  const owned = new Set(routeHostList.map((h) => h.toLowerCase()));
  return [...new Set(flagged.map((h) => String(h).trim().toLowerCase()).filter(Boolean))]
    .filter((h) => !owned.has(h))
    .sort();
}

/**
 * Read `select host from shelter_hosts where attach_to_worker` through the Management API (read-only, the call
 * check-deployed-hosts.mjs makes). Never throws: { ok: true, hosts } or { ok: false, reason }.
 * The CALLER must refuse the deploy on ok:false — see deploy.mjs.
 */
export async function readFlaggedHosts(env, projectRef, { timeoutMs = 30_000, fetchImpl = fetch } = {}) {
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) return { ok: false, reason: "SUPABASE_ACCESS_TOKEN is not set, so the database cannot be read" };
  try {
    const res = await fetchImpl(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "select host from public.shelter_hosts where attach_to_worker" }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    const rows = text ? JSON.parse(text) : [];
    if (!Array.isArray(rows)) return { ok: false, reason: `unexpected reply: ${text.slice(0, 200)}` };
    return { ok: true, hosts: rows.map((r) => r.host) };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
