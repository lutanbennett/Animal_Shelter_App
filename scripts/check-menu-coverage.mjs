// Menu coverage, asked of CARDS: which pages can a login holding EXACTLY ONE card (and nothing else) reach without the left
// menu, and which pages can no card open at all? Read-only.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-menu-coverage.mjs [--card=<key>] [--lang=th]
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-menu-coverage.mjs --roles [--role=<key>]   (DEV only; transient context)
//
// Lutan, 2026-10-28: "All analysis must be against cards as Roles are just a transient grouping of cards." So the default
// answer is per card. A card's access is its bundle (bundleOfCards in src/lib/permissions/cards.ts, the same list
// set_role_cards() applies), taken ALONE: the strictest reading, and the one that finds every page no single card opens.
// A page is then in exactly one of four states:
//   reached alone   some single card opens it AND reaches it (a home tile, a group, the header/account menu, or a declared
//                   link from a page it reaches; scripts/lib/menu-coverage-declared.mjs, each link re-proved against its source)
//   needs two cards some card opens it but none reaches it alone (the tile lives under a card that is not the one holding the
//                   page). REPORTED, not hidden, and not called an orphan: a different answer.
//   no card opens   no card's bundle lets anyone but Admin open it. THE NUMBER THIS SCRIPT EXISTS TO PRINT.
// Exit 1 while any page is "needs two cards" or "no card opens" and not accepted. That is red on purpose: it goes green only
// when someone has looked at each one. It over-reports on purpose: a falsely clean list costs staff a page.
//
// --roles keeps the old per-role walk, because "what does this role reach today" is a live-database question. Its counts
// count a page once per role and are NOT a count of pages; do not quote them as a finding.
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
const { homeTilesFor } = await imp("src/lib/home/tiles.ts");
const { isCardKey, CARD_KEYS, bundleJson } = await imp("src/lib/permissions/cards.ts");
const { parsePermissions, can } = await imp("src/lib/permissions/can.ts");
const { ROUTES, canOpen, opensAnyIn } = await imp("src/lib/permissions/routes.ts");
const { CHROME, LANDINGS, DEEP, ACCEPTED } = await imp("scripts/lib/menu-coverage-declared.mjs");
const lang = process.argv.includes("--lang=th") ? "th" : "en";
const t = (await imp(`src/lib/i18n/dictionaries/${lang}.ts`)).default;
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const rolesMode = process.argv.includes("--roles");

const read = (f) => (existsSync(join(root, f)) ? readFileSync(join(root, f), "utf8") : "");
/** A declared link counts only while its source file still contains the proof. */
const proved = (f, needle) => read(f).includes(needle);

const landingFile = (p) => `src/app${p}/page.tsx`;
const landingChildren = (p) => [...read(landingFile(p)).matchAll(/href:\s*"(\/[^"]+)"/g)].map((m) => m[1]);
const stale = [];
for (const c of CHROME) if (!proved(c.file, c.needle)) stale.push(`chrome ${c.page}: "${c.needle}" not in ${c.file}`);
for (const d of DEEP) if (!proved(d.file, d.needle)) stale.push(`deep ${d.page}: "${d.needle}" not in ${d.file}`);

// Pages outside the registry that a login can open, with the test its own page applies (tiles.ts OUTSIDE_REGISTRY, NavLinks).
const OUTSIDE = [
  { path: "/residents", open: (p) => can(p, "resident.record", "read") },
  { path: "/my", open: (p) => can(p, "recurring.do_own") },
  { path: "/bills", open: (p) => can(p, "maintenance.bills") },
  { path: "/assistant", open: (p) => can(p, "assistant.ask") },
  { path: "/manual", open: (p) => can(p, "resident.record", "read") },
  { path: "/releases", open: (p) => can(p, "resident.record", "read") },
  { path: "/account/password", open: (p) => can(p, "resident.record", "read") },
];

/**
 * Every page `perms` may open and how each is reached without the menu. `held`/`groups` are what the home draws from.
 * Returns { label, all, how } where `how` has a key for every reachable page.
 */
function reach(perms, held, groups) {
  const label = new Map();
  for (const r of ROUTES) if (canOpen(perms, r)) label.set(r.path, r.label(t));
  for (const o of OUTSIDE) if (o.open(perms)) label.set(o.path, o.path);
  for (const [l, s] of [["/operations", "operations"], ["/management", "management"], ["/admin", "settings"]]) if (opensAnyIn(perms, s)) label.set(l, l);
  const pages = new Set(label.keys());
  const deepOpen = DEEP.filter((d) => pages.has(d.parent) && (!d.needs || can(perms, d.needs, d.level)));
  const deepPages = [...new Set(deepOpen.map((d) => d.page))];

  // Nothing redirects away from the home any more (2026-10-18): roles.home_path is not read.
  const drawn = homeTilesFor(perms, t, 0, { cards: held, groups });
  const entries = new Map(); // page -> how
  for (const x of drawn) {
    if (!x.inside) entries.set(x.href, "a tile on the home");
    // A card in a group is reachable through the group's tile; the group's page draws exactly these (cardTilesFor).
    for (const y of x.inside ?? []) if (!entries.has(y.href)) entries.set(y.href, `the "${x.label}" group on the home`);
  }
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
  return { label, all: [...pages, ...deepPages].sort(), how };
}

const accepted = (p, who) => ACCEPTED.find((a) => (a.role === "*" || a.role === who) && a.page === p && a.reason && a.acceptedBy);

if (!rolesMode) {
  // ---- Per card -------------------------------------------------------------------------------------------------------
  const only = arg("card");
  if (only && !isCardKey(only)) throw new Error(`--card=${only} is not a card key`);
  const universe = new Set([...ROUTES.map((r) => r.path), ...OUTSIDE.map((o) => o.path), ...LANDINGS, ...DEEP.map((d) => d.page)]);
  const opens = new Map(); // page -> cards that open it
  const reaches = new Map(); // page -> cards that open AND reach it alone
  const rows = [];
  for (const card of CARD_KEYS) {
    const cells = Object.fromEntries(bundleJson([card]).map((b) => [b.activity, b.level]));
    const perms = parsePermissions({ role: { key: `card:${card}`, name: card, name_th: null }, is_admin: false, permissions: cells });
    const { label, all, how } = reach(perms, [card], []);
    for (const p of all) {
      (opens.get(p) ?? opens.set(p, []).get(p)).push(card);
      if (how.has(p)) (reaches.get(p) ?? reaches.set(p, []).get(p)).push(card);
    }
    const orphans = all.filter((p) => !how.has(p));
    rows.push({ card, openable: all.length, reached: all.length - orphans.length, orphans: orphans.length });
    if (only === card) {
      console.log(`\n=== ${card} alone: ${all.length} pages openable, ${all.length - orphans.length} reachable without the menu`);
      for (const p of all) console.log(`    ${how.has(p) ? "ok      " : "NOT REACHED"} ${p.padEnd(34)} ${how.has(p) ? `via ${how.get(p)}` : label.get(p) ?? ""}`);
    }
  }
  if (only) { await exitWith(0); }

  const everyPage = [...new Set([...universe, ...opens.keys()])].sort();
  const reachedAlone = everyPage.filter((p) => reaches.has(p));
  const needsTwo = everyPage.filter((p) => opens.has(p) && !reaches.has(p));
  const noCard = everyPage.filter((p) => !opens.has(p));
  const open = (list) => list.filter((p) => !accepted(p, "*"));

  console.log(`--- Per card (${lang}): a login holding exactly that card and nothing else ---`);
  console.table(rows);
  console.log(`${CARD_KEYS.length} cards; ${rows.filter((r) => r.orphans > 0).length} of them open at least one page they cannot reach on their own (--card=<key> lists them).`);
  console.log(`\n--- Per page: ${everyPage.length} DISTINCT pages (registry + outside it + landings + drill-in pages) ---`);
  console.log(`  ${reachedAlone.length}  reached alone: some single card opens it and reaches it`);
  console.log(`  ${needsTwo.length}  need two cards: a card opens it, but none reaches it alone`);
  for (const p of needsTwo) console.log(`        ${accepted(p, "*") ? "ACCEPTED" : "TWO CARDS"} ${p.padEnd(34)} opened by: ${opens.get(p).join(", ")}`);
  console.log(`  ${noCard.length}  NO CARD OPENS (only Admin can): the figure Card review 2 is sized by`);
  for (const p of noCard) console.log(`        ${accepted(p, "*") ? "ACCEPTED" : "NO CARD  "} ${p.padEnd(34)} ${ROUTES.find((r) => r.path === p)?.activity ?? ""}`);
  if (stale.length) console.log("\nDeclared links whose proof is gone (ignored, so their pages show as not reached):\n  " + stale.join("\n  "));
  const bad = open(needsTwo).length + open(noCard).length;
  console.log(bad ? `\n${bad} page(s) that no single card both opens and reaches, unaccepted. Red on purpose until someone has looked at each.` : "\nEvery page is reached alone by some card, or accepted.");
  await exitWith(bad ? 1 : 0);
} else {
  // ---- Per role: TRANSIENT CONTEXT, not a finding ---------------------------------------------------------------------
  const { loadEnv, projectRef } = await imp("scripts/lib/env.mjs");
  const env = loadEnv("test");
  const ref = projectRef(env);
  if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
  const only = arg("role");
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
  const roles = await sql(`select id, key, name, kind, home_path from roles order by key`);
  const cards = await sql(`select r.key, c.card, c.position, c.group_id from role_cards c join roles r on r.id = c.role_id order by r.key, c.position`);
  const groupRows = await sql(`select r.key, g.id, g.name, g.icon from role_groups g join roles r on r.id = g.role_id order by r.key, g.position, g.name`);
  const cells = await sql(`select r.key, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id order by r.key, p.activity`);

  console.log("TRANSIENT CONTEXT: roles are groupings of cards that will be rebuilt. These counts count a page once per role and are not a count of pages.");
  let unexplained = 0;
  const summary = [];
  for (const role of roles) {
    if (role.key === "admin" || role.kind === "fixed") continue;
    if (only && role.key !== only) continue;
    // Disposable one-card logins the card walkthroughs leave on the shared dev database come and go while this runs.
    if (!only && /^(dev_signin_|dryrun_|harness_)/.test(role.key)) continue;
    const rc = cells.filter((c) => c.key === role.key);
    const held = cards.filter((c) => c.key === role.key).map((c) => c.card).filter(isCardKey);
    const perms = parsePermissions({
      role: { key: role.key, name: role.name, name_th: null, kind: role.kind, home_path: role.home_path },
      is_admin: false,
      permissions: Object.fromEntries(rc.map((c) => [c.activity, c.level])),
    });
    const rows = cards.filter((c) => c.key === role.key);
    const groups = groupRows.filter((g) => g.key === role.key).map((g) => ({ id: g.id, label: g.name, icon: g.icon, cards: rows.filter((c) => c.group_id === g.id).map((c) => c.card).filter(isCardKey) }));
    const { label, all, how } = reach(perms, held, groups);
    const orphans = all.filter((p) => !how.has(p));
    const bad = orphans.filter((p) => !accepted(p, role.key));
    unexplained += bad.length;

    const exercised = held.length > 0 ? `${held.length} cards` : "NO CARDS on dev: the derived/legacy home was tested, not a card home";
    console.log(`\n=== ${role.key} — ${exercised}`);
    console.log(`    ${all.length} pages openable, ${all.length - orphans.length} reachable without the menu, ${orphans.length} orphan(s)`);
    for (const p of all) {
      const via = how.get(p);
      if (via) console.log(`    ok       ${p.padEnd(34)} via ${via}`);
      else console.log(`    ${accepted(p, role.key) ? "ACCEPTED" : "ORPHAN  "} ${p.padEnd(34)} ${label.get(p) ?? ""}${accepted(p, role.key) ? ` — ${accepted(p, role.key).reason}` : ""}`);
    }
    summary.push({ role: role.key, exercised: held.length > 0 ? "cards" : "NO CARDS", total: all.length, orphans: orphans.length, unexplained: bad.length });
  }
  console.log("\n--- Summary (" + lang + ") ---");
  console.table(summary);
  if (stale.length) console.log("Declared links whose proof is gone (ignored, so their pages show as orphans):\n  " + stale.join("\n  "));
  console.log(unexplained ? `\n${unexplained} unexplained orphan(s): the menu cannot go yet.` : "\nNo unexplained orphans.");
  await exitWith(unexplained ? 1 : 0);
}
