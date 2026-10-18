// Menu coverage: which pages would become unreachable for each non-Admin role if NavPane went. Read-only, DEV only.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-menu-coverage.mjs [--role=<key>] [--lang=th]
//
// For each non-Admin role it takes every page the role may open (route registry + the pages outside it + the three
// landings), then asks whether each is reachable WITHOUT the left menu: from a tile on the role's home, from the
// header/account menu, or from a page that is reachable (declared in scripts/lib/menu-coverage-declared.mjs, each
// link re-proved against its source file on every run). Anything it cannot prove is an ORPHAN. It over-reports on
// purpose: a falsely clean list is the failure that costs staff a page. Exit 1 while any orphan is unexplained.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { register } from "node:module";
import { exitWith } from "./lib/exit.mjs";

const root = process.cwd();
const src = pathToFileURL(join(root, "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
        if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const imp = (p) => import(pathToFileURL(join(root, p)).href);
const { loadEnv, projectRef } = await imp("scripts/lib/env.mjs");
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { homeTilesFor } = await imp("src/lib/home/tiles.ts");
const { isCardKey } = await imp("src/lib/permissions/cards.ts");
const { parsePermissions, can } = await imp("src/lib/permissions/can.ts");
const { ROUTES, canOpen, opensAnyIn } = await imp("src/lib/permissions/routes.ts");
const { CHROME, LANDINGS, DEEP, ACCEPTED } = await imp("scripts/lib/menu-coverage-declared.mjs");
const lang = process.argv.includes("--lang=th") ? "th" : "en";
const t = (await imp(`src/lib/i18n/dictionaries/${lang}.ts`)).default;
const only = process.argv.find((a) => a.startsWith("--role="))?.slice(7);

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
}

const read = (f) => (existsSync(join(root, f)) ? readFileSync(join(root, f), "utf8") : "");
/** A declared link counts only while its source file still contains the proof. */
const proved = (f, needle) => read(f).includes(needle);

const landingFile = (p) => `src/app${p}/page.tsx`;
const landingChildren = (p) => [...read(landingFile(p)).matchAll(/href:\s*"(\/[^"]+)"/g)].map((m) => m[1]);
const stale = [];
for (const c of CHROME) if (!proved(c.file, c.needle)) stale.push(`chrome ${c.page}: "${c.needle}" not in ${c.file}`);
for (const d of DEEP) if (!proved(d.file, d.needle)) stale.push(`deep ${d.page}: "${d.needle}" not in ${d.file}`);

const roles = await sql(`select id, key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails from roles where archived_at is null order by key`);
const cards = await sql(`select r.key, c.card, c.position from role_cards c join roles r on r.id = c.role_id order by r.key, c.position`);
const cells = await sql(`select r.key, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id order by r.key, p.activity`);

// Pages outside the registry that a role can open, with the test its own page applies (tiles.ts OUTSIDE_REGISTRY, NavLinks).
const OUTSIDE = [
  { path: "/residents", open: (p) => p.role.opensApp },
  { path: "/my", open: (p) => can(p, "recurring.do_own") },
  { path: "/bills", open: (p) => can(p, "maintenance.bills") },
  { path: "/assistant", open: (p) => can(p, "assistant.ask") },
  { path: "/manual", open: (p) => p.role.opensApp },
  { path: "/releases", open: (p) => p.role.opensApp },
  { path: "/account/password", open: (p) => p.role.opensApp },
];

let unexplained = 0;
const summary = [];
for (const role of roles) {
  if (role.key === "admin" || !role.opens_app) continue;
  if (only && role.key !== only) continue;
  const rc = cells.filter((c) => c.key === role.key);
  const held = cards.filter((c) => c.key === role.key).map((c) => c.card).filter(isCardKey);
  const perms = parsePermissions({
    role: { key: role.key, name: role.name, name_th: null, kind: role.kind, opens_app: role.opens_app, home_path: role.home_path },
    is_admin: false,
    scopes: { residents: role.scope_residents, clinical: role.scope_clinical, contacts: role.scope_contacts, photos: role.scope_photos, sees_login_emails: role.sees_login_emails },
    permissions: Object.fromEntries(rc.map((c) => [c.activity, c.level])),
  });

  // Every page the role may open.
  const label = new Map();
  for (const r of ROUTES) if (canOpen(perms, r)) label.set(r.path, r.label(t));
  for (const o of OUTSIDE) if (o.open(perms)) label.set(o.path, o.path);
  for (const [l, s] of [["/operations", "operations"], ["/management", "management"], ["/admin", "settings"]]) if (opensAnyIn(perms, s)) label.set(l, l);
  const pages = new Set(label.keys());
  const deepOpen = DEEP.filter((d) => pages.has(d.parent) && (!d.needs || can(perms, d.needs, d.level)));
  const deepPages = [...new Set(deepOpen.map((d) => d.page))];

  // How the role gets in: its home tiles. Nothing redirects away from the home any more (2026-10-18): roles.home_path
  // is not read, and a clinic login lands on its tiles like everyone else, not on /appointments.
  const tiles = homeTilesFor(perms, t, 0, held).map((x) => x.href);
  const entries = new Map(); // page -> how
  for (const h of tiles) entries.set(h, "a tile on the home");
  for (const c of CHROME) if (proved(c.file, c.needle) && (!c.needs || can(perms, c.needs))) entries.set(c.page, c.what);

  // Spread: landings read their own tile lists, deep pages hang off a parent. Repeat to a fixed point.
  const how = new Map(entries);
  for (let changed = true; changed; ) {
    changed = false;
    for (const [page, via] of [...how]) {
      const kids = LANDINGS.includes(page) ? landingChildren(page).map((k) => [k, `the ${page} page`]) : [];
      for (const [k, v] of kids) if (!how.has(k)) { how.set(k, `${v} (reached from ${page}, ${via})`); changed = true; }
      for (const d of deepOpen) if (d.parent === page && proved(d.file, d.needle) && !how.has(d.page)) { how.set(d.page, `${page} (${via})`); changed = true; }
    }
  }

  // A home that redirects to a page the role cannot open is a broken landing, whatever the menu does.
  const broken = redirect && !pages.has(redirect) ? redirect : null;
  if (broken) unexplained++;
  const accepted = (p) => ACCEPTED.find((a) => (a.role === "*" || a.role === role.key) && a.page === p && a.reason && a.acceptedBy);
  const all = [...pages, ...deepPages].sort();
  const orphans = all.filter((p) => !how.has(p));
  const bad = orphans.filter((p) => !accepted(p));
  unexplained += bad.length;

  const exercised = held.length > 0 ? `${held.length} cards` : "NO CARDS on dev: the derived/legacy home was tested, not a card home";
  console.log(`\n=== ${role.key} — ${exercised}${redirect ? `; home redirects to ${redirect} (tiles are not shown)` : ""}`);
  if (broken) console.log(`    BROKEN HOME: signing in sends this role to ${broken}, which its cells do not let it open`);
  console.log(`    ${all.length} pages openable, ${all.length - orphans.length} reachable without the menu, ${orphans.length} orphan(s)`);
  for (const p of all) {
    const via = how.get(p);
    if (via) console.log(`    ok       ${p.padEnd(34)} via ${via}`);
    else console.log(`    ${accepted(p) ? "ACCEPTED" : "ORPHAN  "} ${p.padEnd(34)} ${label.get(p) ?? ""}${accepted(p) ? ` — ${accepted(p).reason}` : ""}`);
  }
  summary.push({ role: role.key, exercised: held.length > 0 ? "cards" : "NO CARDS", total: all.length, orphans: orphans.length, unexplained: bad.length });
}

console.log("\n--- Summary (" + lang + ") ---");
console.table(summary);
if (stale.length) console.log("Declared links whose proof is gone (ignored, so their pages show as orphans):\n  " + stale.join("\n  "));
const noCards = summary.filter((s) => s.exercised === "NO CARDS").map((s) => s.role);
if (noCards.length) console.log(`Roles with no cards on dev (their result says little about card homes): ${noCards.join(", ")}`);
console.log(unexplained ? `\n${unexplained} unexplained orphan(s): the menu cannot go yet.` : "\nNo unexplained orphans.");
await exitWith(unexplained ? 1 : 0);
