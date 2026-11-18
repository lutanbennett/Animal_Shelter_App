import test from "node:test";
import assert from "node:assert/strict";
import { reportWriterRun } from "./writer-runs.mjs";

const env = { SUPABASE_URL: "https://x.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "svc" };

test("reportWriterRun posts the job, the outcome and the detail to record_scheduled_writer_run", async () => {
  let seen;
  const fetchImpl = async (url, init) => { seen = { url: String(url), body: JSON.parse(init.body), auth: init.headers.authorization }; return new Response(null, { status: 204 }); };
  assert.equal(await reportWriterRun(env, "label-drafts", { outcome: "failed", note: "boom" }, fetchImpl), true);
  assert.equal(seen.url, "https://x.supabase.co/rest/v1/rpc/record_scheduled_writer_run");
  assert.deepEqual(seen.body, { p_job: "label-drafts", p_outcome: "failed", p_detail: "boom" });
  assert.equal(seen.auth, "Bearer svc");
});

test("reportWriterRun never throws, whatever goes wrong", async () => {
  assert.equal(await reportWriterRun({}, "j", { outcome: "ok" }, async () => { throw new Error("x"); }), false);
  assert.equal(await reportWriterRun(env, "j", { outcome: "ok" }, async () => { throw new Error("down"); }), false);
  assert.equal(await reportWriterRun(env, "j", { outcome: "ok" }, async () => new Response("", { status: 500 })), false);
});

import { summariseStage, reportStage } from "./writer-runs.mjs";

test("summariseStage reads each stage string the way the heartbeat means it", () => {
  assert.equal(summariseStage("calendar-sweep: not due"), null);
  assert.equal(summariseStage("merch-supplier-emails: not due"), null);
  assert.deepEqual(summariseStage("calendar-sweep: 200"), { outcome: "ok", note: "200" });
  assert.equal(summariseStage("calendar-sweep: 500").outcome, "failed");
  assert.equal(summariseStage("calendar-sweep: 401").outcome, "failed");
  assert.equal(summariseStage("calendar-sweep: skipped, not set: STATUS_ALERT_SITE").outcome, "skipped");
  assert.deepEqual(summariseStage("report-photo-retention: failed, boom"), { outcome: "failed", note: "failed, boom" });
  assert.equal(summariseStage("calendar-sweep: something odd").outcome, "failed");
});

test("reportStage keeps the string for the heartbeat and records only a stage that ran", async () => {
  const posts = [];
  const fetchImpl = async (_u, init) => { posts.push(JSON.parse(init.body)); return new Response(null, { status: 204 }); };
  const stages = [];
  await reportStage(env, "calendar-sweep", "calendar-sweep: 500", stages, fetchImpl);
  await reportStage(env, "merch-supplier-emails", "merch-supplier-emails: not due", stages, fetchImpl);
  assert.deepEqual(stages, ["calendar-sweep: 500", "merch-supplier-emails: not due"]);
  assert.deepEqual(posts, [{ p_job: "calendar-sweep", p_outcome: "failed", p_detail: "answered 500" }]);
});
