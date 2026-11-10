#!/usr/bin/env node
// See, remove and restore "anyone with the link" on one environment's Google Drive tree (#yy9fz).
//
//   node scripts/drive-sharing.mjs --env uat            # REPORT only. Changes nothing.
//   node scripts/drive-sharing.mjs --env uat --remove   # delete every `anyone` permission
//   node scripts/drive-sharing.mjs --env uat --restore  # put `anyone: reader` back on every item
//
// --env is REQUIRED (test | uat | production); there is no default. Production is refused outright until
// the question of whose credentials own its files is settled (docs/decisions/2026-11-09-drive-unshare.md).
// test is the dev tree every running stream shares, so changing it also needs --shared-tree-ok.
//
// Walks the root recursively, pages through every folder, and handles FILES as well as FOLDERS: a
// folder losing `anyone` does not revoke a permission a file holds in its own right, so a folders-only
// strip would look clean while old files stayed readable. Folders, files and shortcuts are counted apart.
// Re-runnable: an item already without the permission is skipped, and a delete that 404s counts as done.
// Never prints a token, secret or refresh token.
import { loadEnv } from "./lib/env.mjs";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const ei = argv.indexOf("--env");
const envName = ei > -1 ? argv[ei + 1] : undefined;
if (!["test", "uat", "production"].includes(envName)) {
  console.error("--env test|uat|production is required (no default).");
  process.exit(2);
}
const REMOVE = flag("--remove");
const RESTORE = flag("--restore");
if (REMOVE && RESTORE) {
  console.error("Give --remove or --restore, not both.");
  process.exit(2);
}
const WRITE = REMOVE || RESTORE;
if (envName === "production") {
  console.error("Production is refused: its Drive credentials are not settled yet. Nothing was read or changed.");
  process.exit(2);
}
if (WRITE && envName === "test" && !flag("--shared-tree-ok")) {
  console.error("test is the dev tree every running stream shares. Add --shared-tree-ok to change it. Nothing was changed.");
  process.exit(2);
}

const env = loadEnv(envName);
const root = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
for (const k of ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"]) {
  if (!env[k]) {
    console.error(`${k} is not set for ${envName}.`);
    process.exit(2);
  }
}
if (!root) {
  console.error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not set.");
  process.exit(2);
}

const API = "https://www.googleapis.com/drive/v3";
let tok = { v: "", at: 0 };
async function token() {
  if (tok.v && Date.now() - tok.at < 45 * 60_000) return tok.v;
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
  if (!j.access_token) throw new Error(`token refresh failed: ${j.error ?? r.status}`);
  tok = { v: j.access_token, at: Date.now() };
  return tok.v;
}
/** Returns the Response; retries rate limits and 5xx. Callers decide what a 404 means. */
async function call(path, init = {}) {
  for (let i = 1; ; i++) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    });
    if (res.ok || res.status === 404 || i >= 5 || !(res.status === 429 || res.status >= 500 || res.status === 403)) return res;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
  }
}
/** Google's own reason for a refusal (never contains a credential). */
async function reason(res) {
  try {
    const j = await res.json();
    return `${j.error?.errors?.[0]?.reason ?? j.error?.status ?? "no reason given"}: ${j.error?.message ?? ""}`.slice(0, 200);
  } catch {
    return "no reason given";
  }
}
async function json(path, init) {
  const res = await call(path, init);
  if (!res.ok) throw new Error(`Drive ${res.status} on ${path.split("?")[0]}`);
  return res.json();
}

const FOLDER = "application/vnd.google-apps.folder";
const SHORTCUT = "application/vnd.google-apps.shortcut";
const kindOf = (m) => (m === FOLDER ? "folder" : m === SHORTCUT ? "shortcut" : "file");

async function permsOf(id) {
  const out = [];
  let page = "";
  do {
    const j = await json(`/files/${id}/permissions?supportsAllDrives=true&fields=nextPageToken,permissions(id,type,role)&pageSize=100${page}`);
    out.push(...(j.permissions ?? []));
    page = j.nextPageToken ? `&pageToken=${encodeURIComponent(j.nextPageToken)}` : "";
  } while (page);
  return out;
}

async function* walk() {
  const r = await json(`/files/${root}?supportsAllDrives=true&fields=id,name,mimeType`);
  yield { ...r, path: "/" + r.name };
  const queue = [{ id: root, path: "/" + r.name }];
  while (queue.length) {
    const dir = queue.shift();
    let page = "";
    do {
      const q = encodeURIComponent(`'${dir.id}' in parents and trashed=false`);
      const j = await json(
        `/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=1000&fields=nextPageToken,files(id,name,mimeType)${page}`,
      );
      for (const f of j.files ?? []) {
        const path = `${dir.path}/${f.name}`;
        yield { ...f, path };
        if (f.mimeType === FOLDER) queue.push({ id: f.id, path });
      }
      page = j.nextPageToken ? `&pageToken=${encodeURIComponent(j.nextPageToken)}` : "";
    } while (page);
  }
}

const tally = () => ({ folder: 0, file: 0, shortcut: 0 });
const seen = tally();
const shared = tally();
const changed = tally();
let skipped = 0;
const failed = [];

console.log(`Environment: ${envName}   root: ${root}   mode: ${REMOVE ? "REMOVE" : RESTORE ? "RESTORE" : "report only (nothing is changed)"}`);

for await (const item of walk()) {
  const kind = kindOf(item.mimeType);
  seen[kind]++;
  try {
    const anyone = (await permsOf(item.id)).filter((p) => p.type === "anyone");
    if (anyone.length) shared[kind]++;
    if (anyone.length && !WRITE) console.log(`  shared   ${kind.padEnd(8)} ${item.path}  (${anyone.map((p) => p.role).join(",")})`);
    if (REMOVE && anyone.length) {
      for (const p of anyone) {
        const res = await call(`/files/${item.id}/permissions/${p.id}?supportsAllDrives=true`, { method: "DELETE" });
        if (!res.ok && res.status !== 404) throw new Error(`delete refused (${res.status}: ${await reason(res)})`);
      }
      changed[kind]++;
      console.log(`  removed  ${kind.padEnd(8)} ${item.path}`);
    } else if (RESTORE && !anyone.length) {
      const res = await call(`/files/${item.id}/permissions?supportsAllDrives=true`, {
        method: "POST",
        body: JSON.stringify({ type: "anyone", role: "reader" }),
      });
      if (!res.ok) throw new Error(`create refused (${res.status}: ${await reason(res)})`);
      changed[kind]++;
      console.log(`  restored ${kind.padEnd(8)} ${item.path}`);
    } else if (WRITE) {
      skipped++;
    }
  } catch (e) {
    failed.push(`${item.path}: ${e.message}`);
    console.log(`  FAILED   ${kind.padEnd(8)} ${item.path}: ${e.message}`);
    if (failed.length === 1 && flag("--stop-on-first-failure")) break;
  }
}

const line = (t) => `${t.folder} folders, ${t.file} files, ${t.shortcut} shortcuts`;
console.log("\nSummary");
console.log(`  walked:        ${line(seen)}`);
console.log(`  anyone-shared: ${line(shared)}`);
if (WRITE) {
  console.log(`  changed:       ${line(changed)}`);
  console.log(`  skipped:       ${skipped} (${REMOVE ? "already had no anyone permission" : "already shared"})`);
}
console.log(`  failed:        ${failed.length}`);
for (const f of failed) console.log(`    ${f}`);
if (failed.length) process.exit(1);
