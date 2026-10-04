// Resident ID search through the page, against DEV and a running dev server
// (dry run 2026-10-03, F-13: "R-0055" and "0055" found the resident, "R0055" —
// how the manual and checklist wrote IDs — found nothing):
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-resident-id-search.mjs [http://localhost:<port>]
//
// Makes a throwaway staff login and resident, then fetches /residents?q=… and
// checks that every spelling of the resident's code lists it, and that a code
// that belongs to nobody lists nothing. Both are deleted at the end.
import { randomBytes, randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const digits = (n) => Array.from({ length: n }, () => randomInt(0, 10)).join("");
const tag = randomBytes(4).toString("hex");
const email = `harness-idsearch-staff-${tag}@example.invalid`;
const password = randomBytes(18).toString("base64url");
const name = `Harness IdSearch ${tag}`;

async function signInCookies() {
  const jar = new Map();
  const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([n, value]) => ({ name: n, value })),
      setAll: (list) => list.forEach(({ name: n, value }) => (value ? jar.set(n, value) : jar.delete(n))),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

/** A 3xx before anything streams; once loading.tsx has started the stream, Next sends a 200 whose body carries the redirect. Either way. */
const goesTo = (res, hub) =>
  (res.status >= 300 && res.status < 400 && (res.location ?? "").endsWith(hub)) ||
  new RegExp(`NEXT_REDIRECT[^"]*${hub}|url=${hub}`).test(res.html);

async function page(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

let userId = null;
let residentId = null;
try {
  const { data: u, error: uErr } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (uErr) throw uErr;
  userId = u.user.id;
  const { error: roleErr } = await service.from("user_roles").insert({ user_id: userId, role: "staff" });
  if (roleErr) throw roleErr;
  const { data: r, error: rErr } = await service.from("residents").insert({ name }).select("id, resident_code").single();
  if (rErr) throw rErr;
  residentId = r.id;
  const code = r.resident_code;
  expect(/^R-[0-9]{4,}$/.test(code), `the stored code is hyphenated (${code})`);
  const num = code.slice(2);
  const cookie = await signInCookies();
  const lists = async (q) => (await page(`/residents?q=${encodeURIComponent(q)}`, cookie)).html.includes(name);
  for (const q of [code, code.toLowerCase(), code.replace("-", ""), code.replace("-", " "), `  ${code.replace("-", "")} `, num])
    expect(await lists(q), `"${q}" lists the resident`);
  expect(!(await lists("R-99999999")), "a code that is nobody's lists nothing");
  expect(await lists(name), "the name still finds the resident");
} finally {
  if (residentId) {
    const { error } = await service.from("residents").delete().eq("id", residentId);
    if (error) console.error(`  could not delete resident ${residentId}: ${error.message}`);
  }
  if (userId) {
    const { error } = await service.auth.admin.deleteUser(userId);
    if (error) console.error(`  could not delete login ${userId}: ${error.message}`);
  }
  console.log("  deleted the throwaway resident and login");
}

if (failures.length) {
  console.error(`\n${failures.length} expectation(s) failed.`);
  process.exit(1);
}
console.log("\nAll expectations held.");
