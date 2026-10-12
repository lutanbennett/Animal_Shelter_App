import test from "node:test";
import assert from "node:assert/strict";
import { fingerprint, readMarker, attemptsFor, eligible, runTranslations, MAX_ATTEMPTS } from "./translations.mjs";

const NOW = Date.parse("2026-10-12T12:00:00Z");
const minutesAgo = (m) => new Date(NOW - m * 60_000).toISOString();

test("fingerprint is short, stable, and changes with the text", async () => {
  const a = await fingerprint("hello");
  assert.match(a, /^[0-9a-f]{8}$/);
  assert.equal(a, await fingerprint("hello"));
  assert.notEqual(a, await fingerprint("hello!"));
});

test("readMarker: only a well-formed retry marker counts", () => {
  assert.deepEqual(readMarker("mt-retry:2:abcd1234"), { attempts: 2, hash: "abcd1234" });
  for (const e of [null, undefined, "", "human", "workers-ai", "mt-retry:x:abc", "mt-retry:2", "xmt-retry:1:ab", "mt-retry:1:ZZ"]) {
    assert.deepEqual(readMarker(e), { attempts: 0, hash: null }, String(e));
  }
});

test("failures count only against the exact source they were recorded for", () => {
  const row = { engine: "mt-retry:2:aaaa1111" };
  assert.equal(attemptsFor(row, "aaaa1111"), 2);
  assert.equal(attemptsFor(row, "bbbb2222"), 0, "an edited source starts fresh");
});

test("a row never tried is eligible", () => {
  assert.equal(eligible({ engine: null, updated_at: minutesAgo(0) }, "abc1", NOW), true);
});

test("backoff: 30 minutes after the first failure, 3 hours after the second", () => {
  const one = (m) => ({ engine: "mt-retry:1:abc1", updated_at: minutesAgo(m) });
  assert.equal(eligible(one(29), "abc1", NOW), false);
  assert.equal(eligible(one(30), "abc1", NOW), true);
  const two = (m) => ({ engine: "mt-retry:2:abc1", updated_at: minutesAgo(m) });
  assert.equal(eligible(two(179), "abc1", NOW), false);
  assert.equal(eligible(two(180), "abc1", NOW), true);
});

test("after three failures the row is given up on, however long ago", () => {
  assert.equal(MAX_ATTEMPTS, 3);
  assert.equal(eligible({ engine: "mt-retry:3:abc1", updated_at: minutesAgo(100_000) }, "abc1", NOW), false);
});

test("runTranslations does nothing, and touches no network, without configuration", async () => {
  const fetchImpl = async () => { throw new Error("no network in this test"); };
  const lines = [];
  const out = await runTranslations({}, { fetchImpl, now: NOW, log: (l) => lines.push(l) });
  assert.equal(out.drafted, 0);
  assert.match(out.note, /not set/);
});
