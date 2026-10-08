/**
 * Following a shared maps short link (`maps.app.goo.gl`, `goo.gl`, …) to
 * where it really points. The one link-checker: map-preview.ts uses it for
 * the contact hub, the contacts list and Shelter Friends pages, and
 * scripts/audit-contact-map-links.mjs uses it to list the rows whose link
 * leads nowhere — so the report and the app can't disagree about a link.
 * No imports, so Node can run it straight from a script.
 */

const RESOLVE_TIMEOUT_MS = 3000;
const MAX_HOPS = 3;

/**
 * `target` is the first URL off the short-link hosts (or the last hop),
 * or null when Google answered without sending us anywhere — a retired
 * `goo.gl` link, a typo. `status` is the first answer's HTTP status.
 * Throws when Google can't be reached at all, which is not the same as
 * "leads nowhere".
 */
export async function followShortLink(
  url: string,
  shortLinkHosts: readonly string[],
): Promise<{ target: string | null; status: number }> {
  let current = url;
  let status = 0;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const res = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    });
    if (hop === 0) status = res.status;
    const location = res.headers.get("location");
    if (!location) return { target: current === url ? null : current, status };
    current = new URL(location, current).toString();
    if (!shortLinkHosts.includes(new URL(current).hostname)) return { target: current, status };
  }
  return { target: current, status };
}
