#!/usr/bin/env node
/**
 * Checks fetchFromOrigin (worker/origin.mjs) — what the Worker does when the
 * Pi, behind the tunnel, is not there. A write falls through to local only
 * for 521/522/523/530 (the edge never reached the Pi); 502/503/504 and a
 * thrown fetch stay refused. A GET/HEAD/OPTIONS gets null (fall
 * back to rendering locally; that kept the public site up on 2026-10-01). A
 * write must NOT get null: the Pi may already have recorded it, and the
 * local replay would double-apply an intake, a weight, a delivery. Before
 * this check, a 502/530 for a POST fell through to the local render; only a
 * thrown fetch was guarded.
 *
 *   node scripts/check-worker-origin.mjs
 *
 * No network: `fetch` is stubbed. Exits 1 if any case is wrong.
 */
import { fetchFromOrigin, ORIGIN_DOWN_STATUSES, NEVER_ARRIVED_STATUSES } from "../worker/origin.mjs";

const env = { ORIGIN_HOST: "origin.test", ORIGIN_KEY: "k" };
const realFetch = globalThis.fetch;
let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};

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
    if (NEVER_ARRIVED_STATUSES.has(Number(label.slice(7)))) {
      check(`${method} ${label} never reached the Pi, so falls back to local`, r === null);
      continue;
    }
    check(
      `${method} ${label} is answered 503, not replayed`,
      r !== null && r.status === 503 && r.headers.get("x-lanna-served-by") === "pi-timeout"
        && (await r.text()).includes("Check whether your change was saved"),
    );
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

globalThis.fetch = realFetch;
if (failures) {
  console.error(`${failures} case(s) wrong`);
  process.exit(1);
}
console.log("all cases ok");
