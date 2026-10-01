import { NextResponse } from "next/server";

/**
 * Hosts a browser may legitimately post an upload from — the same list as
 * `experimental.serverActions.allowedOrigins` in next.config.ts, and for the
 * same reason: they are the hosts in the visitor's address bar. `*` stands for
 * exactly one label, so the apex needs its own entry.
 */
const PUBLIC_HOSTS = ["lannacare.org"];
const PUBLIC_SUFFIX = ".lannacare.org";

function isPublicHost(hostname: string): boolean {
  return PUBLIC_HOSTS.includes(hostname) || (hostname.endsWith(PUBLIC_SUFFIX) && !hostname.slice(0, -PUBLIC_SUFFIX.length).includes("."));
}

/**
 * Refuses a cross-site browser POST to a cookie-authenticated upload route
 * (a form on another site can post multipart to us with the visitor's
 * cookies; SameSite is the first defence, this is the second). Returns a 403
 * response to send, or null to carry on.
 *
 * What it compares is deliberate. It NEVER compares `Origin` with the host the
 * server believes it is: behind the Worker and cloudflared that host is
 * `pi.lannacare.org` in `x-forwarded-host` and `localhost:3000` in
 * `request.nextUrl`, and doing that rejected every Server Action on
 * 2026-10-01 (docs/decisions/2026-10-01-server-actions-allowed-origins.md).
 * Instead:
 *  1. `Sec-Fetch-Site`, set by the browser and not forgeable by a page:
 *     `cross-site` is refused, whatever else is true. `same-origin`,
 *     `same-site` and `none` pass.
 *  2. `Origin`, if present, must be one of our public hosts, or equal the
 *     `Host` header (which cloudflared pins to the public name, and which is
 *     localhost under `next dev`).
 * A request with neither header is not a browser cross-site post and passes —
 * it still needs a session and a role.
 */
export function refuseCrossSite(request: Request): NextResponse | null {
  const deny = () => NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });

  if (request.headers.get("sec-fetch-site") === "cross-site") return deny();

  const origin = request.headers.get("origin");
  if (origin && origin !== "null") {
    let host: string;
    let hostname: string;
    try {
      const u = new URL(origin);
      host = u.host;
      hostname = u.hostname;
    } catch {
      return deny();
    }
    const own = request.headers.get("host");
    if (!isPublicHost(hostname) && host !== own) return deny();
  } else if (origin === "null") {
    return deny();
  }
  return null;
}
