// "Scan a chip" end to end, through the page, against DEV and a running dev
// server (dry run 2026-10-03, F-02: the page's chip test had lost its
// backslashes, so a chip that was in the database was never looked up and the
// answer was "0 residents"):
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-chip-scan.mjs [http://localhost:<port>]
//
// The base URL defaults to this checkout's .port. This makes a throwaway
// staff login and a throwaway resident carrying a random 15-digit chip, then
// fetches /residents?q=… as that staff member and checks:
//
//   - the bare chip redirects to the resident's own page,
//   - the same chip typed in groups (spaces, dashes) does too,
//   - an unknown chip stays on the list and says no resident has it,
//     with the "new resident with this chip" link,
//   - a name is still a name search (no redirect, no chip message).
//
// The resident and the login are deleted at the end, whatever happened.
// Exits 0 when every expectation held.
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
const email = `harness-chip-staff-${tag}@example.invalid`;
const password = randomBytes(18).toString("base64url");
const name = `Harness Chip ${tag}`;
// 999 is not a manufacturer code in use here; the rest is random, so a re-run never collides.
const chip = `999${digits(12)}`;
const unknownChip = `998${digits(12)}`;

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

  const { data: r, error: rErr } = await service
    .from("residents")
    .insert({ name, microchip_number: chip })
    .select("id, microchip_number")
    .single();
  if (rErr) throw rErr;
  residentId = r.id;
  // The first half of F-02's diagnosis: the write stores the chip as digits, so the search is what was broken.
  expect(r.microchip_number === chip, `the chip is stored as 15 digits (${r.microchip_number})`);

  const cookie = await signInCookies();
  const hub = `/residents/${residentId}`;

  const bare = await page(`/residents?q=${chip}`, cookie);
  expect(
    goesTo(bare, hub),
    `a scanned chip goes to the resident (${bare.status} → ${bare.location})`,
  );

  const grouped = chip.replace(/(\d{3})(?=\d)/g, "$1 ");
  const spaced = await page(`/residents?q=${encodeURIComponent(grouped)}`, cookie);
  expect(
    goesTo(spaced, hub),
    `a chip typed in groups goes to the resident ("${grouped}")`,
  );

  const dashed = await page(`/residents?q=${encodeURIComponent(chip.replace(/(\d{3})(?=\d)/g, "$1-"))}`, cookie);
  expect(
    goesTo(dashed, hub),
    "a chip typed with dashes goes to the resident",
  );

  const unknown = await page(`/residents?q=${unknownChip}`, cookie);
  expect(unknown.status === 200, `an unknown chip stays on the list (${unknown.status})`);
  expect(unknown.html.includes(`No resident has microchip ${unknownChip}`), "it says no resident has that chip");
  expect(unknown.html.includes(`/residents/new?chip=${unknownChip}`), "it offers a new resident with that chip");

  const byName = await page(`/residents?q=${encodeURIComponent(name)}`, cookie);
  expect(byName.status === 200, `a name is still a name search (${byName.status})`);
  expect(byName.html.includes(name), "the resident is listed by name");
  expect(!byName.html.includes("No resident has microchip"), "a name never gets the chip message");
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
