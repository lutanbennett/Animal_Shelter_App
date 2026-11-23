// #pihst: a Pi-shaped local run, because `next dev` and a plain `next start` cannot show this class of fault.
//
// The Pi starts `next start --hostname 127.0.0.1` and cloudflared forwards `Host: localhost:<port>`, so any ABSOLUTE
// URL the proxy hands to NextResponse.rewrite is read as another origin and proxied outward over TLS (#thpfx: HTTP 500,
// "Failed to proxy https://localhost:3001/ ... EPROTO"). This script starts that exact shape and sends the requests.
//
//   npx next build                                  (once; a production build, not dev)
//   node scripts/pi-shaped-check.mjs [--port 3912]  (starts the server, prints one line per request, stops it)
//
// It is a Pi-SHAPED build, not the Pi: no cloudflared, no Worker, no TLS terminator. It proves what Next does with the
// bind address and the headers; it does not prove production. Exit 1 if any expectation below fails.
import { spawn } from "node:child_process";
import http from "node:http";
import { exitWith } from "./lib/exit.mjs";

const port = Number(process.argv[process.argv.indexOf("--port") + 1]) || 3912;
const env = {
  ...process.env,
  // Split addresses so the host redirects in src/proxy.ts have something to do (isSplit() reads these at runtime).
  APP_HOST: "app.pihst.test",
  PUBLIC_HOST: "pub.pihst.test",
  PLATFORM_HOST: "plat.pihst.test",
  PORT: String(port),
};
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port), "--hostname", "127.0.0.1"], {
  env,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));

// fetch() cannot set Host; http.request can, which is the whole point of the shape.
const get = (path, headers = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path, method: "GET", headers: { host: `localhost:${port}`, "x-forwarded-proto": "https", ...headers } },
      (res) => { res.resume(); res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location ?? "" })); },
    );
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout")));
    req.end();
  });

const cases = [
  // [label, path, extra headers, expected status, expected Location (or null)]
  ["plain page", "/adopt", {}, 200, null],
  ["Thai page (the #thpfx rewrite)", "/th/adopt", {}, 200, null],
  ["redirect: public page asked on the app address", "/adopt", { "x-lanna-public-host": "app.pihst.test" }, 307, "https://pub.pihst.test/adopt"],
  ["redirect: staff page asked on the public address", "/residents", { "x-lanna-public-host": "pub.pihst.test" }, 307, "https://app.pihst.test/residents"],
  ["redirect: shelter page asked on the platform address", "/residents", { "x-lanna-public-host": "plat.pihst.test" }, 307, "https://plat.pihst.test/platform"],
];

let failed = 0;
try {
  for (let i = 0; i < 90; i++) {
    try { await get("/api/status/health"); break; } catch { await new Promise((r) => setTimeout(r, 1000)); if (i === 89) throw new Error("server never came up:\n" + log); }
  }
  for (const [label, path, headers, want, wantLoc] of cases) {
    const r = await get(path, headers);
    const ok = r.status === want && (wantLoc === null || r.location === wantLoc);
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"} ${r.status} ${label}  ${path}${r.location ? "  -> " + r.location : ""}`);
  }
  const proxied = /Failed to proxy/.test(log);
  if (proxied) { failed++; console.log("FAIL server log says: " + log.split("\n").find((l) => /Failed to proxy/.test(l))); }
  else console.log("ok   no 'Failed to proxy' in the server log");
} finally {
  server.kill();
}
await exitWith(failed ? 1 : 0);
