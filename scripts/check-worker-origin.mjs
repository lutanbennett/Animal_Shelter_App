#!/usr/bin/env node
/**
 * Checks worker/origin.mjs — what the Worker does when the Pi, behind the
 * tunnel, is not there. A GET/HEAD/OPTIONS gets null (fall back to rendering
 * locally; that kept the public site up on 2026-10-01). A write gets null
 * only on a 530, the edge saying it found no tunnel to hand the request to:
 * it never reached the Pi, so the local render cannot double-apply it, and
 * sign-in and saving survive the Pi being off (the 2026-10-02 outage). On
 * 502/503/504/52x or a thrown fetch a write must NOT get null: the Pi may
 * already have recorded it, and the local replay would double-apply an
 * intake, a weight, a delivery (#250).
 *
 *   node scripts/check-worker-origin.mjs
 *
 * Two parts. The first stubs `fetch`. The second talks to throwaway servers
 * on 127.0.0.1 — an origin that answers 530, one that answers 504, one that
 * takes the write and drops the connection, one that refuses, one that hangs
 * — because the fallback is only worth having if the local render still gets
 * the write's body. Nothing leaves the machine. Exits 1 if any case is wrong.
 */
import http from "node:http";
import { fetchFromOrigin, originOrLocal, ORIGIN_DOWN_STATUSES, NEVER_ARRIVED_STATUSES } from "../worker/origin.mjs";

const env = { ORIGIN_HOST: "origin.test", ORIGIN_KEY: "k" };
const realFetch = globalThis.fetch;
let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};
const isUnanswered = async (r) =>
  r !== null && r.status === 503 && r.headers.get("x-lanna-served-by") === "pi-timeout"
  && (await r.text()).includes("Check whether your change was saved");

// ── Part 1: fetch stubbed ───────────────────────────────────────────────────

check("only 530 lets a write fall back", [...NEVER_ARRIVED_STATUSES].join() === "530", `got ${[...NEVER_ARRIVED_STATUSES]}`);

const stubs = {
  ...Object.fromEntries([...ORIGIN_DOWN_STATUSES].map((s) => [`status ${s}`, () => new Response("x", { status: s })])),
  "fetch throws": () => { throw new TypeError("connection reset"); },
};

for (const [label, stub] of Object.entries(stubs)) {
  globalThis.fetch = async () => stub();
  for (const method of ["GET", "HEAD", "OPTIONS"]) {
    const r = await fetchFromOrigin(new Request("https://lannacare.org/", { method }), env);
    check(`${method} ${label} falls back to local`, r === null);
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const r = await fetchFromOrigin(new Request("https://lannacare.org/x", { method, body: "a=1" }), env);
    if (label === "status 530") check(`${method} ${label} never reached the Pi, so falls back to local`, r === null);
    else check(`${method} ${label} is answered 503, not replayed`, await isUnanswered(r));
  }
}

// A real answer from the Pi — including an app error — passes straight through.
for (const status of [200, 303, 400, 401, 404, 500]) {
  globalThis.fetch = async () => new Response("x", { status });
  for (const method of ["GET", "POST"]) {
    const r = await fetchFromOrigin(new Request("https://lannacare.org/x", { method, body: method === "POST" ? "a=1" : undefined }), env);
    check(`${method} ${status} from the Pi passes through`, r !== null && r.status === status);
  }
}

// ── Part 2: real sockets on 127.0.0.1 ───────────────────────────────────────

// Node's fetch wants `duplex` spelled out to send a stream; workerd does not.
globalThis.fetch = (url, init) => realFetch(url, init?.body ? { ...init, duplex: "half" } : init);

/** A throwaway origin; `seen` collects what reached it. */
async function origin(handler) {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ method: req.method, body, key: req.headers["x-origin-key"], host: req.headers["x-forwarded-host"] });
      handler(req, res);
    });
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const close = () => new Promise((done) => { server.closeAllConnections(); server.close(done); });
  return { host: `127.0.0.1:${server.address().port}`, seen, close };
}

/** One request through originOrLocal, with a local render that records what it was given. */
async function through(host, method, extraEnv = {}) {
  const rendered = [];
  const body = method === "POST" ? "name=Cooper" : undefined;
  const { response, servedBy } = await originOrLocal(
    new Request("http://lannacare.test/residents/new", { method, body }),
    { ORIGIN_HOST: host, ORIGIN_KEY: "k", ...extraEnv },
    async (forLocal) => {
      rendered.push(forLocal.body ? await forLocal.text() : null);
      return new Response("rendered locally", { status: 200 });
    },
  );
  return { response, servedBy, rendered };
}

{
  // The 2026-10-02 outage: no tunnel, the edge answers 530 for the Pi.
  const o = await origin((_req, res) => res.writeHead(530).end("error code: 1033"));
  const post = await through(o.host, "POST");
  check("POST, origin answers 530: rendered locally and succeeds",
    post.response.status === 200 && post.servedBy === "worker", `status ${post.response.status} by ${post.servedBy}`);
  check("POST, origin answers 530: the local render got the write's body, once",
    post.rendered.length === 1 && post.rendered[0] === "name=Cooper", JSON.stringify(post.rendered));
  const get = await through(o.host, "GET");
  check("GET, origin answers 530: rendered locally", get.servedBy === "worker" && get.rendered.length === 1);
  await o.close();
}
{
  // cloudflared answering for a Pi that may already have acted.
  const o = await origin((_req, res) => res.writeHead(504).end("gateway timeout"));
  const post = await through(o.host, "POST");
  check("POST, origin answers 504: 503, and never rendered locally",
    (await isUnanswered(post.response)) && post.rendered.length === 0, `status ${post.response.status}, rendered ${post.rendered.length}`);
  const get = await through(o.host, "GET");
  check("GET, origin answers 504: rendered locally", get.servedBy === "worker" && get.rendered.length === 1);
  await o.close();
}
{
  // The case the refusal exists for: the write arrives, then the connection dies.
  const o = await origin((req) => req.socket.destroy());
  const post = await through(o.host, "POST");
  check("POST, origin takes the write then drops the connection: 503, and never rendered locally",
    (await isUnanswered(post.response)) && post.rendered.length === 0, `status ${post.response.status}, rendered ${post.rendered.length}`);
  check("  …and the write really had arrived", o.seen.length === 1 && o.seen[0].body === "name=Cooper", JSON.stringify(o.seen));
  await o.close();
}
{
  // Nothing listening. The request provably went nowhere, but a thrown fetch
  // does not say so — workerd words this the same as the case above — so a
  // write stays refused. (The Worker never sees this from the tunnel: the
  // edge answers 530 instead.)
  const o = await origin(() => {});
  await o.close();
  const post = await through(o.host, "POST");
  check("POST, origin refuses the connection: 503, and never rendered locally",
    (await isUnanswered(post.response)) && post.rendered.length === 0, `status ${post.response.status}, rendered ${post.rendered.length}`);
  const get = await through(o.host, "GET");
  check("GET, origin refuses the connection: rendered locally", get.servedBy === "worker" && get.rendered.length === 1);
}
{
  const o = await origin(() => {});
  const get = await through(o.host, "GET", { ORIGIN_TIMEOUT_MS: "300" });
  check("GET, origin accepts and never answers: rendered locally after ORIGIN_TIMEOUT_MS", get.servedBy === "worker" && get.rendered.length === 1);
  await o.close();
}
{
  const o = await origin((_req, res) => res.writeHead(303, { location: "/residents/1" }).end());
  const post = await through(o.host, "POST");
  check("POST, the Pi answers: passed through, never rendered locally",
    post.response.status === 303 && post.servedBy === "pi" && post.rendered.length === 0, `status ${post.response.status} by ${post.servedBy}`);
  check("  …and the Pi got the body, the key and the public host",
    o.seen.length === 1 && o.seen[0].body === "name=Cooper" && o.seen[0].key === "k" && o.seen[0].host === "lannacare.test", JSON.stringify(o.seen));
  await o.close();
}
{
  const post = await through("", "POST");
  check("POST with ORIGIN_HOST empty: rendered locally with its body",
    post.servedBy === "worker" && post.rendered[0] === "name=Cooper", JSON.stringify(post.rendered));
}
{
  // An upload at the body ceiling (MAX_UPLOAD_BODY_BYTES, 16 MB) — the largest
  // thing originOrLocal ever clones. The clone is a tee: the Pi leg drains the
  // stream and the local leg holds it, so the Worker holds one body at most,
  // and a write the Pi takes costs it no render.
  const big = "x".repeat(16 * 1024 * 1024);
  const sizeThrough = async (host) => {
    const rendered = [];
    const { response, servedBy } = await originOrLocal(
      new Request("http://lannacare.test/api/upload", { method: "POST", body: big }),
      { ORIGIN_HOST: host, ORIGIN_KEY: "k" },
      async (forLocal) => { rendered.push((await forLocal.text()).length); return new Response("rendered locally"); },
    );
    return { response, servedBy, rendered };
  };
  const pi = await origin((_req, res) => res.writeHead(303, { location: "/ok" }).end());
  const viaPi = await sizeThrough(pi.host);
  check("16 MB POST, the Pi answers: the Pi got every byte and nothing rendered locally",
    viaPi.servedBy === "pi" && viaPi.rendered.length === 0 && pi.seen[0]?.body.length === big.length,
    JSON.stringify({ by: viaPi.servedBy, rendered: viaPi.rendered, got: pi.seen[0]?.body.length }));
  await pi.close();
  const down = await origin((_req, res) => res.writeHead(530).end("error code: 1033"));
  const viaLocal = await sizeThrough(down.host);
  check("16 MB POST, origin answers 530: the local render got every byte, once",
    viaLocal.servedBy === "worker" && viaLocal.rendered.length === 1 && viaLocal.rendered[0] === big.length,
    JSON.stringify(viaLocal.rendered));
  await down.close();
}

globalThis.fetch = realFetch;
if (failures) {
  console.error(`${failures} case(s) wrong`);
  process.exit(1);
}
console.log("all cases ok");
