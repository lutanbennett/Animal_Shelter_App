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
// environment, falling back to .env.local — the same values the deploy
// build inlines, so point .env.local at production first (README, step 3).
// Exits non-zero if a view is unreadable or writable.

import { existsSync, readFileSync } from "node:fs";

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(".env.local")) {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      if (!line.includes("=") || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i).trim();
      if (!(key in env)) env[key] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
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

console.log(`\nProject: ${new URL(url).hostname}`);
process.exit(failed ? 1 : 0);
