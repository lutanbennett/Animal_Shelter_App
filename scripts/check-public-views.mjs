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
// (docs/decisions.md, "Anon loses the internal views"). The same goes for
// functions: until 0082 anon could call every one through /rest/v1/rpc/,
// including security-definer helpers that answered for any row id and role
// guards that let a NULL role through (docs/decisions.md, "Anon loses the
// functions"). Run this against
// the production project after applying the migrations and before
// announcing the site.
//
//   node scripts/check-public-views.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from the
// environment or the env files for the chosen environment (scripts/lib/env.mjs;
// `--env production` for the live database), and SUPABASE_SERVICE_ROLE_KEY
// to list every table, view and function the Data API exposes, so an object
// added later is checked without anyone adding it here. Exits non-zero if a
// public object is unreadable or writable, anon can read anything else, a
// function the public site calls refuses anon, or anon can execute any
// other function.

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

// Functions anon may execute, each granted back by 0082, with arguments
// for a harmless call. The public views call the shelter_* ones (EXECUTE is
// checked as the caller even inside a view), the site_* policies call
// current_user_role, and the photo proxy calls is_public_drive_file (0084).
// is_known_drive_file was on this list until 0089 took it back; it answers
// yes for internal files too, so it must now be refused like the rest.
const PUBLIC_FUNCTIONS = {
  current_user_role: {},
  is_public_drive_file: { p_drive_file_id: "check-public-views-no-such-file" },
  shelter_date: { p_at: new Date().toISOString() },
  shelter_time_zone: {},
  shelter_today: {},
};

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
  const paths = (await root.json()).paths ?? {};
  const exposed = Object.keys(paths)
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

  // Every function the Data API exposes. The allow-listed ones must answer
  // anon; every other one must be refused *as a function* (42501 naming the
  // function), not merely fail further in — before 0082 most write RPCs
  // "refused" anon only because a table inside them did, and the
  // security-definer ones did not refuse at all. Arguments are all null:
  // enough for PostgREST to find the function, and the privilege check
  // comes before the body runs.
  const rpcs = Object.entries(paths)
    .filter(([path]) => path.startsWith("/rpc/"))
    .map(([path, def]) => [path.slice(5), def])
    .sort(([a], [b]) => a.localeCompare(b));
  for (const name of Object.keys(PUBLIC_FUNCTIONS)) {
    if (!rpcs.some(([n]) => n === name)) report(false, `${name}(): listed as public but not exposed`);
  }
  for (const [name, def] of rpcs) {
    const allowed = Object.hasOwn(PUBLIC_FUNCTIONS, name);
    const params = def.post?.parameters?.find((p) => p.in === "body")?.schema?.properties ?? {};
    const args = allowed
      ? PUBLIC_FUNCTIONS[name]
      : Object.fromEntries(Object.keys(params).map((p) => [p, null]));
    const call = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const body = await call.text();
    if (allowed) {
      report(call.ok, `${name}(): anon can EXECUTE`, `HTTP ${call.status}`);
      continue;
    }
    let message = body;
    try {
      message = JSON.parse(body).message ?? body;
    } catch {
      // not JSON — keep the raw body
    }
    const refused = !call.ok && message === `permission denied for function ${name}`;
    report(refused, `${name}(): anon EXECUTE is refused`, `HTTP ${call.status}${refused ? "" : `: ${message.slice(0, 120)}`}`);
  }
}

// is_public_drive_file must tell the two kinds of file apart when anon asks:
// yes for a photo the public site shows, no for an internal attachment the
// photo proxy also knows (a blood-test or procedure file). Skipped, not
// failed, when the database has no such file to ask about.
async function anonIsPublic(fileId) {
  const call = await fetch(`${url}/rest/v1/rpc/is_public_drive_file`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ p_drive_file_id: fileId }),
  });
  return call.ok ? call.json() : `HTTP ${call.status}`;
}
const publicPhoto = await fetch(`${url}/rest/v1/public_resident_photos?select=drive_file_id&limit=1`, { headers })
  .then((r) => (r.ok ? r.json() : []))
  .then((rows) => rows[0]?.drive_file_id);
if (publicPhoto) {
  const answer = await anonIsPublic(publicPhoto);
  report(answer === true, "is_public_drive_file(): yes for a public resident photo", String(answer));
} else {
  console.log("skip  is_public_drive_file(): no public resident photo to ask about");
}
const internalFile = await fetch(
  `${url}/rest/v1/attachments?select=drive_file_id&owner_type=in.(blood_test,procedure)&limit=1`,
  { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
)
  .then((r) => (r.ok ? r.json() : []))
  .then((rows) => rows[0]?.drive_file_id);
if (internalFile) {
  const answer = await anonIsPublic(internalFile);
  report(answer === false, "is_public_drive_file(): no for a blood-test/procedure file", String(answer));
} else {
  console.log("skip  is_public_drive_file(): no blood-test or procedure file to ask about");
}

console.log(`\nProject: ${new URL(url).hostname}`);
process.exit(failed ? 1 : 0);
