import { test } from "node:test";
import assert from "node:assert/strict";
import { domainsToReassert, readFlaggedHosts } from "./lib/attached-hosts.mjs";

test("drops hosts wrangler.jsonc already routes, dedupes and sorts", () => {
  assert.deepEqual(
    domainsToReassert(["b.example.org", "Test.lannacare.org", "a.example.org", "b.example.org", " "], ["test.lannacare.org"]),
    ["a.example.org", "b.example.org"],
  );
});

test("no flagged rows means no --domain", () => {
  assert.deepEqual(domainsToReassert([], ["test.lannacare.org"]), []);
});

test("a failed read is reported, never thrown, so the deploy can refuse", async () => {
  const r = await readFlaggedHosts({ SUPABASE_ACCESS_TOKEN: "t" }, "ref", {
    fetchImpl: async () => new Response("boom", { status: 500 }),
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /HTTP 500/);
  const thrown = await readFlaggedHosts({ SUPABASE_ACCESS_TOKEN: "t" }, "ref", {
    fetchImpl: async () => { throw new Error("offline"); },
  });
  assert.deepEqual(thrown, { ok: false, reason: "offline" });
  assert.equal((await readFlaggedHosts({}, "ref")).ok, false);
});

test("reads the hosts", async () => {
  const r = await readFlaggedHosts({ SUPABASE_ACCESS_TOKEN: "t" }, "ref", {
    fetchImpl: async () => new Response(JSON.stringify([{ host: "x.lannacare.org" }]), { status: 200 }),
  });
  assert.deepEqual(r, { ok: true, hosts: ["x.lannacare.org"] });
});
