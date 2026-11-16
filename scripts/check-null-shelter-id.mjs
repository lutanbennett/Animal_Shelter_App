// Null-shelter check for multi-tenancy (#stmp5, step 4): no row of any tenant table may have a null shelter_id.
//
//   node scripts/check-null-shelter-id.mjs [--env test|uat|production]
//
// WHY: a null shelter_id is invisible today and becomes invisible DATA once per-shelter policies land (a row no shelter can
// see, with no error anywhere). This is the instrument that says whether that has happened. It does NOT fix anything and does
// NOT cover NOT NULL, which is a separate step (decision file docs/decisions/2026-11-16-null-shelter-id-check.md).
//
// HOW THE LIST IS DERIVED: the service role reads PostgREST's OpenAPI document and takes every exposed object that has a
// shelter_id property. There is no hard-coded list, so a table that gains the column later is checked without anyone adding it
// here. Views that expose shelter_id are counted too (a null there means a null underneath). The service role bypasses RLS, so
// the count sees every row. Needs the same three keys as check-public-views.mjs and no secret beyond them.
//
// OUTPUT: one summary line when clean (exit 0); a line per table with a non-zero count, then a summary, and exit 1 otherwise.
// Exit 2: could not read (missing keys, unreadable schema, or a count that failed), which is never reported as clean.
import { loadEnv, parseEnvArg } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. NOT CHECKED.");
  await exitWith(2);
} else {
  await main();
}

async function main() {
  const auth = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  try {
    const spec = await fetch(`${url}/rest/v1/`, { headers: { ...auth, Accept: "application/openapi+json" } });
    if (!spec.ok) throw new Error(`schema read failed (HTTP ${spec.status})`);
    const defs = (await spec.json()).definitions ?? {};
    const tables = Object.keys(defs).filter((t) => defs[t]?.properties && "shelter_id" in defs[t].properties).sort();
    if (!tables.length) throw new Error("no object with a shelter_id column was found, so nothing was checked");
    const bad = [];
    for (const t of tables) {
      const res = await fetch(`${url}/rest/v1/${encodeURIComponent(t)}?shelter_id=is.null&select=shelter_id`, {
        method: "HEAD",
        headers: { ...auth, Prefer: "count=exact" },
      });
      const m = /\/(\d+)$/.exec(res.headers.get("content-range") ?? "");
      if (!res.ok || !m) throw new Error(`count failed for ${t} (HTTP ${res.status})`);
      if (Number(m[1]) > 0) bad.push([t, Number(m[1])]);
    }
    for (const [t, n] of bad) console.log(`FAIL  ${t}: ${n} row(s) with a null shelter_id`);
    if (bad.length) {
      console.log(`${bad.length} of ${tables.length} object(s) have null shelter_id rows. NOT CLEAN.`);
      await exitWith(1);
    } else {
      console.log(`ok  no null shelter_id in any of the ${tables.length} objects that carry the column.`);
      await exitWith(0);
    }
  } catch (e) {
    console.error(`${e.message}. NOT CHECKED.`);
    await exitWith(2);
  }
}
