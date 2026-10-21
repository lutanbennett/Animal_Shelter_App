// Refresh the shared "Home screen icons" Drive folder from the route registry.
// Claude runs this at each release (docs/release-procedure.md); nobody else needs to.
//
//   node scripts/sync-home-icons.mjs --local <dir>   draw the PNGs into <dir>, no Drive (a dry run)
//   node scripts/sync-home-icons.mjs                 upload to Drive under GOOGLE_DRIVE_ROOT_FOLDER_ID
//   node scripts/sync-home-icons.mjs --env production   (production's Drive values, as the other scripts)
//
// Every page in src/lib/permissions/routes.ts gets 8 files: dark and light, with and without the
// card's name, at 180 and 1024 px, in two subfolders ("With name", "Icon only"). A file that exists
// is replaced in place, so a re-run leaves no duplicates. Files for a card that was removed are left
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
async function findIn(parent, name, folder) {
  const r = await drive.files.list({
    q: `'${parent}' in parents and name = '${esc(name)}' and mimeType ${folder ? "=" : "!="} '${FOLDER}' and trashed = false`,
    fields: "files(id)",
    orderBy: "createdTime",
  });
  return r.data.files?.[0]?.id ?? null;
}
async function folderIn(parent, name) {
  const found = await findIn(parent, name, true);
  if (found) return found;
  const c = await drive.files.create({ requestBody: { name, mimeType: FOLDER, parents: [parent] }, fields: "id" });
  return c.data.id;
}

const { Readable } = await import("node:stream");
const top = await folderIn(env.GOOGLE_DRIVE_ROOT_FOLDER_ID, HOME_ICONS_FOLDER);
const subs = new Map();
let n = 0;
for (const f of files) {
  if (!subs.has(f.folder)) subs.set(f.folder, await folderIn(top, f.folder));
  const parent = subs.get(f.folder);
  const media = { mimeType: "image/png", body: Readable.from(f.png) };
  const existing = await findIn(parent, f.name, false);
  if (existing) await drive.files.update({ fileId: existing, media });
  else await drive.files.create({ requestBody: { name: f.name, parents: [parent] }, media, fields: "id" });
  if (++n % 40 === 0) console.log(`  ${n}/${files.length}`);
}
console.log(`Done: ${n} images in Drive → ${HOME_ICONS_FOLDER}.`);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
