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
//      replaced (canStocktake, canRecordDelivery) said, and the two lists
//      recurring-job eligibility still carries agree with the seed
//   E  the route registry: unique paths, a level only where the activity has
//      one, and every entry's page file guards with the same activity
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
const { STOCK_COUNT_ROLES, STOCK_DELIVERY_ROLES } = await imp("src/lib/recurring-jobs/eligibility.ts");

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
const seededCells = []; // [role, activity, level]
for (const f of migrations) {
  const sql = readFileSync(join(migDir, f), "utf8");
  if (!/permission_activities|role_permissions/.test(sql)) continue;
  for (const m of sql.matchAll(/\('([a-z_]+\.[a-z_]+)', '(level|yesno)', '([a-z]+)', (\d+)\)/g)) {
    seeded.set(m[1], { kind: m[2], area: m[3], sort: Number(m[4]) });
  }
  for (const m of sql.matchAll(/\('([a-z_]+)', '([a-z_]+\.[a-z_]+)', ([12])\)/g)) {
    seededCells.push([m[1], m[2], Number(m[3])]);
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
const ROLES = ["admin", "management", "staff", "vet", "volunteer", "public_viewer"];
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
const rolesWith = (activity) => ROLES.filter((r) => r === "admin" || seededCells.some(([role, a]) => role === r && a === activity));
eq("D eligibility's count list equals the seed", [...STOCK_COUNT_ROLES], rolesWith("stock.count"));
eq("D eligibility's delivery list equals the seed", [...STOCK_DELIVERY_ROLES], rolesWith("stock.delivery"));

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

console.log(fails ? `\n${fails} FAILED` : "\nall ok");
process.exitCode = fails ? 1 : 0;
