// Go-live check for the public (anonymous) tier of the Supabase project.
//
// The /adopt pages read public_resident_profiles and public_resident_photos
// with the anon key. Those views must be readable by anon and nothing more:
// Supabase's default privileges grant INSERT/UPDATE/DELETE on new objects
// to anon, and public_resident_profiles is auto-updatable, so before 0025
// an anonymous PATCH through it was accepted (docs/decisions.md, "Adopted
// residents leave the public pages"). Run this against the production
// project after applying the migrations and before announcing the site.
//
//   node scripts/check-public-views.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from the
// environment or the env files for the chosen environment (scripts/lib/env.mjs;
// `--env production` for the live database). Exits non-zero if a view is
// unreadable or writable.

import { loadEnv, parseEnvArg } from "./lib/env.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
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

for (const view of [
  "public_resident_profiles",
  "public_resident_photos",
  "public_projects",
  "public_project_photos",
  "public_site_pages",
  "public_recent_adoptions",
  "public_resident_cards",
  "public_shelter_friends",
]) {
  const read = await fetch(`${url}/rest/v1/${view}?select=id&limit=1`, { headers });
  report(read.ok, `${view}: anon can SELECT`, `HTTP ${read.status}`);

  for (const [method, body] of [
    ["PATCH", JSON.stringify({ id: "00000000-0000-0000-0000-000000000000" })],
    ["DELETE", undefined],
  ]) {
    const write = await fetch(`${url}/rest/v1/${view}?${noRow}`, {
      method,
      headers: { ...headers, "Content-Type": "application/json" },
      body,
    });
    // 401/403 with 42501 is what we want; 2xx means the write was allowed.
    report(
      !write.ok,
      `${view}: anon ${method} is refused`,
      `HTTP ${write.status}`,
    );
  }
}

// Tables behind a public view that anon must not read directly. RLS alone
// would return an empty list; these also have their anon grants revoked, so
// the read is refused outright — the view is the only way in.
for (const table of ["shelter_friends"]) {
  const read = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, { headers });
  report(!read.ok, `${table}: anon SELECT is refused`, `HTTP ${read.status}`);
}

console.log(`\nProject: ${new URL(url).hostname}`);
process.exit(failed ? 1 : 0);
