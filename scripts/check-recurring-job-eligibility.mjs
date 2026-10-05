// Checks src/lib/recurring-jobs/eligibility.ts — the real exported functions,
// not a copy — against fixed cases: which roles can be given a recurring job,
// worked out from the page the job links to (backlog, "Recurring jobs: only
// offer people who can actually do the job", 2026-09-27). The Pass 0 case —
// a stocktake given to a vet — is the first one.
//
//   node scripts/check-recurring-job-eligibility.mjs
//
// No database, no env. The pages in the route registry are decided by
// role_can() (0133), so the answers it would give are built here from the cells
// 0132 seeds (role_can's own parity with has_permission() is
// check-role-can.mjs). The truth tables the deleted STOCK_*_ROLES lists and
// canDoJob's old role-string rules gave are kept in
// scripts/fixtures/legacy-predicates.json and compared at the end, so the
// conversion is held to what it replaced. Exits 0 when every case holds.
import { readdirSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The lib imports "@/lib/…" and extensionless relative paths; resolve both
// to the .ts file the way tsconfig and the bundler do.
const src = pathToFileURL(join(process.cwd(), "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
        if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const { canDoJob, rolesForJob, jobIsRestricted, ASSIGNABLE_ROLES, JOB_NEEDS, needKey } = await import(
  pathToFileURL(join(process.cwd(), "src/lib/recurring-jobs/eligibility.ts")).href
);

const { ROUTES } = await import(pathToFileURL(join(process.cwd(), "src/lib/permissions/routes.ts")).href);

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};

// What role_can(role, activity, 'edit') says on a database holding the seed: Admin
// always, otherwise the roles with a cell. Asked only for the assignable roles,
// as loadEligibility does.
const migDir = join(process.cwd(), "supabase/migrations");
const cells = [];
for (const f of readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort()) {
  const sql = readFileSync(join(migDir, f), "utf8");
  if (!/role_permissions/.test(sql)) continue;
  for (const m of sql.matchAll(/\('([a-z_]+)', '([a-z_]+\.[a-z_]+)', ([12])\)/g)) cells.push([m[1], m[2], Number(m[3])]);
}
// A configured role's cells are inserted by its own migration, as a cross join over the role's key
// (0143, the 2IC), not as rows the regex above reads: take them from there.
const CONFIGURED = "second_in_command";
{
  const sql = readFileSync(join(migDir, "0143_2ic_role.sql"), "utf8");
  const block = sql.slice(sql.indexOf("insert into role_permissions"), sql.indexOf("-- 2. Stock figures"));
  if (!block.includes(`r.key = '${CONFIGURED}'`)) throw new Error("0143 no longer inserts the 2IC's cells where this check reads them");
  for (const m of block.matchAll(/\('([a-z_]+\.[a-z_]+)', ([12])\)/g)) cells.push([CONFIGURED, m[1], Number(m[2])]);
}
const holds = (role, need) =>
  role === "admin" || cells.some(([r, a, l]) => r === role && a === need.activity && l >= (need.level === "read" ? 1 : 2));
// Role KEYS, as app_users.role_key gives them (0146): the built-in roles and a configured one, whose enum
// value is a borrowed 'volunteer'. The check used to ask only the enum names, which is how the bug hid.
const ROLES = [...ASSIGNABLE_ROLES, CONFIGURED];
const eligibility = Object.fromEntries(
  JOB_NEEDS.map((need) => [needKey(need), ROLES.filter((role) => holds(role, need))]),
);
// Every cell comes from the registry (the sweeps registered every page): a page's own entry, at the level a
// job linking there needs (jobLevel, else the level that opens it), plus the two landings' any-of.
const wanted = [...new Set(ROUTES.map((r) => needKey({ activity: r.activity, level: r.jobLevel ?? r.level ?? "edit" })))];
eq("S1 the rules ask about exactly what the registry registers", [...JOB_NEEDS.map(needKey)].sort(), wanted.sort());
eq("S1 the maintenance board's work is Edit although the page opens at Read", needKey(JOB_NEEDS.find((n) => n.activity === "maintenance.jobs")), "maintenance.jobs:edit");

// Vets are never given a recurring job (Lutan, 2026-09-27): their work comes
// from vet appointments.
const ALL = ["admin", "management", "staff", "volunteer"];
eq("assignable roles are the app-access roles but vet", [...ASSIGNABLE_ROLES], ALL);
const ALLK = [...ALL, CONFIGURED];

// [label, link_path, roles that can do it]
const cases = [
  ["E1 stocktake (Pass 0)", "/stocktake", ALLK],
  ["E2 stocktake, diets tab: the query is ignored", "/stocktake?tab=diets", ALLK],
  ["E3 maintenance: those who write it", "/maintenance", ["admin", "management", "staff", "second_in_command"]],
  ["E4 a maintenance job's page", "/maintenance/123e4567-e89b-12d3-a456-426614174000", ["admin", "management", "staff", "second_in_command"]],
  ["E5 deliveries", "/deliveries", ["admin", "management", "staff", "second_in_command"]],
  ["E6 a management page", "/management/medications", ["admin", "management"]],
  ["E7 admin", "/admin/zones", ["admin"]],
  ["E8 enclosures", "/enclosures", ALLK],
  ["E9 contacts, trailing slash", "/contacts/", ALL],
  ["E10 a management page, trailing slash", "/management/diets/", ["admin", "management"]],
  ["E11 maintenance, with a fragment", "/maintenance#board", ["admin", "management", "staff", "second_in_command"]],
  ["E12 residents: everyone", "/residents", ALLK],
  ["E13 no link: everyone", null, ALLK],
  ["E14 empty link: everyone", "", ALLK],
  ["E15 a prefix that is only a prefix", "/stocktakes", ALLK],
  ["E16 my tasks: everyone", "/my", ALLK],
  ["E17 purchasing: a registered page under /management, decided by its own activity", "/management/purchasing", ["admin", "management", "second_in_command"]],
];
for (const [label, path, want] of cases) eq(label, rolesForJob(path, eligibility, ROLES), want);

eq("R1 restricted: maintenance", jobIsRestricted("/maintenance", eligibility, ROLES), true);
eq("R1b not restricted: stocktake takes every assignable role", jobIsRestricted("/stocktake", eligibility, ROLES), false);
eq("R2 not restricted: residents", jobIsRestricted("/residents", eligibility, ROLES), false);
eq("R3 not restricted: no link", jobIsRestricted(null, eligibility, ROLES), false);

eq("V1 vet, stocktake (Pass 0)", canDoJob("vet", "/stocktake", eligibility), false);
eq("V2 vet, no link", canDoJob("vet", null, eligibility), false);
eq("V3 vet, residents", canDoJob("vet", "/residents", eligibility), false);
eq("V4 vet, a vaccination form", canDoJob("vet", "/immunizations/new", eligibility), false);
eq("N1 no role", canDoJob(null, "/residents", eligibility), false);
eq("N2 public viewer", canDoJob("public_viewer", null, eligibility), false);
eq("N3 unknown role key, on a page that needs a cell", canDoJob("owner", "/stocktake", eligibility), false);

// The bug this check exists for (backlog, "A configured role's rota eligibility", 2026-10-04): the 2IC's
// enum value is 'volunteer', and a volunteer may not open /stocktake — so asking the enum refused her.
// Asked by her key, her own cells decide.
eq("K1 2IC, weekly stocktake (the case that matters)", canDoJob(CONFIGURED, "/stocktake", eligibility), true);
eq("K2 2IC, maintenance board (her own maintenance.jobs cell)", canDoJob(CONFIGURED, "/maintenance", eligibility), true);
eq("K3 2IC, deliveries", canDoJob(CONFIGURED, "/deliveries", eligibility), true);
eq("K4 2IC, no link", canDoJob(CONFIGURED, null, eligibility), true);
eq("K5 2IC, a page she holds no cell for", canDoJob(CONFIGURED, "/management/medications", eligibility), false);
eq("K6 2IC, admin pages", canDoJob(CONFIGURED, "/admin/zones", eligibility), false);
eq("K7 a plain volunteer, stocktake: the floor still holds what it held", canDoJob("volunteer", "/stocktake", eligibility), true);
eq("K8 a plain volunteer, maintenance: still not", canDoJob("volunteer", "/maintenance", eligibility), false);
eq("K9 the enum read for the 2IC would have said what a volunteer says — the two questions differ", eligibility["stock.count:edit"].includes(CONFIGURED), true);

// Missing answers never grant: nothing asked, or a role that was not asked about.
eq("F1 no answers at all: a stocktake is nobody's", rolesForJob("/stocktake", {}, ROLES), []);
eq("F2 no answers: an unregistered page is still everyone's", rolesForJob("/residents", {}, ROLES), ALLK);
eq("F3 asked only about volunteer: only volunteer", rolesForJob("/stocktake", { "stock.count:edit": ["volunteer"] }, ROLES), ["volunteer"]);

// Held to what the conversion replaced, except where a later change to the cells moved the answer on
// purpose. The /management landing opens for anyone who may open a page under it; staff and volunteers
// were given contacts.directory (0144), so it now opens for them. Listed here, so the drift is on the
// record rather than a red that has been failing since (found on a clean main, 2026-10-05).
const MOVED_BY_CELLS = { "canDoJob(/management)": { staff: true, volunteer: true } };
const fixture = JSON.parse(readFileSync(join(process.cwd(), "scripts/fixtures/legacy-predicates.json"), "utf8"));
for (const [id, table] of Object.entries(fixture).filter(([id]) => id.startsWith("canDoJob("))) {
  const link = id.slice("canDoJob(".length, -1);
  const got = Object.fromEntries(Object.keys(table).map((r) => [r, canDoJob(r === "null" ? null : r, link, eligibility)]));
  eq(`L ${id} equals the table written before the conversion`, got, { ...table, ...MOVED_BY_CELLS[id] });
}

if (fails) {
  console.error(`\n${fails} case(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nEvery case held.");
}
