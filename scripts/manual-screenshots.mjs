// Re-captures the screenshots the in-app user manual (/manual) shows, into
// public/manual/. Run it whenever a screen changes so the manual keeps up:
//
//   node scripts/manual-screenshots.mjs            # against http://localhost:3000
//   MANUAL_BASE_URL=http://localhost:3001 node scripts/manual-screenshots.mjs
//
// It drives the Edge (or Chrome) already installed on this machine through
// playwright-core, so nothing is downloaded. A visible window opens on the
// sign-in page: sign in there yourself with an ADMIN account (the script
// never sees the password), and it takes over once you land in the app.
// Public pages are captured from a second, signed-out context.
//
// Records are discovered from the running app — the first resident whose
// status is Resident, the first enclosure, vet, contact and project folder —
// so point it at a database with some data in it (dev, not an empty
// project). The file names must match the `src` values in
// src/lib/manual/en.ts.
//
// The signed-in session is kept in a JSON file under the OS temp folder so
// a re-run the same day skips the sign-in step; delete that file (its path
// is printed) or pass --fresh to sign in again.
//
// Every run ends by writing src/lib/manual/screenshot-sizes.json: the pixel
// size of each PNG in public/manual/, read from the files themselves. The
// manual gives each <img> that width and height so the browser reserves the
// space before the lazy images load, and a link to /manual#topic lands on
// the topic instead of above it. To refresh just that file without
// re-capturing anything (after adding or replacing a PNG by hand):
//
//   node scripts/manual-screenshots.mjs --sizes

import { access, mkdir, open, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.MANUAL_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.join(ROOT, "public", "manual");
const SIZES_FILE = path.join(ROOT, "src", "lib", "manual", "screenshot-sizes.json");
const STATE_FILE = path.join(os.tmpdir(), "lca-manual-screenshots-session.json");
const FRESH = process.argv.includes("--fresh");
const SIZES_ONLY = process.argv.includes("--sizes");

/** Placeholder shown where the signed-in user's email would be. */
const EMAIL_PLACEHOLDER = "you@example.com";
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const SCALE = 1.5;

/**
 * What to capture once signed in. `path` may use placeholders filled from
 * the ids discovered below. `full` captures the whole page rather than the
 * first screen — right for forms, wrong for long lists.
 */
const SIGNED_IN = [
  { name: "residents-list", path: "/residents" },
  { name: "resident-intake", path: "/residents/new", full: true },
  { name: "resident-hub", path: "/residents/{resident}", full: true },
  { name: "resident-housing", path: "/residents/{resident}/housing", full: true },
  { name: "resident-move", path: "/residents/{resident}/move", full: true },
  { name: "resident-hospital", path: "/residents/{resident}/hospital", full: true },
  { name: "resident-rehome", path: "/residents/{resident}/rehome", full: true },
  { name: "resident-deceased", path: "/residents/{resident}/deceased", full: true },
  { name: "resident-photos", path: "/residents/{resident}/photos", full: true },
  { name: "weight-history", path: "/residents/{resident}/weight", full: true },
  { name: "immunizations-new", path: "/immunizations/new", full: true },
  { name: "vet-visit-new", path: "/vet-visits/new?residentId={resident}", full: true },
  { name: "prescription-new", path: "/prescriptions/new?residentId={resident}", full: true },
  { name: "procedure-new", path: "/procedures/new?residentId={resident}", full: true },
  { name: "blood-test-new", path: "/blood-tests/new?residentId={resident}", full: true },
  { name: "enclosures", path: "/enclosures" },
  { name: "enclosure-hub", path: "/enclosures/{enclosure}", full: true },
  { name: "maintenance-board", path: "/maintenance" },
  { name: "maintenance-new", path: "/maintenance/new", full: true },
  { name: "projects", path: "/projects" },
  { name: "project-folder", path: "/projects/{project}", full: true },
  { name: "vets", path: "/vets" },
  { name: "vet-hub", path: "/vets/{vet}", full: true },
  { name: "contacts", path: "/contacts" },
  { name: "contact-hub", path: "/contacts/{contact}", full: true },
  { name: "management-dashboard", path: "/management/dashboard", full: true },
  { name: "management-contacts", path: "/management/contacts" },
  { name: "management-vets", path: "/management/vets" },
  { name: "management-medications", path: "/management/medications", full: true },
  { name: "management-diets", path: "/management/diets", full: true },
  { name: "admin-security", path: "/admin/security" },
  { name: "admin-website", path: "/admin/website", full: true },
  { name: "admin-zones", path: "/admin/zones" },
  { name: "admin-enclosures", path: "/admin/enclosures" },
  { name: "admin-immunization-types", path: "/admin/immunization-types" },
  { name: "admin-procedure-types", path: "/admin/procedure-types" },
  { name: "admin-blood-test-types", path: "/admin/blood-test-types" },
];

const SIGNED_OUT = [
  { name: "login", path: "/login" },
  { name: "public-home", path: "/", full: true },
  { name: "public-adopt", path: "/adopt" },
  { name: "public-our-work", path: "/our-work" },
];

async function main() {
  if (SIZES_ONLY) return writeSizes();
  await mkdir(OUT, { recursive: true });

  const browser = await launch();
  try {
    if (FRESH) await rm(STATE_FILE, { force: true });
    const savedState = await access(STATE_FILE).then(() => STATE_FILE, () => undefined);
    const context = await browser.newContext({
      viewport: DESKTOP,
      deviceScaleFactor: SCALE,
      storageState: savedState,
    });
    const page = await context.newPage();

    // A signed-in visitor to /login is bounced to /residents by the proxy,
    // so the same wait covers a reused session and a fresh sign-in.
    console.log(
      savedState
        ? `Reusing the session in ${STATE_FILE} (pass --fresh to sign in again).`
        : `Opening ${BASE}/login — sign in with an admin account in the window that appears.`,
    );
    await page.goto(`${BASE}/login`);
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 10 * 60_000 });
    await settle(page);
    if (!(await page.locator('nav a[href="/admin"]').first().isVisible().catch(() => false))) {
      console.warn("Signed in, but not as an admin — the Management and Admin screenshots will fail.");
    }
    await context.storageState({ path: STATE_FILE });

    const ids = await discoverIds(page);
    console.log("Using", ids);

    for (const shot of SIGNED_IN) {
      await capture(page, shot, ids);
    }

    // The phone menu: same session, phone-sized viewport, drawer open.
    const phone = await browser.newContext({
      viewport: PHONE,
      deviceScaleFactor: SCALE,
      isMobile: true,
      hasTouch: true,
      storageState: await context.storageState(),
    });
    const phonePage = await phone.newPage();
    await phonePage.goto(`${BASE}/residents`);
    await settle(phonePage);
    await phonePage.getByRole("button", { name: /open menu|เปิดเมนู/i }).click();
    await phonePage.waitForSelector("#mobile-nav");
    await phonePage.waitForTimeout(300);
    await phonePage.screenshot({ path: path.join(OUT, "nav-mobile.png") });
    console.log("  nav-mobile.png");
    await phone.close();

    // Public pages, signed out.
    const anon = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: SCALE });
    const anonPage = await anon.newPage();
    for (const shot of SIGNED_OUT) {
      await capture(anonPage, shot, ids);
    }
    await anon.close();

    await context.close();
    console.log(`Done — ${SIGNED_IN.length + SIGNED_OUT.length + 1} screenshots in ${path.relative(process.cwd(), OUT)}`);
  } finally {
    await browser.close();
  }
  await writeSizes();
}

/**
 * Record every PNG's size in SIZES_FILE, keyed by the `src` the manual uses.
 * Read from the files rather than worked out from the viewport, because a
 * full-page capture's height is only known once it has been taken, and a
 * PNG dropped in by hand is covered too.
 */
async function writeSizes() {
  const sizes = {};
  for (const name of (await readdir(OUT)).filter((n) => n.endsWith(".png")).sort()) {
    sizes[`/manual/${name}`] = await pngSize(path.join(OUT, name));
  }
  await writeFile(SIZES_FILE, `${JSON.stringify(sizes, null, 2)}\n`);
  console.log(`${Object.keys(sizes).length} sizes in ${path.relative(process.cwd(), SIZES_FILE)}`);
}

/** Width and height from a PNG's IHDR chunk, which always comes first. */
async function pngSize(file) {
  const handle = await open(file);
  try {
    const { buffer } = await handle.read(Buffer.alloc(24), 0, 24, 0);
    if (buffer.readUInt32BE(0) !== 0x89504e47 || buffer.toString("ascii", 12, 16) !== "IHDR") {
      throw new Error(`${file} is not a PNG`);
    }
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  } finally {
    await handle.close();
  }
}

/** Installed Edge first (every Windows 11 machine has it), then Chrome. */
async function launch() {
  let lastError;
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel, headless: false });
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Couldn't start Edge or Chrome: ${lastError?.message ?? lastError}`);
}

async function capture(page, shot, ids) {
  const target = shot.path.replace(/\{(\w+)\}/g, (_, key) => {
    if (!ids[key]) throw new Error(`No ${key} id was discovered, needed for ${shot.name}`);
    return ids[key];
  });
  await page.goto(`${BASE}${target}`);
  await settle(page);
  await page.screenshot({ path: path.join(OUT, `${shot.name}.png`), fullPage: Boolean(shot.full) });
  console.log(`  ${shot.name}.png  ←  ${target}`);
}

/**
 * Wait for data, fonts and the Drive photo proxy before shooting, then tidy
 * what shouldn't be in a manual: the Next.js dev-tools bubble, and the
 * signed-in email in the header (the reader's own will be there instead).
 */
async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.evaluate((placeholder) => {
    for (const portal of document.querySelectorAll("nextjs-portal")) {
      portal.style.display = "none";
    }
    for (const span of document.querySelectorAll("header span")) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(span.textContent?.trim() ?? "")) {
        span.textContent = placeholder;
      }
    }
  }, EMAIL_PLACEHOLDER);
}

/**
 * The ids the placeholders need, read off the lists in the running app.
 * The resident must currently be a plain Resident so the move / hospital /
 * foster pages all apply to them.
 */
async function discoverIds(page) {
  const ids = {};

  await page.goto(`${BASE}/residents`);
  await settle(page);
  ids.resident = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("tbody tr")];
    const row =
      rows.find((r) => [...r.querySelectorAll("td")].some((td) => td.textContent?.trim() === "Resident")) ??
      rows[0];
    const href = row?.querySelector('a[href^="/residents/"]')?.getAttribute("href");
    return href?.split("/")[2] ?? null;
  });

  for (const [key, list, prefix] of [
    ["enclosure", "/enclosures", "/enclosures/"],
    ["vet", "/vets", "/vets/"],
    ["contact", "/contacts", "/contacts/"],
    ["project", "/projects", "/projects/"],
  ]) {
    await page.goto(`${BASE}${list}`);
    await settle(page);
    ids[key] = await page.evaluate((p) => {
      const href = document.querySelector(`main a[href^="${p}"]`)?.getAttribute("href");
      return href?.slice(p.length).split(/[/?#]/)[0] ?? null;
    }, prefix);
  }

  // A project folder with content makes a better picture than a bare
  // category, so step one level down if the category has subfolders.
  if (ids.project) {
    await page.goto(`${BASE}/projects/${ids.project}`);
    await settle(page);
    const child = await page.evaluate((p) => {
      const href = document.querySelector(`main a[href^="${p}"]`)?.getAttribute("href");
      return href?.slice(p.length).split(/[/?#]/)[0] ?? null;
    }, "/projects/");
    if (child && child !== ids.project) ids.project = child;
  }

  return ids;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
