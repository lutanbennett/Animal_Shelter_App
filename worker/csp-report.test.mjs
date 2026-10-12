import test from "node:test";
import assert from "node:assert/strict";
import { handleCspReport, resetCspReportLimiter, CSP_REPORT_PATH } from "./csp-report.mjs";

const URL_ = `https://site.example${CSP_REPORT_PATH}`;
const post = (body, headers = {}) => new Request(URL_, { method: "POST", body, headers });
const legacy = (extra = {}) => JSON.stringify({ "csp-report": { "violated-directive": "script-src", "blocked-uri": "https://evil.example/x.js?token=SECRET#f", "document-uri": "https://site.example/a?k=SECRET", ...extra } });

function capture() {
  const lines = [];
  const real = console.log;
  console.log = (...a) => lines.push(a.join(" "));
  return { lines, restore: () => { console.log = real; } };
}
test.beforeEach(() => resetCspReportLimiter());

test("other paths are not ours (null)", async () => {
  assert.equal(await handleCspReport(new Request("https://site.example/api/other", { method: "POST" })), null);
});

test("a non-POST is 405 with Allow: POST", async () => {
  const res = await handleCspReport(new Request(URL_));
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "POST");
});

test("a POST is an empty 204, never an echo", async () => {
  const c = capture();
  try {
    const res = await handleCspReport(post(legacy()));
    assert.equal(res.status, 204);
    assert.equal(await res.text(), "");
  } finally { c.restore(); }
});

test("query strings and fragments never reach the log", async () => {
  const c = capture();
  try { await handleCspReport(post(legacy())); } finally { c.restore(); }
  const line = c.lines.join("\n");
  assert.ok(line.includes("script-src"));
  assert.ok(!line.includes("SECRET"), line);
  assert.ok(!line.includes("token"), line);
});

test("a body over the cap is 413 and nothing is logged", async () => {
  const c = capture();
  let res;
  try { res = await handleCspReport(post("x".repeat(9000))); } finally { c.restore(); }
  assert.equal(res.status, 413);
  assert.equal(c.lines.length, 0);
});

test("a declared Content-Length over the cap is 413 without reading", async () => {
  const res = await handleCspReport(post("{}", { "content-length": "99999" }));
  assert.equal(res.status, 413);
});

test("junk is still a quiet 204 and logs nothing", async () => {
  const c = capture();
  const outs = [];
  try {
    for (const b of ["", "not json", "null", "42", "[]", "{}", JSON.stringify({ "csp-report": {} })]) outs.push((await handleCspReport(post(b))).status);
  } finally { c.restore(); }
  assert.deepEqual(outs, [204, 204, 204, 204, 204, 204, 204]);
  assert.equal(c.lines.length, 0);
});

test("the report-to format is understood", async () => {
  const c = capture();
  try { await handleCspReport(post(JSON.stringify([{ type: "csp-violation", body: { effectiveDirective: "img-src", blockedURL: "https://x.example/i.png", documentURL: "https://site.example/p" } }]))); } finally { c.restore(); }
  assert.equal(c.lines.length, 1);
  assert.ok(c.lines[0].includes("img-src"));
});

test("fields are truncated and control characters removed", async () => {
  const c = capture();
  try { await handleCspReport(post(legacy({ "blocked-uri": "a\nb" + "z".repeat(1000) }))); } finally { c.restore(); }
  const logged = JSON.parse(c.lines[0].replace("csp-report: ", ""));
  assert.ok(logged.blocked.length <= 200);
  assert.ok(!/[\u0000-\u001f]/.test(logged.blocked));
});

test("at most 5 reports per body are logged", async () => {
  const c = capture();
  try { await handleCspReport(post(JSON.stringify(Array.from({ length: 20 }, () => JSON.parse(legacy()))))); } finally { c.restore(); }
  assert.equal(c.lines.length, 5);
});

test("a flood is capped at 30 lines a minute, then the drop count is reported in the next window", async () => {
  const c = capture();
  try {
    for (let i = 0; i < 40; i++) await handleCspReport(post(legacy()), 1_000_000);
    const within = c.lines.length;
    await handleCspReport(post(legacy()), 1_000_000 + 61_000);
    assert.equal(within, 30);
    assert.ok(c.lines.some((l) => l.includes("10 more dropped")), c.lines.join("\n"));
  } finally { c.restore(); }
});
