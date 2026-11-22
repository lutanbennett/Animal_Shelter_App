#!/usr/bin/env node
// Move a shelter's Drive tree into the shelter's OWN Google account (#rqv5c), after the Director has connected it from Settings.
// The connect flow stored her consent STAGED (shelter_drive_credentials.staged, 0435), so nothing has changed for anyone yet.
//
//   node scripts/drive-move-to-shelter-account.mjs --env test|uat [--shelter lanna] [--source <folderId>] [--map <file>]
//                                                  [--apply] [--go-live]
//
// THREE STEPS, each a flag, none implied by another:
//   (no flag)   DRY RUN. Walks the old tree, counts folders/files/bytes, reads the new account's free space. Writes nothing.
//   --apply     COPY. A drive.file token cannot copy a file it did not create, so each file is DOWNLOADED with the OLD
//               credentials (the environment's account) and UPLOADED with the NEW (the staged row). The tree is rebuilt under a new
//               root in the new account. Resumable through the jsonl map (same {from,to,kind,path} lines as drive-copy-tree.mjs, so
//               check-drive-leftovers.mjs reads it). Re-run to pick up what was added meanwhile.
//   --go-live   ONE database statement: remap every *drive_file_id / *drive_folder_id, set shelters.drive_root_folder_id to the new
//               root, and clear staged, so the ids and the account change together and no read ever sees half of it. Refuses unless
//               a fresh walk of the old tree finds every file already in the map.
//
// NEVER WRITES TO THE SOURCE: against the old account it only lists and downloads (files.list, files.get alt=media). It never
// updates, moves, trashes or deletes. REFUSES PRODUCTION: dev or UAT only, by --env and by the project src/lib/app-env.ts says it
// is, the same guard as drive-remap-ids.mjs. Production is the Director's consent plus Lutan's run, with a backup, as a deliberate decision.
// Prints counts and names, never a token. A file that is not a binary (a Google Doc/Sheet) is listed as skipped, not exported.
import fs from "node:fs";
import { loadEnv, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";
import { decryptSecret } from "../src/lib/google/drive-credentials-crypto.ts";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : d; };
const APPLY = argv.includes("--apply");
const GO_LIVE = argv.includes("--go-live");
const envName = arg("--env", "test");
const SHELTER = arg("--shelter", "lanna");
const MAP = arg("--map", `drive-move-map.${envName}.${SHELTER}.jsonl`);
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER = "application/vnd.google-apps.folder";
const NATIVE = /^application\/vnd\.google-apps\./;
const ID = /^[A-Za-z0-9_-]{10,200}$/;
const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;

function tokenSource(creds) {
  let c = { v: "", at: 0 };
  return async () => {
    if (c.v && Date.now() - c.at < 45 * 60_000) return c.v;
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: creds.id, client_secret: creds.secret, refresh_token: creds.refresh, grant_type: "refresh_token" }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j.access_token) throw new Error(`token refresh failed for the ${creds.label} account: ${j.error ?? r.status}`);
    c = { v: j.access_token, at: Date.now() };
    return c.v;
  };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchRetry(tok, url, init = {}, tries = 5) {
  for (let i = 1; ; i++) {
    let res;
    try { res = await fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${await tok()}` } }); }
    catch (e) { if (i < tries) { await wait(1000 * 2 ** i); continue; } throw e; } // a dropped connection or a DNS blip: retry, do not fail the file
    if (res.ok) return res;
    if (i < tries && (res.status === 429 || res.status >= 500 || res.status === 403)) { await wait(1000 * 2 ** i); continue; }
    throw new Error(`Drive ${init.method ?? "GET"} ${url.replace(/\?.*/, "").replace(/\/files\/[^/]+/, "/files/<id>")} -> ${res.status} ${(await res.text()).slice(0, 160)}`);
  }
}
const json = async (tok, path, init) => (await fetchRetry(tok, `${API}${path}`, init)).json();

async function walk(tok, root) {
  const folders = [], files = [], skipped = [];
  const rootInfo = await json(tok, `/files/${root}?fields=id,name`);
  const go = async (id, path) => {
    let page = "";
    do {
      const p = new URLSearchParams({ q: `'${id}' in parents and trashed = false`, fields: "nextPageToken,files(id,name,mimeType,size)", pageSize: "1000" });
      if (page) p.set("pageToken", page);
      const j = await json(tok, `/files?${p}`);
      for (const c of j.files ?? []) {
        const here = `${path}/${c.name}`;
        if (c.mimeType === FOLDER) { folders.push({ id: c.id, name: c.name, path: here, parent: id }); await go(c.id, here); }
        else if (NATIVE.test(c.mimeType)) skipped.push({ id: c.id, path: here, mime: c.mimeType });
        else files.push({ id: c.id, name: c.name, mime: c.mimeType, size: Number(c.size ?? 0), parent: id, path: here });
      }
      page = j.nextPageToken ?? "";
    } while (page);
  };
  await go(root, rootInfo.name);
  return { rootInfo, folders, files, skipped };
}

async function main() {
  if (envName === "production") throw new Error("Refusing --env production: this script only ever writes to dev or UAT.");
  const env = loadEnv(envName);
  const appEnv = appEnvForSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (appEnv !== "dev" && appEnv !== "uat") throw new Error(`Refusing: ${projectRef(env)} is "${appEnv}" by src/lib/app-env.ts. Only dev and uat are allowed.`);
  for (const k of ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN", "DRIVE_CREDENTIALS_KEY"]) if (!env[k]) throw new Error(`${k} is not set for --env ${envName}.`);
  const ref = projectRef(env);
  const query = async (sql) => {
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }),
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`database: ${t.slice(0, 300)}`);
    return t ? JSON.parse(t) : [];
  };

  if (!/^[a-z0-9_-]{1,60}$/.test(SHELTER)) throw new Error("bad --shelter");
  const [row] = await query(`select s.id, s.drive_root_folder_id, c.staged, c.oauth_client_id, c.oauth_client_secret_enc, c.refresh_token_enc, c.drive_account_email
      from shelters s left join shelter_drive_credentials c on c.shelter_id = s.id where s.key = ${lit(SHELTER)}`);
  if (!row) throw new Error(`No shelter with key ${SHELTER}.`);
  if (!row.refresh_token_enc) throw new Error("This shelter has no stored Google connection. The Director connects it from Settings first.");
  if (!row.staged) throw new Error("The connection is already live (staged = false). Nothing to move; refusing so a live account is never re-pointed.");

  const oldTok = tokenSource({ label: "old", id: env.GOOGLE_OAUTH_CLIENT_ID, secret: env.GOOGLE_OAUTH_CLIENT_SECRET, refresh: env.GOOGLE_OAUTH_REFRESH_TOKEN });
  const newTok = tokenSource({ label: "new", id: row.oauth_client_id, secret: await decryptSecret(row.oauth_client_secret_enc, env.DRIVE_CREDENTIALS_KEY), refresh: await decryptSecret(row.refresh_token_enc, env.DRIVE_CREDENTIALS_KEY) });
  const SOURCE = arg("--source", row.drive_root_folder_id || env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
  if (!ID.test(SOURCE ?? "")) throw new Error("No source folder: pass --source or set GOOGLE_DRIVE_ROOT_FOLDER_ID.");

  const mapped = new Map(); let newRoot = null;
  if (fs.existsSync(MAP)) for (const l of fs.readFileSync(MAP, "utf8").split(/\r?\n/).filter(Boolean)) { const m = JSON.parse(l); mapped.set(m.from, m.to); if (m.kind === "root") newRoot = m.to; }
  const record = (m) => { mapped.set(m.from, m.to); fs.appendFileSync(MAP, JSON.stringify(m) + "\n"); };

  const oldWho = (await json(oldTok, "/about?fields=user(emailAddress)")).user?.emailAddress;
  const newAbout = await json(newTok, "/about?fields=storageQuota,user(emailAddress)");
  const { rootInfo, folders, files, skipped } = await walk(oldTok, SOURCE);
  const bytes = files.reduce((s, f) => s + f.size, 0);
  const gb = (n) => (n / 1024 ** 3).toFixed(2) + " GB";
  const limit = newAbout.storageQuota?.limit ? Number(newAbout.storageQuota.limit) : null;
  const free = limit === null ? null : limit - Number(newAbout.storageQuota?.usage ?? 0);
  console.log(`Env ${envName} (${appEnv}), shelter ${SHELTER}. OLD account ${oldWho} -> NEW account ${newAbout.user?.emailAddress}.`);
  console.log(`Source "${rootInfo.name}": ${folders.length} folders, ${files.length} files, ${gb(bytes)}; ${skipped.length} Google-native files skipped (not exported).`);
  console.log(`New account free space: ${free === null ? "unlimited" : gb(free)}. Already mapped: ${mapped.size} (${MAP}).`);
  const fits = free === null || free > bytes;
  if (!fits) { console.log("Fits: NO. Stop."); return 1; }

  if (!APPLY && !GO_LIVE) { console.log("DRY RUN: nothing was written anywhere. --apply copies; --go-live finishes."); return 0; }

  if (APPLY) {
    if (!newRoot) {
      const r = await json(newTok, "/files?fields=id", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: rootInfo.name, mimeType: FOLDER }) });
      newRoot = r.id; record({ from: SOURCE, to: newRoot, kind: "root", path: rootInfo.name });
      console.log("Made the new root in the new account.");
    } else console.log("Resuming into the existing new root.");
    for (const f of folders) {
      if (mapped.has(f.id)) continue;
      const r = await json(newTok, "/files?fields=id", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, mimeType: FOLDER, parents: [mapped.get(f.parent)] }) });
      record({ from: f.id, to: r.id, kind: "folder", path: f.path });
    }
    let done = 0, failed = 0, doneBytes = 0;
    for (const f of files) {
      if (mapped.has(f.id)) continue;
      let err;
      for (let a = 1; a <= 3; a++) try {
        err = null;
        const src = await fetchRetry(oldTok, `${API}/files/${f.id}?alt=media&supportsAllDrives=true`);
        const start = await fetchRetry(newTok, `${UPLOAD}/files?uploadType=resumable&fields=id`, {
          method: "POST", headers: { "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": f.mime, "X-Upload-Content-Length": String(f.size) },
          body: JSON.stringify({ name: f.name, parents: [mapped.get(f.parent)] }),
        });
        const loc = start.headers.get("location");
        if (!loc) throw new Error("no upload location");
        // Streamed, not buffered: a video must not need its own size in memory. The upload URL is session-bound, so it needs no token.
        const up = await fetch(loc, { method: "PUT", headers: { "Content-Length": String(f.size), "Content-Type": f.mime }, body: f.size ? src.body : "", duplex: "half" });
        if (!up.ok) throw new Error(`upload -> ${up.status}`);
        const id = (await up.json()).id;
        record({ from: f.id, to: id, kind: "file", path: f.path });
        doneBytes += f.size;
        if (++done % 25 === 0) console.log(`  ${done} files copied (${gb(doneBytes)})…`);
        break;
      } catch (e) { err = e; await wait(2000 * a); }
      if (err) { const e = err; failed++; console.error(`  FAILED ${f.path}: ${e.message}${e.cause ? " (" + (e.cause.code ?? e.cause.message) + ")" : ""}`); }
    }
    console.log(`Copied ${done} files this run; ${failed} failed. Map ${MAP} has ${mapped.size} entries. Re-run to retry or to pick up new files.`);
    if (failed) return 1;
  }

  if (GO_LIVE) {
    if (!newRoot) throw new Error("No new root in the map: run --apply first.");
    const unmapped = [...folders, ...files].filter((x) => !mapped.has(x.id));
    if (unmapped.length) throw new Error(`${unmapped.length} item(s) in the old tree are not copied yet (first: ${unmapped[0].path}). Run --apply again, then --go-live straight after.`);
    const pairs = [...mapped].filter(([a, b]) => ID.test(a) && ID.test(b));
    const cols = await query(`select c.table_name t, c.column_name c from information_schema.columns c join information_schema.tables x using (table_schema, table_name)
      where c.table_schema='public' and x.table_type='BASE TABLE' and c.data_type='text' and c.column_name ~ 'drive_(file|folder)_id$' order by 1,2`);
    const m = `(values ${pairs.map(([a, b]) => `(${lit(a)},${lit(b)})`).join(",")}) as m(f,t)`;
    // ONE request: the remap, the new root and the flip land together or not at all, so no read sees the ids and the account out of step.
    const sql = `select set_config('app.deceased_lock_bypass','on',true);
      ${cols.map(({ t, c }) => `update public."${t}" x set "${c}" = m.t from ${m} where x."${c}" = m.f;`).join("\n")}
      update public.shelters set drive_root_folder_id = ${lit(newRoot)} where id = ${lit(row.id)};
      update public.shelter_drive_credentials set staged = false, updated_at = now() where shelter_id = ${lit(row.id)} and staged;`;
    await query(sql);
    const [after] = await query(`select c.staged, s.drive_root_folder_id = ${lit(newRoot)} as root_set from shelters s join shelter_drive_credentials c on c.shelter_id = s.id where s.id = ${lit(row.id)}`);
    console.log(`LIVE: ${cols.length} id columns remapped; staged=${after.staged}, root set=${after.root_set}. Now run check-drive-leftovers.mjs --map ${MAP} --env ${envName}.`);
    if (after.staged || !after.root_set) return 1;
  }
  return 0;
}

await exitWith(await main().catch((e) => { console.error(e.message); return 1; }));
