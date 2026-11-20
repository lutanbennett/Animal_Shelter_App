// Maps the request host to a shelter and puts it on the request as x-shelter-id (#v0302, Part 4 of #ykefa).
//
// The same lookup also returns the shelter's website state (shelters.public_site, 0426, #wbsof), forwarded as x-public-site and cached with
// the host, so deciding "is this site open" on a signed-out request costs no extra read: it rides on the one that was already made.
//
// How it reaches the lookup: a service-role call to resolve_shelter_site(p_host) over REST (0426, after 0382's resolve_shelter_host; executable
// by service_role only), remembered in this isolate for a minute. Not a cached map of the whole table: the
// table is read-restricted, a miss must be cheap, and a host added to shelter_hosts is live within a minute
// everywhere with nothing to purge. A lookup that FAILS is not remembered, and sends no header ("no header
// means no rows"), so an outage of the lookup shows as an empty site, never as another shelter's data.
//
// The incoming request's own x-shelter-id is ALWAYS removed first: a visitor must not choose their shelter.

const HEADER = "x-shelter-id";
const SITE_HEADER = "x-public-site";
const ARCHIVED_HEADER = "x-shelter-archived";
const SITES = new Set(["open", "locked", "off"]);
const TTL_MS = 60_000;
const cache = new Map(); // host -> { id: string | null, site: string | null, until: number }

export function normaliseHost(host) {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

export async function resolveShelterSite(env, rawHost, fetchImpl = fetch, now = Date.now()) {
  const none = { id: null, site: null, archived: false };
  const host = normaliseHost(rawHost);
  if (!host || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return none;
  const hit = cache.get(host);
  if (hit && hit.until > now) return hit;
  try {
    const res = await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/resolve_shelter_site`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ p_host: host }),
    });
    if (!res.ok) {
      console.error(`shelter-host: lookup ${res.status}`);
      return none;
    }
    const row = await res.json();
    const id = row && typeof row.id === "string" ? row.id : null;
    // A shelter with no valid state sends none, so only the deployment floor applies.
    const site = id && SITES.has(row.site) ? row.site : null;
    // An archived shelter (0428) comes back with id and site null and archived true: no shelter header is sent, so no rows, and the app is told why.
    const archived = row?.archived === true;
    const entry = { id, site, archived, until: now + TTL_MS };
    cache.set(host, entry);
    return entry;
  } catch (err) {
    console.error(`shelter-host: lookup failed, ${err?.message ?? err}`);
    return none;
  }
}

export async function resolveShelter(env, rawHost, fetchImpl = fetch, now = Date.now()) {
  return (await resolveShelterSite(env, rawHost, fetchImpl, now)).id;
}

/** A copy of the request carrying x-shelter-id for its host, or none (any inbound one is dropped). */
export async function withShelter(request, env, fetchImpl) {
  const { id, site, archived } = await resolveShelterSite(env, new URL(request.url).host, fetchImpl);
  const headers = new Headers(request.headers);
  // Both inbound headers are always removed: a visitor chooses neither their shelter nor whether its website is open.
  headers.delete(HEADER);
  headers.delete(SITE_HEADER);
  headers.delete(ARCHIVED_HEADER);
  if (id) headers.set(HEADER, id);
  if (site) headers.set(SITE_HEADER, site);
  // A closed shelter: its website is off (nothing cached, nothing shown) and the sign-in page can say why.
  if (archived) {
    headers.set(SITE_HEADER, "off");
    headers.set(ARCHIVED_HEADER, "1");
  }
  return new Request(request, { headers });
}

export function clearShelterCache() {
  cache.clear();
}
