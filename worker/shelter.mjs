// Maps the request host to a shelter and puts it on the request as x-shelter-id (#v0302, Part 4 of #ykefa).
//
// How it reaches the lookup: a service-role call to resolve_shelter_host(p_host) over REST (0382; executable
// by service_role only), remembered in this isolate for a minute. Not a cached map of the whole table: the
// table is read-restricted, a miss must be cheap, and a host added to shelter_hosts is live within a minute
// everywhere with nothing to purge. A lookup that FAILS is not remembered, and sends no header ("no header
// means no rows"), so an outage of the lookup shows as an empty site, never as another shelter's data.
//
// The incoming request's own x-shelter-id is ALWAYS removed first: a visitor must not choose their shelter.

const HEADER = "x-shelter-id";
const TTL_MS = 60_000;
const cache = new Map(); // host -> { id: string | null, until: number }

export function normaliseHost(host) {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

export async function resolveShelter(env, rawHost, fetchImpl = fetch, now = Date.now()) {
  const host = normaliseHost(rawHost);
  if (!host || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const hit = cache.get(host);
  if (hit && hit.until > now) return hit.id;
  try {
    const res = await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/resolve_shelter_host`, {
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
      return null;
    }
    const id = await res.json();
    const value = typeof id === "string" ? id : null;
    cache.set(host, { id: value, until: now + TTL_MS });
    return value;
  } catch (err) {
    console.error(`shelter-host: lookup failed, ${err?.message ?? err}`);
    return null;
  }
}

/** A copy of the request carrying x-shelter-id for its host, or none (any inbound one is dropped). */
export async function withShelter(request, env, fetchImpl) {
  const id = await resolveShelter(env, new URL(request.url).host, fetchImpl);
  const headers = new Headers(request.headers);
  headers.delete(HEADER);
  if (id) headers.set(HEADER, id);
  return new Request(request, { headers });
}

export function clearShelterCache() {
  cache.clear();
}
