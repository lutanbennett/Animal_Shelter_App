// Where the browser's CSP violation reports land: POST /api/csp-report,
// answered by the Worker itself before the edge cache and before the Pi (the
// /api/releases/* pattern in index.mjs). Reachable even when the Pi is down,
// and nothing is written to the Pi's disk — a report becomes one line in the
// Worker's logs (wrangler.jsonc "observability"), which is where to read them.
//
// Reports are untrusted input from any browser on the internet, so:
//   - the body is read up to MAX_BODY_BYTES and no further;
//   - it is never echoed back (always an empty 204 for a POST);
//   - each field is picked out, stripped of query/fragment where it is a URL,
//     and truncated, so a hostile report can't smuggle a large or odd line in;
//   - each isolate logs at most MAX_LOGS_PER_WINDOW lines a minute and says
//     how many it dropped, so a flood costs a counter, not a log.

export const CSP_REPORT_PATH = "/api/csp-report";
export const MAX_BODY_BYTES = 8 * 1024;
export const MAX_LOGS_PER_WINDOW = 30;
const WINDOW_MS = 60_000;
const MAX_REPORTS_PER_BODY = 5;
const MAX_FIELD_CHARS = 200;

let windowStart = 0;
let logged = 0;
let dropped = 0;

/** Test hook: forget the rate-limit window. */
export function resetCspReportLimiter() {
  windowStart = 0;
  logged = 0;
  dropped = 0;
}

/** A URL without its query and fragment, else the text itself; always short. */
function clean(value) {
  if (typeof value !== "string") return undefined;
  const bare = value.split(/[?#]/)[0];
  return bare.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, MAX_FIELD_CHARS);
}

const num = (v) => (Number.isFinite(v) ? v : undefined);

/** Both wire formats reduced to the same few fields, or null if unusable. */
function summarise(r) {
  if (!r || typeof r !== "object") return null;
  // report-uri: { "csp-report": { "document-uri", "violated-directive", … } }
  // report-to:  { type: "csp-violation", body: { documentURL, effectiveDirective, … } }
  const b = r["csp-report"] ?? r.body ?? r;
  if (!b || typeof b !== "object") return null;
  const directive = clean(b.effectiveDirective ?? b["effective-directive"] ?? b.violatedDirective ?? b["violated-directive"]);
  if (!directive) return null;
  return {
    directive,
    blocked: clean(b.blockedURL ?? b.blockedURI ?? b["blocked-uri"]),
    page: clean(b.documentURL ?? b.documentURI ?? b["document-uri"]),
    source: clean(b.sourceFile ?? b["source-file"]),
    line: num(b.lineNumber ?? b["line-number"]),
    disposition: clean(b.disposition),
  };
}

/** The body as text, abandoned (null) once it passes the cap. */
async function readCapped(request) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_BODY_BYTES) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

function logLine(summary, now) {
  if (now - windowStart >= WINDOW_MS) {
    if (dropped) console.log(`csp-report: ${dropped} more dropped in the last minute`);
    windowStart = now;
    logged = 0;
    dropped = 0;
  }
  if (logged >= MAX_LOGS_PER_WINDOW) {
    dropped++;
    return;
  }
  logged++;
  console.log(`csp-report: ${JSON.stringify(summary)}`);
}

/** The response if this is the report endpoint, else null (not ours). */
export async function handleCspReport(request, now = Date.now()) {
  if (new URL(request.url).pathname !== CSP_REPORT_PATH) return null;
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST", "cache-control": "no-store" } });
  }
  const text = await readCapped(request);
  if (text === null) return new Response(null, { status: 413, headers: { "cache-control": "no-store" } });

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  const items = Array.isArray(parsed) ? parsed : [parsed];
  for (const item of items.slice(0, MAX_REPORTS_PER_BODY)) {
    const summary = summarise(item);
    if (summary) logLine(summary, now);
  }
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
