// The residents list's Unallocated and status chips, through the page, against DEV and a running
// dev server (2026-10-08: the "Status" zone chip listed the adopted with the unallocated):
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-residents-status-chips.mjs [http://localhost:<port>]
//
// Makes a throwaway staff login and a throwaway resident with a random chip, picks one real
// resident of each status from dev, then fetches /residents as that staff member and checks:
//
//   - the Lifecycle zone is no longer a zone chip, and an old link to it means Unallocated,
//   - Unallocated lists the unassigned and not the adopted, fostered or hospitalised,
//   - each status chip lists only its own status, and ?adopted=1 still means Adopted,
//   - a name search under Unallocated says how many adopted / fostered / in hospital match,
//   - a chip typed into Search with a zone picked still goes to the resident,
//   - the spreadsheet download follows the status chip.
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

const tag = randomBytes(4).toString("hex");
const email = `harness-status-chips-${tag}@example.invalid`;
const password = randomBytes(18).toString("base64url");
const chip = `999${Array.from({ length: 12 }, () => randomInt(0, 10)).join("")}`;

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
  return {
    status: res.status,
    location: res.headers.get("location"),
    disposition: res.headers.get("content-disposition") ?? "",
    html: await res.text(),
  };
}

/** A resident's link on the list: their hub's href, which no other row carries. */
const lists = (html, id) => html.includes(`/residents/${id}"`);

let userId = null;
let residentId = null;
try {
  // One real resident per status, from dev's own rows.
  const sample = {};
  for (const status of ["Unassigned", "Adopted", "Fostered", "Hospitalised"]) {
    const { data } = await service
      .from("resident_list_view")
      .select("resident_id, name, zone_name")
      .eq("current_status", status)
      .order("name")
      .limit(1);
    sample[status] = data?.[0] ?? null;
    console.log(`  dev has ${sample[status] ? `"${sample[status].name}" (zone ${sample[status].zone_name})` : "no resident"} as ${status}`);
  }
  const { data: zones } = await service.from("zones").select("id, name");
  const lifecycle = zones.find((z) => z.name === "Lifecycle");
  const physical = zones.find((z) => z.name !== "Lifecycle");
  // The item's diagnosis, confirmed on dev: all four statuses sit in the Lifecycle zone.
  expect(
    Object.values(sample).filter(Boolean).every((r) => r.zone_name === "Lifecycle"),
    "every unassigned, adopted, fostered and hospitalised sample is in the Lifecycle zone",
  );

  const { data: u, error: uErr } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (uErr) throw uErr;
  userId = u.user.id;
  const { error: roleErr } = await service.from("user_roles").insert({ user_id: userId, role: "staff" });
  if (roleErr) throw roleErr;
  const { data: r, error: rErr } = await service
    .from("residents")
    .insert({ name: `Harness Status ${tag}`, microchip_number: chip })
    .select("id")
    .single();
  if (rErr) throw rErr;
  residentId = r.id;
  const cookie = await signInCookies();

  const everywhere = await page("/residents", cookie);
  expect(everywhere.status === 200, `the list opens (${everywhere.status})`);
  expect(!everywhere.html.includes(`zone=${lifecycle.id}`), "the Lifecycle zone is not offered as a zone chip");
  expect(everywhere.html.includes("unallocated=1"), "an Unallocated chip is offered");
  for (const s of ["adopted", "fostered", "hospitalised"]) {
    expect(everywhere.html.includes(`status=${s}`), `a ${s} chip is offered`);
  }

  const offSite = await page("/residents?place=external", cookie);
  expect(!offSite.html.includes("unallocated=1"), "Off-site does not offer Unallocated");

  for (const path of ["/residents?unallocated=1", `/residents?zone=${lifecycle.id}`]) {
    const res = await page(path, cookie);
    if (sample.Unassigned) expect(lists(res.html, sample.Unassigned.resident_id), `${path} lists the unassigned`);
    for (const s of ["Adopted", "Fostered", "Hospitalised"]) {
      if (sample[s]) expect(!lists(res.html, sample[s].resident_id), `${path} leaves out the ${s.toLowerCase()}`);
    }
  }

  for (const [path, own] of [
    ["/residents?status=adopted", "Adopted"],
    ["/residents?adopted=1", "Adopted"],
    ["/residents?status=fostered", "Fostered"],
    ["/residents?status=hospitalised", "Hospitalised"],
  ]) {
    const res = await page(path, cookie);
    for (const s of ["Unassigned", "Adopted", "Fostered", "Hospitalised"]) {
      if (!sample[s]) continue;
      expect(lists(res.html, sample[s].resident_id) === (s === own), `${path} ${s === own ? "lists" : "leaves out"} the ${s.toLowerCase()}`);
    }
  }

  // A search that matches a filtered-out status says so.
  for (const [s, words] of [
    ["Adopted", "adopted resident"],
    ["Fostered", "fostered resident"],
    ["Hospitalised", "in hospital match"],
  ]) {
    if (!sample[s]) continue;
    const res = await page(`/residents?unallocated=1&q=${encodeURIComponent(sample[s].name)}`, cookie);
    expect(res.html.includes(words), `a name search under Unallocated says a ${s.toLowerCase()} resident matches`);
  }

  // A chip reader fired into Search, with a zone picked, still jumps.
  const scanned = await page(`/residents?zone=${physical.id}&q=${chip}`, cookie);
  const hub = `/residents/${residentId}`;
  expect(
    (scanned.status >= 300 && scanned.status < 400 && (scanned.location ?? "").endsWith(hub)) ||
      new RegExp(`NEXT_REDIRECT[^"]*${hub}|url=${hub}`).test(scanned.html),
    "a chip typed into Search with a zone picked goes to the resident",
  );

  const file = await page("/residents/export?status=fostered", cookie);
  expect(file.status === 200 && /residents-fostered-/.test(file.disposition), `the download is named for the chip (${file.disposition})`);
  if (sample.Fostered) expect(file.html.includes(sample.Fostered.name), "the download holds the fostered resident");
  if (sample.Adopted) expect(!file.html.includes(sample.Adopted.name), "the download leaves out the adopted");
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
