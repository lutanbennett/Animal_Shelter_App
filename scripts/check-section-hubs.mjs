// Section hubs name every page of their section. Read-only, no server, no database.
//
//   node scripts/check-section-hubs.mjs
//
// Why: Admin holds no cards (CLAUDE.md, settled), so Admin's home draws no card tiles, and its only way to a page is the sidebar's
// Operations / Management / Settings links, which open hub pages whose tiles are literal href entries typed by hand. A page built
// with a card and a registry entry but no hub tile works for the card holder and is invisible to Admin, and nothing failed
// (#fc7te, 2026-11-14: nine pages). check-menu-coverage.mjs asks what ONE CARD reaches and skips Admin, so this is the Admin question.
// Every registry route whose section is operations, management or settings (src/lib/permissions/routes.ts, sectionOf) must have
// href: "<path>" in that section's hub page, unless it is dynamic ([param]) or listed in ACCEPTED below with a reason.
import { readFileSync } from "node:fs";
import { exitWith } from "./lib/exit.mjs";

const HUBS = { operations: "src/app/operations/page.tsx", management: "src/app/management/page.tsx", settings: "src/app/admin/page.tsx" };
// path -> why it is not a hub tile. A reason is required.
const ACCEPTED = {
  "/admin/who-does-what": "the Management hub opens it through WHO_DOES_WHAT_PATH, the constant, not a literal href",
};
const read = (f) => readFileSync(f, "utf8").split("\r\n").join("\n");
const text = read("src/lib/permissions/routes.ts");
const start = text.indexOf("export const ROUTES");
const end = text.indexOf("\n];", start);
const body = text.slice(start, end);
const blocks = body.split(/\n  \{\n/).slice(1);
const sectionOf = (path, explicit) => explicit ?? (path.startsWith("/operations/") ? "operations" : path.startsWith("/management/") ? "management" : path.startsWith("/admin/") ? "settings" : undefined);
const hubs = Object.fromEntries(Object.entries(HUBS).map(([k, f]) => [k, read(f)]));
const missing = [];
let n = 0;
for (const b of blocks) {
  const path = /\n    path: "([^"]+)"/.exec("\n" + b)?.[1];
  if (!path || path.includes("[")) continue;
  const sec = sectionOf(path, /\n    section: "(\w+)"/.exec("\n" + b)?.[1]);
  if (!sec) continue;
  n++;
  if (!hubs[sec].includes(`href: "${path}"`) && !ACCEPTED[path]) missing.push(`${path}  (${sec})`);
}
console.log(`${n} registry routes carry a section; ${missing.length} not named by their hub page.`);
for (const m of missing) console.log("  NOT IN HUB  " + m);
console.log(missing.length ? "\nAdd a tile gated by canOpen(perms, routeFor(path)), or accept it in ACCEPTED with a reason." : "Every sectioned route is reachable from its hub.");
await exitWith(missing.length ? 1 : 0);
