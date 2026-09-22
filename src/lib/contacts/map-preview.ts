import "server-only";

import { mapEmbedSrc, mapQueryFromUrl } from "./contacts";

/**
 * Hosts whose links are redirects to the real maps URL. Anything else that
 * starts with http(s) is taken as-is: either it already says where it
 * points (`mapQueryFromUrl`) or it isn't a maps link at all.
 */
const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "g.co"]);
const RESOLVE_TIMEOUT_MS = 3000;
const MAX_HOPS = 3;

/** Resolved short links, per isolate — a shared pin doesn't change. */
const resolved = new Map<string, Promise<string | null>>();

async function followRedirects(url: string): Promise<string | null> {
  let current = url;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const res = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    });
    const location = res.headers.get("location");
    if (!location) return current === url ? null : current;
    current = new URL(location, current).toString();
    if (!SHORT_LINK_HOSTS.has(new URL(current).hostname)) return current;
  }
  return current;
}

function resolveShortLink(url: string): Promise<string | null> {
  let pending = resolved.get(url);
  if (!pending) {
    pending = followRedirects(url).catch(() => null);
    resolved.set(url, pending);
    // A failed lookup (timeout, Google hiccup) shouldn't be remembered
    // for the life of the isolate — let the next view try again.
    pending.then((result) => {
      if (result === null) resolved.delete(url);
    });
  }
  return pending;
}

/**
 * The embed URL for a contact's address, or null when there is nothing
 * to show. Plain text is searched as typed. A pasted maps link is read
 * for what it points at; a shared `maps.app.goo.gl` short link (what the
 * Maps app's Share button produces, and what staff actually paste) is
 * followed once, server-side, to the full URL behind it. Whatever text
 * follows the link is the last resort. Never throws — a preview that
 * can't be built is simply not shown.
 */
export async function addressMapEmbedSrc(
  address: string | null | undefined,
): Promise<string | null> {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return mapEmbedSrc(trimmed);

  const [link, ...rest] = trimmed.split(/\s+/);
  let query = mapQueryFromUrl(link);
  if (!query) {
    let host: string | null = null;
    try {
      host = new URL(link).hostname;
    } catch {
      // not a URL after all — fall through to the trailing text
    }
    if (host && SHORT_LINK_HOSTS.has(host)) {
      const target = await resolveShortLink(link);
      if (target) query = mapQueryFromUrl(target);
    }
  }
  return mapEmbedSrc(query ?? rest.join(" "));
}
