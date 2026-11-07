// Every host the BROWSER contacts must be allowed by the connect-src the Worker
// actually sends. Sits beside security-headers.test.mjs (which pins the one
// Drive case) and generalises it: same real header (`CSP` imported, never
// restated), but the targets are found by scanning the client code.
// docs/decisions/2026-11-04-csp-client-fetch-check.md.
//
// WHAT IT COVERS: every fetch / XMLHttpRequest.open / WebSocket / EventSource /
// sendBeacon call in a 'use client' file or in anything such a file imports
// (relative or "@/" imports, followed transitively). The first argument is
// classified as: same-origin path (fine, 'self'), absolute URL literal (its
// origin must be in connect-src), or UNRESOLVED.
//
// BLIND SPOTS, deliberately stated so green is not read as complete:
//  1. A URL that arrives at run time (an API response, a prop, a setting) cannot
//     be read. Those call sites are in UNRESOLVED_OK below, each with where the
//     value really comes from. A NEW unresolved call fails this test so that a
//     person looks. Today: the Drive resumable session URL, covered separately
//     by security-headers.test.mjs.
//  2. Supabase: the browser client's host is NEXT_PUBLIC_SUPABASE_URL, an env
//     value not visible here. We only assert connect-src names *.supabase.co
//     (https and wss); a non-supabase.co project URL would slip past.
//  3. Only connect-src. Images, frames, fonts, scripts and form targets are other
//     directives and are not checked.
//  4. Redirects: a same-origin or allowed URL that 302s to a third host is
//     checked by the browser against connect-src again; not modelled.
//  5. Third-party scripts that fetch for themselves (Google reCAPTCHA frame etc.)
//     run under their own origin's rules, not ours.
//  6. Computed import paths are not followed; `import type` and files marked
//     "use server" / server-only are skipped on purpose (they run on the server).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { CSP } from "./security-headers.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

/** Call sites whose URL is only known at run time. key: "<repo path>:<callee>". */
const UNRESOLVED_OK = {
  "src/lib/uploads/resumable-video.ts:fetch": "Drive resumable session URL returned by our server; host pinned by security-headers.test.mjs",
  "src/components/AttachmentUploader.tsx:xhr.open": "uploadUrl prop: a same-origin /api route chosen by each caller",
  "src/components/PhotoUploader.tsx:xhr.open": "uploadUrl built from props: a same-origin /api route",
  "src/components/TagNoteField.tsx:fetch": "searchUrl prop: a same-origin /api route (the general resident search, or the reel one)",
};

const connectSrc = () =>
  (CSP.split("; ").find((d) => d.startsWith("connect-src ")) ?? "").split(" ").slice(1);

/** Does connect-src permit `url`? Handles 'self', exact origins and https://*.host. */
function permitted(url) {
  const u = new URL(url);
  return connectSrc().some((s) => {
    if (s === "'self'") return false; // absolute URLs here are never our own origin
    const m = /^(\w+):\/\/(\*\.)?([^/]+)$/.exec(s);
    if (!m) return false;
    const [, scheme, wild, host] = m;
    if (u.protocol !== `${scheme}:`) return false;
    return wild ? u.hostname.endsWith(`.${host}`) : u.hostname === host;
  });
}

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\./.test(n)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const text = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
const isClient = (s) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/.test(s);

function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  for (const c of [base + ".ts", base + ".tsx", join(base, "index.ts"), join(base, "index.tsx"), base]) {
    if (text.has(c)) return c;
  }
  return null;
}

/** Files reachable from any 'use client' file. */
function clientReachable() {
  const seen = new Set();
  const stack = files.filter((f) => isClient(text.get(f)));
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    // A "use server" file (a server action) or server-only module runs on the
    // server even when a client component imports it: its fetches are not the browser's.
    if (/^\s*["']use server["']|import\s+["']server-only["']/m.test(text.get(f).slice(0, 600))) continue;
    seen.add(f);
    for (const m of text.get(f).matchAll(/^\s*(?:import|export)\s+(?!type\b)[^;]*?from\s*["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']/gm)) {
      const r = resolveImport(f, m[1] ?? m[2]);
      if (r) stack.push(r);
    }
  }
  return seen;
}

const CALLS = [
  { callee: "fetch", re: /(?<![.\w])fetch\s*\(\s*/g },
  { callee: "xhr.open", re: /\.open\(\s*["'][A-Z]+["']\s*,\s*/g },
  { callee: "WebSocket", re: /new\s+WebSocket\s*\(\s*/g },
  { callee: "EventSource", re: /new\s+EventSource\s*\(\s*/g },
  { callee: "sendBeacon", re: /\.sendBeacon\s*\(\s*/g },
];

/** Classify the argument starting at `i`: {kind:"relative"|"absolute"|"unresolved", url?} */
function classify(src, i) {
  const rest = src.slice(i);
  let m = /^(["'`])((?:(?!\1)[^\\]|\\.)*)\1/.exec(rest);
  if (m) return fromLiteral(m[2]);
  m = /^`([^`]*)`/.exec(rest);
  if (m) return fromLiteral(m[1]);
  m = /^([A-Za-z_$][\w$]*)\s*[,)]/.exec(rest);
  if (m) {
    const d = new RegExp(`\\bconst\\s+${m[1].replace(/\$/g, "\\$")}\\s*(?::[^=]+)?=\\s*(["'\`])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`).exec(src);
    if (d) return fromLiteral(d[2]);
  }
  return { kind: "unresolved" };
}
function fromLiteral(s) {
  if (s.startsWith("/") && !s.startsWith("//")) return { kind: "relative" };
  if (/^(https?|wss?):\/\//.test(s)) return { kind: "absolute", url: s.replace(/\$\{[^}]*\}/g, "x") };
  return { kind: "unresolved" };
}

function scan() {
  const hits = [];
  for (const f of clientReachable()) {
    const src = text.get(f);
    for (const { callee, re } of CALLS) {
      for (const m of src.matchAll(re)) {
        hits.push({ file: relative(ROOT, f).split(sep).join("/"), callee, ...classify(src, m.index + m[0].length) });
      }
    }
  }
  return hits;
}

test("the scan finds the client's network calls at all (guards against the scan silently matching nothing)", () => {
  const hits = scan();
  assert.ok(hits.length >= 6, `only ${hits.length} call sites found; the scan is broken`);
  assert.ok(hits.some((h) => h.file === "src/lib/uploads/resumable-video.ts"), "resumable-video.ts not reached via imports");
  assert.ok(hits.some((h) => h.kind === "relative"));
});

test("every absolute URL a client file fetches is allowed by the connect-src the Worker sends", () => {
  const bad = scan().filter((h) => h.kind === "absolute" && !permitted(h.url));
  assert.deepEqual(bad.map((h) => `${h.file}: ${h.callee} ${h.url}`), []);
});

test("every client call whose URL cannot be read is acknowledged, with where its value comes from", () => {
  const unknown = scan()
    .filter((h) => h.kind === "unresolved")
    .map((h) => `${h.file}:${h.callee}`)
    .filter((k) => !(k in UNRESOLVED_OK));
  assert.deepEqual(unknown, [], "a new run-time URL: work out its host, check connect-src, then add it to UNRESOLVED_OK");
});

test("the Supabase browser client's hosts (https and wss) are named in connect-src", () => {
  assert.ok(existsSync(join(SRC, "lib/supabase/client.ts")));
  assert.ok(permitted("https://abc.supabase.co/rest/v1/x"));
  assert.ok(permitted("wss://abc.supabase.co/realtime/v1/websocket"));
});

test("the permitted() matcher itself refuses what it should", () => {
  assert.ok(!permitted("https://evil.example/x"));
  assert.ok(!permitted("https://supabase.co.evil.example/x"));
  assert.ok(!permitted("http://abc.supabase.co/x"));
  assert.ok(!permitted("https://oauth2.googleapis.com/token"));
});
