// Go-live check for the public (anonymous) tier of the Supabase project.
//
// The public pages read the public_* views and three site_* tables with
// the anon key. Those must be readable by anon and nothing more:
// Supabase's default privileges grant INSERT/UPDATE/DELETE on new objects
// to anon, and public_resident_profiles is auto-updatable, so before 0025
// an anonymous PATCH through it was accepted (docs/decisions.md, "Adopted
// residents leave the public pages"). Everything else must refuse anon
// outright: until 0081, four internal views that run as their owner
// answered anon with resident names, placements and death dates
// (docs/decisions.md, "Anon loses the internal views"). Run this against
// the production project after applying the migrations and before
// announcing the site.
//
//   node scripts/check-public-views.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from the
// environment or the env files for the chosen environment (scripts/lib/env.mjs;
// `--env production` for the live database), and SUPABASE_SERVICE_ROLE_KEY
// to list every table and view the Data API exposes, so an object added
// later is checked without anyone adding it here. Exits non-zero if a
// public object is unreadable or writable, or anon can read anything else.

import { loadEnv, parseEnvArg } from "./lib/env.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !serviceKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
  process.exit(2);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
// A filter that can never match, so a permitted write still changes nothing.
const noRow = "id=eq.00000000-0000-0000-0000-000000000000";
let failed = false;

function report(ok, label, detail) {
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed = true;
}

// What anon may read. Each is granted SELECT to anon by a migration, and
// 0081 revokes everything else.
const PUBLIC_VIEWS = [
  "public_resident_profiles",
  "public_resident_photos",
  "public_projects",
  "public_project_photos",
  "public_site_pages",
  "public_recent_adoptions",
  "public_resident_cards",
  "public_shelter_friends",
  "public_enclosures",
  "public_shelter_stats",
];
// Base tables the home page and footer read directly, each behind a
// public_read_* policy.
const PUBLIC_TABLES = ["site_content", "site_content_photos", "site_pages"];
const PUBLIC = new Set([...PUBLIC_VIEWS, ...PUBLIC_TABLES]);

for (const name of PUBLIC) {
  const read = await fetch(`${url}/rest/v1/${name}?limit=1`, { headers });
  report(read.ok, `${name}: anon can SELECT`, `HTTP ${read.status}`);

  for (const [method, body] of [
    ["PATCH", JSON.stringify({ id: "00000000-0000-0000-0000-000000000000" })],
    ["DELETE", undefined],
  ]) {
    const write = await fetch(`${url}/rest/v1/${name}?${noRow}`, {
      method,
      headers: { ...headers, "Content-Type": "application/json" },
      body,
    });
    // 401/403 with 42501 is what we want; 2xx means the write was allowed.
    report(!write.ok, `${name}: anon ${method} is refused`, `HTTP ${write.status}`);
  }
}

// Every other table and view the Data API exposes must refuse anon, not
// just return an empty list: an owner-rights view skips RLS entirely, so
// only the grant stands between it and a signed-out visitor. The schema
// root lists them all, but only for the service role.
const root = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
});
if (!root.ok) {
  report(false, "list the Data API's tables and views", `HTTP ${root.status}`);
} else {
  const exposed = Object.keys((await root.json()).paths ?? {})
    .filter((path) => path !== "/" && !path.startsWith("/rpc/"))
    .map((path) => path.slice(1))
    .sort();
  for (const name of PUBLIC) {
    if (!exposed.includes(name)) report(false, `${name}: listed as public but not exposed`);
  }
  for (const name of exposed.filter((n) => !PUBLIC.has(n))) {
    const read = await fetch(`${url}/rest/v1/${name}?limit=1`, { headers });
    report(
      !read.ok,
      `${name}: anon SELECT is refused`,
      `HTTP ${read.status}${read.ok && name.startsWith("public_") ? " (a new public view? add it to PUBLIC_VIEWS)" : ""}`,
    );
  }
}

console.log(`\nProject: ${new URL(url).hostname}`);
process.exit(failed ? 1 : 0);
