import test from "node:test";
import assert from "node:assert/strict";
import { fetchFromOrigin, originOrLocal } from "./origin.mjs";

const ENV = { ORIGIN_HOST: "pi.example", ORIGIN_KEY: "k" };
const realFetch = globalThis.fetch;
const stub = (impl) => { globalThis.fetch = impl; };
test.afterEach(() => { globalThis.fetch = realFetch; });

const get = () => new Request("https://site.example/adopt");
const post = () => new Request("https://site.example/residents", { method: "POST", body: "payload" });

test("a good answer from the Pi is passed through", async () => {
  stub(async () => new Response("hi", { status: 200 }));
  const res = await fetchFromOrigin(get(), ENV);
  assert.equal(res.status, 200);
});

test("the request is replayed to the origin host with the key and the public host", async () => {
  let seen;
  stub(async (url, init) => { seen = { url: String(url), headers: init.headers }; return new Response("ok"); });
  await fetchFromOrigin(get(), ENV);
  assert.equal(new URL(seen.url).host, "pi.example");
  assert.equal(seen.headers.get("x-origin-key"), "k");
  assert.equal(seen.headers.get("x-forwarded-host"), "site.example");
  assert.equal(seen.headers.get("x-forwarded-proto"), "https");
});

test("a read falls back to local on any failure or down status", async () => {
  for (const status of [502, 503, 504, 521, 522, 523, 530]) {
    stub(async () => new Response("", { status }));
    assert.equal(await fetchFromOrigin(get(), ENV), null, String(status));
  }
  stub(async () => { throw new Error("Network connection lost."); });
  assert.equal(await fetchFromOrigin(get(), ENV), null);
});

test("a write is replayed locally ONLY on 530 (it provably never arrived)", async () => {
  stub(async () => new Response("", { status: 530 }));
  assert.equal(await fetchFromOrigin(post(), ENV), null);
});

test("a write is NEVER replayed locally on any other failure: it is answered 503 and not re-run", async () => {
  for (const status of [502, 503, 504, 521, 522, 523]) {
    stub(async () => new Response("", { status }));
    const res = await fetchFromOrigin(post(), ENV);
    assert.equal(res.status, 503, String(status));
    assert.equal(res.headers.get("x-lanna-served-by"), "pi-timeout");
  }
  stub(async () => { throw new Error("Network connection lost."); });
  const res = await fetchFromOrigin(post(), ENV);
  assert.equal(res.status, 503);
});

test("an application error from the Pi (404, 500) is the app's answer, not a reason to fall back", async () => {
  for (const status of [400, 401, 403, 404, 500]) {
    stub(async () => new Response("", { status }));
    const res = await fetchFromOrigin(post(), ENV);
    assert.equal(res.status, status);
  }
});

test("originOrLocal: no ORIGIN_HOST means local, without calling fetch", async () => {
  stub(async () => { throw new Error("must not be called"); });
  const out = await originOrLocal(get(), {}, async () => new Response("local"));
  assert.equal(out.servedBy, "worker");
  assert.equal(await out.response.text(), "local");
});

test("originOrLocal: a write that never arrived is rendered locally WITH its body", async () => {
  stub(async () => new Response("", { status: 530 }));
  let body;
  const out = await originOrLocal(post(), ENV, async (req) => { body = await req.text(); return new Response("local"); });
  assert.equal(out.servedBy, "worker");
  assert.equal(body, "payload");
});

test("originOrLocal: a write the Pi may have acted on is not rendered locally", async () => {
  stub(async () => new Response("", { status: 504 }));
  let ran = false;
  const out = await originOrLocal(post(), ENV, async () => { ran = true; return new Response("local"); });
  assert.equal(ran, false);
  assert.equal(out.response.status, 503);
});
