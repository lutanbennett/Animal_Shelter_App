// Checks src/lib/recurring-jobs/eligibility.ts — the real exported functions,
// not a copy — against fixed cases: which roles can be given a recurring job,
// worked out from the page the job links to (backlog, "Recurring jobs: only
// offer people who can actually do the job", 2026-09-27). The Pass 0 case —
// a stocktake given to a vet — is the first one.
//
//   node scripts/check-recurring-job-eligibility.mjs
//
// No database, no env. Exits 0 when every case holds.
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
const { canDoJob, rolesForJob, jobIsRestricted, ASSIGNABLE_ROLES } = await import(
  pathToFileURL(join(process.cwd(), "src/lib/recurring-jobs/eligibility.ts")).href
);

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};

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
];
for (const [label, path, want] of cases) eq(label, rolesForJob(path), want);

eq("R1 restricted: maintenance", jobIsRestricted("/maintenance"), true);
eq("R1b not restricted: stocktake takes every assignable role", jobIsRestricted("/stocktake"), false);
eq("R2 not restricted: residents", jobIsRestricted("/residents"), false);
eq("R3 not restricted: no link", jobIsRestricted(null), false);

eq("V1 vet, stocktake (Pass 0)", canDoJob("vet", "/stocktake"), false);
eq("V2 vet, no link", canDoJob("vet", null), false);
eq("V3 vet, residents", canDoJob("vet", "/residents"), false);
eq("V4 vet, a vaccination form", canDoJob("vet", "/immunizations/new"), false);
eq("N1 no role", canDoJob(null, "/residents"), false);
eq("N2 public viewer", canDoJob("public_viewer", null), false);
eq("N3 unknown role", canDoJob("owner", "/residents"), false);

if (fails) {
  console.error(`\n${fails} case(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nEvery case held.");
}
