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
const holds = (role, need) =>
  role === "admin" || cells.some(([r, a, l]) => r === role && a === need.activity && l >= (need.level === "read" ? 1 : 2));
const eligibility = Object.fromEntries(
  JOB_NEEDS.map((need) => [needKey(need), ASSIGNABLE_ROLES.filter((role) => holds(role, need))]),
);
eq("S1 the rules ask about the stock pages and purchasing, from the registry", JOB_NEEDS.map(needKey), [
  "stock.count:edit",
  "stock.delivery:edit",
  "stock.purchasing:edit",
]);

// Vets are never given a recurring job (Lutan, 2026-09-27): their work comes
// from vet appointments.
const ALL = ["admin", "management", "staff", "volunteer"];
eq("assignable roles are the app-access roles but vet", [...ASSIGNABLE_ROLES], ALL);

// [label, link_path, roles that can do it]
const cases = [
  ["E1 stocktake (Pass 0)", "/stocktake", ALL],
  ["E2 stocktake, diets tab: the query is ignored", "/stocktake?tab=diets", ALL],
  ["E3 maintenance: those who write it", "/maintenance", ["admin", "management", "staff"]],
  ["E4 a maintenance job's page", "/maintenance/123e4567-e89b-12d3-a456-426614174000", ["admin", "management", "staff"]],
  ["E5 deliveries", "/deliveries", ["admin", "management", "staff"]],
  ["E6 a management page", "/management/medications", ["admin", "management"]],
  ["E7 admin", "/admin/zones", ["admin"]],
  ["E8 enclosures", "/enclosures", ALL],
  ["E9 contacts, trailing slash", "/contacts/", ALL],
  ["E10 a management page, trailing slash", "/management/diets/", ["admin", "management"]],
  ["E11 maintenance, with a fragment", "/maintenance#board", ["admin", "management", "staff"]],
  ["E12 residents: everyone", "/residents", ALL],
  ["E13 no link: everyone", null, ALL],
  ["E14 empty link: everyone", "", ALL],
  ["E15 a prefix that is only a prefix", "/stocktakes", ALL],
  ["E16 my tasks: everyone", "/my", ALL],
  ["E17 purchasing: a registered page under /management, decided by its own activity", "/management/purchasing", ["admin", "management"]],
];
for (const [label, path, want] of cases) eq(label, rolesForJob(path, eligibility), want);

eq("R1 restricted: maintenance", jobIsRestricted("/maintenance", eligibility), true);
eq("R1b not restricted: stocktake takes every assignable role", jobIsRestricted("/stocktake", eligibility), false);
eq("R2 not restricted: residents", jobIsRestricted("/residents", eligibility), false);
eq("R3 not restricted: no link", jobIsRestricted(null, eligibility), false);

eq("V1 vet, stocktake (Pass 0)", canDoJob("vet", "/stocktake", eligibility), false);
eq("V2 vet, no link", canDoJob("vet", null, eligibility), false);
eq("V3 vet, residents", canDoJob("vet", "/residents", eligibility), false);
eq("V4 vet, a vaccination form", canDoJob("vet", "/immunizations/new", eligibility), false);
eq("N1 no role", canDoJob(null, "/residents", eligibility), false);
eq("N2 public viewer", canDoJob("public_viewer", null, eligibility), false);
eq("N3 unknown role", canDoJob("owner", "/residents", eligibility), false);

// Missing answers never grant: nothing asked, or a role that was not asked about.
eq("F1 no answers at all: a stocktake is nobody's", rolesForJob("/stocktake", {}), []);
eq("F2 no answers: an unregistered page is still everyone's", rolesForJob("/residents", {}), ALL);
eq("F3 asked only about volunteer: only volunteer", rolesForJob("/stocktake", { "stock.count:edit": ["volunteer"] }), ["volunteer"]);

// Held to what the conversion replaced.
const fixture = JSON.parse(readFileSync(join(process.cwd(), "scripts/fixtures/legacy-predicates.json"), "utf8"));
for (const [id, table] of Object.entries(fixture).filter(([id]) => id.startsWith("canDoJob("))) {
  const link = id.slice("canDoJob(".length, -1);
  const got = Object.fromEntries(Object.keys(table).map((r) => [r, canDoJob(r === "null" ? null : r, link, eligibility)]));
  eq(`L ${id} equals the table written before the conversion`, got, table);
}

if (fails) {
  console.error(`\n${fails} case(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nEvery case held.");
}
