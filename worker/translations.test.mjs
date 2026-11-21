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

import { runLabelDrafts, missingLabelLogin } from "./translations.mjs";

test("runLabelDrafts: no login configured means skip, with no network", async () => {
  const fetchImpl = async () => { throw new Error("no network in this test"); };
  const out = await runLabelDrafts({ SUPABASE_URL: "https://x.supabase.co" }, { fetchImpl, log: () => {} });
  assert.equal(out.proposed, 0);
  assert.match(out.note, /no label login configured/);
  assert.deepEqual(missingLabelLogin({ LABEL_DRAFT_EMAIL: "a" }), ["LABEL_DRAFT_PASSWORD", "SUPABASE_ANON_KEY"]);
});

test("runLabelDrafts: a refused sign-in is reported and nothing else is called", async () => {
  const urls = [];
  const fetchImpl = async (u) => { urls.push(String(u)); return new Response("{}", { status: 400 }); };
  const env = {
    SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "k", LABEL_DRAFT_EMAIL: "m@x", LABEL_DRAFT_PASSWORD: "p",
    AI: {}, TRANSLATE_ENGINE: "workers-ai",
  };
  const out = await runLabelDrafts(env, { fetchImpl, log: () => {} });
  assert.equal(out.proposed, 0);
  assert.match(out.note, /could not sign in|not running/);
  assert.ok(urls.every((u) => u.includes("/auth/v1/token")));
});

// #lblcr: the label run names a shelter on every request, and says how it went.
const labelEnv = {
  SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "svc",
  LABEL_DRAFT_EMAIL: "m@x", LABEL_DRAFT_PASSWORD: "p", AI: { run: async () => ({ response: "ทดสอบ" }) }, TRANSLATE_ENGINE: "workers-ai",
};
/** A fake Supabase: records every call, answers sign-in, the login's roles, the label list and the proposal. */
function fakeSupabase({ shelters, rpcStatus = 200, closed = [] }) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, headers: init.headers ?? {} });
    if (u.includes("/auth/v1/token")) return Response.json({ access_token: "tok", user: { id: "u1" } });
    if (u.includes("/rest/v1/user_roles")) return Response.json(shelters.map((s) => ({ shelter_id: s })));
    if (u.includes("/rest/v1/shelters")) return Response.json(shelters.filter((x) => !closed.includes(x)).map((x) => ({ id: x })));
    if (rpcStatus !== 200) return new Response("{}", { status: rpcStatus });
    if (u.endsWith("/rpc/label_translations")) return Response.json([{ status: "missing", source_text: "Dog", table_name: "diet_types", column_name: "name", row_id: `r-${init.headers["x-shelter-id"]}` }]);
    if (u.endsWith("/rpc/propose_label_th")) return Response.json(true);
    throw new Error(`unexpected ${u}`);
  };
  return { fetchImpl, calls };
}

test("runLabelDrafts: every database call for a shelter carries that shelter's x-shelter-id", async () => {
  const { fetchImpl, calls } = fakeSupabase({ shelters: ["shelter-a", "shelter-b"] });
  const out = await runLabelDrafts({ ...labelEnv, LABEL_DRAFT_BATCH: "5" }, { fetchImpl, log: () => {} });
  assert.equal(out.outcome, "ok");
  assert.equal(out.proposed, 2);
  const rpcs = calls.filter((c) => c.url.includes("/rpc/"));
  assert.equal(rpcs.length, 4);
  assert.ok(rpcs.every((c) => c.headers["x-shelter-id"]), "an rpc went out with no shelter");
  assert.deepEqual([...new Set(rpcs.map((c) => c.headers["x-shelter-id"]))].sort(), ["shelter-a", "shelter-b"]);
});

test("runLabelDrafts: a login with no shelter is a failure, and proposes nothing", async () => {
  const { fetchImpl, calls } = fakeSupabase({ shelters: [] });
  const out = await runLabelDrafts(labelEnv, { fetchImpl, log: () => {} });
  assert.equal(out.outcome, "failed");
  assert.match(out.note, /no role in any shelter/);
  assert.equal(calls.filter((c) => c.url.includes("/rpc/")).length, 0);
});

test("runLabelDrafts: a refused rpc is reported as failed, not swallowed", async () => {
  const { fetchImpl } = fakeSupabase({ shelters: ["shelter-a"], rpcStatus: 403 });
  const out = await runLabelDrafts(labelEnv, { fetchImpl, log: () => {} });
  assert.equal(out.outcome, "failed");
  assert.match(out.note, /rpc label_translations → 403/);
});

test("runLabelDrafts: not configured is 'skipped', which is healthy", async () => {
  const out = await runLabelDrafts({ SUPABASE_URL: "https://x.supabase.co" }, { fetchImpl: async () => { throw new Error("no network"); }, log: () => {} });
  assert.equal(out.outcome, "skipped");
});

test("runLabelDrafts: a closed shelter is not drafted for (#clsjb)", async () => {
  const { fetchImpl, calls } = fakeSupabase({ shelters: ["shelter-a", "shelter-b"], closed: ["shelter-b"] });
  const out = await runLabelDrafts({ ...labelEnv, LABEL_DRAFT_BATCH: "5" }, { fetchImpl, log: () => {} });
  assert.equal(out.proposed, 1);
  assert.ok(!calls.some((c) => c.headers["x-shelter-id"] === "shelter-b"));
});
