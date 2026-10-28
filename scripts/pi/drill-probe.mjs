#!/usr/bin/env node
// Failover drill probe (docs/pi-failover.md, "Running the drill"; stream pi-failover-drills).
//
// Once a second it POSTs ONE REAL WRITE to the test site (Settings -> Units "create unit", replayed as the
// progressive-enhancement form post, signed in as a dev-signin admin) and records per attempt: the clock time,
// the HTTP status or the thrown error, how long it took, which side answered (x-lanna-served-by), and, after the
// run, whether the row actually LANDED in the dev database. Landing is read from the table, never inferred from
// the status: a 502 can arrive after the Pi has written.
//
// usage: node scripts/pi/drill-probe.mjs <case> <seconds> <cookie-file> [site]
//   cookie-file holds "sb-...-auth-token=base64-..." (the cookie dev-signin prints; never commit it)
// output: one line per attempt on stdout, then a summary; also appended to .local/drill-<case>.log
// Test and production share the Pi and tunnel; the test site writes to the DEV database only.
import { readFileSync, appendFileSync, mkdirSync } from "node:fs";

const [drillCase, secondsArg, cookieFile, site = "https://test.lannacare.org"] = process.argv.slice(2);
if (!drillCase || !secondsArg || !cookieFile) throw new Error("usage: drill-probe.mjs <case> <seconds> <cookie-file> [site]");
const seconds = Number(secondsArg);
const cookie = readFileSync(cookieFile, "utf8").trim();
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const ACTION_ID = "607e1b04c24472ed9e1e8d92b3fba808354b3d8f50"; // createUnit; re-read from /admin/units chunks if a build changes it
const run = Date.now().toString(36);
mkdirSync(".local", { recursive: true });
const logFile = `.local/drill-${drillCase}.log`;
const stamp = (d) => d.toISOString().slice(11, 23);

const attempts = [];
async function attempt(n) {
  const name = `drill-${run}-${n}`;
  const started = new Date();
  const form = new FormData();
  form.set("$ACTION_REF_1", "");
  form.set("$ACTION_1:0", JSON.stringify({ id: ACTION_ID, bound: "$@1" }));
  form.set("$ACTION_1:1", "[null]");
  form.set("$ACTION_KEY", "k");
  form.set("name", name);
  form.set("usedFor", "ingredients");
  const row = { n, name, at: stamp(started), status: "", ms: 0, servedBy: "none", landed: null };
  try {
    const res = await fetch(`${site}/admin/units`, { method: "POST", body: form, headers: { cookie }, signal: AbortSignal.timeout(30000) });
    row.status = String(res.status);
    row.servedBy = res.headers.get("x-lanna-served-by") ?? "none";
    await res.arrayBuffer().catch(() => {});
  } catch (e) {
    row.status = `error:${e?.cause?.code ?? e?.name ?? e}`;
  }
  row.ms = Date.now() - started.getTime();
  attempts.push(row);
}

const pending = [];
for (let n = 0; n < seconds; n++) {
  pending.push(attempt(n));
  await new Promise((r) => setTimeout(r, 1000));
}
await Promise.all(pending);

// Did it land? One read of the table by this run's prefix.
const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/units?select=name&name=like.drill-${run}-*`, {
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
});
const landed = new Set((await res.json()).map((r) => r.name));
attempts.sort((a, b) => a.n - b.n);
for (const a of attempts) a.landed = landed.has(a.name);

const lines = attempts.map((a) => `${a.at} ${a.status} ${a.ms}ms served-by=${a.servedBy} landed=${a.landed ? "yes" : "NO"}`);
console.log(lines.join("\n"));
appendFileSync(logFile, `# ${drillCase} ${new Date().toISOString()}\n${lines.join("\n")}\n`);
const byServer = {};
for (const a of attempts) byServer[a.servedBy] = (byServer[a.servedBy] ?? 0) + 1;
console.log(`\nattempts=${attempts.length} landed=${attempts.filter((a) => a.landed).length} not-landed=${attempts.filter((a) => !a.landed).length} by-server=${JSON.stringify(byServer)}`);
