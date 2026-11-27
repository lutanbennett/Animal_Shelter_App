import { test } from "node:test";
import assert from "node:assert/strict";
import { blackoutLookups, dnsRetryDecision } from "./lib/dns-retry.mjs";

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
  assert.equal(dnsRetryDecision({ status: 1, traceText: blackout, retriesDone: 1 }).retry, true);
  assert.equal(dnsRetryDecision({ status: 1, traceText: blackout, retriesDone: 2 }).retry, false);
});

test("a success is never retried, even if a lookup failed on the way", () => {
  assert.equal(dnsRetryDecision({ status: 0, traceText: blackout, retriesDone: 0 }).retry, false);
});
