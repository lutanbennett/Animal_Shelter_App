// The residents spreadsheet check: seeds a few residents in DEV, signs in as an admin and as a
// volunteer through the app's own SSR client, downloads /residents/export and checks the file.
//
//   node scripts/worktree.mjs dev                                   (another terminal)
//   node scripts/check-residents-export.mjs [http://localhost:<port>]
//   node scripts/check-residents-export.mjs --keep                  (leave the rows and logins in dev)
//   node scripts/check-residents-export.mjs --clean                 (remove what a killed run left)
//
// What it asserts, and why each one is here (docs/decisions/2026-10-06-residents-spreadsheet.md):
//   - the UTF-8 BOM is there and a Thai name arrives intact (Excel reads it as UTF-8 only with it);
//   - a name that opens with "=" is written as text, never a formula (CODE-4);
//   - a resident with no prescription, visit, diet or weight still has a row: count 0, blanks;
//   - the filters are the page's: search, place, Show all, and ticked ids narrow the file;
//   - a volunteer's file has the who-and-where columns and no others, and none of the rows' extras.
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
const NAME = `ZZ Export ${tag}`;
const made = { users: [], seed: [] };

function bail(message) {
  console.error(`check-residents-export: ${message}`);
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
  const ids = await seed();
  const admin = await account("admin");
  const volunteer = await account("volunteer");
  await run(ids, admin, volunteer);
  exitCode = failures ? 1 : 0;
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

async function seed() {
  const zone = await insert("zones", { name: `${NAME} Zone` });
  const enclosure = await insert("enclosures", { name: `${NAME} Pen`, zone_id: zone.id, capacity: 4 });
  const vet = await insert("vets", { name: `${NAME} Clinic`, clinic_name: `${NAME} Clinic` });
  const cooper = await insert("residents", {
    name: `${NAME} Cooper`,
    thai_name: "คูเปอร์",
    species: "Dog",
    breed: "Thai Ridgeback",
    sex: "Male",
    size: "Medium",
    colour: "Brindle",
    estimated_age_years: 5,
    age_estimated_on: "2026-01-01",
    intake_date: "2025-11-03",
    ready_for_adoption: true,
  });
  await insert("placement_history", { resident_id: cooper.id, placement_type: "Intake", zone_id: zone.id, enclosure_id: enclosure.id });
  const plain = await insert("residents", { name: `=HYPERLINK("http://example.invalid") ${NAME}`, species: "Cat", sex: "Female" });
  await insert("placement_history", { resident_id: plain.id, placement_type: "Intake", zone_id: zone.id, enclosure_id: enclosure.id });

  // Cooper alone has medical rows; the other resident must still get a row, with a 0 and blanks.
  const medication = await insert("medication", { name: `${NAME} Medication` });
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 9 * 86_400_000).toISOString();
  await insert("prescriptions", { resident_id: cooper.id, medication_id: medication.id, start_date: "2026-01-01" });
  await insert("prescriptions", { resident_id: cooper.id, medication_id: medication.id, start_date: "2025-01-01", end_date: "2025-02-01" });
  await insert("clinic_visits", { resident_id: cooper.id, clinic_id: vet.id, appointment_date: future, status: "scheduled" });
  await insert("weight", { resident_id: cooper.id, date: "2026-02-01", weight_kg: 17.5 });
  await insert("weight", { resident_id: cooper.id, date: today, weight_kg: 18.25 });
  const diet = await insert("diet_types", { name: `${NAME} Diet`, daily_qty_small: 100, daily_qty_medium: 200, daily_qty_large: 300 });
  await insert("resident_diets", { resident_id: cooper.id, diet_type_id: diet.id, start_date: "2026-01-01" });
  return { cooper: cooper.id, plain: plain.id };
}

async function account(role) {
  const email = `resexport-${role}-${tag}@example.invalid`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Export ${role}` } });
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
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function download(cookie, query) {
  const response = await fetch(`${base}/residents/export${query}`, { headers: { cookie }, redirect: "manual" });
  const bytes = new Uint8Array(await response.arrayBuffer());
  // Read the bytes, not response.text(): the latter drops a leading BOM, which is the thing under test.
  const bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
  return { status: response.status, headers: response.headers, text, bom, location: response.headers.get("location") };
}

/** A tiny CSV reader: enough for this file (quotes, doubled quotes, CRLF). */
function parse(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* the \n that follows ends the row */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  return rows;
}

async function run(ids, adminCookie, volunteerCookie) {
  console.log("admin, filtered to the seeded residents:");
  const search = `?q=${encodeURIComponent(NAME)}`;
  const file = await download(adminCookie, search);
  check("answers 200 as a CSV attachment", file.status === 200 && /text\/csv/.test(file.headers.get("content-type") ?? "") && /attachment; filename="residents-filtered-\d{4}-\d{2}-\d{2}\.csv"/.test(file.headers.get("content-disposition") ?? ""), `${file.status} ${file.headers.get("content-disposition")}`);
  check("starts with the UTF-8 BOM", file.bom);
  const rows = parse(file.text.replace(/^﻿/, ""));
  const [header, ...body] = rows.filter((r) => r.length > 1);
  const col = (name) => header.indexOf(name);
  const cooper = body.find((r) => r[col("Name")]?.endsWith("Cooper"));
  const plain = body.find((r) => r[col("Name")]?.includes("HYPERLINK"));
  check("one row per resident", body.length === 2, `${body.length} rows`);
  check("the header names the columns the backlog asked for", ["R-code", "Name", "Thai name", "Other names", "Species", "Breed", "Sex", "Age", "Estimated birth year", "Size", "Colour", "Microchipped", "Zone", "Enclosure", "Status", "Place", "Intake date", "Ready for adoption", "Prescriptions running today", "Next vet visit", "Next vet visit clinic", "Current diet", "Latest weight (kg)", "Latest weight date"].every((h) => col(h) >= 0), header.join("|"));
  check("a Thai name arrives intact", cooper?.[col("Thai name")] === "คูเปอร์", cooper?.[col("Thai name")]);
  check("sex, size, breed and colour are plain values", cooper?.[col("Sex")] === "Male" && cooper?.[col("Size")] === "Medium" && cooper?.[col("Breed")] === "Thai Ridgeback" && cooper?.[col("Colour")] === "Brindle", cooper?.join("|"));
  check("age is the hub's wording and a birth year sorts", /5|6/.test(cooper?.[col("Age")] ?? "") && /^20\d\d$/.test(cooper?.[col("Estimated birth year")] ?? ""), `${cooper?.[col("Age")]} / ${cooper?.[col("Estimated birth year")]}`);
  check("only the running prescription is counted (the ended one is not)", cooper?.[col("Prescriptions running today")] === "1", cooper?.[col("Prescriptions running today")]);
  check("next vet visit has a date and the clinic", /^\d{4}-\d{2}-\d{2}$/.test(cooper?.[col("Next vet visit")] ?? "") && cooper?.[col("Next vet visit clinic")] === `${NAME} Clinic`, `${cooper?.[col("Next vet visit")]} / ${cooper?.[col("Next vet visit clinic")]}`);
  check("current diet and the latest weight (not the older one)", cooper?.[col("Current diet")] === `${NAME} Diet` && cooper?.[col("Latest weight (kg)")] === "18.25", `${cooper?.[col("Current diet")]} / ${cooper?.[col("Latest weight (kg)")]}`);
  check("microchipped and ready for adoption read Yes / No", cooper?.[col("Microchipped")] === "No" && cooper?.[col("Ready for adoption")] === "Yes");
  check("a name that opens with = is text, not a formula", /^'=HYPERLINK/.test(plain?.[col("Name")] ?? ""), plain?.[col("Name")]);
  check("a resident with nothing recorded still has a row: 0 and blanks", plain?.[col("Prescriptions running today")] === "0" && plain?.[col("Next vet visit")] === "" && plain?.[col("Current diet")] === "" && plain?.[col("Latest weight (kg)")] === "", plain?.join("|"));

  console.log("admin, ticked rows and the page's filters:");
  const ticked = await download(adminCookie, `${search}&ids=${ids.cooper}`);
  const tickedBody = parse(ticked.text.replace(/^﻿/, "")).filter((r) => r.length > 1).slice(1);
  check("ids narrows the file to the ticked residents", tickedBody.length === 1 && tickedBody[0][col("Name")]?.endsWith("Cooper"), `${tickedBody.length} rows`);
  check("and the name says so", /filename="residents-selected-filtered-/.test(ticked.headers.get("content-disposition") ?? ""), ticked.headers.get("content-disposition"));
  const offSite = await download(adminCookie, `${search}&zone=offsite`);
  check("the Off-site chip applies (the seeded residents are on site)", parse(offSite.text).filter((r) => r.length > 1).length === 1, "expected the header row only");
  const odd = await download(adminCookie, `${search}&ids=not-an-id,${ids.plain}`);
  const oddBody = parse(odd.text.replace(/^﻿/, "")).filter((r) => r.length > 1).slice(1);
  check("a malformed id is ignored, the good one kept", oddBody.length === 1 && oddBody[0][col("Name")]?.includes("HYPERLINK"), `${oddBody.length} rows`);

  console.log("volunteer, who and where only:");
  const vol = await download(volunteerCookie, search);
  check("answers 200", vol.status === 200, `${vol.status} ${vol.location}`);
  const volRows = parse(vol.text.replace(/^﻿/, "")).filter((r) => r.length > 1);
  const volHeader = volRows[0] ?? [];
  const forbidden = ["Other names", "Breed", "Age", "Estimated birth year", "Size", "Colour", "Microchipped", "Intake date", "Ready for adoption", "Prescriptions running today", "Next vet visit", "Next vet visit clinic", "Current diet", "Latest weight (kg)", "Latest weight date"];
  check("the header is exactly who and where", volHeader.join("|") === "R-code|Name|Thai name|Species|Sex|Zone|Enclosure|Status|Place", volHeader.join("|"));
  check("no column a volunteer cannot read, blank or otherwise", forbidden.every((h) => !volHeader.includes(h)));
  const volCooper = volRows.find((r) => r[1]?.endsWith("Cooper"));
  check("the volunteer's Thai name and place are there", volCooper?.[2] === "คูเปอร์" && volCooper?.[6] === `${NAME} Pen`, volCooper?.join("|"));
  check("none of the medical values leak into a volunteer's file", !/Brindle|Thai Ridgeback|18\.25/.test(vol.text));

  await clickThrough(adminCookie, ids, search);

  console.log("signed out:");
  const out = await download("", search);
  check("is turned away, not given the file", out.status !== 200 && !out.text.includes(NAME), String(out.status));
}

async function cleanup() {
  for (const id of made.seed.filter(([t]) => t === "residents").map(([, i]) => i)) {
    for (const table of ["prescriptions", "clinic_visits", "weight", "resident_diets", "placement_history"]) {
      await service.from(table).delete().eq("resident_id", id);
    }
  }
  for (const [table, id] of [...made.seed].reverse()) {
    const { error } = await service.from(table).delete().eq("id", id);
    if (error) console.warn(`  cleanup: could not delete ${table} ${id}: ${error.message}`);
  }
  for (const id of made.users) {
    await service.from("user_roles").delete().eq("user_id", id);
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.warn(`  cleanup: could not delete login ${id}: ${error.message}`);
  }
}

/** --clean: everything a run made carries "ZZ Export" or "resexport-", so a killed run can be swept. */
async function sweep() {
  const { data: residents } = await service.from("residents").select("id").like("name", "%ZZ Export %");
  for (const { id } of residents ?? []) {
    for (const table of ["prescriptions", "clinic_visits", "weight", "resident_diets", "placement_history"]) {
      await service.from(table).delete().eq("resident_id", id);
    }
  }
  for (const [table, column] of [["residents", "name"], ["diet_types", "name"], ["medication", "name"], ["vets", "name"], ["enclosures", "name"], ["zones", "name"]]) {
    const { data, error } = await service.from(table).delete().like(column, "%ZZ Export %").select("id");
    console.log(`  ${table}: ${error ? error.message : `${data.length} removed`}`);
  }
  const { data } = await service.auth.admin.listUsers({ perPage: 200 });
  for (const user of data?.users.filter((u) => u.email?.startsWith("resexport-")) ?? []) {
    await service.from("user_roles").delete().eq("user_id", user.id);
    await service.auth.admin.deleteUser(user.id);
    console.log(`  login ${user.email} removed`);
  }
}

/** The button itself, in a real browser: ticking changes the link, a click downloads and says where it went. */
async function clickThrough(cookie, ids, search) {
  console.log("admin, the button in a browser:");
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
    console.log("  skipped: no Edge or Chrome to drive");
    return;
  }
  try {
    const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, acceptDownloads: true });
    await context.addCookies(
      cookie.split("; ").map((pair) => {
        const at = pair.indexOf("=");
        return { name: pair.slice(0, at), value: pair.slice(at + 1), url: base };
      }),
    );
    const page = await context.newPage();
    await page.goto(`${base}/residents${search}`, { waitUntil: "networkidle" });
    const link = page.getByRole("link", { name: /^Download spreadsheet/ });
    check("the button is on the list", (await link.count()) === 1);
    const plainHref = await link.getAttribute("href");
    check("it carries the page's own query string", new URL(plainHref ?? "", base).searchParams.get("q") === `${NAME}`, plainHref ?? "");
    await page.getByRole("checkbox", { name: /Cooper/ }).check();
    const tickedLink = page.getByRole("link", { name: /^Download spreadsheet \(1\)/ });
    check("ticking a row counts it and adds ids", (await tickedLink.getAttribute("href"))?.endsWith(`&ids=${ids.cooper}`) === true);
    const [download] = await Promise.all([page.waitForEvent("download"), tickedLink.click()]);
    check("clicking downloads the ticked file", /^residents-selected-filtered-\d{4}-\d{2}-\d{2}\.csv$/.test(download.suggestedFilename()), download.suggestedFilename());
    const note = await page.getByRole("status").innerText();
    check("and says where it went", /Downloads/.test(note) && note.includes(download.suggestedFilename()), note);
  } finally {
    await browser.close();
  }
}
