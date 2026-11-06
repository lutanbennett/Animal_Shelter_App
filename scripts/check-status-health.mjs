// The health feed Home Assistant reads: GET /api/status/health (backlog #mzu7v).
//
//   node scripts/check-status-health.mjs                 offline checks
//   node scripts/check-status-health.mjs --url http://localhost:3011 [--token <t>]
//
// Offline: a wrong, missing, malformed or too-short token is refused; the right one is
// accepted; the limiter trips; the payload carries no error text or host names; the
// proxy lets exactly this GET through; the token is declared in the runtime config.
// With --url it also calls a running server: no token and a wrong token must be 401.
// A --token is only used to confirm a 200 and is never printed.
import { readFileSync } from "node:fs";
import { buildHealthFeed, makeLimiter, tokenMatches, databaseSizeState } from "../src/lib/status/health-feed.ts";
import { RUNTIME_CONFIG } from "./lib/runtime-config.mjs";

let failed = 0;
const check = (name, ok) => { console.log(`${ok ? "ok  " : "FAIL"} ${name}`); if (!ok) failed++; };

const T = "a".repeat(40);
check("right token accepted", tokenMatches(`Bearer ${T}`, T));
check("missing header refused", !tokenMatches(null, T));
check("wrong token refused", !tokenMatches(`Bearer ${"b".repeat(40)}`, T));
check("token that is a prefix refused", !tokenMatches(`Bearer ${T.slice(0, 39)}`, T));
check("token with extra tail refused", !tokenMatches(`Bearer ${T}x`, T));
check("no Bearer scheme refused", !tokenMatches(T, T));
check("empty bearer refused", !tokenMatches("Bearer ", T));
check("unset server token refuses everyone", !tokenMatches("Bearer ", undefined) && !tokenMatches(`Bearer ${T}`, undefined));
check("too-short server token refuses everyone", !tokenMatches("Bearer abc", "abc"));

let t = 0;
const limit = makeLimiter(3, 1000, () => t);
const four = [limit(), limit(), limit(), limit()];
check("limiter allows 3 then refuses", four.join() === "true,true,true,false");
t = 1000;
check("limiter opens again next window", limit() === true);

const secretError = "relation schema_migrations missing at db.internal.example:5432 key=abc123";
const r = (state, facts) => ({ state, checkedAt: "2026-11-06T00:00:00.000Z", durationMs: 12.4, error: secretError, facts });
const feed = buildHealthFeed({
  report: {
    database: r("ok", { latencyMs: 41 }),
    backup: r("warn", { env: "production", count: 5, newest: { name: "lannacare-production-x.dump.age", createdAt: "x", ageDays: 2.345 } }),
    origin: r("ok", { host: "pi.secret-host.example", status: 200 }),
    release: r("ok", { version: "0.43.3", title: "t" }),
    drive: r("fail", { notConnected: true }),
  },
  databaseHealth: { sizeBytes: 100 * 1_048_576, connections: 9 },
  environment: "production",
  now: new Date("2026-11-06T01:00:00Z"),
});
const text = JSON.stringify(feed);
check("payload carries no error text", !/schema_migrations|internal|abc123|error/i.test(text));
check("payload carries no host or file names", !/secret-host|dump\.age|production-x/.test(text));
check("states and times kept", feed.checks.drive.state === "fail" && feed.checks.database.checkedAt.startsWith("2026"));
check("numbers computed", feed.numbers.databaseResponseMs === 41 && feed.numbers.databaseSizeMb === 100 && feed.numbers.databaseSizePercent === 20
  && feed.numbers.databaseConnections === 9 && feed.numbers.newestBackupAgeDays === 2.35 && feed.numbers.releaseVersion === "0.43.3" && feed.numbers.originInUse === true);
check("size 20% ok", feed.checks.databaseSize.state === "ok");
check("size thresholds", databaseSizeState(79) === "ok" && databaseSizeState(80) === "warn" && databaseSizeState(95) === "fail" && databaseSizeState(null) === "fail");
const unknown = buildHealthFeed({ report: {}, databaseHealth: null, environment: "dev", now: new Date() });
check("database numbers unknown, not invented", unknown.numbers.databaseSizeMb === null && unknown.checks.databaseSize.state === "fail");

const proxy = readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");
check("proxy lets exactly the health GET through", /pathname === STATUS_HEALTH_PATH && request\.method === "GET"/.test(proxy) && proxy.includes('"/api/status/health"'));
const route = readFileSync(new URL("../src/app/api/status/health/route.ts", import.meta.url), "utf8");
check("route reads STATUS_READ_TOKEN and never the service-role key as a credential",
  route.includes("process.env.STATUS_READ_TOKEN") && !/SERVICE_ROLE_KEY/.test(route));
check("route is no-store", route.includes('"cache-control": "no-store"'));
const cfg = RUNTIME_CONFIG.find((c) => c.name === "STATUS_READ_TOKEN");
check("token declared as a scrubbed Worker secret", !!cfg && cfg.secret && cfg.scrub);

const args = process.argv.slice(2);
const at = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const url = at("--url");
if (url) {
  const get = (auth) => fetch(`${url}/api/status/health`, { headers: auth ? { authorization: auth } : {}, redirect: "manual" });
  check("live: no token is 401", (await get(null)).status === 401);
  check("live: wrong token is 401", (await get(`Bearer ${"z".repeat(40)}`)).status === 401);
  const token = at("--token");
  if (token) {
    const res = await get(`Bearer ${token}`);
    check("live: right token is 200 and no-store", res.status === 200 && res.headers.get("cache-control") === "no-store");
  }
}
if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log("\nall checks passed");
