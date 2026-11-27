// Which wrangler failures deploy.mjs retries (#dnsgp, docs/decisions/2026-11-27-deploy-dns-blackout.md).
// ONLY a child whose net trace recorded a getaddrinfo ENOTFOUND: the sub-second, machine-wide resolver
// blackout measured on 0.49.3. Everything else fails at once, exactly as before — this is not a
// general retry (#wgdns refused one for good reason, and that reason still governs every other failure).

export const DNS_RETRY_MAX = 2; // retries after the first attempt
export const DNS_RETRY_DELAY_MS = 5000; // the blackout lasted ~250 ms

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
