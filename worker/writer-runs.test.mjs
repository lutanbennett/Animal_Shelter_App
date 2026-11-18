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
