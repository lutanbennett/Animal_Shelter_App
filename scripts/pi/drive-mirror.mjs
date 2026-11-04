#!/usr/bin/env node
// Pull-only mirror of the app's Google Drive tree onto the Pi's encrypted USB partition.
//
//   node scripts/pi/drive-mirror.mjs [--env-file <path>] [--dest <dir>] [--shelter <name>] [--status]
//
// RULE, NOT AN ACCIDENT: this script NEVER writes to Drive. Every Drive call below is a
// GET (token refresh, list, download, export). No delete, rename, move, copy, create or
// metadata touch. Do not "improve" it. The mirror's value is surviving a mistake in Drive.
//
// A file that disappears from Drive (or is trashed) is KEPT here and logged to
// <dest>/_mirror/gone.log. An edited file is re-copied (by Drive id + modifiedTime).
// A renamed or moved file is copied to its new path; the old copy is kept, never removed.
// Layout: <dest>/<shelter>/<Drive path>. State: <dest>/_mirror/state.json.
// Reads GOOGLE_OAUTH_CLIENT_ID/SECRET, GOOGLE_OAUTH_REFRESH_TOKEN, GOOGLE_DRIVE_ROOT_FOLDER_ID
// from the env file (the app's own; nothing new is minted), so after the move to the shelter's
// own account only that file changes. docs/pi-hosting.md, "Drive mirror", has the restore steps.
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { plan, isWorthRetrying } from "./drive-export.mjs";

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : d;
};
const DEST = arg("--dest", process.env.MIRROR_DEST || "/mnt/lanna-mirror");
const SHELTER = arg("--shelter", process.env.MIRROR_SHELTER || "lanna");
const ENV_FILE = arg("--env-file", process.env.MIRROR_ENV_FILE || ".env.deploy.production");
const META = path.join(DEST, "_mirror");
const STATE = path.join(META, "state.json");
const STATUS = path.join(META, "status.json");
const GONE = path.join(META, "gone.log");
const API = "https://www.googleapis.com/drive/v3/files";

if (process.argv.includes("--status")) {
  console.log(fs.existsSync(STATUS) ? fs.readFileSync(STATUS, "utf8") : "no run yet");
  process.exit(0);
}

const env = {};
for (const l of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
for (const k of ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN", "GOOGLE_DRIVE_ROOT_FOLDER_ID"]) {
  if (!env[k]) {
    console.error(`drive-mirror: ${k} missing in ${ENV_FILE}`);
    process.exit(1);
  }
}

// The destination must exist already: an unmounted encrypted drive must never be
// "created" as a plain folder on the NVMe.
if (!fs.existsSync(DEST)) {
  console.error(`drive-mirror: ${DEST} missing (is the encrypted drive unlocked and mounted?)`);
  process.exit(1);
}
fs.mkdirSync(META, { recursive: true });
const started = new Date().toISOString();

async function token() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const t = (await r.json()).access_token;
  if (!t) throw new Error("could not get a Drive access token");
  return t;
}
let tok = await token();
const get = async (url) => {
  for (let a = 0; a < 4; a++) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } }); // GET only
    if (r.status === 401) {
      tok = await token();
      continue;
    }
    if (r.status === 429 || r.status >= 500) {
      await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
      continue;
    }
    return r;
  }
  throw new Error(`Drive kept failing: ${String(url).split("?")[0]}`);
};
const safe = (n) => n.replace(/[<>:"\\|?*\x00-\x1f/]/g, "_").replace(/^\.+$/, "_");

const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {};
const seen = new Set();
const counts = { new: 0, changed: 0, same: 0, gone: 0, failed: 0, skipped: 0 };

async function list(id) {
  const out = [];
  let pt = "";
  do {
    const u = new URL(API);
    u.search = new URLSearchParams({
      q: `'${id}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,modifiedTime)",
      pageSize: "1000",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      ...(pt ? { pageToken: pt } : {}),
    });
    const r = await get(u);
    if (!r.ok) throw new Error(`list ${id}: HTTP ${r.status}`);
    const j = await r.json();
    out.push(...j.files);
    pt = j.nextPageToken;
  } while (pt);
  return out;
}

async function copyFile(f, target, how) {
  const url =
    how === "export"
      ? `${API}/${f.id}/export?mimeType=application%2Fpdf`
      : `${API}/${f.id}?alt=media&supportsAllDrives=true`;
  const r = await get(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const full = path.join(DEST, SHELTER, target);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const tmp = full + ".part";
  try {
    await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(tmp));
  } catch (e) {
    // A half-written .part is not a copy. Leave nothing behind for the retry to trip on.
    fs.rmSync(tmp, { force: true });
    throw e;
  }
  fs.renameSync(tmp, full);
}

// Drive's busy and outage codes are retried inside get(); this is for what gets past it —
// a connection dropped mid-body, which arrives as a bare `terminated` and used to fail the
// whole run over one photo. A 4xx is final and is not retried.
async function copyWithRetry(f, target, how) {
  for (let a = 0; ; a++) {
    try {
      return await copyFile(f, target, how);
    } catch (e) {
      if (a >= 2 || !isWorthRetrying(e.message)) throw e;
      console.error(`drive-mirror: ${target}: ${e.message} — retrying (${a + 1} of 2)`);
      await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
    }
  }
}

async function walk(id, rel) {
  for (const f of await list(id)) {
    const here = path.join(rel, safe(f.name));
    const how = plan(f.mimeType);
    if (how === "folder") {
      await walk(f.id, here);
      continue;
    }
    seen.add(f.id);
    if (how === "shortcut") {
      counts.skipped++;
      continue;
    }
    if (how === "unexportable") {
      // Drive has no file behind a Form, a Site or a Jamboard, so there is nothing to copy
      // and no retry that would help. Named every run rather than silenced: this is the only
      // place anyone learns that something in Drive is not in the mirror.
      counts.skipped++;
      console.error(`drive-mirror: ${here}: skipped, ${f.mimeType} cannot be exported`);
      continue;
    }
    const want = how === "export" ? here + ".pdf" : here;
    const prev = state[f.id];
    if (prev && prev.modifiedTime === f.modifiedTime && prev.path === want && !prev.gone) {
      counts.same++;
      continue;
    }
    try {
      await copyWithRetry(f, want, how);
      counts[prev ? "changed" : "new"]++;
      state[f.id] = { path: want, modifiedTime: f.modifiedTime };
    } catch (e) {
      counts.failed++;
      console.error(`drive-mirror: ${want}: ${e.message}`);
    }
  }
}

let fatal = "";
try {
  await walk(env.GOOGLE_DRIVE_ROOT_FOLDER_ID, "");
} catch (e) {
  fatal = e.message;
}

if (!fatal) {
  // Only after a complete walk: in state but not seen means gone from Drive. Keep it, log it once.
  for (const [id, s] of Object.entries(state)) {
    if (!seen.has(id) && !s.gone) {
      s.gone = started;
      counts.gone++;
      fs.appendFileSync(GONE, `${started}\t${id}\t${s.path}\n`);
    }
  }
}
fs.writeFileSync(STATE + ".tmp", JSON.stringify(state));
fs.renameSync(STATE + ".tmp", STATE);
const ok = !fatal && counts.failed === 0;
const prevOk = fs.existsSync(STATUS) ? JSON.parse(fs.readFileSync(STATUS, "utf8")).lastSuccess : "";
fs.writeFileSync(
  STATUS,
  JSON.stringify({ lastAttempt: started, lastSuccess: ok ? new Date().toISOString() : prevOk, result: ok ? "ok" : "failed", detail: fatal || JSON.stringify(counts), counts }) + "\n",
);
console.log(`drive-mirror ${ok ? "ok" : "FAILED"}: ${fatal || JSON.stringify(counts)}`);
process.exit(ok ? 0 : 1);
