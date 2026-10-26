#!/usr/bin/env node
// Cuts a release: moves `unreleased` in src/lib/releases.ts into a new entry at
// the top of `releases`, empties `unreleased`, and bumps package.json — then,
// with --verify, proves nothing was lost, changed or invented.
// docs/release-procedure.md step 4; docs/decisions/2026-10-26-cut-release-script.md.
//
//   node scripts/cut-release.mjs <version> <YYYY-MM-DD> <major|minor> --title "…" [--root <dir>]
//   node scripts/cut-release.mjs <version> <YYYY-MM-DD> <major|minor> --verify [--base <ref|file>] [--root <dir>]
//
// "major" means worth an EMAIL to admins (not semver major); "minor" means no mail.
// Both line endings work. Every refusal happens before a byte is written.
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const die = (msg) => {
  console.error(`cut-release: REFUSED — ${msg}`);
  process.exit(1);
};

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("--")) die(`--${name} needs a value`);
  argv.splice(i, 2);
  return v;
};
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return false;
  argv.splice(i, 1);
  return true;
};
const title = opt("title");
const rootArg = opt("root");
const baseArg = opt("base") ?? "origin/main";
const verify = flag("verify");
const [version, date, kind] = argv;

const repoDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(rootArg ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
const relPath = join(root, "src", "lib", "releases.ts");
const pkgPath = join(root, "package.json");

if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) die(`version "${version}" is not a.b.c`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) die(`date "${date}" is not YYYY-MM-DD`);
if (kind !== "major" && kind !== "minor") die(`third argument must be "major" (mails admins) or "minor" (no mail), got "${kind}"`);
const major = kind === "major";

const src = readFileSync(relPath, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
const pkg = readFileSync(pkgPath, "utf8");
const pkgEol = pkg.includes("\r\n") ? "\r\n" : "\n";

const OPEN_UNRELEASED = /export const unreleased: ReleaseNote\[\] = \[\r?\n/;
const OPEN_RELEASES = /export const releases: Release\[\] = \[\r?\n/;
const PKG_VERSION = /^(\s*"version":\s*")([^"]+)(",?)\r?$/m;

async function load(file) {
  // A copy with a unique name, so Node's module cache never serves a stale one.
  const dir = mkdtempSync(join(tmpdir(), "cut-release-"));
  const copy = join(dir, "releases.ts");
  copyFileSync(file, copy);
  try {
    return await import(pathToFileURL(copy).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (!verify) {
  const mU = OPEN_UNRELEASED.exec(src);
  if (!mU) die("could not find `export const unreleased: ReleaseNote[] = [` (no anchor, nothing written)");
  const bodyStart = mU.index + mU[0].length;
  const closeRe = /^\];\r?$/m;
  const rest = src.slice(bodyStart);
  const mC = closeRe.exec(rest);
  if (!mC) die("could not find the closing `];` of unreleased");
  const body = rest.slice(0, mC.index);
  if (body.trim() === "") die("`unreleased` is empty — there is nothing to cut (see release-procedure step 4: an empty list is not proof nothing shipped)");

  const mR = OPEN_RELEASES.exec(src);
  if (!mR) die("could not find `export const releases: Release[] = [`");
  if (mR.index < bodyStart) die("`releases` appears before `unreleased`; the file is not shaped as expected");
  if (!PKG_VERSION.test(pkg)) die('could not find the `"version"` line in package.json');
  const prev = PKG_VERSION.exec(pkg)[2];
  const t = (title ?? "").trim();
  if (!t) die("--title is required");
  if (src.includes(`version: "${version}"`)) die(`releases.ts already has version ${version}`);

  // Re-indent by slice: strip the common indent, put every line at 6 spaces.
  const lines = body.split(/\r?\n/);
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const cut = Math.min(...indents);
  const notes = lines.map((l) => (l.trim() ? "      " + l.slice(cut) : l));
  // Lines of the body are nested at 2; the new entry's notes nest at 6, one
  // level inside `notes: [` — shifting by (6 - 2) keeps inner structure.
  const entry = [
    "  {",
    `    version: "${version}",`,
    `    date: "${date}",`,
    `    title: ${JSON.stringify(t)},`,
    `    major: ${major},`,
    "    notes: [",
    ...notes,
    "    ],",
    "  },",
  ].join(eol) + eol;

  const insertAt = mR.index + mR[0].length;
  const out =
    src.slice(0, bodyStart) +
    src.slice(bodyStart + body.length, insertAt) +
    entry +
    src.slice(insertAt);
  const newPkg = pkg.replace(PKG_VERSION, `$1${version}$3` + (pkgEol === "\r\n" ? "\r" : ""));
  if (out === src) die("internal: nothing changed");
  writeFileSync(relPath, out);
  writeFileSync(pkgPath, newPkg);
  console.log(`cut ${prev} -> ${version} (${kind}, ${eol === "\r\n" ? "CRLF" : "LF"}); now run: node scripts/cut-release.mjs ${version} ${date} ${kind} --verify`);
  process.exit(0);
}

// ---- verification -----------------------------------------------------------
let baseFile;
let tmpBase = null;
try {
  baseFile = resolve(baseArg);
  readFileSync(baseFile);
} catch {
  tmpBase = mkdtempSync(join(tmpdir(), "cut-base-"));
  baseFile = join(tmpBase, "releases.ts");
  try {
    // Not a dotted path, so Git Bash path rewriting does not bite here.
    writeFileSync(baseFile, execFileSync("git", ["-C", repoDir, "show", `${baseArg}:src/lib/releases.ts`], { encoding: "buffer" }));
  } catch {
    die(`--base "${baseArg}" is neither a file nor a git ref with src/lib/releases.ts`);
  }
}

const cur = await load(relPath);
const base = await load(baseFile);
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });
const key = (n) => JSON.stringify(typeof n === "string" ? { text: n } : { text: n.text, roles: n.roles });

const entry = cur.releases[0];
const prev = base.releases[0];
check("new entry is the newest and has the requested version", entry?.version === version, entry?.version);
check("new entry has the requested date", entry?.date === date, entry?.date);
check("new entry's major flag matches", entry?.major === major, String(entry?.major));
check("new entry has a title", typeof entry?.title === "string" && entry.title.trim() !== "");
check("version is newer than the previous release", cur.compareVersions(version, prev.version) > 0, `${prev.version} -> ${version}`);
check("unreleased is empty after the cut", cur.unreleased.length === 0, String(cur.unreleased.length));
check("base unreleased was not empty", base.unreleased.length > 0);
check(
  "every note carried across character-identical, with its role tags, same order",
  JSON.stringify(entry.notes.map(key)) === JSON.stringify(base.unreleased.map(key)),
);
check("nothing invented (note count equal)", entry.notes.length === base.unreleased.length, `${entry.notes.length} vs ${base.unreleased.length}`);
check("every earlier entry present and unchanged", JSON.stringify(cur.releases.slice(1)) === JSON.stringify(base.releases));
const order = cur.releases.every((r, i, a) => i === 0 || cur.compareVersions(a[i - 1].version, r.version) > 0);
check("releases are in compareVersions order, newest first", order);
check("latestRelease is the new entry", cur.latestRelease.version === version);
const pkgNow = JSON.parse(readFileSync(pkgPath, "utf8"));
check("package.json version equals the newest entry", pkgNow.version === version, pkgNow.version);
const rendered = JSON.stringify(entry);
check("no [object Object] or undefined in the entry", !/\[object Object\]|undefined/.test(rendered));
// majorReleasesSince returns Release OBJECTS, not version strings — map first.
const mailed = cur.majorReleasesSince(prev.version).map((r) => r.version);
if (major) check("mail PRESENCE: majorReleasesSince(previous) is exactly the new version", JSON.stringify(mailed) === JSON.stringify([version]), JSON.stringify(mailed));
else check("mail ABSENCE: majorReleasesSince(previous) is empty", mailed.length === 0, JSON.stringify(mailed));
// Control, so an absence cannot pass because the function is broken: from
// further back it must still find an older major release.
const olderMajorIdx = cur.releases.findIndex((r, i) => i > 0 && r.major);
if (olderMajorIdx > 0 && olderMajorIdx < cur.releases.length - 1) {
  const older = cur.releases[olderMajorIdx];
  const before = cur.releases[olderMajorIdx + 1].version;
  const found = cur.majorReleasesSince(before).map((r) => r.version);
  check("control: from further back, an older major release is still found", found.includes(older.version), `${older.version} in ${JSON.stringify(found)}`);
} else check("control: from further back, an older major release is still found", false, "no older major release with a predecessor to test against");

if (tmpBase) rmSync(tmpBase, { recursive: true, force: true });
let bad = 0;
for (const r of results) {
  if (!r.ok) bad++;
  console.log(`${r.ok ? "ok  " : "FAIL"} ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
}
console.log(bad ? `\n${bad} of ${results.length} assertions FAILED` : `\nall ${results.length} assertions passed`);
process.exit(bad ? 1 : 0);
