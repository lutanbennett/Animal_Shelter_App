// The permission catalogue (src/lib/permissions/) against the database's
// idea of it, and against everything that names an activity. Part of
// `npm run lint`, so a mistyped key is a build failure and never a silent
// "no" (or worse, a silent "yes").
//
//   node scripts/check-permission-catalogue.mjs
//
// No database, no env: the database side is read from the migrations that
// seed permission_activities and role_permissions (0132 today), which is what
// dev and production run once applied. It checks
//   A  catalogue.ts and the seeded permission_activities are the same set, with
//      the same kind, area and sort, and no prerequisites on either side
//   B  every activity key written in the app (can(), requirePermission(), the
//      route registry) or in a migration (has_permission()) is in the catalogue
//   C  can() fails closed: no permissions, an unknown key, a bad level, a
//      missing cell; Admin yes for every known key; a read cell is not edit
//   D  stock, the pattern area: every role's answer for stock.count and
//      stock.delivery from the seeded cells equals what the predicates it
//      replaced (canStocktake, canRecordDelivery) said; recurring-job
//      eligibility holds no role list of its own (it asks role_can(), 0133)
//      and every cell it asks about is in the catalogue
//   E  the route registry: unique paths, a level only where the activity has
//      one, and every entry's page file guards with the same activity
//   F  every other page.tsx under src/app (layer 3 of §11 for the pages outside
//      the registry): each is in exactly one of three buckets, the registry (E),
//      PINNED (its guard, word for word, and every can() decision in its body),
//      or EXEMPT (no permission, with the reason why none is needed). A page in
//      none of them fails, so a new page cannot ship unpinned.
//      docs/decisions/2026-10-10-parity-layer-3-pages-outside-the-registry.md
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { register } from "node:module";

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
const { ACTIVITIES, isActivityKey } = await imp("src/lib/permissions/catalogue.ts");
const { can, parsePermissions } = await imp("src/lib/permissions/can.ts");
const { ROUTES } = await imp("src/lib/permissions/routes.ts");
const { JOB_NEEDS } = await imp("src/lib/recurring-jobs/eligibility.ts");
const { isPublicPath } = await imp("src/lib/public-paths.ts");

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};

// ---- the database side, from the migrations ----
const migDir = join(root, "supabase/migrations");
const migrations = readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort();
const seeded = new Map(); // key -> { kind, area, sort }
const seededCells = []; // [role, activity, level]; a cell seeded for 'vet' is the doctor's (0172 renamed the key)
for (const f of migrations) {
  const sql = readFileSync(join(migDir, f), "utf8");
  if (!/permission_activities|role_permissions/.test(sql)) continue;
  for (const m of sql.matchAll(/\('([a-z_]+\.[a-z_]+)', '(level|yesno)', '([a-z]+)', (\d+)\)/g)) {
    seeded.set(m[1], { kind: m[2], area: m[3], sort: Number(m[4]) });
  }
  for (const m of sql.matchAll(/\('([a-z_]+)', '([a-z_]+\.[a-z_]+)', ([12])\)/g)) {
    seededCells.push([m[1] === "vet" ? "doctor" : m[1], m[2], Number(m[3])]);
  }
}

// ---- A ----
const fileKeys = ACTIVITIES.map((a) => a.key);
eq("A keys: no duplicates in the file", new Set(fileKeys).size, fileKeys.length);
eq("A sort: unique", new Set(ACTIVITIES.map((a) => a.sort)).size, ACTIVITIES.length);
eq("A the file and permission_activities are the same set", [...fileKeys].sort(), [...seeded.keys()].sort());
for (const a of ACTIVITIES) {
  const s = seeded.get(a.key);
  if (!s) continue;
  eq(`A ${a.key} kind, area, sort`, [a.kind, a.area, a.sort], [s.kind, s.area, s.sort]);
}
eq("A no prerequisites stated (permission_activities.requires is empty in 0132)", ACTIVITIES.filter((a) => a.requires.length).map((a) => a.key), []);

// ---- B ----
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : [],
  );
const used = []; // [where, key]
for (const f of walk(join(root, "src"))) {
  const text = readFileSync(f, "utf8");
  const rel = f.slice(root.length + 1).replaceAll("\\", "/");
  for (const m of text.matchAll(/\bcan\((?:[^()"]|\([^()]*\))*?,\s*"([a-z_]+\.[a-z_]+)"/g)) used.push([rel, m[1]]);
  for (const m of text.matchAll(/\brequirePermission\(\s*"([^"]+)"/g)) used.push([rel, m[1]]);
  for (const m of text.matchAll(/\bactivity:\s*"([^"]+)"/g)) used.push([rel, m[1]]);
}
for (const f of migrations) {
  const sql = readFileSync(join(migDir, f), "utf8");
  for (const m of sql.matchAll(/\bhas_permission\(\s*'([^']+)'/g)) used.push([f, m[1]]);
}
const unknown = used.filter(([, k]) => !isActivityKey(k));
eq(`B every activity key written in the app or a migration exists (${used.length} found)`, unknown, []);

// ---- C ----
const cells = (o) => o;
const person = (cs, isAdmin = false) =>
  parsePermissions({
    role: { key: "x", name: "X" },
    is_admin: isAdmin,
    scopes: {},
    permissions: cells(cs),
  });
eq("C signed out (null) is no", can(null, "stock.count"), false);
eq("C undefined is no", can(undefined, "stock.count"), false);
eq("C no cell is no", can(person({}), "stock.count"), false);
eq("C a cell is yes", can(person({ "stock.count": 2 }), "stock.count"), true);
eq("C a read cell reads", can(person({ "medical.weight": 1 }), "medical.weight", "read"), true);
eq("C a read cell does not edit", can(person({ "medical.weight": 1 }), "medical.weight"), false);
eq("C an edit cell reads (edit includes read)", can(person({ "medical.weight": 2 }), "medical.weight", "read"), true);
eq("C an unknown key is no, even for Admin", can(person({}, true), "stock.cuont"), false);
eq("C a cell for an unknown key is dropped", can(person({ "stock.cuont": 2 }), "stock.cuont"), false);
eq("C a mistyped level is no", can(person({ "medical.weight": 2 }), "medical.weight", "raed"), false);
eq("C a malformed cell value is dropped", [can(person({ "stock.count": 3 }), "stock.count"), can(person({ "stock.count": "2" }), "stock.count")], [false, false]);
eq("C Admin is yes with no cells", can(person({}, true), "stock.delivery"), true);
eq("C parsePermissions(null) is null", parsePermissions(null), null);
eq("C parsePermissions(garbage) is null", [parsePermissions("x"), parsePermissions({}), parsePermissions({ role: {} })], [null, null, null]);

// ---- D ----
const ROLES = ["admin", "management", "staff", "doctor", "volunteer", "public_viewer"];
const forRole = (role) =>
  person(
    Object.fromEntries(seededCells.filter(([r]) => r === role).map(([, a, l]) => [a, l])),
    role === "admin", // Admin has no rows: a rule, not data
  );
// Truth tables of the predicates this PR deleted (STOCKTAKE_ROLES, DELIVERY_ROLES),
// in ROLES order, then a null role.
const LEGACY_COUNT = [true, true, true, false, true, false];
const LEGACY_DELIVERY = [true, true, true, false, false, false];
eq("D stock.count: each role as canStocktake said", ROLES.map((r) => can(forRole(r), "stock.count")), LEGACY_COUNT);
eq("D stock.delivery: each role as canRecordDelivery said", ROLES.map((r) => can(forRole(r), "stock.delivery")), LEGACY_DELIVERY);
eq("D no role at all: no to both", [can(null, "stock.count"), can(null, "stock.delivery")], [false, false]);
eq("D eligibility asks only about catalogue activities", JOB_NEEDS.filter((n) => !isActivityKey(n.activity)).map((n) => n.activity), []);
eq("D eligibility asks about both stock pages", ["stock.count", "stock.delivery"].filter((a) => !JOB_NEEDS.some((n) => n.activity === a)), []);

// ---- E ----
eq("E route paths are unique", new Set(ROUTES.map((r) => r.path)).size, ROUTES.length);
for (const r of ROUTES) {
  const def = ACTIVITIES.find((a) => a.key === r.activity);
  eq(`E ${r.path} names a catalogue activity`, !!def, true);
  if (def?.kind === "yesno") eq(`E ${r.path} gives no level for a yes/no activity`, r.level, undefined);
  const page = join(root, "src/app", r.path, "page.tsx");
  const exists = existsSync(page);
  eq(`E ${r.path} has a page.tsx`, exists, true);
  if (!exists) continue;
  const text = readFileSync(page, "utf8");
  const level = r.level ? `,\\s*"${r.level}"` : "";
  eq(
    `E ${r.path} guards with requirePermission("${r.activity}")`,
    new RegExp(`requirePermission\\(\\s*"${r.activity.replace(".", "\\.")}"${level}\\s*\\)`).test(text),
    true,
  );
}

// ---- F ----
// Layer 3 for the pages E does not reach. Three buckets, and every page.tsx is in exactly one.
//
// PINNED: the page's guards, written exactly as the page writes them (whitespace aside), and the
// can() decisions in its body as "activity" or "activity:read" (`in` names a shared component
// that holds them instead). The guards are the *whole* set: requirePermission, requireFullResident,
// requireAnyPageIn, requireAdminUser, requireRole and any `if (…) refuseFor(…)`. A changed key or
// level, a guard added or dropped, or a can() that appears or changes, fails until this list says
// so. Each was read against what the page does, not copied from it: a page that writes is pinned
// at Edit. Where it is not, the entry carries `known` (what the page says today and the backlog
// item that fixes it): printed every run, not a failure, and a failure the day the page is fixed
// (STALE), so the list cannot defend the bug.
//
// What a `decides` pin proves is that the call is there with that key: not what it gates. That
// the edit page's form only renders when can(perms, "resident.record") is true is still read by a
// person (the decision file lists every one).
const FULL = "requireFullResident()";
const PINNED = {
  // Add and edit pages under a registered list. Every one writes, so every one is at Edit.
  "/residents/new": { guards: ['requirePermission("resident.register")'], decides: [] },
  "/weight/new": { guards: ['requirePermission("medical.weight")'], decides: [] },
  "/weight/[id]/edit": {
    guards: ['requirePermission("medical.weight")'],
    decides: [],
  },
  "/prescriptions/new": { guards: ['requirePermission("medical.prescriptions")'], decides: [] },
  "/prescriptions/[id]/edit": {
    guards: ['requirePermission("medical.prescriptions")'],
    decides: [],
  },
  "/procedures/new": { guards: ['requirePermission("medical.procedures")'], decides: ["resident.microchip"] },
  "/blood-tests/new": { guards: ['requirePermission("medical.blood_tests")'], decides: [] },
  "/immunizations/new": { guards: ['requirePermission("medical.immunizations")'], decides: [] },
  "/diets/new": { guards: ['requirePermission("medical.diet")'], decides: [] },
  "/diets/[id]/edit": {
    guards: ['requirePermission("medical.diet")'],
    decides: [],
  },
  "/clinic-visits/new": { guards: ['requirePermission("medical.visits")'], decides: [] },
  "/clinic-visits/[id]/edit": {
    guards: ['requirePermission("medical.visits")'],
    decides: ["resident.microchip"],
  },
  "/outreach/new": { guards: ['requirePermission("community.outings")'], decides: [] },
  "/outreach/[id]/edit": { guards: ['requirePermission("community.outings")'], decides: [] },
  "/management/donations/new": { guards: ['requirePermission("donation.receipt")'], decides: [] },
  "/management/shelter-friends/new": { guards: ['requirePermission("friends.manage")'], decides: [] },
  "/management/cashflow/fixed-outgoings": { guards: ['requirePermission("reports.cashflow")'], decides: [] },
  "/management/clinics/[id]/doctors": { guards: ['requirePermission("clinics.doctors")'], decides: [] },
  // Maintenance opens its add and edit pages at Read on purpose and shows a reader "read only"
  // instead of the form: the form is behind the body's can(perms, "maintenance.jobs") (Edit).
  "/maintenance/new": { guards: ['requirePermission("maintenance.jobs", "read")'], decides: ["maintenance.jobs"] },
  "/maintenance/[id]/edit": { guards: ['requirePermission("maintenance.jobs", "read")'], decides: ["maintenance.jobs"] },
  // Detail pages: they open at the list's own level, and every control that writes asks can().
  "/maintenance/[id]": { guards: ['requirePermission("maintenance.jobs", "read")'], decides: ["maintenance.jobs", "translations.manage"] },
  "/clinics/[id]": { guards: ['requirePermission("clinics.list", "read")'], decides: ["clinics.list", "medical.visits:read"] },
  "/contacts/[id]": { guards: ['requirePermission("contacts.browse")'], decides: ["contacts.directory", "friends.manage"] },
  "/enclosures/[id]": { guards: ['requirePermission("facility.enclosures", "read")'], decides: ["facility.enclosures", "maintenance.jobs"] },
  "/projects/[id]": { guards: ['requirePermission("projects.folders", "read")'], decides: ["projects.folders", "translations.manage"] },
  // A donation's own page is the receipt: issuing it is the yes/no activity, and nothing else.
  "/management/donations/[id]": { guards: ['requirePermission("donation.receipt")'], decides: [] },

  // The resident's own pages. requireFullResident() is resident.record at Read plus "not a
  // who-and-where login" (0134); the decision that matters, may this person do the thing, is the
  // body's can(), which the page asks before it renders the form.
  // The record hub: a who-and-where login is redirected to /r/ before this guard (redirect() is not
  // a guard, so it is not listed), and every control on it that writes asks can().
  "/residents/[id]": { guards: [FULL], decides: ["placement.death", "placement.death_withdraw", "translations.manage", "resident.microchip", "resident.adoption_news"] },
  "/residents/[id]/edit": { guards: [FULL], decides: ["resident.record"] },
  "/residents/[id]/move": { guards: [FULL], decides: ["placement.move"] },
  "/residents/[id]/hospital": { guards: [FULL], decides: ["placement.hospital"] },
  "/residents/[id]/hospital/return": { guards: [FULL], decides: ["placement.hospital"] },
  "/residents/[id]/rehome": { guards: [FULL], decides: ["placement.rehome"] },
  "/residents/[id]/rehome/return": { guards: [FULL], decides: ["placement.rehome"] },
  "/residents/[id]/deceased": { guards: [FULL], decides: ["placement.death"] },
  "/residents/[id]/deceased/undo": { guards: [FULL], decides: ["placement.death_withdraw"] },
  "/residents/[id]/adoption-updates/new": {
    guards: [FULL],
    decides: ["resident.adoption_news"],
    in: "src/app/residents/[id]/adoption-updates/AdoptionUpdatePage.tsx",
  },
  "/residents/[id]/adoption-updates/[updateId]/edit": {
    guards: [FULL],
    decides: ["resident.adoption_news"],
    in: "src/app/residents/[id]/adoption-updates/AdoptionUpdatePage.tsx",
  },
  // A record tab: the tab's own medical activity at Read, from the page's SECTION_READS (pinned
  // below), on top of the record. Its writes are per row, on the tab's add/edit pages above.
  "/residents/[id]/[section]": {
    guards: ["requireFullResident(SECTION_READS[section])"],
    decides: ["medical.archive", "resident.adoption_news", "resident.microchip"],
    table: {
      name: "SECTION_READS",
      want: {
        immunizations: "medical.immunizations",
        "clinic-visits": "medical.visits",
        prescriptions: "medical.prescriptions",
        diet: "medical.diet",
        weight: "medical.weight",
        procedures: "medical.procedures",
        "blood-tests": "medical.blood_tests",
      },
    },
  },

  // The three landings: a grid of the registry's own pages, open to whoever opens one of them.
  "/admin": { guards: ['requireAnyPageIn("settings")'], decides: ["system.status"] },
  "/management": { guards: ['requireAnyPageIn("management")'], decides: [] },
  "/operations": { guards: ['requireAnyPageIn("operations")'], decides: [] },

  // Admin rules, not activities (§6: a power only one role holds is not a cell): who signs in,
  // the role-draft comparison sheet, and seeing another role's home screen.
  "/admin/security": { guards: ["requireAdminUser()"], decides: [] },
  "/admin/security/verify": { guards: ["requireAdminUser()"], decides: [] },
  "/admin/role-draft": { guards: ["if (!mine?.isAdmin) refuseFor(mine)"], decides: [] },
  "/home/[role]": { guards: ["if (!mine?.isAdmin) refuseFor(mine)"], decides: [] },
};

// EXEMPT: no permission guard, and the reason none is needed. `public: true` is also checked
// against src/lib/public-paths.ts, the list the proxy lets through signed out. Every other path
// is behind the proxy's gate (src/lib/supabase/proxy.ts): signed in, and a role that opens the
// app, before the page runs. A reason that only says "hub" or "public" is not a reason.
const APP = "Behind the proxy's gate (signed in, a role that opens the app).";
const EXEMPT = {
  "/": { public: true, why: "The public home page. Reads the session only to choose the header; shows nothing from the app." },
  "/login": { public: true, why: "Sign-in. There is no one to ask a permission of yet." },
  "/login/forgot": { public: true, why: "Password reset request: sign-in's own page." },
  "/login/request": { public: true, why: "Asking for an account: sign-in's own page." },
  "/privacy": { public: true, why: "Static privacy notice; Google's consent screen links to it." },
  "/adopt": { public: true, why: "Public website: reads public_resident_profiles, the anonymous tier (§6)." },
  "/adopt/[id]": { public: true, why: "Public website: one public_resident_profiles row." },
  "/adopt/international": { public: true, why: "Public website: static page from site_content." },
  "/our-work": { public: true, why: "Public website: the public_projects views (0042)." },
  "/our-work/[id]": { public: true, why: "Public website: one public_projects row." },
  "/foster": { public: true, why: "Public website: a site_pages page (SitePageView), the same text for every visitor, signed in or not." },
  "/volunteer": { public: true, why: "Public website: a site_pages page (SitePageView), the same text for every visitor, signed in or not." },
  "/donate": { public: true, why: "Public website: a site_pages page (SitePageView), the same text for every visitor, signed in or not." },
  "/friends": { public: true, why: "Public website: public_shelter_friends (0076)." },
  "/friends/join": { public: true, why: "Public website: a site_pages page (SitePageView), the same text for every visitor, signed in or not." },
  "/r/[code]": {
    public: true,
    why: "A resident's RFID card: the public card (public_resident_cards) for anyone; a signed-in reader is sent on to the record, by the body's can().",
    decides: ["resident.record:read"],
  },
  "/e/[id]": {
    public: true,
    why: "An enclosure's QR code: the public enclosure (public_enclosures) for anyone; a reader of enclosures is sent on to /enclosures/[id] (whose guard E pins).",
    decides: ["facility.enclosures:read"],
  },
  "/no-access": { why: `The refusal page every guard sends to. It must open for a person with no permission, or a refusal loops. ${APP}` },
  "/account/password": { why: `Changing your own password: every signed-in login must be able to, and the proxy sends one on a temporary password nowhere else. Asks only for a user.` },
  "/home": { why: `The dispatcher every app role lands on: sends each to its configured home, or shows the tiles homeTilesFor(perms) derives from the registry, so every tile is a page E pins. Refuses a role that does not open the app. ${APP}` },
  "/my": {
    why: `A person's own task list; each list in it is loaded only behind can() for its activity, so the page shows nothing a role may not see. ${APP}`,
    decides: ["maintenance.jobs:read", "maintenance.jobs", "recurring.manage"],
  },
  "/manual": { why: `The user manual: text for every app role; the body greys the topics that are not the reader's but hides none. ${APP}` },
  "/releases": { why: `What changed in each release, for every app role. The environment line is behind can(system.status). ${APP}`, decides: ["system.status"] },
  "/assistant": {
    why: `The assistant: a role without assistant.ask gets the "can't use" note and nothing is loaded (the body's can()). ${APP}`,
    decides: ["assistant.ask"],
  },
  "/management/medication-list": { why: "Not a page any more: a redirect to /operations/medication-list (which E pins), kept for old links. Renders nothing." },
  "/residents": {
    why: `The residents list, which every app role reads at least as who-and-where (§5, 0134): the page reads resident_who_and_where for that login and resident_list_view otherwise, and RLS decides the rows. Registering from a chip search is behind can(resident.register). ${APP}`,
    decides: ["resident.register"],
  },
};

const appDir = join(root, "src/app");
const pages = walk(appDir)
  .filter((f) => /[\\/]page\.tsx$/.test(f))
  .map((f) => {
    const dir = f.slice(appDir.length, -"page.tsx".length).replaceAll("\\", "/").replace(/\/$/, "");
    // A route group "(x)" is not part of the address.
    return { file: f, path: dir.split("/").filter((s) => !/^\(.*\)$/.test(s)).join("/") || "/" };
  });
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const norm = (s) => s.replace(/\s+/g, " ").replace(/\(\s/g, "(").replace(/\s\)/g, ")");
const guardsIn = (text) =>
  [
    ...text.matchAll(/\b(?:requirePermission|requireFullResident|requireAnyPageIn|requireAdminUser|requireRole)\((?:[^()]|\([^()]*\))*\)/g),
    ...text.matchAll(/\bif \((?:[^()]|\([^()]*\))*\) refuseFor\(\w+\)/g),
  ]
    .map((m) => norm(m[0]))
    .sort();
const decidesIn = (text) =>
  [...new Set([...text.matchAll(/\bcan\((?:[^()"]|\([^()]*\))*?,\s*"([a-z_]+\.[a-z_]+)"(?:\s*,\s*"([a-z]+)")?\s*\)/g)].map((m) => (m[2] === "read" ? `${m[1]}:read` : m[1])))].sort();
const sameSet = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

const registered = new Set(ROUTES.map((r) => r.path));
const known = [];
for (const { file, path } of pages) {
  const buckets = [registered.has(path) && "the registry", path in PINNED && "PINNED", path in EXEMPT && "EXEMPT"].filter(Boolean);
  if (buckets.length !== 1) {
    eq(`F ${path} is in exactly one bucket (registry, PINNED or EXEMPT)`, buckets, buckets.length ? [buckets[0]] : ["one of them"]);
    if (!buckets.length) console.log(`     A new page: add it to PINNED with its guard, or to EXEMPT with why it needs none (scripts/check-permission-catalogue.mjs, section F).`);
    continue;
  }
  if (registered.has(path)) continue; // E's
  const text = stripComments(readFileSync(file, "utf8"));
  const guards = guardsIn(text);
  const pin = PINNED[path];
  if (pin) {
    const want = pin.guards.map(norm).sort();
    if (pin.known && sameSet(guards, pin.known.has.map(norm))) {
      known.push(`${path}: guards ${pin.known.has.join(", ")}; should be ${pin.guards.join(", ")} (backlog: "${pin.known.item}")`);
    } else {
      eq(`F ${path} guards with ${pin.guards.join(" + ")}`, guards, want);
      if (pin.known && sameSet(guards, want)) eq(`F ${path} STALE: fixed, remove its \`known\` entry`, "known entry", "no entry");
    }
    const body = pin.in ? stripComments(readFileSync(join(root, pin.in), "utf8")) : text;
    eq(`F ${path} body decides with can(${pin.decides.join(", ") || "nothing"})`, decidesIn(body), [...pin.decides].sort());
    if (pin.table) {
      const block = text.match(new RegExp(`\\b${pin.table.name}\\b[^=]*=\\s*\\{([^}]*)\\}`))?.[1] ?? "";
      const got = Object.fromEntries([...block.matchAll(/"?([a-z-]+)"?\s*:\s*"([a-z_.]+)"/g)].map((m) => [m[1], m[2]]));
      eq(`F ${path} ${pin.table.name} maps each tab to its activity`, got, pin.table.want);
    }
  } else {
    const ex = EXEMPT[path];
    eq(`F ${path} is exempt with no guard of its own`, guards.filter((g) => !g.startsWith("if (")), []);
    if (ex.public) eq(`F ${path} is public in src/lib/public-paths.ts`, isPublicPath(path.replace(/\[[^\]]+\]/g, "x")), true);
    eq(`F ${path} body decides with can(${(ex.decides ?? []).join(", ") || "nothing"})`, decidesIn(text), [...(ex.decides ?? [])].sort());
  }
}
for (const p of [...Object.keys(PINNED), ...Object.keys(EXEMPT)]) {
  if (!pages.some((pg) => pg.path === p)) eq(`F ${p} STALE: listed but has no page.tsx`, "listed", "removed");
}
// The hub's order is the part a pin of its guards cannot see: a who-and-where login may hold no
// resident.record, so the guard ahead of its redirect would turn the volunteer's card into no-access.
{
  const hub = stripComments(readFileSync(join(appDir, "residents/[id]/page.tsx"), "utf8"));
  const redirectAt = hub.search(/readsWhoAndWhereOnly\(\)\)\s*redirect\(/);
  const guardAt = hub.search(/\brequireFullResident\(/);
  eq("F /residents/[id] sends a who-and-where login to /r/ before its guard", redirectAt >= 0 && redirectAt < guardAt, true);
}
eq("F every EXEMPT entry gives a reason", Object.entries(EXEMPT).filter(([, e]) => !e.why || e.why.length < 40).map(([p]) => p), []);
console.log(
  `F ${pages.length} pages: ${pages.filter((p) => registered.has(p.path)).length} in the registry, ` +
    `${Object.keys(PINNED).length} pinned, ${Object.keys(EXEMPT).length} exempt`,
);
for (const k of known) console.log(`KNOWN ${k}`);

console.log(fails ? `\n${fails} FAILED` : "\nall ok");
process.exitCode = fails ? 1 : 0;
