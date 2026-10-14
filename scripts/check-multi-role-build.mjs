// multi-role-build (docs/decisions/2026-10-14-multi-role-ui.md): the app side of one login holding several roles.
// No database, no env: each default role's cells are read from the migrations that seed them, as check-home-screens.mjs does.
//
//   node scripts/check-multi-role-build.mjs
//
//   A  a login with ONE role gets exactly the home homeTilesFor() always gave it (hashed, per default role)
//   B  a login with two roles gets both homes, once each tile, main role's first
//   C  canDoJob() counts every role a person holds, and a doctor key never counts
//   D  the manual reads a covering person as both audiences
import { createHash } from "node:crypto";
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
const { homeTilesFor, homeTilesForRoles } = await imp("src/lib/home/tiles.ts");
const { ACTIVITIES } = await imp("src/lib/permissions/catalogue.ts");
const { parsePermissions } = await imp("src/lib/permissions/can.ts");
const { bundleOfRole } = await imp("src/lib/permissions/jobs.ts");
const { canDoJob } = await imp("src/lib/recurring-jobs/eligibility.ts");
const { audiencesOf } = await imp("src/lib/manual/audience.ts");
const { isForTopic } = await imp("src/lib/manual/for-topic.ts");
const { loadSeed } = await import(pathToFileURL(join(root, "scripts/lib/permission-seed.mjs")).href);
const t = (await imp("src/lib/i18n/dictionaries/en.ts")).default;
const seed = loadSeed(root);

let fails = 0;
const ok = (name, pass, detail = "") => {
  if (!pass) fails++;
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${pass ? "" : `: ${detail}`}`);
};

const cellsOf = (role) => {
  const cells = {};
  // The configured roles (Head of Medical, Head of Maintenance, 2IC) hold the cells their jobs expand to (jobs.ts).
  for (const [activity, level] of bundleOfRole(role)) cells[activity] = level === "edit" ? 2 : 1;
  for (const a of ACTIVITIES) {
    if (seed.rolesHolding(a.key, "edit").includes(role)) cells[a.key] = 2;
    else if (a.kind === "level" && seed.rolesHolding(a.key, "read").includes(role)) cells[a.key] = 1;
  }
  return cells;
};
/** What my_permissions() says for these roles together: highest cell per activity (0196); the first is the main role. */
const permsFor = (...roles) => {
  const cells = {};
  for (const r of roles) for (const [k, v] of Object.entries(cellsOf(r))) cells[k] = Math.max(cells[k] ?? 0, v);
  return parsePermissions({
    role: { key: roles[0], name: roles[0], opens_app: true },
    roles,
    is_admin: false,
    scopes: {},
    permissions: cells,
  });
};
const hash = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex").slice(0, 12);
const hrefs = (tiles) => tiles.map((x) => x.href);

// ---- A ----
const DEFAULT_ROLES = ["management", "second_in_command", "head_of_maintenance", "head_of_medical", "volunteer", "doctor"];
const before = {};
const after = {};
for (const role of DEFAULT_ROLES) {
  const perms = permsFor(role);
  before[role] = hrefs(homeTilesFor(perms, t, undefined, undefined));
  after[role] = hrefs(homeTilesForRoles(perms, t, undefined, {}));
}
for (const role of DEFAULT_ROLES) ok(`A ${role}: one role, same home as before`, JSON.stringify(before[role]) === JSON.stringify(after[role]), `${before[role]} vs ${after[role]}`);
console.log(`     single-role homes hashed: before ${hash(before)} after ${hash(after)}`);
ok("A the single-role hashes are identical", hash(before) === hash(after));

// ---- B ----
const medical = hrefs(homeTilesFor(permsFor("head_of_medical"), t, undefined, undefined));
const maintenance = hrefs(homeTilesFor(permsFor("head_of_maintenance"), t, undefined, undefined));
const both = hrefs(homeTilesForRoles(permsFor("head_of_medical", "head_of_maintenance"), t, undefined, {}));
ok("B Head of Medical covering Maintenance: every maintenance tile is there", maintenance.every((h) => both.includes(h)), `${maintenance} not in ${both}`);
ok("B ...and every medical tile", medical.every((h) => both.includes(h)), `${medical} not in ${both}`);
ok("B Add photos is not drawn beside the medical photos tile", !both.includes("/photos/add"), both.join());
ok("B ...each tile once", new Set(both).size === both.length, both.join());
ok("B ...main role's tiles lead", JSON.stringify(both.slice(0, medical.length)) === JSON.stringify(medical), both.join());
console.log("   medical:", medical.join(), "| maint:", maintenance.join(), "| both:", both.join());
ok("B maintenance is a tile of the cover, not of the medical lead alone", !medical.includes("/maintenance") && both.includes("/maintenance"));

// ---- C ----
const MAINT = "/maintenance";
ok("C a person holding both can", canDoJob(["head_of_medical", "head_of_maintenance"], MAINT, { "maintenance.jobs:edit": ["head_of_maintenance"] }));
ok("C a person holding only the first cannot", !canDoJob(["head_of_medical"], MAINT, { "maintenance.jobs:edit": ["head_of_maintenance"] }));
ok("C a doctor key never counts", !canDoJob(["doctor"], MAINT, { "maintenance.jobs:edit": ["doctor"] }));
ok("C no roles, no job", !canDoJob([], MAINT, {}));

// ---- D ----
ok("D one role, one audience", JSON.stringify(audiencesOf(permsFor("head_of_medical"))) === JSON.stringify(["volunteer"]));
ok("D management covering a volunteer role reads as both", JSON.stringify(audiencesOf(permsFor("management", "head_of_medical"))) === JSON.stringify(["management", "volunteer"]));
const topic = { id: "x", title: "x", roles: ["volunteer"], steps: [] };
ok("D a volunteer-tagged topic is the covering manager's", isForTopic(topic, "management", permsFor("management", "head_of_medical")));
ok("D ...and not a plain manager's", !isForTopic(topic, "management", permsFor("management")));

console.log(fails ? `\n${fails} check(s) failed` : "\nall checks passed");
process.exit(fails ? 1 : 0);
