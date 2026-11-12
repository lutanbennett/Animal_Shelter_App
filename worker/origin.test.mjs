import test from "node:test";
import assert from "node:assert/strict";
import { fetchFromOrigin, originOrLocal } from "./origin.mjs";

const ENV = { ORIGIN_HOST: "pi.example", ORIGIN_KEY: "k" };
const realFetch = globalThis.fetch;
const stub = (impl) => { globalThis.fetch = impl; };
test.afterEach(() => { globalThis.fetch = realFetch; });

const get = () => new Request("https://site.example/adopt");
const post = () => new Request("https://site.example/api/version", { method: "POST", body: "payload" });

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

// A path the Worker cannot render (src/lib/pi-only-paths.ts) is never rendered here.
const pdf = () => new Request("https://site.example/manual/pdf?view=all");

test("a Pi-only path is answered 503 on any failure or down status, and never rendered locally", async () => {
  for (const status of [502, 503, 504, 521, 522, 523, 530]) {
    stub(async () => new Response("", { status }));
    let rendered = false;
    const out = await originOrLocal(pdf(), ENV, async () => { rendered = true; return new Response("local"); });
    assert.equal(rendered, false, String(status));
    assert.equal(out.response.status, 503, String(status));
    assert.equal(out.servedBy, "pi-unavailable");
  }
  stub(async () => { throw new Error("Network connection lost."); });
  const out = await originOrLocal(pdf(), ENV, async () => new Response("local"));
  assert.equal(out.response.status, 503);
});

test("a Pi-only path is not cut short by the origin timeout, and the Pi's own answer passes through", async () => {
  let signal = "unset";
  stub(async (_url, init) => { signal = init.signal; return new Response("pdf", { status: 200 }); });
  const out = await originOrLocal(pdf(), ENV, async () => new Response("local"));
  assert.equal(signal, undefined);
  assert.equal(await out.response.text(), "pdf");
});

test("an ordinary read still has its timeout", async () => {
  let signal;
  stub(async (_url, init) => { signal = init.signal; return new Response("ok"); });
  await fetchFromOrigin(get(), ENV);
  assert.ok(signal instanceof AbortSignal);
});

// The rule is the website renders here, everything else is refused (src/lib/pi-only-paths.ts).
const app = (path, init) => new Request(`https://site.example${path}`, init);

test("an app page is answered with the offline page, never rendered locally, and still has its timeout", async () => {
  let signal;
  stub(async (_u, init) => { signal = init.signal; return new Response("", { status: 530 }); });
  let rendered = false;
  const out = await originOrLocal(app("/bills"), ENV, async () => { rendered = true; return new Response("local"); });
  assert.ok(signal instanceof AbortSignal);
  assert.equal(rendered, false);
  assert.equal(out.response.status, 503);
  assert.equal(out.servedBy, "pi-unavailable");
  assert.match(out.response.headers.get("content-type"), /text\/html/);
  assert.equal(out.response.headers.get("retry-after"), "60");
});

test("the offline page is self-contained, in English and Thai, with no external request", async () => {
  stub(async () => { throw new Error("Network connection lost."); });
  const out = await originOrLocal(app("/residents"), ENV, async () => new Response("local"));
  const html = await out.response.text();
  assert.match(html, /offline/i);
  assert.match(html, /[฀-๿]/);
  assert.match(html, /name="viewport"/);
  assert.doesNotMatch(html, /(src|href)=|@import|url\(/i);
});

test("the website still falls back to the Worker: / , a page, /th/ twin, robots, sign-in", async () => {
  stub(async () => new Response("", { status: 530 }));
  for (const p of ["/", "/adopt", "/th/adopt", "/robots.txt", "/login"]) {
    assert.equal(await fetchFromOrigin(app(p), ENV), null, p);
  }
});

test("a write to an app path: refused when it never arrived, 'check it saved' when the Pi may have acted", async () => {
  stub(async () => new Response("", { status: 530 }));
  let res = await fetchFromOrigin(app("/bills", { method: "POST", body: "x" }), ENV);
  assert.equal(res.headers.get("x-lanna-served-by"), "pi-unavailable");
  stub(async () => new Response("", { status: 504 }));
  res = await fetchFromOrigin(app("/bills", { method: "POST", body: "x" }), ENV);
  assert.equal(res.headers.get("x-lanna-served-by"), "pi-timeout");
});
