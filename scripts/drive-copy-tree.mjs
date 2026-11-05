#!/usr/bin/env node
// Copy a Google Drive folder tree into a NEW root folder in the SAME account, for the cutover
// (#rqv5c): UAT is restored from the same data as production, so both hold the same Drive ids and a
// tester deleting a photo on UAT would delete the shelter's live one. UAT gets its own copy instead.
//
//   node scripts/drive-copy-tree.mjs [--env test|uat|production] [--source <folderId>] [--name <root name>]
//                                    [--map <file>] [--apply]
//
// DRY RUN BY DEFAULT: walks the tree, counts folders/files/bytes, measures the account's free space
// and writes nothing to Drive. --apply creates the new root and copies.
//
// READS the source tree and WRITES only inside the new root folder: the only Drive calls that write
// are folder create (parent = the new tree) and files.copy (parents = the new tree). Never update,
// move, trash or delete, so the live tree cannot be damaged. The new root is created with no
// permission call at all, so it is private (NOT 'anyone with the link', #yy9fz) and files.copy does
// not carry permissions over.
//
// RESUMABLE / RE-RUNNABLE: the mapping file (jsonl, one {from,to,kind,path} per line, root first) is
// appended as each item lands. A re-run with the same --map skips what is mapped and carries on in
// the same new root; it never makes a second root.
//
// Same call shape as DriveClient.copyFile / createFolder in src/lib/google/drive.ts (that file is
// TypeScript with "@/" imports, which a plain .mjs cannot load); credentials are the app's own.
import fs from "node:fs";
import { loadEnv } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(n);
  return i > -1 ? argv[i + 1] : d;
};
const APPLY = argv.includes("--apply");
const envName = arg("--env", "test");
const MAP = arg("--map", `drive-copy-map.${envName}.jsonl`);

const API = "https://www.googleapis.com/drive/v3";
const FOLDER = "application/vnd.google-apps.folder";
const SHORTCUT = "application/vnd.google-apps.shortcut";

const env = loadEnv(envName);
for (const k of ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"]) {
  if (!env[k]) {
    console.error(`${k} is not set for --env ${envName}.`);
    throw new Error("missing credentials");
  }
}
const SOURCE = arg("--source", env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
if (!SOURCE) {
  console.error("No source folder: pass --source or set GOOGLE_DRIVE_ROOT_FOLDER_ID.");
  throw new Error("no source");
}

let tokenCache = { value: "", at: 0 };
async function token() {
  if (tokenCache.value && Date.now() - tokenCache.at < 45 * 60_000) return tokenCache.value;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token refresh failed: ${j.error ?? r.status} (try scripts/check-drive-token.mjs)`);
  tokenCache = { value: j.access_token, at: Date.now() };
  return j.access_token;
}

async function call(path, init = {}, tries = 5) {
  for (let i = 1; ; i++) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${await token()}` },
    });
    if (res.ok) return res.json();
    if (i < tries && (res.status === 429 || res.status >= 500 || res.status === 403)) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
      continue;
    }
    throw new Error(`Drive ${init.method ?? "GET"} ${path.split("?")[0]} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
}

async function children(folderId) {
  const out = [];
  let pageToken = "";
  do {
    const p = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,size)",
      pageSize: "1000",
      spaces: "drive",
    });
    if (pageToken) p.set("pageToken", pageToken);
    const j = await call(`/files?${p}`);
    out.push(...(j.files ?? []));
    pageToken = j.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

// Mapping file: already-copied items, so a dead run resumes.
const mapped = new Map(); // original id -> copy id
let newRoot = null;
if (fs.existsSync(MAP)) {
  for (const line of fs.readFileSync(MAP, "utf8").split(/\r?\n/).filter(Boolean)) {
    const m = JSON.parse(line);
    mapped.set(m.from, m.to);
    if (m.kind === "root") newRoot = m.to;
  }
}
const record = (m) => {
  mapped.set(m.from, m.to);
  fs.appendFileSync(MAP, JSON.stringify(m) + "\n");
};

async function main() {
const quota = (await call("/about?fields=storageQuota,user(emailAddress)"));
const limit = quota.storageQuota?.limit ? Number(quota.storageQuota.limit) : null;
const usage = Number(quota.storageQuota?.usage ?? 0);

// Walk the source.
const folders = []; // {id, name, path, parent}
const files = []; // {id, name, parent, size}
let skipped = 0;
async function walk(id, pathSoFar) {
  for (const c of await children(id)) {
    if (c.mimeType === FOLDER) {
      folders.push({ id: c.id, name: c.name, path: `${pathSoFar}/${c.name}`, parent: id });
      await walk(c.id, `${pathSoFar}/${c.name}`);
    } else if (c.mimeType === SHORTCUT) {
      skipped++;
    } else {
      files.push({ id: c.id, name: c.name, parent: id, size: Number(c.size ?? 0), path: `${pathSoFar}/${c.name}` });
    }
  }
}
const src = await call(`/files/${SOURCE}?fields=id,name`);
await walk(SOURCE, src.name);
const bytes = files.reduce((s, f) => s + f.size, 0);
const gb = (n) => (n / 1024 ** 3).toFixed(2) + " GB";

console.log(`Account: ${quota.user?.emailAddress}  (env ${envName})`);
console.log(`Source "${src.name}" (${SOURCE}): ${folders.length} folders, ${files.length} files, ${gb(bytes)}` + (skipped ? `, ${skipped} shortcuts skipped` : ""));
console.log(`Storage: used ${gb(usage)} of ${limit === null ? "unlimited" : gb(limit)}; free ${limit === null ? "unlimited" : gb(limit - usage)}; a copy adds ~${gb(bytes)}`);
const fits = limit === null || limit - usage > bytes;
console.log(fits ? "Fits: yes." : `Fits: NO. Shortfall ${gb(bytes - (limit - usage))}. Stop; this is a blocker for Lutan.`);
console.log(`Already mapped from a previous run: ${mapped.size} (${MAP})`);

if (!APPLY) {
  console.log("DRY RUN: nothing was written to Drive. Add --apply to copy.");
  return fits ? 0 : 1;
} else if (!fits) {
  return 1;
} else {
  const rootName = arg("--name", `${src.name} (UAT copy ${new Date().toISOString().slice(0, 10)})`);
  if (!newRoot) {
    // No permissions call: a folder made this way is private to the account.
    const r = await call("/files?fields=id", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ name: rootName, mimeType: FOLDER, parents: ["root"] }),
    });
    newRoot = r.id;
    record({ from: SOURCE, to: newRoot, kind: "root", path: rootName });
    console.log(`New root "${rootName}": ${newRoot}`);
  } else {
    console.log(`Resuming into the existing new root ${newRoot}`);
  }
  // Parents before children: folders were collected depth-first, so a parent is always earlier.
  let done = 0;
  for (const f of folders) {
    if (mapped.has(f.id)) continue;
    const to = (await call("/files?fields=id", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ name: f.name, mimeType: FOLDER, parents: [mapped.get(f.parent)] }),
    })).id;
    record({ from: f.id, to, kind: "folder", path: f.path });
  }
  let failed = 0;
  for (const f of files) {
    if (mapped.has(f.id)) continue;
    try {
      const to = (await call(`/files/${f.id}/copy?fields=id`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ parents: [mapped.get(f.parent)], name: f.name }),
      })).id;
      record({ from: f.id, to, kind: "file", path: f.path });
      if (++done % 50 === 0) console.log(`  ${done} files copied…`);
    } catch (e) {
      failed++;
      console.error(`  FAILED ${f.path}: ${e.message}`);
    }
  }
  console.log(`Copied ${done} files this run; ${failed} failed. Map: ${MAP} (${mapped.size} entries).`);
  if (failed) console.log("Re-run the same command to retry the failures.");
  return failed ? 1 : 0;
}
}

await exitWith(await main().catch((e) => { console.error(e.message); return 1; }));
