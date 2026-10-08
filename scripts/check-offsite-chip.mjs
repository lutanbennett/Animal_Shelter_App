// enclosures-offsite-chip (2026-10-08): one Off-site chip for every zone with internal = false,
// and no Everywhere / On-site / Off-site row, on /enclosures and /residents.
//
//   node scripts/worktree.mjs dev                         (another terminal)
//   node scripts/check-offsite-chip.mjs [http://localhost:<port>]
//
// The item's one instruction not to get wrong is "do not hard-code Offsite, Orchard and Village",
// and a list of names would pass on dev's own zones. So this makes a NEW off-site zone, with a
// name no code has seen, an enclosure in it and a resident in that, then checks:
//   - neither page offers that zone as a chip of its own, and both offer one Off-site chip;
//   - ?zone=offsite lists its enclosure and its resident, and leaves out an on-site one;
//   - the old links still land: ?place=external → ?zone=offsite, ?place=internal → the on-site
//     zones (and, on /residents, Unallocated), an off-site zone's own id → ?zone=offsite;
//   - the place row is gone (no ?place= link on either page).
// Against DEV only. A throwaway staff login, the zone, enclosure and resident are deleted at the
// end, whatever happened. Exit 0: every expectation held. Exit 1: one did not.
import { randomBytes } from "node:crypto";
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

const tag = randomBytes(4).toString("hex");
const NAME = `Harness Offsite ${tag}`;
const email = `harness-offsite-chip-${tag}@example.invalid`;
const password = randomBytes(18).toString("base64url");

async function insert(table, row) {
  const { data, error } = await service.from(table).insert(row).select("id").single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

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

async function page(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  const html = await res.text();
  // A page that redirects after it has started streaming answers 200 and carries the target in
  // the body (NEXT_REDIRECT;replace;<url>;307;), which is what the browser follows.
  const streamed = html.match(/NEXT_REDIRECT;(?:replace|push);(.+?);30[78];/)?.[1]?.replaceAll("&amp;", "&") ?? null;
  return { status: res.status, location: res.headers.get("location") ?? streamed ?? "", redirected: Boolean(res.headers.get("location") || streamed), html };
}

const made = { userId: null, zone: null, onZone: null, residents: [] };
try {
  const { data: u, error: uErr } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (uErr) throw uErr;
  made.userId = u.user.id;
  const { error: roleErr } = await service.from("user_roles").insert({ user_id: made.userId, role: "staff" });
  if (roleErr) throw roleErr;

  made.zone = (await insert("zones", { name: `${NAME} Zone`, internal: false })).id;
  const pen = await insert("enclosures", { name: `${NAME} Pen`, zone_id: made.zone, capacity: 3 });
  made.onZone = (await insert("zones", { name: `${NAME} On-site Zone`, internal: true })).id;
  const onPen = await insert("enclosures", { name: `${NAME} On-site Pen`, zone_id: made.onZone, capacity: 3 });
  const away = await insert("residents", { name: `${NAME} Away` });
  made.residents.push(away.id);
  await insert("placement_history", { resident_id: away.id, placement_type: "Intake", zone_id: made.zone, enclosure_id: pen.id });
  const home = await insert("residents", { name: `${NAME} Home` });
  made.residents.push(home.id);
  await insert("placement_history", { resident_id: home.id, placement_type: "Intake", zone_id: made.onZone, enclosure_id: onPen.id });
  console.log(`  made off-site zone "${NAME} Zone" with one enclosure and one resident, and an on-site twin`);

  const cookie = await signInCookies();

  for (const path of ["/enclosures", "/residents"]) {
    const res = await page(path, cookie);
    expect(res.status === 200, `${path} opens (${res.status})`);
    expect(!res.html.includes(`zone=${made.zone}`), `${path} offers no chip of the new off-site zone's own`);
    expect(res.html.includes(`zone=${made.onZone}`), `${path} offers the new on-site zone as a chip`);
    expect(res.html.includes("zone=offsite"), `${path} offers the Off-site chip`);
    expect(!/[?&;]place=/.test(res.html), `${path} has no Everywhere / On-site / Off-site links`);
  }

  const encl = await page("/enclosures?zone=offsite", cookie);
  expect(encl.html.includes(`/enclosures/${pen.id}"`), "/enclosures?zone=offsite lists the new zone's enclosure");
  expect(!encl.html.includes(`/enclosures/${onPen.id}"`), "/enclosures?zone=offsite leaves out the on-site enclosure");
  const both = await page(`/enclosures?zone=${made.onZone},offsite`, cookie);
  expect(
    both.html.includes(`/enclosures/${pen.id}"`) && both.html.includes(`/enclosures/${onPen.id}"`),
    "an on-site zone picked with Off-site adds to it",
  );

  const res = await page("/residents?zone=offsite", cookie);
  expect(res.html.includes(`/residents/${away.id}"`), "/residents?zone=offsite lists the resident in the new zone");
  expect(!res.html.includes(`/residents/${home.id}"`), "/residents?zone=offsite leaves out the on-site resident");

  for (const [path, want, what] of [
    ["/enclosures?place=external", /^\/enclosures\?zone=offsite$/, "old Off-site link → the Off-site chip"],
    ["/residents?place=external", /^\/residents\?zone=offsite$/, "old Off-site link → the Off-site chip"],
    [`/enclosures?zone=${made.zone}`, /^\/enclosures\?zone=offsite$/, "an off-site zone's own id (an enclosure's back link) → the Off-site chip"],
    ["/enclosures?place=internal", new RegExp(`zone=[^&]*${made.onZone}`), "old On-site link → the on-site zones"],
    ["/residents?place=internal", /unallocated=1/, "old On-site link → on-site zones and Unallocated"],
  ]) {
    const r = await page(path, cookie);
    const location = decodeURIComponent(r.location.replace(base, ""));
    expect(r.redirected && want.test(location) && !location.includes("place="), `${path}: ${what} (${location.length > 90 ? `${location.slice(0, 40)}…${location.slice(-40)}` : location})`);
  }
  const onSite = decodeURIComponent((await page("/enclosures?place=internal", cookie)).location);
  expect(!onSite.includes(made.zone) && !onSite.includes("offsite"), "old On-site link picks no off-site zone");
} finally {
  for (const id of made.residents) {
    await service.from("placement_history").delete().eq("resident_id", id);
    const { error } = await service.from("residents").delete().eq("id", id);
    if (error) console.error(`  could not delete resident ${id}: ${error.message}`);
  }
  for (const zone of [made.zone, made.onZone].filter(Boolean)) {
    await service.from("enclosures").delete().eq("zone_id", zone);
    const { error } = await service.from("zones").delete().eq("id", zone);
    if (error) console.error(`  could not delete zone ${zone}: ${error.message}`);
  }
  if (made.userId) {
    const { error } = await service.auth.admin.deleteUser(made.userId);
    if (error) console.error(`  could not delete login ${made.userId}: ${error.message}`);
  }
  console.log("  deleted the throwaway zones, enclosures, residents and login");
}

if (failures.length) {
  console.error(`\n${failures.length} expectation(s) failed.`);
  process.exit(1);
}
console.log("\nAll expectations held.");
