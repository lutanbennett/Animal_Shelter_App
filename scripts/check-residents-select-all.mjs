// The residents list's Select all box, in a real browser against DEV and a running dev server:
//
//   node scripts/worktree.mjs dev                                      (another terminal)
//   node scripts/check-residents-select-all.mjs [http://localhost:<port>]
//   node scripts/check-residents-select-all.mjs --keep                 (leave the rows and login in dev)
//   node scripts/check-residents-select-all.mjs --clean                (remove what a killed run left)
//
// What it asserts (docs/decisions/2026-10-09-residents-select-all.md):
//   - pick a zone, tick Select all: every resident listed is ticked and Book clinic visit carries
//     every one of them; the box shows a dash when only some are ticked, and unticks them all;
//   - change the zones on the client (the chips): ticks still listed stay, ticks no longer listed
//     are dropped from the links and the page says how many — nothing acts on a resident unseen;
//   - Select all leaves the adopted and the deceased out, and says how many.
// Dev only: it refuses any other Supabase project. Exit 0 all passed, 1 a check failed, 2 could not run.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright-core";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);

const args = process.argv.slice(2);
const KEEP = args.includes("--keep");

const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") bail(`refusing: ${projectRef(env)} is not the dev project`);
const base = (args.find((a) => /^https?:/.test(a)) ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`).replace(/\/$/, "");
const supaUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(supaUrl, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const tag = randomBytes(4).toString("hex");
const NAME = `ZZ SelectAll ${tag}`;
const made = { users: [], seed: [], admin: null };

function bail(message) {
  console.error(`check-residents-select-all: ${message}`);
  process.exit(2);
}

if (args.includes("--clean")) {
  await sweep();
  process.exit(0);
}

try {
  await fetch(`${base}/login`, { redirect: "manual" });
} catch {
  bail(`nothing is answering at ${base}. Start it: node scripts/worktree.mjs dev`);
}

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "  ok  " : "  FAIL"} ${label}${ok ? "" : detail ? `: ${detail}` : ""}`);
  if (!ok) failures += 1;
}

let exitCode = 0;
try {
  const seeded = await seed();
  const cookie = await account("admin");
  exitCode = (await run(seeded, cookie)) ? 2 : failures ? 1 : 0;
} catch (error) {
  console.error(error);
  exitCode = 2;
} finally {
  if (KEEP) console.log(`\n--keep: rows named "${NAME}…" and ${made.users.length} login(s) are left in dev.`);
  else await cleanup();
}
process.exit(exitCode);

async function insert(table, row) {
  const { data, error } = await service.from(table).insert(row).select().single();
  if (error) throw new Error(`seeding ${table}: ${error.message}`);
  made.seed.push([table, data.id]);
  return data;
}

async function resident(label, placements) {
  const row = await insert("residents", { name: `${NAME} ${label}`, species: "Dog", sex: "Female" });
  for (const placement of placements) await insert("placement_history", { resident_id: row.id, ...placement });
  return row.id;
}

/** Zone A: three living residents. Zone B: one. Beside them, one adopted and one deceased. */
async function seed() {
  const zoneA = await insert("zones", { name: `${NAME} Zone A`, internal: true });
  const zoneB = await insert("zones", { name: `${NAME} Zone B`, internal: true });
  const penA = await insert("enclosures", { name: `${NAME} Pen A`, zone_id: zoneA.id, capacity: 6 });
  const penB = await insert("enclosures", { name: `${NAME} Pen B`, zone_id: zoneB.id, capacity: 6 });
  const intakeA = { placement_type: "Intake", zone_id: zoneA.id, enclosure_id: penA.id };
  const a = [await resident("Alpha", [intakeA]), await resident("Bravo", [intakeA]), await resident("Charlie", [intakeA])];
  const b = await resident("Delta", [{ placement_type: "Intake", zone_id: zoneB.id, enclosure_id: penB.id }]);
  // The status is read from the enclosure a placement points at: Lifecycle's Adopted or Deceased.
  const { data: lifecycle, error } = await service
    .from("enclosures")
    .select("id, name, zone_id, zones!inner(name)")
    .eq("zones.name", "Lifecycle")
    .in("name", ["Adopted", "Deceased"]);
  if (error) throw new Error(`reading the Lifecycle enclosures: ${error.message}`);
  const to = (name) => {
    const e = lifecycle.find((row) => row.name === name);
    if (!e) throw new Error(`no Lifecycle → ${name} enclosure in dev`);
    return { zone_id: e.zone_id, enclosure_id: e.id };
  };
  const adopted = await resident("Echo", [intakeA, { placement_type: "Adopt", ...to("Adopted") }]);
  const deceased = await resident("Foxtrot", [intakeA, { placement_type: "Deceased", ...to("Deceased") }]);
  return { zoneA: zoneA.id, zoneB: zoneB.id, a, b, adopted, deceased };
}

async function account(role) {
  const email = `selectall-${role}-${tag}@example.invalid`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Select all ${role}` } });
  if (error) throw new Error(`creating the ${role} login: ${error.message}`);
  made.users.push(data.user.id);
  const { error: roleError } = await service.from("user_roles").insert({ user_id: data.user.id, role });
  if (roleError) throw new Error(`giving the ${role} login its role: ${roleError.message}`);

  const jar = new Map();
  const ssr = createServerClient(supaUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error: signInError } = await ssr.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`signing in as ${email}: ${signInError.message}`);
  // Kept to withdraw the seeded death at cleanup: only an admin may, and the lock blocks a delete.
  if (role === "admin") made.admin = ssr;
  return [...jar].map(([name, value]) => ({ name, value }));
}

/** The ids in the Book clinic visit link, sorted; [] when it carries none. */
async function bookingIds(page) {
  const href = await page.locator('a[href^="/clinic-visits/new"]').first().getAttribute("href");
  const ids = new URL(href, base).searchParams.get("residentIds");
  return ids ? ids.split(",").sort() : [];
}

function same(x, y) {
  return JSON.stringify([...x].sort()) === JSON.stringify([...y].sort());
}

/** Returns true when it could not run (no browser), so the caller exits 2 rather than 0. */
async function run(s, cookies) {
  let browser;
  for (const channel of ["msedge", "chrome"]) {
    try {
      browser = await chromium.launch({ channel, headless: true });
      break;
    } catch {
      /* try the next */
    }
  }
  if (!browser) {
    console.error("  could not run: no Edge or Chrome to drive");
    return true;
  }
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([...cookies, { name: "locale", value: "en" }].map((c) => ({ ...c, url: base })));
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => message.type() === "error" && consoleErrors.push(message.text()));
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    const header = page.locator("thead input[type=checkbox]");
    const rowBoxes = page.locator("tbody input[type=checkbox]");
    const ticked = () => page.locator("tbody input[type=checkbox]:checked").count();

    console.log("pick zone A, Select all:");
    await page.goto(`${base}/residents?zone=${s.zoneA}`, { waitUntil: "networkidle" });
    check("zone A lists its three residents", (await rowBoxes.count()) === 3, `${await rowBoxes.count()} rows`);
    check("the box is labelled with the count", (await header.getAttribute("aria-label")) === "Select all 3 residents shown", await header.getAttribute("aria-label"));
    await header.click();
    check("every row is ticked", (await ticked()) === 3, `${await ticked()} ticked`);
    check("Book clinic visit carries every one", same(await bookingIds(page), s.a), (await bookingIds(page)).join(","));
    check("the count says 3 selected", (await page.getByText("3 selected").count()) > 0);

    console.log("some, then none:");
    await rowBoxes.first().click();
    check("one unticked: the box shows a dash", await header.evaluate((el) => el.indeterminate && !el.checked));
    await header.click();
    check("ticking it again ticks all three", (await ticked()) === 3 && !(await header.evaluate((el) => el.indeterminate)));
    await header.click();
    check("and again unticks them all", (await ticked()) === 0 && (await bookingIds(page)).length === 0);

    console.log("change the zones with the chips:");
    await header.click();
    await page.locator(`a[href*="${s.zoneB}"]`).first().click();
    await page.waitForURL((url) => url.searchParams.get("zone")?.includes(s.zoneB) ?? false);
    await page.waitForLoadState("networkidle");
    check("zone A and B: four rows", (await rowBoxes.count()) === 4, `${await rowBoxes.count()} rows`);
    check("the three still listed stay ticked", same(await bookingIds(page), s.a), (await bookingIds(page)).join(","));
    // Take zone A off: its chip's link is the one whose zones are B alone.
    await page.locator(`a[href*="zone=${s.zoneB}"]:not([href*="${s.zoneA}"])`).first().click();
    await page.waitForURL((url) => url.searchParams.get("zone") === s.zoneB);
    await page.waitForLoadState("networkidle");
    check("zone B alone: one row", (await rowBoxes.count()) === 1, `${await rowBoxes.count()} rows`);
    check("no ticks are left on the hidden residents", (await bookingIds(page)).length === 0, (await bookingIds(page)).join(","));
    check("the page says so", (await page.getByText("3 ticked residents are no longer in the list").count()) > 0);

    console.log("adopted and deceased left out:");
    await page.goto(`${base}/residents?q=${encodeURIComponent(NAME)}&all=1`, { waitUntil: "networkidle" });
    check("the search with Show all lists all six", (await rowBoxes.count()) === 6, `${await rowBoxes.count()} rows`);
    const label = await header.getAttribute("aria-label");
    check("the label says two are left out", label === "Select all 4 residents shown (2 adopted or deceased left out)", label);
    await header.click();
    check("Book clinic visit carries the four living, not the other two", same(await bookingIds(page), [...s.a, s.b]), (await bookingIds(page)).join(","));
    check("the count line says two were not ticked", (await page.getByText("2 adopted or deceased not ticked").count()) > 0);
    check("the box reads as all ticked", (await header.isChecked()) && !(await header.evaluate((el) => el.indeterminate)));
    check("no console errors on the residents list", consoleErrors.length === 0, consoleErrors.join(" | "));

    console.log("the manual:");
    await page.goto(`${base}/manual`, { waitUntil: "networkidle" });
    check("the residents topic explains Select all", (await page.getByText("tick the box at the top of the tick column").count()) > 0);
  } finally {
    await browser.close();
  }
  return false;
}

/** A deceased resident is read-only to everyone (0026); withdrawing the death, as an admin, unlocks it. */
async function undoDeaths(ids) {
  for (const id of ids) {
    const { data } = await service.from("resident_list_view").select("current_status").eq("resident_id", id).maybeSingle();
    if (data?.current_status !== "Deceased") continue;
    const { error } = await made.admin.rpc("undo_deceased_placement", { p_resident_id: id, p_reason: "check-residents-select-all test row" });
    if (error) console.warn(`  cleanup: could not withdraw the seeded death ${id}: ${error.message}`);
  }
}

async function cleanup() {
  if (made.admin) await undoDeaths(made.seed.filter(([t]) => t === "residents").map(([, i]) => i));
  for (const id of made.seed.filter(([t]) => t === "residents").map(([, i]) => i)) {
    await service.from("placement_history").delete().eq("resident_id", id);
  }
  for (const [table, id] of [...made.seed].reverse()) {
    if (table === "placement_history") continue;
    const { error } = await service.from(table).delete().eq("id", id);
    if (error) console.warn(`  cleanup: could not delete ${table} ${id}: ${error.message}`);
  }
  for (const id of made.users) {
    await service.from("user_roles").delete().eq("user_id", id);
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.warn(`  cleanup: could not delete login ${id}: ${error.message}`);
  }
}

/** --clean: everything a run made carries "ZZ SelectAll" or "selectall-", so a killed run can be swept. */
async function sweep() {
  const { data: residents } = await service.from("residents").select("id").like("name", "%ZZ SelectAll %");
  if (residents?.length) {
    await account("admin");
    await undoDeaths(residents.map((r) => r.id));
  }
  for (const { id } of residents ?? []) await service.from("placement_history").delete().eq("resident_id", id);
  for (const table of ["residents", "enclosures", "zones"]) {
    const { data, error } = await service.from(table).delete().like("name", "%ZZ SelectAll %").select("id");
    console.log(`  ${table}: ${error ? error.message : `${data.length} removed`}`);
  }
  const { data } = await service.auth.admin.listUsers({ perPage: 200 });
  for (const user of data?.users.filter((u) => u.email?.startsWith("selectall-")) ?? []) {
    await service.from("user_roles").delete().eq("user_id", user.id);
    await service.auth.admin.deleteUser(user.id);
    console.log(`  login ${user.email} removed`);
  }
}
