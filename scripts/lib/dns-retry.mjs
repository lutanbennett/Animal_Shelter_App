// Which wrangler failures deploy.mjs retries (#dnsgp, docs/decisions/2026-11-27-deploy-dns-blackout.md).
// ONLY a child whose net trace recorded a getaddrinfo ENOTFOUND: the machine-wide resolver
// blackout measured on 0.49.3. Everything else fails at once, exactly as before — this is not a
// general retry (#wgdns refused one for good reason, and that reason still governs every other failure).

// The wait before each retry, growing (#dnsgp, 2026-11-28). The first sizing (2 x 5 s, ~10 s of cover)
// came from "the blackout lasted ~250 ms", which was one lookup's gap, not the episode: the episode on
// 0.49.3 ran ~23 s, so the retry gave up while it was still happening. These wait 65 s in all (35 s by
// the third retry, ~1.5x the one measurement; 65 s is ~3x), short at first so a brief blip costs little.
// Too short loses a ~10 min build; too long holds a genuinely dead network ~65 s (plus each attempt)
// before the operator is told. One measurement is not a distribution: re-size from the next episode.
export const DNS_RETRY_DELAYS_MS = [5000, 10000, 20000, 30000];
export const DNS_RETRY_MAX = DNS_RETRY_DELAYS_MS.length; // retries after the first attempt

/** The wait before retry number `retriesDone + 1`. */
export function dnsRetryDelayMs(retriesDone) {
  return DNS_RETRY_DELAYS_MS[Math.min(retriesDone, DNS_RETRY_DELAYS_MS.length - 1)];
}

/** Total waiting before the given retry starts (the cover, not counting the attempts themselves). */
export function dnsRetryCoverMs(retries = DNS_RETRY_MAX) {
  return DNS_RETRY_DELAYS_MS.slice(0, retries).reduce((a, b) => a + b, 0);
}

const LINE = /\[deploy net-trace\] DNS lookup FAILED: (.*)$/;

/** The failed lookups in a net-trace file that are the blackout's signature. */
export function blackoutLookups(traceText) {
  const hits = [];
  for (const raw of String(traceText ?? "").split(/\r?\n/)) {
    const m = LINE.exec(raw);
    if (!m) continue;
    const f = Object.fromEntries(m[1].split(" ").map((kv) => kv.split("=")));
    if (f.code === "ENOTFOUND" && f.syscall === "getaddrinfo") hits.push(f);
  }
  return hits;
}

/**
 * Retry or not. `retriesDone` counts retries already made (0 after the first attempt).
 * Returns { retry: false } or { retry: true, hosts: [...] }.
 */
export function dnsRetryDecision({ status, traceText, retriesDone, max = DNS_RETRY_MAX }) {
  if (status === 0) return { retry: false };
  if (retriesDone >= max) return { retry: false };
  const hits = blackoutLookups(traceText);
  if (!hits.length) return { retry: false };
  return { retry: true, hosts: [...new Set(hits.map((h) => h.host))] };
}
