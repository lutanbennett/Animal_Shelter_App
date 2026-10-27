import test from "node:test";
import assert from "node:assert/strict";
import { recordHeartbeat, finishHeartbeat, HEARTBEAT_NOTE } from "./heartbeat.mjs";

const env = { SUPABASE_URL: "https://x.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "k" };

function stubFetch(handler) {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return handler(url, init); };
  return calls;
}

test("a heartbeat is a cron row whose note starts with the marker, and returns its id", async () => {
  const calls = stubFetch(() => new Response(JSON.stringify([{ id: 7 }]), { status: 201 }));
  assert.equal(await recordHeartbeat(env, "*/15 * * * *"), 7);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.trigger, "cron");
  assert.ok(body.note.startsWith(HEARTBEAT_NOTE));
  assert.equal(calls[0].url, "https://x.supabase.co/rest/v1/status_alert_runs");
});

test("a heartbeat that cannot be written returns null and never throws", async () => {
  stubFetch(() => { throw new Error("network down"); });
  assert.equal(await recordHeartbeat(env, "c"), null);
  stubFetch(() => new Response("no", { status: 401 }));
  assert.equal(await recordHeartbeat(env, "c"), null);
  assert.equal(await recordHeartbeat({}, "c"), null);
});

test("finishing records every stage and keeps the marker; null id does nothing", async () => {
  const calls = stubFetch(() => new Response("", { status: 204 }));
  await finishHeartbeat(env, 7, "c", ["a: skipped, not set: X", "b: 200"]);
  assert.ok(calls[0].url.endsWith("?id=eq.7"));
  const note = JSON.parse(calls[0].init.body).note;
  assert.ok(note.startsWith(HEARTBEAT_NOTE) && note.includes("not set: X"));
  await finishHeartbeat(env, null, "c", []);
  assert.equal(calls.length, 1);
});
