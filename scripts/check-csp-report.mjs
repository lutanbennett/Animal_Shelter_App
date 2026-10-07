#!/usr/bin/env node
/**
 * Checks the CSP report endpoint (worker/csp-report.mjs) and the headers that
 * point at it. Reports come from any browser on the internet, so the cases
 * that matter are the hostile ones: oversize, malformed, a flood, wrong
 * method — none may echo input, throw, or log without bound.
 *
 *   node scripts/check-csp-report.mjs
 *
 * No network. Exits 1 if any case is wrong.
 */
import {
  handleCspReport, resetCspReportLimiter, CSP_REPORT_PATH, MAX_BODY_BYTES, MAX_LOGS_PER_WINDOW,
} from "../worker/csp-report.mjs";
import { SECURITY_HEADERS, CSP } from "../worker/security-headers.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  (globalThis.__realLog ?? console.log)(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};

const lines = [];
const realLog = console.log;
globalThis.__realLog = realLog;
console.log = (...a) => { lines.push(a.join(" ")); };
const post = (body, headers = {}, path = CSP_REPORT_PATH) =>
  handleCspReport(new Request(`https://lannacare.org${path}`, { method: "POST", body, headers }));

const legacy = JSON.stringify({ "csp-report": {
  "document-uri": "https://lannacare.org/adopt?secret=1#frag", "violated-directive": "img-src",
  "effective-directive": "img-src", "blocked-uri": "https://evil.example/x.png?token=abc", "line-number": 7,
} });
const modern = JSON.stringify([{ type: "csp-violation", body: {
  documentURL: "https://lannacare.org/", effectiveDirective: "script-src-elem", blockedURL: "inline", disposition: "report",
} }]);

// Not ours → null, so the request carries on to the cache / Pi.
check("other paths are not handled", (await handleCspReport(new Request("https://lannacare.org/adopt", { method: "POST" }))) === null);

let r = await post(legacy);
check("legacy report → empty 204", r.status === 204 && (await r.text()) === "");
check("legacy report logged once, query/fragment stripped",
  lines.length === 1 && lines[0].includes("img-src") && !lines[0].includes("secret") && !lines[0].includes("token"), lines.join("|"));
r = await post(modern);
check("report-to batch → 204, logged", r.status === 204 && lines.length === 2 && lines[1].includes("script-src-elem"));

lines.length = 0;
for (const [label, body] of [["not JSON", "{{{"], ["empty", ""], ["a number", "42"], ["null", "null"], ["no directive", '{"csp-report":{}}']]) {
  r = await post(body);
  check(`${label} → 204, nothing logged`, r.status === 204 && lines.length === 0);
}

r = await post("x".repeat(MAX_BODY_BYTES + 1));
check("oversize body → 413", r.status === 413);
r = await post("x", { "content-length": String(MAX_BODY_BYTES + 1) });
check("oversize declared length → 413", r.status === 413);
lines.length = 0;
r = await post(JSON.stringify({ "csp-report": { "violated-directive": "z".repeat(3000), "blocked-uri": "\n".repeat(50) + "y".repeat(3000) } }));
check("long and control-char fields are truncated on one line", lines.length === 1 && lines[0].length < 700 && !lines[0].includes("\n"), String(lines[0]?.length));

r = await handleCspReport(new Request(`https://lannacare.org${CSP_REPORT_PATH}`, { method: "GET" }));
check("GET → 405 allow POST", r.status === 405 && r.headers.get("allow") === "POST");

// A flood logs at most MAX_LOGS_PER_WINDOW lines, then one summary after the window.
resetCspReportLimiter();
lines.length = 0;
const t0 = 1_000_000;
for (let i = 0; i < 500; i++) await handleCspReport(new Request(`https://lannacare.org${CSP_REPORT_PATH}`, { method: "POST", body: legacy }), t0);
check(`flood of 500 logs ${MAX_LOGS_PER_WINDOW}`, lines.length === MAX_LOGS_PER_WINDOW, String(lines.length));
await handleCspReport(new Request(`https://lannacare.org${CSP_REPORT_PATH}`, { method: "POST", body: legacy }), t0 + 61_000);
check("next window reports the drop count", lines.some((l) => l.includes("470 more dropped")), lines.slice(-2).join("|"));

console.log = realLog;

check("CSP names both report mechanisms", CSP.includes(`report-uri ${CSP_REPORT_PATH}`) && CSP.includes("report-to csp"));
check("CSP is enforced, not report-only", typeof SECURITY_HEADERS["content-security-policy"] === "string" && !("content-security-policy-report-only" in SECURITY_HEADERS));
check("Reporting-Endpoints points at the endpoint", SECURITY_HEADERS["reporting-endpoints"] === `csp="${CSP_REPORT_PATH}"`);
check("camera stays allowed", SECURITY_HEADERS["permissions-policy"].includes("camera=(self)"));

if (failures) {
  console.error(`${failures} case(s) wrong`);
  process.exit(1);
}
console.log("all cases ok");
