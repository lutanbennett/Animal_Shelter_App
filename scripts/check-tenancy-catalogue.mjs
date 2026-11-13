// Catalogue lint for multi-tenancy: ownership of every API-readable view and every API-executable security definer
// function. REPORT-ONLY: it always exits 0 unless it could not read the catalogue (exit 2). It does NOT fail the build.
//
//   node scripts/check-tenancy-catalogue.mjs [--env test|uat|production] [--tenant-role <role>] [--strict]
//
// Needs SUPABASE_ACCESS_TOKEN (the Management API). CI has only the test project's URL and keys, which cannot read
// pg_catalog, so this is a script someone runs and is NOT wired into CI (docs/decisions/2026-11-13-tenancy-catalogue-lint.md).
// --strict exits 1 on any finding; for the re-own stream, once a tenant role exists.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";
import { lintCatalogue, VIEWS_SQL, FUNCTIONS_SQL, DEFAULT_TENANT_ROLE } from "./lib/tenancy-catalogue.mjs";

const argv = process.argv.slice(2);
const { name: envName } = parseEnvArg(argv);
const strict = argv.includes("--strict");
const ti = argv.indexOf("--tenant-role");
const tenantRole = ti >= 0 ? argv[ti + 1] : DEFAULT_TENANT_ROLE;
const env = loadEnv(envName);
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required: the catalogue is only readable through the Management API. NOT CHECKED.");
  await exitWith(2);
} else {
  const ref = projectRef(env);
  const run = async (query) => {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const rows = await res.json();
    if (!res.ok || !Array.isArray(rows) || rows.length === 0) throw new Error(`catalogue read failed or empty (HTTP ${res.status})`);
    return rows;
  };
  try {
    const views = await run(VIEWS_SQL);
    const functions = await run(FUNCTIONS_SQL);
    const { findings, allowedHit, stale } = lintCatalogue({ views, functions }, { tenantRole });
    const apiViews = views.filter((v) => v.api);
    const apiDefiners = functions.filter((f) => f.api && f.secdef);
    console.log(`Project ${ref}; tenant role: ${tenantRole ?? "(none yet)"}`);
    console.log(`Read ${views.length} views (${apiViews.length} API-readable), ${functions.length} functions (${apiDefiners.length} API-executable security definer).`);
    for (const f of findings) console.log(`FLAG rule ${f.rule}  ${f.object}  owner=${f.owner}`);
    for (const a of allowedHit) console.log(`allowed  ${a.object}  — ${a.why}`);
    for (const s of stale) console.log(`STALE allow-list entry ${s}: no such API object any more; drop it`);
    const r1 = findings.filter((f) => f.rule === 1).length;
    console.log(`\n${findings.length} flagged (${r1} views, ${findings.length - r1} functions), ${allowedHit.length} allowed by name, ${stale.length} stale.`);
    console.log(strict ? "STRICT: exiting 1 on any finding." : "REPORT-ONLY: this does not fail the build.");
    await exitWith(strict && (findings.length || stale.length) ? 1 : 0);
  } catch (e) {
    console.error(`NOT CHECKED: ${e.message}`);
    await exitWith(2);
  }
}
