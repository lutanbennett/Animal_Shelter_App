import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blackoutLookups,
  DNS_RETRY_DELAYS_MS,
  DNS_RETRY_MAX,
  dnsRetryCoverMs,
  dnsRetryDecision,
  dnsRetryDelayMs,
} from "./lib/dns-retry.mjs";

const blackout =
  "\n[deploy net-trace] DNS lookup FAILED: host=api.cloudflare.com code=ENOTFOUND errno=-3008 syscall=getaddrinfo family=any after=2ms at=2026-11-27T00:31:38.000Z\n" +
  "[deploy net-trace] DNS lookup FAILED: host=registry.npmjs.org code=ENOTFOUND errno=-3008 syscall=getaddrinfo family=any after=10ms at=2026-11-27T00:31:37.879Z\n";

test("an ENOTFOUND from getaddrinfo in the child is retried, naming the hosts", () => {
  const d = dnsRetryDecision({ status: 1, traceText: blackout, retriesDone: 0 });
  assert.equal(d.retry, true);
  assert.deepEqual(d.hosts, ["api.cloudflare.com", "registry.npmjs.org"]);
});

test("a non-DNS failure is NOT retried: empty trace (bad token, deleted Worker, bad config)", () => {
  assert.equal(dnsRetryDecision({ status: 1, traceText: "", retriesDone: 0 }).retry, false);
  assert.equal(dnsRetryDecision({ status: 1, traceText: undefined, retriesDone: 0 }).retry, false);
});

test("a DNS failure that is not the blackout's signature is NOT retried", () => {
  const other = "[deploy net-trace] DNS lookup FAILED: host=x code=EAI_AGAIN errno=-3001 syscall=getaddrinfo family=any after=5000ms at=t\n" +
    "[deploy net-trace] DNS lookup FAILED: host=y code=ENOTFOUND errno=-3008 syscall=queryA family=any after=1ms at=t\n";
  assert.deepEqual(blackoutLookups(other), []);
  assert.equal(dnsRetryDecision({ status: 1, traceText: other, retriesDone: 0 }).retry, false);
});

test("the attempt limit is respected", () => {
  assert.equal(dnsRetryDecision({ status: 1, traceText: blackout, retriesDone: DNS_RETRY_MAX - 1 }).retry, true);
  assert.equal(dnsRetryDecision({ status: 1, traceText: blackout, retriesDone: DNS_RETRY_MAX }).retry, false);
});

// The 0.49.3 episode: lookups failed for ~23 s. Model it as "every attempt that STARTS before 23 s
// fails with the blackout signature", and walk the real schedule. The old 2 x 5 s gave up at ~10 s.
test("the measured 23-second episode is ridden out by the retry schedule", () => {
  const EPISODE_MS = 23000;
  let clock = 0; // waiting only; each real attempt also takes time, which only helps
  for (let retriesDone = 0; ; retriesDone++) {
    if (clock >= EPISODE_MS) return; // this attempt starts after the episode: it lands
    const d = dnsRetryDecision({ status: 1, traceText: blackout, retriesDone });
    assert.equal(d.retry, true, `gave up at ${clock / 1000}s, inside a ${EPISODE_MS / 1000}s episode`);
    clock += dnsRetryDelayMs(retriesDone);
  }
});

test("the schedule grows, and its total cover is at least ~2.5x the one measured episode", () => {
  for (let i = 1; i < DNS_RETRY_DELAYS_MS.length; i++) assert.ok(DNS_RETRY_DELAYS_MS[i] >= DNS_RETRY_DELAYS_MS[i - 1]);
  assert.equal(DNS_RETRY_MAX, DNS_RETRY_DELAYS_MS.length);
  assert.ok(dnsRetryCoverMs() >= 2.5 * 23000);
  // and a dead network is not held for minutes before the operator is told
  assert.ok(dnsRetryCoverMs() <= 120000);
});

test("a success is never retried, even if a lookup failed on the way", () => {
  assert.equal(dnsRetryDecision({ status: 0, traceText: blackout, retriesDone: 0 }).retry, false);
});
