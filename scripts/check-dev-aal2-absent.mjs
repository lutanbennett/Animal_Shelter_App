// Proves the dev-only aal2 step-up (#dvaal) cannot exist on production or UAT. "Impossible" means proven, so:
//
//   node scripts/check-dev-aal2-absent.mjs                  static proofs only (any checkout; no network)
//   node scripts/check-dev-aal2-absent.mjs --env production  static + a LIVE read of that project: no dev-signin login, no factor on one
//   node scripts/check-dev-aal2-absent.mjs --env uat         the same for UAT
//   node scripts/check-dev-aal2-absent.mjs --env test        dev itself: static + live, where dev-signin logins ARE expected
//
// Static (what the code can do):
//   1 the step-up helper is imported by scripts/dev-signin.mjs and by nothing else, and nothing under src/, worker/ or
//     wrangler config mentions it, so no deployed code contains the path;
//   2 the helper refuses any project but dev, and refuses any login that is not dev-signin-*@example.invalid;
//   3 dev-signin.mjs itself refuses a non-dev project before it does anything;
//   4 0411's two aal2 restrictive policies are still in the migrations and no later migration drops or alters them.
// Live (what the target project actually holds), for --env production|uat: no auth user matching dev-signin-*@example.invalid.
// Exit 0 only when every proof held. Running it against production and UAT is the planner's and Lutan's, not a worktree's.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { DEV_PROJECT_REF } from "./lib/dev-aal2.mjs";
import { exitWith } from "./lib/exit.mjs";

const { name } = parseEnvArg(process.argv.slice(2));
const failures = [];
const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m) => { failures.push(m); console.log(`  FAIL  ${m}`); };
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    if (f === "node_modules" || f === ".next" || f === ".open-next" || f === ".git") continue;
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
const read = (p) => readFileSync(p, "utf8");
const rel = (p) => p.split(String.fromCharCode(92)).join("/");

console.log("static proofs");
// 1
const mentions = [];
for (const dir of ["src", "worker", "scripts", "."]) {
  const files = dir === "." ? readdirSync(".").filter((f) => /^(wrangler|open-next|next\.config|package)/.test(f)) : walk(dir);
  for (const f of files) {
    if (!/\.(m?[jt]sx?|json|jsonc)$/.test(f)) continue;
    if (/dev-aal2/.test(read(f))) mentions.push(rel(f));
  }
}
const allowed = new Set(["scripts/dev-signin.mjs", "scripts/check-dev-aal2-absent.mjs", "scripts/lib/dev-aal2.mjs"]);
const stray = mentions.filter((f) => !allowed.has(f) && !f.endsWith(".test.mjs"));
stray.length ? bad(`the step-up is referenced outside dev-signin: ${stray.join(", ")}`) : ok(`only ${[...allowed].join(", ")} mention the step-up; nothing under src/ or worker/ does`);
/dev-aal2/.test(read("scripts/dev-signin.mjs")) ? ok("dev-signin.mjs is the one importer") : bad("dev-signin.mjs no longer imports the helper");
// 2
const helper = read("scripts/lib/dev-aal2.mjs");
/assertDevProject\(projectRef\);\s*assertDevLogin\(user\.email\)/.test(helper) && helper.includes(`"${DEV_PROJECT_REF}"`)
  ? ok("the helper calls assertDevProject then assertDevLogin before it touches any factor")
  : bad("the helper's dev-project and dev-login guards are missing or no longer first");
// 3
const signin = read("scripts/dev-signin.mjs");
signin.indexOf("is not the dev project") > -1 && signin.indexOf("is not the dev project") < signin.indexOf("stepUpToAal2({")
  ? ok("dev-signin.mjs refuses a non-dev project before it can reach the step-up") : bad("dev-signin.mjs does not refuse a non-dev project ahead of the step-up");
// 4
const migs = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
const m411 = read("supabase/migrations/0411_product_admins.sql");
const polNames = ["product_admins_insert_requires_aal2", "product_admins_delete_requires_aal2"];
polNames.every((p) => m411.includes(`create policy ${p}`) && m411.includes("= 'aal2'")) ? ok("0411 still defines both aal2 restrictive policies") : bad("0411's aal2 policies are not as recorded");
const weakened = [];
for (const f of migs.filter((f) => f.slice(0, 4) > "0411")) {
  const sql = read(`supabase/migrations/${f}`);
  for (const p of polNames) if (new RegExp(String.raw`(drop|alter)\s+policy\s+(if exists\s+)?${p}`, "i").test(sql)) weakened.push(`${f}:${p}`);
}
weakened.length ? bad(`a later migration touches an aal2 policy: ${weakened.join(", ")}`) : ok(`no migration after 0411 drops or alters either aal2 policy (${migs.length} files read)`);

if (name !== "test" || process.argv.includes("--live")) {
  console.log(`live read of ${name}`);
  const env = loadEnv(name);
  const ref = projectRef(env);
  if (name === "test") ref === DEV_PROJECT_REF ? ok(`test is the dev project (${ref})`) : bad(`--env test points at ${ref}, not dev`);
  else ref === DEV_PROJECT_REF ? bad(`--env ${name} resolves to the DEV project; the read below proves nothing about ${name}`) : ok(`${name} is project ${ref}, not dev`);
  const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const found = [];
  for (let page = 1; ; page++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) { bad(`could not list ${name}'s logins: ${error.message}`); break; }
    found.push(...data.users.filter((u) => u.email?.startsWith("dev-signin-") && u.email.endsWith("@example.invalid")));
    if (data.users.length < 200) break;
  }
  if (name === "test") ok(`dev holds ${found.length} dev-signin login(s), as expected there`);
  else found.length ? bad(`${name} holds ${found.length} dev-signin login(s): ${found.map((u) => u.email).join(", ")}`) : ok(`${name} holds no dev-signin login, so none can be stepped up`);
}
console.log(failures.length ? `\nNOT PROVEN: ${failures.length} failed` : "\nthe dev-only aal2 step-up is absent from every deployed path");
await exitWith(failures.length ? 1 : 0);
