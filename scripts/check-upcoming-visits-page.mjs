// /upcoming-visits against DEV and a running dev server:
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-vet-visits-page.mjs [http://localhost:<port>]
//
// The one harm this page can do is show fewer visits than exist, so the main check is a count:
// the Edit links on the page, as a Management login sees it, must be exactly the Scheduled,
// unarchived rows of clinic_visits (Completed and Cancelled are hidden by default). The
// negative logins matter as much, because a widened read shows on nobody's screen: a doctor
// (own-clinic scope), a public viewer and a login with no role must not get the page.
//
// Every login is deleted at the end, whatever happened. Exits 0 when every expectation held.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { giveRole } from "./lib/user-role.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("refusing: not the dev project");

const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const tag = randomBytes(4).toString("hex");
const password = randomBytes(18).toString("base64url");

async function signInCookies(email) {
  const jar = new Map();
  const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

async function page(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

const editIds = (html) =>
  new Set([...html.matchAll(/href="\/clinic-visits\/([0-9a-f-]{36})\/edit"/g)].map((m) => m[1]));

const made = [];
async function login(roleKey) {
  const email = `harness-vetvisits-${roleKey ?? "none"}-${tag}@example.invalid`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  made.push(data.user.id);
  if (roleKey) {
    const { error: roleError } = await giveRole(service, data.user.id, roleKey);
    if (roleError) throw roleError;
  }
  return signInCookies(email);
}

try {
  const { data: scheduled, error: dbError } = await service
    .from("clinic_visits")
    .select("id")
    .is("archived_at", null)
    .eq("status", "scheduled");
  if (dbError) throw dbError;
  const expected = new Set(scheduled.map((r) => r.id));
  console.log(`  dev has ${expected.size} scheduled, unarchived visit(s)`);

  const mgmt = await page("/upcoming-visits", await login("management"));
  expect(mgmt.status === 200, `management opens /upcoming-visits (${mgmt.status}${mgmt.location ? ` → ${mgmt.location}` : ""})`);
  const shown = editIds(mgmt.html);
  expect(shown.size === expected.size, `page shows ${shown.size} visits, the table has ${expected.size} (exact)`);
  expect([...expected].every((id) => shown.has(id)), "every scheduled visit in the table is on the page");
  expect([...shown].every((id) => expected.has(id)), "nothing on the page is outside the table's scheduled set");

  for (const roleKey of ["doctor", "public_viewer", null]) {
    const res = await page("/upcoming-visits", await login(roleKey));
    const refused = res.status !== 200 || editIds(res.html).size === 0 && !res.html.includes("Every visit booked at every clinic");
    expect(refused, `${roleKey ?? "a login with no role"} does not get the page (${res.status}${res.location ? ` → ${res.location}` : ""})`);
    expect(editIds(res.html).size === 0, `${roleKey ?? "no role"}: no visit links in the response`);
  }
} finally {
  for (const id of made) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.error(`  could not delete ${id}: ${error.message}`);
  }
  console.log(`  deleted ${made.length} throwaway login(s)`);
}

if (failures.length) {
  console.error(`\n${failures.length} expectation(s) failed.`);
  process.exit(1);
}
console.log("\nAll expectations held.");
