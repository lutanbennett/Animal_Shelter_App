// Refresh the shared "Home screen icons" Drive folder from the route registry.
// Claude runs this at each release (docs/release-procedure.md); nobody else needs to.
//
//   node scripts/sync-home-icons.mjs --local <dir>   draw the PNGs into <dir>, no Drive (a dry run)
//   node scripts/sync-home-icons.mjs                 upload to Drive under GOOGLE_DRIVE_ROOT_FOLDER_ID
//   node scripts/sync-home-icons.mjs --env production   (production's Drive values, as the other scripts)
//
// Every page in src/lib/permissions/routes.ts gets 8 files: dark and light, with and without the
// card's name, at 180 and 1024 px, in two subfolders ("With name", "Icon only"). A file that exists and is
// byte-identical (md5) is skipped, a changed one is replaced in place, so a re-run uploads nothing
// new and a run that died part-way simply resumes. Rate limits are retried with backoff. Files for a card that was removed are left
// alone (nothing is deleted from Drive). The drawing is src/lib/home-icons/svg.ts, the same code the
// Account page uses, rasterised here with sharp.
// See docs/decisions/2026-10-21-home-screen-icons.md.

import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { build } from "esbuild";
import sharp from "sharp";
import { google } from "googleapis";
import { loadEnv, parseEnvArg } from "./lib/env.mjs";

const root = process.cwd();
const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const localIdx = args.indexOf("--local");
const localDir = localIdx >= 0 ? resolve(args[localIdx + 1] ?? "") : null;
if (localIdx >= 0 && !args[localIdx + 1]) fail("--local needs a folder.");

// Bundled as CommonJS inside node_modules/.cache so react and lucide resolve from this project.
mkdirSync(join(root, "node_modules/.cache"), { recursive: true });
const outfile = join(root, "node_modules/.cache/home-icons-entry.cjs");
await build({
  entryPoints: [join(root, "src/lib/home-icons/script-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile,
  alias: { "@": join(root, "src") },
  external: ["react", "react-dom", "react-dom/server"],
  logLevel: "error",
});
const mod = createRequire(import.meta.url)(outfile);
const { catalogueEn, buildIconSvg, iconFileStem, HOME_ICONS_FOLDER } = mod;

const cards = catalogueEn();
const files = [];
for (const card of cards) {
  for (const showName of [true, false]) {
    for (const style of ["dark", "light"]) {
      for (const size of [180, 1024]) {
        const svg = buildIconSvg({ inner: card.inner, label: card.label, showName, style, size });
        const png = await sharp(Buffer.from(svg)).png().toBuffer();
        files.push({ folder: showName ? "With name" : "Icon only", name: `${iconFileStem(card.label)} ${style} ${size}.png`, png });
      }
    }
  }
}
console.log(`${cards.length} cards, ${files.length} images drawn.`);

if (localDir) {
  for (const f of files) {
    mkdirSync(join(localDir, f.folder), { recursive: true });
    writeFileSync(join(localDir, f.folder, f.name), f.png);
  }
  console.log(`Wrote them to ${localDir}. Nothing was sent to Drive.`);
  process.exit(0);
}

const env = loadEnv(envName);
for (const k of ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN", "GOOGLE_DRIVE_ROOT_FOLDER_ID"]) {
  if (!env[k]) fail(`${k} is not set for ${envName}.`);
}
const auth = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
auth.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth });

const FOLDER = "application/vnd.google-apps.folder";
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

// Drive answers 403 userRateLimitExceeded when asked too fast. That is a speed limit, NOT a broken
// login: the token is fine and a later retry works. Back off and retry; if it still fails, say so.
async function call(what, fn) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const status = e?.code ?? e?.response?.status;
      const reason = e?.errors?.[0]?.reason ?? e?.response?.data?.error?.errors?.[0]?.reason ?? "";
      const limited = /ratelimit/i.test(reason) || status === 429 || (status >= 500 && status < 600);
      if (!limited) {
        if (status === 401 || reason === "invalid_grant" || /invalid_grant/.test(String(e?.message))) {
          fail(`${what}: Drive refused the login (${status} ${reason || e.message}). THAT is an auth fault: check the Google refresh token.`);
        }
        throw e;
      }
      if (attempt >= 6) {
        fail(`${what}: Drive rate limit (${status} ${reason}) still active after ${attempt} retries. This is a SPEED LIMIT, not an auth fault; the login is fine. Wait a few minutes and re-run: files already up to date are skipped, so it resumes where it stopped.`);
      }
      const wait = Math.min(60000, 2000 * 2 ** attempt) + Math.random() * 500;
      console.log(`  rate limited on ${what}; waiting ${Math.round(wait / 1000)}s (retry ${attempt + 1}/6)`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function findFolder(parent, name) {
  const r = await call(`find folder ${name}`, () =>
    drive.files.list({
      q: `'${parent}' in parents and name = '${esc(name)}' and mimeType = '${FOLDER}' and trashed = false`,
      fields: "files(id)",
      orderBy: "createdTime",
    }),
  );
  return r.data.files?.[0]?.id ?? null;
}
async function folderIn(parent, name) {
  const found = await findFolder(parent, name);
  if (found) return found;
  const c = await call(`create folder ${name}`, () => drive.files.create({ requestBody: { name, mimeType: FOLDER, parents: [parent] }, fields: "id" }));
  return c.data.id;
}
// One listing per folder (not one lookup per file): name -> { id, md5 } of the oldest file with that name.
async function listPngs(parent) {
  const out = new Map();
  let pageToken;
  do {
    const r = await call("list folder", () =>
      drive.files.list({
        q: `'${parent}' in parents and mimeType != '${FOLDER}' and trashed = false`,
        fields: "nextPageToken, files(id, name, md5Checksum)",
        orderBy: "createdTime",
        pageSize: 1000,
        pageToken,
      }),
    );
    for (const f of r.data.files ?? []) if (!out.has(f.name)) out.set(f.name, { id: f.id, md5: f.md5Checksum });
    pageToken = r.data.nextPageToken;
  } while (pageToken);
  return out;
}

const { Readable } = await import("node:stream");
const { createHash } = await import("node:crypto");
const top = await folderIn(env.GOOGLE_DRIVE_ROOT_FOLDER_ID, HOME_ICONS_FOLDER);
const subs = new Map();
let created = 0, updated = 0, unchanged = 0;
for (const f of files) {
  if (!subs.has(f.folder)) {
    const id = await folderIn(top, f.folder);
    subs.set(f.folder, { id, existing: await listPngs(id) });
  }
  const { id: parent, existing } = subs.get(f.folder);
  const have = existing.get(f.name);
  const md5 = createHash("md5").update(f.png).digest("hex");
  if (have && have.md5 === md5) { unchanged++; continue; }
  const media = () => ({ mimeType: "image/png", body: Readable.from(f.png) });
  if (have) { await call(f.name, () => drive.files.update({ fileId: have.id, media: media() })); updated++; }
  else { await call(f.name, () => drive.files.create({ requestBody: { name: f.name, parents: [parent] }, media: media(), fields: "id" })); created++; }
  if ((created + updated) % 40 === 0) console.log(`  ${created + updated} uploaded so far`);
}
console.log(`Done: ${files.length} images checked against Drive → ${HOME_ICONS_FOLDER}: ${unchanged} unchanged, ${updated} updated, ${created} created.`);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
