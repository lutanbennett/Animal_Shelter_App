#!/usr/bin/env node
/**
 * The worklist for a Thai read: every string that needs a person to look at it again
 * since a given date or commit, English and Thai side by side.
 *
 *   node scripts/list-thai-added.mjs 2026-11-01              markdown to stdout
 *   node scripts/list-thai-added.mjs 2026-11-01 --out x.md   write it to a file (hand that to the reader)
 *   node scripts/list-thai-added.mjs <commit> --json         machine-readable
 *   node scripts/list-thai-added.mjs 2026-11-01 --count      totals per kind and area, no text
 *
 * WHAT COUNTS AS "ADDED" — three kinds, each under its own heading, because they are three
 * different jobs for the reader (docs/decisions/2026-11-10-thai-added-since.md):
 *
 *   disagree  the ENGLISH changed and the Thai did not. The two no longer say the same thing and
 *             nothing else reports it, so it is listed first.
 *   new       a key that did not exist at the starting point.
 *   reworded  the Thai changed (with or without the English). Someone edited it, so it is unread.
 *
 * Entries whose English holds no letters (a dash, "4:5", bare placeholders) need no reading and
 * are left out. It reads the dictionaries the way check-thai-dictionary.mjs does: at runtime, a
 * function entry sampled with stand-in arguments, shown here with {a} {b} {c} for the arguments.
 * It changes nothing and needs neither the database nor a dev server.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const DICT_DIR = "src/lib/i18n/dictionaries";

const MARKS = ["\u0001one\u0001", 7, "\u0001two\u0001", 3, "\u0001three\u0001", 1];
const anyFields = new Proxy({}, { get: (_, key) => (key === Symbol.toPrimitive ? undefined : MARKS[0]) });

function sample(fn) {
  const scalars = Array.from({ length: fn.length }, (_, i) => MARKS[i % MARKS.length]);
  for (const attempt of [scalars, scalars.map(() => [MARKS[0], MARKS[2]]), scalars.map(() => anyFields)]) {
    try {
      const out = fn(...attempt);
      if (typeof out === "string" && !out.includes("undefined")) return out;
    } catch {
      // next shape
    }
  }
  return null;
}

/** Readable placeholders for a person: the stand-in marks become {a} {b} {c}. */
function show(text) {
  return text
    .replaceAll("\u0001one\u0001", "{a}")
    .replaceAll("\u0001two\u0001", "{b}")
    .replaceAll("\u0001three\u0001", "{c}");
}

function hasWords(text) {
  return /[A-Za-z]/.test(text.replaceAll(/\u0001[a-z]+\u0001/g, " "));
}

/** Flatten a dictionary to { "area.key": "text" }. Arrays get [i] in the path. */
export function flatten(dict, prefix = "", out = {}) {
  for (const [key, v] of Object.entries(dict ?? {})) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof v === "string") out[p] = v;
    else if (typeof v === "function") {
      const s = sample(v);
      if (s !== null) out[p] = s;
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "string") out[`${p}[${i}]`] = item;
        else if (item && typeof item === "object") flatten(item, `${p}[${i}]`, out);
      });
    } else if (v && typeof v === "object") flatten(v, p, out);
  }
  return out;
}

/**
 * Compare two states. Each is { en, th } flat maps; `before` may be empty.
 * Returns entries of kind disagree | new | reworded, in that order, then by path.
 */
export function diffDictionaries(before, after) {
  const found = [];
  for (const [p, en] of Object.entries(after.en)) {
    if (!hasWords(en)) continue;
    const th = after.th[p];
    if (th === undefined) continue; // a missing Thai is the typecheck's to catch
    const bEn = before.en[p];
    const bTh = before.th[p];
    let kind = null;
    if (bEn === undefined || bTh === undefined) kind = "new";
    else if (bTh !== th) kind = "reworded";
    else if (bEn !== en) kind = "disagree";
    if (kind) found.push({ kind, path: p, area: p.split(/[.[]/)[0], en, th, wasEn: kind === "disagree" ? bEn : null });
  }
  const order = { disagree: 0, new: 1, reworded: 2 };
  return found.sort((a, b) => order[a.kind] - order[b.kind] || a.path.localeCompare(b.path));
}

const TITLES = {
  disagree: "English changed, Thai did not — check they still say the same thing",
  new: "New — read the Thai",
  reworded: "Thai changed — read it again",
};

function cell(s) {
  return show(s).replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderMarkdown(entries, since) {
  const lines = [`# Thai wording to read — added since ${since}`, ""];
  const areas = new Set(entries.map((e) => e.area));
  lines.push(`${entries.length} strings in ${areas.size} areas. The area is the part of the app the wording appears in.`, "");
  for (const kind of ["disagree", "new", "reworded"]) {
    const these = entries.filter((e) => e.kind === kind);
    if (!these.length) continue;
    lines.push(`## ${TITLES[kind]} (${these.length})`, "");
    for (const area of [...new Set(these.map((e) => e.area))]) {
      lines.push(`### ${area}`, "", "| English | Thai | Key |", "|---|---|---|");
      for (const e of these.filter((x) => x.area === area)) {
        const en = kind === "disagree" ? `${cell(e.en)}<br>(was: ${cell(e.wasEn)})` : cell(e.en);
        lines.push(`| ${en} | ${cell(e.th)} | \`${e.path}\` |`);
      }
      lines.push("");
    }
  }
  if (!entries.length) lines.push("Nothing to read.", "");
  return lines.join("\n");
}

export function tally(entries) {
  const out = {};
  for (const e of entries) {
    out[e.kind] ??= {};
    out[e.kind][e.area] = (out[e.kind][e.area] ?? 0) + 1;
  }
  return out;
}

/* ------------------------------------------------------------------ git */
const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** A date (YYYY-MM-DD) means "as the dictionaries stood at the start of that day"; anything else is a commit. */
export function resolveRev(arg) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
    return git("rev-list", "-1", `--before=${arg}T00:00:00`, "HEAD", "--", DICT_DIR) || null;
  }
  return git("rev-parse", "--verify", `${arg}^{commit}`);
}

async function loadAt(rev) {
  if (rev === null) return { en: {}, th: {} };
  const dir = mkdtempSync(path.join(os.tmpdir(), "thai-added-"));
  const result = {};
  for (const name of ["en", "th"]) {
    let text;
    try {
      text = execFileSync("git", ["cat-file", "blob", `${rev}:${DICT_DIR}/${name}.ts`], {
        cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024,
      });
    } catch {
      result[name] = {};
      continue;
    }
    writeFileSync(path.join(dir, `${name}.ts`), text);
    result[name] = flatten((await import(pathToFileURL(path.join(dir, `${name}.ts`)).href)).default);
  }
  return result;
}

async function loadNow() {
  const r = {};
  for (const name of ["en", "th"]) {
    r[name] = flatten((await import(pathToFileURL(path.join(root, DICT_DIR, `${name}.ts`)).href)).default);
  }
  return r;
}

async function main() {
  const args = process.argv.slice(2);
  const outAt = args.indexOf("--out");
  const since = args.find((a, i) => !a.startsWith("--") && (outAt < 0 || i !== outAt + 1));
  if (!since) {
    console.error("usage: node scripts/list-thai-added.mjs <YYYY-MM-DD | commit> [--out file] [--json] [--count]");
    process.exit(2);
  }
  const rev = resolveRev(since);
  const entries = diffDictionaries(await loadAt(rev), await loadNow());
  let text;
  if (args.includes("--json")) text = JSON.stringify({ since, baseCommit: rev, entries }, null, 2);
  else if (args.includes("--count")) {
    const areas = new Set(entries.map((e) => e.area));
    text = `${entries.length} strings in ${areas.size} areas since ${since}\n${JSON.stringify(tally(entries), null, 2)}`;
  } else text = renderMarkdown(entries, since);
  if (outAt >= 0) {
    writeFileSync(args[outAt + 1], text + "\n");
    console.log(`wrote ${args[outAt + 1]}: ${entries.length} strings`);
  } else console.log(text);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
