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
// DETAIL (stream failover-probe-captures): the summary lines stay short on purpose. Every attempt's FULL response
// headers, and the body of any non-2xx reply (first BODY_CAP chars, marked when cut), go to
// .local/drill-<case>.detail.jsonl, one JSON object per attempt. The first non-2xx reply is also printed in full
// under the summary, so one screen answers "who replied" without opening the file. No header is singled out as
// proof of anything: read them all (server, cf-ray, cf-cache-status, content-type, x-lanna-served-by...).
// Test and production share the Pi and tunnel; the test site writes to the DEV database only.
//
// ALWAYS DRY-RUN THIS AGAINST A HEALTHY PI BEFORE TRUSTING ANY DRILL — six seconds is enough, and
// every attempt must say landed=yes. It is cheap and it is not optional, because this probe has
// already failed in the one way that produces a confident wrong answer rather than an error.
// WHAT WENT WRONG (2026-11-01): it sent no request-id field, and runWriteAction() in
// src/lib/action-result.ts fails CLOSED on a write with no id ("refused: no write request id"), so
// every attempt came back a clean-looking 200 while NOTHING landed. A dry run showed 6 of 6 refused;
// run unchanged across a power pull it would have recorded "85 of 85 writes refused" as a fact about
// power loss. The fix is the WRITE_REQUEST_FIELD line in attempt() below: a fresh id per attempt,
// exactly as a real browser save sends one. If a later change to the app moves that field or adds
// another one the server insists on, this probe goes quietly dead again in the same shape — which is
// why the dry run is the rule and why a run that lands nothing now says so loudly.
import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { WRITE_REQUEST_FIELD, newWriteRequestId } from "../../src/lib/write-requests.ts";

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
const detailFile = `.local/drill-${drillCase}.detail.jsonl`;
const stamp = (d) => d.toISOString().slice(11, 23);

const BODY_CAP = 2000;
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
  form.set(WRITE_REQUEST_FIELD, newWriteRequestId()); // fresh per attempt: without it the write is refused and still answers 200
  const row = { n, name, at: stamp(started), status: "", ms: 0, servedBy: "none", landed: null, headers: null, body: null };
  try {
    const res = await fetch(`${site}/admin/units`, { method: "POST", body: form, headers: { cookie }, signal: AbortSignal.timeout(30000) });
    row.status = String(res.status);
    row.servedBy = res.headers.get("x-lanna-served-by") ?? "none";
    row.headers = Object.fromEntries(res.headers.entries());
    const text = await res.text().catch((e) => `<body unreadable: ${e?.name ?? e}>`);
    if (!res.ok) {
      row.body = text.length === 0 ? "<empty body>" : text.length > BODY_CAP ? `${text.slice(0, BODY_CAP)}\n<truncated: ${text.length} chars in all, first ${BODY_CAP} shown>` : text;
    }
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
appendFileSync(detailFile, attempts.map((a) => JSON.stringify({ n: a.n, at: a.at, status: a.status, ms: a.ms, landed: a.landed, headers: a.headers, body: a.body })).join("\n") + "\n");
const bad = attempts.find((a) => a.body !== null || a.status.startsWith("error:"));
if (bad) {
  console.log(`\nFIRST NON-2xx: ${bad.at} ${bad.status} ${bad.ms}ms\nheaders: ${JSON.stringify(bad.headers)}\nbody (first 300; the file has up to 2000): ${(bad.body ?? "<none: no response>").slice(0, 300)}\nall attempts in full: ${detailFile}`);
} else console.log(`\nno non-2xx replies. headers for every attempt: ${detailFile}`);
const byServer = {};
for (const a of attempts) byServer[a.servedBy] = (byServer[a.servedBy] ?? 0) + 1;
const landedCount = attempts.filter((a) => a.landed).length;
console.log(`\nattempts=${attempts.length} landed=${landedCount} not-landed=${attempts.length - landedCount} by-server=${JSON.stringify(byServer)}`);

// A run that lands NOTHING is far more likely to be a broken probe than a real result, so say so
// instead of printing a tidy summary somebody will write down. See the header.
if (attempts.length > 0 && landedCount === 0) {
  console.log(
    "\n*** NOTHING LANDED. THE PROBE IS PROBABLY BROKEN — DO NOT RECORD THIS AS A DRILL RESULT. ***\n" +
      "A real outage refuses some saves, not every one. Check first that the app still accepts this\n" +
      "write at all: run the probe for six seconds against a HEALTHY Pi and expect landed=yes every\n" +
      "time. If that also lands nothing, the probe is what is wrong — a clean 200 with nothing\n" +
      "written is what a refused write looks like from outside (see the header). Other things to\n" +
      "check: the cookie file is current (dev-signin's cookie lasts 50 minutes), ACTION_ID still\n" +
      "matches the build, and the site argument points where you think it does.",
  );
  process.exitCode = 1;
}
