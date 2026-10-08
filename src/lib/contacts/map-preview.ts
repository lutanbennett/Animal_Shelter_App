import "server-only";

import {
  addressMapNow,
  MAP_SHORT_LINK_HOSTS,
  mapQueryFromUrl,
  splitAddress,
  type AddressMap,
} from "./contacts";
import { followShortLink } from "./short-link";

const SHORT_LINK_HOSTS = new Set(MAP_SHORT_LINK_HOSTS);
const RESOLVE_TIMEOUT_MS = 3000;

/** Resolved short links, per isolate — a shared pin doesn't change. */
const resolved = new Map<string, Promise<string | null>>();

function resolveShortLink(url: string): Promise<string | null> {
  let pending = resolved.get(url);
  if (!pending) {
    pending = followShortLink(url, MAP_SHORT_LINK_HOSTS)
      .then((r) => r.target)
      .catch(() => null);
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
 * The map for an address — the thumbnail and what tapping it opens, from
 * the same lookup so the two never disagree — or null when there is
 * nothing valid to open. A shared short link (`maps.app.goo.gl`, what the
 * Maps app's Share button produces and what staff actually paste) is
 * followed once, server-side. One that leads nowhere (an old `goo.gl`
 * link Google has retired, a typo) counts as no link: the text after it
 * is searched instead, and with no text there is no map — never a tap
 * that 404s at Google. Never throws.
 */
export async function addressMap(
  address: string | null | undefined,
): Promise<AddressMap | null> {
  const { link } = splitAddress(address);
  if (link && SHORT_LINK_HOSTS.has(link.hostname)) {
    const target = await resolveShortLink(link.toString());
    return addressMapNow(address, target ? mapQueryFromUrl(target) : null);
  }
  return addressMapNow(address);
}

/**
 * Whether a link saved as a map (Settings → Website's map link) still
 * leads to one: a short link must follow through to a Google Maps place;
 * any other link is taken as pasted, as the field has always allowed.
 * Answers true when Google can't be reached, so a slow network never
 * blocks a save — only a link Google answers "not found" for is refused.
 */
export async function mapLinkLeadsSomewhere(url: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!SHORT_LINK_HOSTS.has(parsed.hostname)) return true;
  try {
    const res = await fetch(parsed, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    });
    return res.status !== 404 && res.status !== 400;
  } catch {
    return true;
  }
}
