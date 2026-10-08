// The 375 px check: opens each page at phone width, in English and Thai,
// signed in as each of a few roles, and fails if (1) the page scrolls sideways —
// as loaded, or once any text box, select or textarea in it is focused —
// printing the element that sticks out, or (2) an action the app's shared
// components render is smaller than 44 px, printing which component.
//
//   node scripts/worktree.mjs dev                                  (another terminal)
//   node scripts/check-phone-width.mjs [http://localhost:<port>]   (defaults to this checkout's .port)
//   node scripts/check-phone-width.mjs --roles=admin,staff --locales=en --pages=/vets,/enclosures
//   (In Git Bash a leading /path in --pages is rewritten to C:/Program Files/Git/…; prefix the command with MSYS_NO_PATHCONV=1.)
//   node scripts/check-phone-width.mjs --keep      (leave the seeded rows and the throwaway logins in dev)
//   node scripts/check-phone-width.mjs --verbose   (also list every page that passed)
//   node scripts/check-phone-width.mjs --clean     (remove what a killed run left behind, and stop)
//
// Run it by hand, or in the release smoke test. It is deliberately NOT in
// `npm run lint` or scripts/gates.mjs: it needs a server, a browser and seeded
// rows, and the gates run on every push from every stream
// (docs/decisions/2026-10-05-phone-width-check.md).
//
// What it makes, against DEV only (it refuses any other Supabase project):
//   - one throwaway login per role, with a user_roles row, signed in by password
//     through the app's own SSR client so the cookies are exactly the app's.
//     No password is read from .env.local; a random one is made per run.
//   - rows with awkwardly long names, because short dev names pass while the
//     real site fails: a zone and an enclosure called "Blue Enclosure 3 (Hallway
//     Small Dogs Only)" and longer, a vet whose clinic is long, a contact with a
//     long name and address, a resident in that enclosure, one at the hospital.
// Everything is deleted at the end, whatever happened (--keep to look at it).
//
// The 44 px rule (docs/decisions/2026-10-06-phone-width-44px.md). There is no
// exemption list. An action is something a shared component renders —
// ActionLink, ActionButton, RowActionLink, RowActionButton — and each stamps
// data-action="<Component>" on what it renders. Only those are measured, so a
// plain link in a sentence, a list or a table (navigation) is out by
// construction. A bare <button> that bypasses the components is NOT failed,
// because a button can be a stepper, a chip or a calendar cell as well as an
// action: those under 44 px are printed as notes, once per page, so the blind
// spot is visible without crying wolf.
//
// Red means something is really wrong, never noise: a page a role cannot open
// (redirected, 404), a page that errors, an element it cannot measure, are
// printed as "skipped" or "warning" and do not fail the run.
// Exit 0: nothing overflowed and every component action is 44 px. Exit 1: at
// least one is not. Exit 2: could not run.
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
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3).split(",").filter(Boolean);
const VERBOSE = args.includes("--verbose");
const KEEP = args.includes("--keep");

const WIDTH = 375;
/** Slack for sub-pixel rounding: a 1 px nudge is not a page you can scroll. */
const TOLERANCE = 1;
/** The touch-target rule, in CSS px; half a pixel of slack for sub-pixel layout. */
const TAP = 44;
const TAP_TOLERANCE = 0.5;

/**
 * Roles worth covering, and why (docs/decisions/2026-10-05-phone-width-check.md).
 * admin, management and staff are the three with the widest page sets; staff are
 * about 100% on phones. vet and volunteer see different, narrower pages (the vet's
 * own screens, the volunteer's R1 set). head_of_medical stands for the configured
 * roles: a narrow set of pages assembled from jobs, which is the kind that shows
 * up in nav only when the job is held.
 */
const ALL_ROLES = {
  admin: { legacy: "admin" },
  management: { legacy: "management" },
  staff: { legacy: "staff" },
  vet: { legacy: "vet" },
  volunteer: { legacy: "volunteer" },
  head_of_medical: { legacy: "volunteer", configured: "head_of_medical" },
  head_of_maintenance: { legacy: "volunteer", configured: "head_of_maintenance" },
};
const roleNames = opt("roles") ?? Object.keys(ALL_ROLES);
const locales = opt("locales") ?? ["en", "th"];
for (const r of roleNames) if (!ALL_ROLES[r]) fail(`unknown role ${r}; one of ${Object.keys(ALL_ROLES).join(", ")}`);
for (const l of locales) if (!["en", "th"].includes(l)) fail(`unknown locale ${l}`);

/**
 * The pages, with {placeholders} for the seeded rows. The first block is the
 * F-06 regression set (docs/decisions/2026-10-03-phone-width.md); the rest is
 * the app's main screens. A page a role cannot open is skipped for that role,
 * and the links in each role's own nav are added to the list as well.
 */
const PAGES = [
  // F-06's pages
  "/enclosures",
  "/vets",
  "/deliveries",
  "/residents/new",
  "/residents/{resident}/edit",
  "/residents/{hospitalised}/hospital/return",
  "/residents/{resident}/rehome",
  "/vets/{vet}",
  "/contacts",
  "/vet-visits/new?residentId={resident}",
  // the rest of the day-to-day screens
  "/home",
  "/my",
  "/residents",
  "/residents/{resident}",
  "/residents/{resident}/housing",
  "/residents/{resident}/move",
  "/residents/{resident}/hospital",
  "/residents/{resident}/photos",
  "/residents/{resident}/weight",
  "/enclosures/{enclosure}",
  "/contacts/{contact}",
  "/appointments",
  "/maintenance",
  "/maintenance/new",
  "/stocktake",
  "/projects",
  "/prescriptions/new?residentId={resident}",
  "/diets/new?residentId={resident}",
  "/procedures/new?residentId={resident}",
  "/blood-tests/new?residentId={resident}",
  "/immunizations/new",
  // management and admin
  "/management",
  "/management/dashboard",
  "/management/contacts",
  "/management/vets",
  "/management/medications",
  "/management/diets",
  "/management/cashflow",
  "/management/purchasing",
  "/admin",
  "/admin/zones",
  "/admin/enclosures",
  "/admin/website",
  "/admin/medications",
  "/admin/diets",
  // everyone
  "/manual",
  "/releases",
  "/account/password",
];
const onlyPages = opt("pages");

const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") fail(`refusing: ${ref} is not the dev project`);
const base = (args.find((a) => /^https?:/.test(a)) ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`).replace(/\/$/, "");
const supaUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(supaUrl, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const tag = randomBytes(4).toString("hex");
const made = { users: [], seed: [] }; // for cleanup, in creation order
let exitCode = 0;

function fail(message) {
  console.error(`check-phone-width: ${message}`);
  process.exit(2);
}

if (args.includes("--clean")) {
  await sweep();
  process.exit(0);
}

try {
  await fetch(`${base}/login`, { redirect: "manual" });
} catch {
  fail(`nothing is answering at ${base}. Start it: node scripts/worktree.mjs dev`);
}

try {
  const ids = await seed();
  const accounts = await makeAccounts();
  exitCode = await run(ids, accounts);
} catch (error) {
  console.error(error);
  exitCode = 2;
} finally {
  if (KEEP) console.log(`\n--keep: seeded rows named "ZZ Width ${tag}…" and ${made.users.length} throwaway login(s) are left in dev.`);
  else await cleanup();
}
process.exit(exitCode);

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/** Insert a row, remember it for cleanup, and return it. */
async function insert(table, row) {
  const { data, error } = await service.from(table).insert(row).select().single();
  if (error) throw new Error(`seeding ${table}: ${error.message}`);
  made.seed.push([table, data.id]);
  return data;
}

async function seed() {
  const LONG_ENCLOSURE = `ZZ Width ${tag} Blue Enclosure 3 (Hallway Small Dogs Only, near the old laundry)`;
  const LONG_CLINIC = `ZZ Width ${tag} Chiang Mai Small Animal Hospital (CMCAH) Faculty of Veterinary Medicine`;
  const zone = await insert("zones", { name: `ZZ Width ${tag} Hallway and Laundry Zone, Small Dogs` });
  const enclosure = await insert("enclosures", { name: LONG_ENCLOSURE, zone_id: zone.id, capacity: 4 });
  const vet = await insert("vets", {
    name: `ZZ Width ${tag} Dr Somchai Rattanakosin-Wongsawat`,
    clinic_name: LONG_CLINIC,
    contact_info: "+66 53 948 000 / reception@a-very-long-clinic-address-for-a-small-animal-hospital.example.invalid",
  });
  const contact = await insert("contacts", {
    name: `ZZ Width ${tag} Khun Pimchanok Sirikanchanakul-Thanasombat`,
    type: "Carer",
    phone: "+66 81 234 5678",
    email: "pimchanok.sirikanchanakul-thanasombat@a-long-domain-name.example.invalid",
    address: "99/123 Moo 4, Tambon Suthep, Amphoe Mueang Chiang Mai, Chiang Mai 50200, Thailand",
  });
  const resident = await insert("residents", {
    name: `ZZ Width ${tag} Sir Reginald Fluffington-Smythe the Third of Hallway Small Dogs`,
    species: "Dog",
    breed: "Thai Ridgeback cross with a very long breed description",
    intake_date: "2026-01-15",
  });
  await insert("placement_history", {
    resident_id: resident.id,
    placement_type: "Intake",
    zone_id: zone.id,
    enclosure_id: enclosure.id,
  });
  const ill = await insert("residents", { name: `ZZ Width ${tag} Hospital Patient`, species: "Cat", intake_date: "2026-02-01" });
  await insert("placement_history", { resident_id: ill.id, placement_type: "Intake", zone_id: zone.id, enclosure_id: enclosure.id, start_date: "2026-02-01T00:00:00Z", end_date: "2026-03-01T00:00:00Z" });
  await insert("placement_history", { resident_id: ill.id, placement_type: "SendToHospital", zone_id: zone.id, enclosure_id: enclosure.id, start_date: "2026-03-01T00:00:00Z" })
    .catch((error) => console.warn(`  warning: could not put a resident in hospital, so the Return from hospital page will be skipped (${error.message})`));
  return { resident: resident.id, hospitalised: ill.id, enclosure: enclosure.id, vet: vet.id, contact: contact.id };
}

// ---------------------------------------------------------------------------
// Accounts and sessions
// ---------------------------------------------------------------------------

async function makeAccounts() {
  const out = {};
  for (const name of roleNames) {
    const spec = ALL_ROLES[name];
    const email = `phonewidth-${name.replace(/_/g, "-")}-${tag}@example.invalid`;
    const password = randomBytes(18).toString("base64url");
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Phone width ${name}` },
    });
    if (error) throw new Error(`creating the ${name} login: ${error.message}`);
    made.users.push(data.user.id);
    const row = { user_id: data.user.id, role: spec.legacy };
    if (spec.configured) {
      const { data: role, error: roleError } = await service.from("roles").select("id").eq("key", spec.configured).single();
      if (roleError) throw new Error(`no configured role ${spec.configured} in dev: ${roleError.message}`);
      row.role_id = role.id;
    }
    const { error: roleWriteError } = await service.from("user_roles").insert(row);
    if (roleWriteError) throw new Error(`giving the ${name} login its role: ${roleWriteError.message}`);
    out[name] = { email, password };
  }
  return out;
}

/** The session cookies the app's own SSR client would set for a password sign-in. */
async function signInCookies({ email, password }) {
  const jar = new Map();
  const ssr = createServerClient(supaUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signing in as ${email}: ${error.message}`);
  return [...jar].map(([name, value]) => ({ name, value, url: base }));
}

// ---------------------------------------------------------------------------
// The measuring
// ---------------------------------------------------------------------------

async function launch() {
  let lastError;
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Couldn't start Edge or Chrome: ${lastError?.message ?? lastError}`);
}

/** Runs in the page. Resolves to the overflow in px and the elements responsible. */
function measureInPage({ tolerance }) {
  const root = document.scrollingElement ?? document.documentElement;
  const overflow = root.scrollWidth - root.clientWidth;
  if (overflow <= tolerance) return { overflow, culprits: [] };

  const viewport = root.clientWidth;
  const clips = (el) => {
    const s = getComputedStyle(el);
    return /(auto|scroll|hidden|clip)/.test(s.overflowX);
  };
  /** A box that sticks out and that nothing between it and the page scrolls or clips. */
  const sticksOut = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.right <= viewport + tolerance) return false;
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.display === "none" || s.visibility === "hidden") return false;
      if (s.position === "fixed") return false;
      if (p !== el && p !== document.body && clips(p)) return false;
    }
    return true;
  };
  const describe = (el) => {
    const one = (e) => {
      const cls = typeof e.className === "string" ? e.className.trim().split(/\s+/).filter(Boolean).slice(0, 4).join(".") : "";
      return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ""}${cls ? `.${cls}` : ""}`;
    };
    const chain = [];
    for (let p = el; p && p !== document.body && chain.length < 3; p = p.parentElement) chain.unshift(one(p));
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 50);
    const r = el.getBoundingClientRect();
    return { path: chain.join(" > "), text, right: Math.round(r.right), width: Math.round(r.width) };
  };

  const main = document.querySelector("main") ?? document.body;
  const out = [...document.querySelectorAll("body *")].filter(
    (el) => !["SCRIPT", "STYLE", "NEXTJS-PORTAL"].includes(el.tagName) && !el.closest("nextjs-portal") && sticksOut(el),
  );
  // The deepest boxes that stick out are what set the width; their parents only follow.
  const deepest = out.filter((el) => !out.some((other) => other !== el && el.contains(other)));
  deepest.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
  return { overflow, inMain: main !== document.body, culprits: deepest.slice(0, 3).map(describe) };
}

/**
 * Runs in the page. Every visible [data-action] under 44 px either way is a
 * failure; every visible bare <button> under 44 px (not inside a component) is
 * a note. Zero-size boxes are display:none or collapsed, so not on screen.
 */
function measureTapTargets({ tap, tolerance }) {
  const shown = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    for (let p = el; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.display === "none" || s.visibility === "hidden") return null;
    }
    return r;
  };
  const describe = (el, r) => {
    const label = el.getAttribute("aria-label") || el.getAttribute("title") || (el.textContent ?? "").replace(/\s+/g, " ").trim();
    const region = el.closest("main, header, nav, dialog, [role=dialog]")?.tagName.toLowerCase() ?? "page";
    return { label: label.slice(0, 40), region, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 };
  };
  const small = (r) => r.width < tap - tolerance || r.height < tap - tolerance;
  const failures = [];
  let components = 0;
  for (const el of document.querySelectorAll("[data-action]")) {
    const r = shown(el);
    if (!r) continue;
    components += 1;
    if (small(r)) failures.push({ component: el.getAttribute("data-action"), ...describe(el, r) });
  }
  const notes = [];
  let bare = 0;
  for (const el of document.querySelectorAll("button, input[type=submit], input[type=button]")) {
    if (el.closest("[data-action]") || el.closest("nextjs-portal")) continue;
    const r = shown(el);
    if (!r) continue;
    bare += 1;
    if (small(r)) notes.push(describe(el, r));
  }
  return { components, bare, failures, notes };
}

/**
 * Focus each text box, select and textarea in turn and re-measure. A control
 * can be fine as loaded and widen the page the moment it is tapped (a
 * `field-sizing: content` textarea with a long placeholder did, 2026-10-07),
 * which a measure of the untouched page cannot see. Returns the first field that
 * pushes the page past the screen, or the widest overflow seen as 0.
 */
async function checkFocus(page) {
  const count = await page
    .evaluate(() => document.querySelectorAll("main textarea, main input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]), main select").length)
    .catch(() => 0);
  for (let i = 0; i < Math.min(count, 60); i++) {
    const field = await page
      .evaluate((n) => {
        const el = document.querySelectorAll("main textarea, main input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]), main select")[n];
        if (!el || el.disabled || el.getBoundingClientRect().width === 0) return null;
        el.focus({ preventScroll: true });
        return `${el.tagName.toLowerCase()}${el.name ? `[name=${el.name}]` : el.id ? `#${el.id}` : ""}`;
      }, i)
      .catch(() => null);
    if (!field) continue;
    await page.waitForTimeout(60);
    const m = await page.evaluate(measureInPage, { tolerance: TOLERANCE }).catch(() => null);
    if (m && m.overflow > TOLERANCE) return { overflow: m.overflow, culprits: m.culprits, field };
  }
  await page.evaluate(() => document.activeElement?.blur?.()).catch(() => {});
  return { overflow: 0, culprits: [] };
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  // A page still streaming reports the loading skeleton's width (docs/decisions/2026-10-03-phone-width.md):
  // wait until nothing in main says it is busy.
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy="true"], [data-loading], .animate-pulse'), null, { timeout: 8_000 })
    .catch(() => {});
  await page.waitForTimeout(250);
}

async function run(ids, accounts) {
  const browser = await launch();
  const results = []; // { role, locale, path, kind: ok|overflow|skipped|warning, ... }
  try {
    for (const roleName of roleNames) {
      const cookies = await signInCookies(accounts[roleName]);
      for (const locale of locales) {
        const context = await browser.newContext({ viewport: { width: WIDTH, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
        await context.addCookies([...cookies, { name: "locale", value: locale, url: base }]);
        const page = await context.newPage();

        const targets = new Set(PAGES.map((p) => fill(p, ids)).filter(Boolean));
        // The role's own nav, so a page added after this list was written is covered too.
        await page.goto(`${base}/home`).catch(() => {});
        await settle(page);
        const navLinks = await page
          .evaluate(() => [...document.querySelectorAll("nav a[href^='/']")].map((a) => a.getAttribute("href")))
          .catch(() => []);
        for (const href of navLinks) if (href && !href.startsWith("/api/") && !href.includes("#")) targets.add(href);

        for (const target of onlyPages ? onlyPages.map((p) => fill(p, ids)).filter(Boolean) : targets) {
          results.push(await checkPage(page, { roleName, locale, target }));
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return report(results);
}

function fill(template, ids) {
  let missing = false;
  const out = template.replace(/\{(\w+)\}/g, (_, key) => {
    if (!ids[key]) missing = true;
    return ids[key] ?? "";
  });
  return missing ? null : out;
}

async function checkPage(page, { roleName, locale, target }) {
  const where = { role: roleName, locale, path: target };
  let response;
  try {
    response = await page.goto(`${base}${target}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  } catch (error) {
    return { ...where, kind: "warning", why: `did not load: ${error.message.split("\n")[0]}` };
  }
  await settle(page);
  const wanted = new URL(target, base).pathname;
  const landed = new URL(page.url()).pathname;
  if (landed !== wanted) return { ...where, kind: "skipped", why: `redirected to ${landed}` };
  const status = response?.status() ?? 0;
  if (status === 404) return { ...where, kind: "skipped", why: "404 for this role" };
  if (status >= 500) return { ...where, kind: "warning", why: `server error ${status}` };
  // Next's not-found page can answer 200 in some setups.
  const notFound = await page.evaluate(() => /could not be found|This page could not be found/i.test(document.querySelector("main")?.textContent ?? "")).catch(() => false);
  if (notFound) return { ...where, kind: "skipped", why: "not found" };
  let m;
  try {
    m = await page.evaluate(measureInPage, { tolerance: TOLERANCE });
  } catch (error) {
    return { ...where, kind: "warning", why: `could not measure: ${error.message.split("\n")[0]}` };
  }
  let t;
  try {
    t = await page.evaluate(measureTapTargets, { tap: TAP, tolerance: TAP_TOLERANCE });
  } catch (error) {
    return { ...where, kind: "warning", why: `could not measure tap targets: ${error.message.split("\n")[0]}` };
  }
  const tap = { components: t.components, bare: t.bare, small: t.failures, notes: t.notes };
  if (m.overflow > TOLERANCE) return { ...where, kind: "overflow", overflow: m.overflow, culprits: m.culprits, ...tap };
  // Only a page that fits unfocused is worth focusing: an overflowing one is already red.
  const f = await checkFocus(page);
  const zoom = await page.evaluate(() => [...document.querySelectorAll("main textarea, main select, main input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image])")].filter((el) => el.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(el).fontSize) < 16).map((el) => el.name || el.id || el.tagName.toLowerCase())).catch(() => []);
  tap.zoom = zoom;
  if (f.overflow > TOLERANCE) return { ...where, kind: "overflow", overflow: f.overflow, culprits: f.culprits, focused: f.field, ...tap };
  if (t.failures.length) return { ...where, kind: "small", ...tap };
  return { ...where, kind: "ok", ...tap };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function report(results) {
  const by = (kind) => results.filter((r) => r.kind === kind);
  const label = (r) => `${r.role} ${r.locale} ${r.path}`;
  for (const r of by("ok")) if (VERBOSE) console.log(`  ok       ${label(r)}`);
  for (const r of by("skipped")) if (VERBOSE) console.log(`  skipped  ${label(r)}  (${r.why})`);
  for (const r of by("warning")) console.log(`  warning  ${label(r)}  (${r.why})`);

  // One line per page and overflow, not per role: the same page fails the same way for several roles.
  const bad = by("overflow");
  for (const r of bad) {
    console.log(`\nFAIL  ${label(r)}  scrolls sideways by ${r.overflow} px at ${WIDTH} px${r.focused ? ` once ${r.focused} is focused` : ""}`);
    if (!r.culprits.length) console.log("      (no single element found: the overflow may come from a transform or a pseudo-element)");
    for (const c of r.culprits) console.log(`      ${c.path}  — right edge ${c.right} px, ${c.width} px wide${c.text ? `  "${c.text}"` : ""}`);
  }

  // Tap targets, on every measured view (an overflowing page is measured too).
  // Grouped by page + component + label, with the roles and languages that saw it.
  const measuredViews = results.filter((r) => r.kind === "ok" || r.kind === "overflow" || r.kind === "small");
  // `across`: fold the same control on many pages (the app header's buttons) into one entry.
  const group = (pick, across = false) => {
    const map = new Map();
    for (const r of measuredViews)
      for (const c of r[pick]) {
        const key = `${across ? `${c.width}x${c.height}` : r.path}|${c.component ?? ""}|${c.region}|${c.label}`;
        const g = map.get(key) ?? { path: r.path, paths: new Set(), c, views: [] };
        g.paths.add(r.path);
        g.views.push(`${r.role}/${r.locale}`);
        map.set(key, g);
      }
    return [...map.values()];
  };
  const zooming = results.filter((r) => r.zoom?.length);
  for (const r of zooming)
    console.log(`
FAIL  ${label(r)}  ${r.zoom.join(", ")} has type under 16 px: iPhone Safari zooms the page in when it is tapped, and the page then scrolls sideways`);
  const smallActions = group("small");
  for (const g of smallActions) {
    console.log(`\nFAIL  ${g.path}  ${g.c.component} "${g.c.label}" (in ${g.c.region}) is ${g.c.width} x ${g.c.height} px at ${WIDTH} px, under ${TAP}`);
    console.log(`      seen by ${[...new Set(g.views)].join(", ")}`);
  }
  const notes = group("notes", true).sort((a, b) => b.paths.size - a.paths.size);
  if (notes.length) {
    console.log(`\nnote: ${notes.length} bare <button>(s) under ${TAP} px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):`);
    for (const g of notes.slice(0, VERBOSE ? notes.length : 25))
      console.log(`      "${g.c.label}" (in ${g.c.region}) ${g.c.width} x ${g.c.height} px  on ${g.paths.size} page(s)${g.paths.size > 1 ? `, e.g. ${[...g.paths][0]}` : `: ${g.path}`}`);
    if (!VERBOSE && notes.length > 25) console.log(`      … and ${notes.length - 25} more (--verbose lists them all)`);
  }

  const measured = measuredViews.length;
  const components = measuredViews.reduce((n, r) => n + r.components, 0);
  console.log(
    `\n${measured} page view(s) measured (${roleNames.join(", ")}; ${locales.join(" + ")}), ${by("skipped").length} skipped because the role cannot open them, ${by("warning").length} warning(s).`,
  );
  console.log(`${components} component action(s) measured for tap size.`);
  console.log(bad.length ? `${bad.length} page view(s) overflow.` : "No page scrolls sideways.");
  console.log(zooming.length ? `${zooming.length} page view(s) have a text box, select or textarea under 16 px.` : "No text box, select or textarea is under 16 px (iPhone zoom on tap).");
  console.log(smallActions.length ? `${smallActions.length} component action(s) under ${TAP} px.` : `Every component action is at least ${TAP} px.`);
  return bad.length || smallActions.length || zooming.length ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanup() {
  // Children before parents: placements, then residents, then the rest, newest first.
  for (const id of made.seed.filter(([t]) => t === "residents").map(([, i]) => i)) {
    await service.from("placement_history").delete().eq("resident_id", id);
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

/** --clean: everything a run made carries "ZZ Width" or "phonewidth-", so a killed run can be swept. */
async function sweep() {
  const { data: residents } = await service.from("residents").select("id").like("name", "ZZ Width %");
  for (const { id } of residents ?? []) await service.from("placement_history").delete().eq("resident_id", id);
  for (const table of ["residents", "contacts", "vets", "enclosures", "zones"]) {
    const { data, error } = await service.from(table).delete().like("name", "ZZ Width %").select("id");
    console.log(`  ${table}: ${error ? error.message : `${data.length} removed`}`);
  }
  const { data } = await service.auth.admin.listUsers({ perPage: 200 });
  for (const user of data?.users.filter((u) => u.email?.startsWith("phonewidth-")) ?? []) {
    await service.from("user_roles").delete().eq("user_id", user.id);
    await service.auth.admin.deleteUser(user.id);
    console.log(`  login ${user.email} removed`);
  }
}
