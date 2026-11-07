#!/usr/bin/env node
// Sort the ONE shared Google Drive tree into per-environment buckets (Prod / UAT / Test roots) inside the
// SAME account (#rqv5c). Until now dev, test and production all wrote into one folder through one token, and
// 220 files were named by BOTH the production and the dev database, so a tester deleting a photo on test
// deleted the shelter's.
//
//   node scripts/drive-partition-tree.mjs --source <rootId> --prod <id> --test <id> [--uat <id>]
//        [--state <file>] [--map <file>] [--phase copy|move|all] [--ids-file <json>] [--apply]
//
// WHAT IT DOES (the only three Drive writes it can make: create a folder, copy a file, move by changing parents):
//   - A Drive move changes parents, NOT the file id, so production's ids keep working while files move.
//   - Each file goes to ONE bucket: named only by production (or a generated home-screen icon) -> Prod;
//     named only by dev -> Test; named by BOTH -> the original goes to Prod, a COPY goes to Test and test's
//     database is remapped onto it (drive-remap-ids.mjs, which this script's --map file feeds unchanged).
//     Named by NEITHER -> left exactly where it is and only counted.
//   - Folders: a folder named by production (or holding Prod-only files) has its HOME in Prod and is moved
//     there, keeping its id; one named only by dev is moved to Test; a folder named by both is moved to Prod
//     and a new same-named folder is made in Test (its pair goes in the map). Where a bucket needs a folder
//     it does not own (the 7 mixed folders), a new folder of the same name is made under that bucket's
//     counterpart of the parent. Folders holding only unreferenced files are left in place.
//   - UAT's root is accepted for the plan's sake but NOTHING is put in it: it is filled later as a copy of Prod.
//
// NEVER deletes, trashes or overwrites. There is no flag for it and no code path that calls one.
// DRY RUN BY DEFAULT: --apply is explicit. RESUMABLE: --state (jsonl) records every folder made and file
// copied, so a dead run continues; moves are idempotent (a file already in its target parent is skipped).
// --map is the file drive-remap-ids.mjs consumes: ONLY test-bucket pairs, so production ids are never remapped.
//
// ORDER (what a person sees if it dies at each step is in docs/decisions/2026-11-07-drive-buckets.md):
//   --phase copy   makes Test's folders and copies the shared files. Nothing existing changes at all.
//   (then drive-remap-ids.mjs --env test --map <map> --apply)
//   --phase move   moves originals. Every id survives a move, so neither database is ever broken.
// --ids-file replaces the database read with {"production":{"ids":[...]},"dev":{"ids":[...]}} (used to
// rehearse on a throwaway tree). Credentials are the app's own (loadEnv, default --env production).
import fs from "node:fs";
import { loadEnv, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(n);
  return i > -1 ? argv[i + 1] : d;
};
const APPLY = argv.includes("--apply");
const PHASE = arg("--phase", "all");
const envName = arg("--env", "production"); // credentials only; the database ids are read from production AND dev
const STATE = arg("--state", "drive-partition-state.jsonl");
const MAP = arg("--map", "drive-partition-map.test.jsonl");
const ROOTS = { prod: arg("--prod"), test: arg("--test"), uat: arg("--uat") };

const API = "https://www.googleapis.com/drive/v3";
const FOLDER = "application/vnd.google-apps.folder";
const SHORTCUT = "application/vnd.google-apps.shortcut";
const ICON_PREFIX = "/Home screen icons";
const BACKUPS_PREFIX = "/Admin/Backups";

const env = loadEnv(envName);
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
  if (!j.access_token) throw new Error(`token refresh failed: ${j.error ?? r.status}`);
  tokenCache = { value: j.access_token, at: Date.now() };
  return j.access_token;
}
async function call(path, init = {}, tries = 5) {
  for (let i = 1; ; i++) {
    const res = await fetch(`${API}${path}`, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${await token()}` } });
    if (res.ok) return res.json();
    if (i < tries && (res.status === 429 || res.status >= 500 || res.status === 403)) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
      continue;
    }
    throw new Error(`Drive ${init.method ?? "GET"} ${path.split("?")[0]} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
}
const JSONH = { "Content-Type": "application/json; charset=UTF-8" };
// The ONLY three writes this script can make.
const createFolder = (name, parent) => call("/files?fields=id", { method: "POST", headers: JSONH, body: JSON.stringify({ name, mimeType: FOLDER, parents: [parent] }) }).then((r) => r.id);
const copyFile = (id, name, parent) => call(`/files/${id}/copy?fields=id`, { method: "POST", headers: JSONH, body: JSON.stringify({ name, parents: [parent] }) }).then((r) => r.id);
const moveItem = (id, from, to) => call(`/files/${id}?addParents=${to}&removeParents=${from}&fields=id,parents`, { method: "PATCH", headers: JSONH, body: "{}" });

async function children(folderId) {
  const out = [];
  let pageToken = "";
  do {
    const p = new URLSearchParams({ q: `'${folderId}' in parents and trashed = false`, fields: "nextPageToken,files(id,name,mimeType,size)", pageSize: "1000", spaces: "drive" });
    if (pageToken) p.set("pageToken", pageToken);
    const j = await call(`/files?${p}`);
    out.push(...(j.files ?? []));
    pageToken = j.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

async function dbIds(name) {
  const e = loadEnv(name);
  const ref = projectRef(e);
  const query = async (sql) => {
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${e.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`${name} db: ${t.slice(0, 300)}`);
    return t ? JSON.parse(t) : [];
  };
  // SELECTs only. Same column discovery drive-remap-ids.mjs uses.
  const cols = await query(
    `select c.table_name t, c.column_name c from information_schema.columns c
       join information_schema.tables x using (table_schema, table_name)
      where c.table_schema='public' and x.table_type='BASE TABLE' and c.data_type in ('text','character varying')
        and c.column_name ~ 'drive_(file|folder)_id$' order by 1,2`,
  );
  const ids = new Set();
  for (const { t, c } of cols) for (const r of await query(`select distinct "${c}" as id from public."${t}" where "${c}" is not null and "${c}" <> ''`)) ids.add(r.id);
  return ids;
}

async function main() {
  if (!ROOTS.prod || !ROOTS.test) throw new Error("Pass --prod <folderId> and --test <folderId> (Lutan's folders; this script never creates a root).");
  const SOURCE = arg("--source", env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
  if (!SOURCE) throw new Error("No source: pass --source or set GOOGLE_DRIVE_ROOT_FOLDER_ID.");
  const rootIds = Object.values(ROOTS).filter(Boolean);
  if (new Set([...rootIds, SOURCE]).size !== rootIds.length + 1) throw new Error("The source and the bucket roots must all be different folders.");
  if (!["move", "copy", "all"].includes(PHASE)) throw new Error("--phase is copy, move or all.");

  // 1. Which ids does each database name?
  let P, D;
  const idsFile = arg("--ids-file");
  if (idsFile) {
    const j = JSON.parse(fs.readFileSync(idsFile, "utf8"));
    P = new Set(j.production.ids); D = new Set(j.dev.ids);
  } else {
    P = await dbIds("production"); D = await dbIds("test");
  }

  // 2. Walk the source tree (the bucket roots are skipped if they sit inside it).
  const nodes = new Map(); // id -> {id,name,folder,parent,path,size}
  const kids = new Map(); // folder id -> child ids
  let shortcuts = 0;
  nodes.set(SOURCE, { id: SOURCE, name: (await call(`/files/${SOURCE}?fields=name`)).name, folder: true, parent: null, path: "", size: 0 });
  async function walk(id) {
    kids.set(id, []);
    for (const c of await children(id)) {
      if (rootIds.includes(c.id)) continue;
      if (c.mimeType === SHORTCUT) { shortcuts++; continue; }
      const path = `${nodes.get(id).path}/${c.name}`;
      nodes.set(c.id, { id: c.id, name: c.name, folder: c.mimeType === FOLDER, parent: id, path, size: Number(c.size ?? 0) });
      kids.get(id).push(c.id);
      if (c.mimeType === FOLDER) await walk(c.id);
    }
  }
  await walk(SOURCE);

  // 3. Classify. File bucket: prod | test | shared | leave.  Folder home: prod | test | none.
  const fileBucket = (n) => {
    if (n.path.startsWith(ICON_PREFIX) || n.path.startsWith(BACKUPS_PREFIX)) return "prod"; // icons and Admin/Backups: Lutan, 2026-11-07
    const p = P.has(n.id), d = D.has(n.id);
    return p && d ? "shared" : p ? "prod" : d ? "test" : "leave";
  };
  const home = new Map(); // folder id -> prod|test|none
  const needs = new Map(); // folder id -> Set of buckets whose files live under it
  const fillNeeds = (id) => {
    const s = new Set();
    for (const k of kids.get(id) ?? []) {
      const n = nodes.get(k);
      if (n.folder) fillNeeds(k).forEach((b) => s.add(b));
      else { const b = fileBucket(n); if (b === "shared") { s.add("prod"); s.add("test"); } else if (b !== "leave") s.add(b); }
    }
    needs.set(id, s);
    return s;
  };
  fillNeeds(SOURCE);
  for (const n of nodes.values()) {
    if (!n.folder || n.id === SOURCE) continue;
    const p = P.has(n.id), d = D.has(n.id), s = needs.get(n.id);
    home.set(n.id, p ? "prod" : d ? "test" : s.has("prod") ? "prod" : s.has("test") ? "test" : "none");
  }
  // A folder is also "named by dev" if D has it: its test counterpart must be mapped so test's DB follows.

  // 4. Plan.
  const folderTarget = (id, bucket, plan) => {
    // counterpart of original folder `id` in `bucket`: a folder id, or a {create} placeholder key
    if (id === SOURCE) return ROOTS[bucket];
    if (home.get(id) === bucket) return id;
    return `new:${id}:${bucket}`;
  };
  const planFolders = []; // {id,bucket,kind:'move'|'create',parentKey}
  for (const n of nodes.values()) {
    if (!n.folder || n.id === SOURCE) continue;
    const h = home.get(n.id);
    if (h !== "none") planFolders.push({ id: n.id, bucket: h, kind: "move", parentKey: folderTarget(n.parent, h) });
    for (const b of needs.get(n.id)) {
      if (b === h) continue;
      planFolders.push({ id: n.id, bucket: b, kind: "create", parentKey: folderTarget(n.parent, b) });
    }
    // dev names a folder whose home is Prod: Test must get a counterpart even if no file needs it
    if (h === "prod" && D.has(n.id) && !needs.get(n.id).has("test")) planFolders.push({ id: n.id, bucket: "test", kind: "create", parentKey: folderTarget(n.parent, "test") });
  }
  const planFiles = [];
  const count = { prod: 0, test: 0, shared: 0, leave: 0 };
  let bytes = { prod: 0, test: 0, shared: 0, leave: 0 };
  for (const n of nodes.values()) {
    if (n.folder) continue;
    const b = fileBucket(n);
    count[b]++; bytes[b] += n.size;
    if (b === "leave") continue;
    if (b === "prod" || b === "shared") planFiles.push({ id: n.id, bucket: "prod", kind: "move", parentKey: folderTarget(n.parent, "prod"), n });
    if (b === "test") planFiles.push({ id: n.id, bucket: "test", kind: "move", parentKey: folderTarget(n.parent, "test"), n });
    if (b === "shared") planFiles.push({ id: n.id, bucket: "test", kind: "copy", parentKey: folderTarget(n.parent, "test"), n });
  }
  const mixed = [...nodes.values()].filter((n) => n.folder && n.id !== SOURCE && needs.get(n.id).size > 1);
  // An unreferenced file is never touched itself, but it travels with a folder that is moved (a folder keeps
  // its id only by being moved whole). Say which ones, so Lutan can match them to his review list.
  const rides = [...nodes.values()].filter((n) => {
    if (n.folder || fileBucket(n) !== "leave") return false;
    for (let p = n.parent; p && p !== SOURCE; p = nodes.get(p).parent) if (home.get(p) !== "none" && planFolders.some((x) => x.kind === "move" && x.id === p && x.parentKey !== nodes.get(p).parent)) return true;
    return false;
  });
  const mb = (x) => (x / 1048576).toFixed(1) + " MB";

  console.log(`Source "${nodes.get(SOURCE).name}" (${SOURCE}): ${[...nodes.values()].filter((n) => n.folder).length - 1} folders, ${[...nodes.values()].filter((n) => !n.folder).length} files` + (shortcuts ? `, ${shortcuts} shortcuts skipped` : ""));
  console.log(`Database ids: production ${P.size}, dev ${D.size}.`);
  console.log(`Files: prod-only ${count.prod} (${mb(bytes.prod)}), test-only ${count.test} (${mb(bytes.test)}), named by BOTH ${count.shared} (${mb(bytes.shared)}), named by neither ${count.leave} (${mb(bytes.leave)}).`);
  console.log(`Plan: Prod root ${ROOTS.prod} gets ${count.prod + count.shared} files; Test root ${ROOTS.test} gets ${count.test} moved + ${count.shared} copied; UAT root ${ROOTS.uat ?? "(not given)"} stays EMPTY on purpose.`);
  console.log(`      ${planFolders.filter((f) => f.kind === "move").length} folders moved, ${planFolders.filter((f) => f.kind === "create").length} folders created. ${count.leave} unreferenced files LEFT UNTOUCHED.`);
  console.log(`Folders holding files for more than one bucket: ${mixed.length}`);
  for (const m of mixed.slice(0, 20)) console.log(`  ${m.path}  [${[...needs.get(m.id)].join(", ")}]`);
  console.log(`Unreferenced files that change PATH only because their folder is moved whole (file itself untouched): ${rides.length}`);
  for (const r of rides.slice(0, 60)) console.log(`  ${r.path}`);
  const missing = (S) => [...S].filter((i) => !nodes.has(i)).length;
  console.log(`Ids a database names that are NOT in the tree (already gone, or outside it): production ${missing(P)}, dev ${missing(D)}.`);

  if (!APPLY) {
    console.log("DRY RUN: nothing was written to Drive. Add --apply (and --phase copy first, then remap, then --phase move).");
    return 0;
  }

  // 5. Apply. State file: made folders and copies, so a dead run resumes.
  const made = new Map(); // key -> id   (key: "new:<orig>:<bucket>" for folders, "copy:<orig>" for files)
  if (fs.existsSync(STATE)) for (const l of fs.readFileSync(STATE, "utf8").split(/\r?\n/).filter(Boolean)) { const m = JSON.parse(l); made.set(m.key, m.to); }
  const remember = (rec) => {
    made.set(rec.key, rec.to);
    fs.appendFileSync(STATE, JSON.stringify(rec) + "\n");
    // The remap map: test-bucket pairs only, in drive-remap-ids.mjs's own format, and only ids test's database names.
    if (rec.bucket === "test" && D.has(rec.from)) fs.appendFileSync(MAP, JSON.stringify({ from: rec.from, to: rec.to, kind: rec.kind, path: rec.path }) + "\n");
  };
  const resolve = (key) => (key.startsWith("new:") ? made.get(key) : key);
  let created = 0, copied = 0, moved = 0, failed = 0;

  if (PHASE !== "move") {
    // parents before children: nodes were walked depth-first, so a parent is always earlier in planFolders
    for (const f of planFolders.filter((x) => x.kind === "create")) {
      const key = `new:${f.id}:${f.bucket}`;
      if (made.has(key)) continue;
      const parent = resolve(f.parentKey);
      if (!parent) throw new Error(`No parent for ${nodes.get(f.id).path} in ${f.bucket}`);
      const to = await createFolder(nodes.get(f.id).name, parent);
      remember({ key, from: f.id, to, kind: "folder", bucket: f.bucket, path: nodes.get(f.id).path });
      created++;
    }
    for (const f of planFiles.filter((x) => x.kind === "copy")) {
      const key = `copy:${f.id}`;
      if (made.has(key)) continue;
      try {
        const to = await copyFile(f.id, f.n.name, resolve(f.parentKey));
        remember({ key, from: f.id, to, kind: "file", bucket: "test", path: f.n.path });
        if (++copied % 25 === 0) console.log(`  ${copied} copied…`);
      } catch (e) { failed++; console.error(`  FAILED copy ${f.n.path}: ${e.message}`); }
    }
  }
  if (PHASE !== "copy") {
    const moves = [...planFolders.filter((x) => x.kind === "move"), ...planFiles.filter((x) => x.kind === "move")];
    for (const m of moves) {
      const n = nodes.get(m.id);
      const to = resolve(m.parentKey);
      try {
        // Read where it is NOW so a re-run (or a parent that moved first) is a no-op, not a second move.
        const cur = (await call(`/files/${m.id}?fields=parents`)).parents ?? [];
        if (cur.includes(to)) continue;
        await moveItem(m.id, cur[0], to);
        moved++;
      } catch (e) { failed++; console.error(`  FAILED move ${n.path}: ${e.message}`); }
    }
  }
  console.log(`APPLIED (${PHASE}): ${created} folders created, ${copied} files copied, ${moved} items moved, ${failed} failed. State ${STATE}; map for the remap ${MAP}.`);
  if (failed) console.log("Re-run the same command to retry the failures.");
  return failed ? 1 : 0;
}

await exitWith(await main().catch((e) => { console.error(e.message); return 1; }));
