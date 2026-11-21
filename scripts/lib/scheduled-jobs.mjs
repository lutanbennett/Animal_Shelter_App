// The SOURCE ARM of check-scheduled-writers (#swout): judge the jobs the Worker dispatches from `scheduled()` in
// worker/index.mjs. They are not cron.job rows, so the database arm cannot see them. No database, no network: reads files.
//
// For each `await runX(` inside scheduled() it finds the function, follows the /api/... route it calls (and that route's
// imports, one level) and asks two questions of that source:
//   1. does it ACT OUTSIDE THE DATABASE (mail, Google, a translation engine, a storage bucket)?
//   2. does it consider `archived_at` (skip a closed shelter)?
// Outside and no archived_at is a PROBLEM, unless the job carries a recorded exemption in the three lines above its dispatch:
//   // writer-outside-db: no-archived-skip — <reason>
// (a retention purge should still purge for a closed shelter: docs/decisions/2026-11-21-closed-shelter-jobs.md).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const OUTSIDE = [
  [/\b(sendEmail|sendMail|send_email|EMAIL\.send|\.send\()/, "sends mail"],
  [/googleapis|google\/(drive|calendar)|calendar\/v3|drive-client|shelter-calendar/i, "calls Google (Calendar/Drive)"],
  [/\btranslate\(|pickEngine\(/, "calls a translation engine"],
  [/\.storage\b|removeReportPhotos|listReportPhotos/, "writes/deletes in a storage bucket"],
];
const EXEMPT = /\/\/\s*writer-outside-db:\s*no-archived-skip[ \t]*[—-][ \t]*(\S.*)/;
const BACKSLASH = String.fromCharCode(92);
const read = (root, p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : null);

function fnBody(src, name) {
  const m = new RegExp("(?:async\\s+)?function\\s+" + name + "\\s*\\(").exec(src);
  if (!m) return null;
  let p = m.index + m[0].length, parens = 1;
  while (p < src.length && parens > 0) { if (src[p] === "(") parens++; else if (src[p] === ")") parens--; p++; }
  const open = src.indexOf("{", p);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open, i + 1);
  }
  return null;
}

// Files a source reads: its `@/...` and relative imports, one level.
function imports(root, file, src) {
  const out = [];
  for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) {
    const s = m[1];
    const base = s.startsWith("@/") ? join("src", s.slice(2)) : s.startsWith(".") ? join(dirname(file), s) : null;
    if (!base) continue;
    for (const ext of ["", ".ts", ".tsx", ".mjs", "/index.ts"]) {
      const p = (base + ext).split(BACKSLASH).join("/");
      if (/[.](ts|tsx|mjs)$/.test(p) && read(root, p) !== null) { out.push(p); break; }
    }
  }
  return out;
}

export function readJobs(root = ".") {
  const indexSrc = read(root, "worker/index.mjs");
  if (indexSrc === null) return { jobs: [], problems: ["worker/index.mjs not found"] };
  const sched = fnBody(indexSrc.replace(/^\s*async scheduled\(/m, "function scheduled("), "scheduled") ?? "";
  const lines = indexSrc.split("\n");
  const sources = { "worker/index.mjs": indexSrc, "worker/translations.mjs": read(root, "worker/translations.mjs") ?? "" };
  const jobs = [];
  for (const m of sched.matchAll(/await\s+(run[A-Za-z]+)\(/g)) {
    const fn = m[1];
    if (jobs.some((j) => j.fn === fn)) continue;
    const at = lines.findIndex((l) => l.includes(m[0]));
    const above = lines.slice(Math.max(0, at - 3), at + 1).join("\n");
    const ex = EXEMPT.exec(above);
    let body = null, from = null;
    for (const [f, s] of Object.entries(sources)) { body = fnBody(s, fn); if (body) { from = f; break; } }
    const files = [from ?? "?"];
    let text = body ?? "";
    const route = /\/api\/([a-z0-9/-]+)/.exec(text);
    if (route) {
      const rf = "src/app/api/" + route[1] + "/route.ts";
      const rs = read(root, rf);
      if (rs !== null) {
        const deps = imports(root, rf, rs);
        files.push(rf, ...deps);
        text += "\n" + rs + deps.map((f) => "\n" + read(root, f)).join("");
      }
    }
    const signals = OUTSIDE.filter(([re]) => re.test(text)).map(([, why]) => why);
    jobs.push({ fn, files, outside: signals.length > 0, signals, archived: /archived_at/.test(text), exempt: ex ? ex[1].trim() : null, found: body !== null });
  }
  return { jobs, problems: [] };
}

export function findProblems(root = ".") {
  const { jobs, problems } = readJobs(root);
  const out = [...problems];
  if (!problems.length && !jobs.length) out.push("no jobs found in worker/index.mjs scheduled(): the reader is blind, not the code clean");
  for (const j of jobs) {
    if (!j.found) out.push(j.fn + ": dispatched from scheduled() but its function was not found; cannot be judged");
    else if (j.outside && !j.archived && !j.exempt) {
      out.push(j.fn + " (" + j.signals.join(", ") + ") never considers archived_at: it would act for a closed shelter. Skip closed shelters, or record why not above its dispatch line (writer-outside-db: no-archived-skip — <reason>)");
    }
  }
  return out;
}

export function describe(j) {
  const kind = j.outside ? "ACTS OUTSIDE THE DATABASE (" + j.signals.join(", ") + ")" : "inside the database only";
  const arch = j.archived ? "skips a closed shelter" : j.exempt ? "EXEMPT, correct not to skip: " + j.exempt : "does not consider archived_at";
  return "  [" + (j.outside ? "OUTSIDE" : "INSIDE") + "] " + j.fn + ": " + kind + "; " + arch;
}
