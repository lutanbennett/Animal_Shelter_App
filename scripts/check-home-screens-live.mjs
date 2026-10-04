// The home screens against DEV and a running dev server: what each role's sign-in lands on, what
// Admin's landing does on a phone, a tablet and a desk, and that nobody but Admin can open another
// role's home, even by typing the URL.
//
//   node scripts/worktree.mjs dev                                (in another terminal)
//   node scripts/check-home-screens-live.mjs [http://localhost:<port>] [--keep <file>]
//   node scripts/check-home-screens-live.mjs --cleanup <file>
//
// It makes one throwaway login per default role (admin, management, staff, volunteer, vet), signed
// in with a password only. Each is deleted at the end, whatever happened, unless --keep names a file:
// then their session cookies and ids are written there (outside git) so a browser can be pointed at
// them, and --cleanup <file> deletes them later. Exits 0 when every expectation held.
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${projectRef(env)} is not the dev project`);

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const keepFile = flag("--keep");
const cleanupFile = flag("--cleanup");
const base = args.find((a) => a.startsWith("http")) ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

if (cleanupFile) {
  const { ids } = JSON.parse(readFileSync(cleanupFile, "utf8"));
  for (const id of ids) {
    const { error } = await service.auth.admin.deleteUser(id);
    console.log(error ? `could not delete ${id}: ${error.message}` : `deleted ${id}`);
  }
  process.exit(0);
}

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
  return { header: [...jar].map(([n, v]) => `${n}=${v}`).join("; "), jar: Object.fromEntries(jar) };
}

async function page(path, cookie, ua) {
  const headers = { cookie };
  if (ua) headers["user-agent"] = ua;
  const res = await fetch(`${base}${path}`, { headers, redirect: "manual" });
  const html = await res.text();
  // Once a response has started streaming, Next sends a 200 whose body carries the redirect.
  const inBody = html.match(/NEXT_REDIRECT;(?:replace|push);([^;]+);/)?.[1] ?? null;
  return { status: res.status, location: res.headers.get("location") ?? inBody, html };
}
const goes = (r, to) => (r.location ?? "").replace(/^https?:\/\/[^/]+/, "") === to;
// A tile is an anchor with the tile class. While the page is still streaming, the same tile is in the RSC payload instead of
// the markup, so read both, and never count the sidebar's own links as tiles.
const tilesIn = (html) => [
  ...new Set([
    ...[...html.matchAll(/<a[^>]*>/g)].map((m) => m[0]).filter((a) => a.includes("min-h-28")).map((a) => a.match(/href="([^"]+)"/)?.[1]),
    ...[...html.matchAll(/\\"href\\":\\"(\/[^\\"]*)\\",\\"className\\":\\"[^\\"]*min-h-28/g)].map((m) => m[1]),
  ]),
].filter(Boolean);
const onHome = (html, path) => tilesIn(html).includes(path);
const notFound = (r) => r.status === 404 || r.html.includes("NEXT_HTTP_ERROR_FALLBACK;404");
const has = (html, path) => new RegExp(`href="${path.replace(/[/.]/g, "\\$&")}"`).test(html);

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const made = [];
const kept = {};
try {
  const cookies = {};
  for (const role of ["admin", "management", "staff", "volunteer", "vet"]) {
    const email = `harness-home-${role}-${tag}@example.invalid`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    made.push(data.user.id);
    const { error: roleErr } = await service.from("user_roles").insert({ user_id: data.user.id, role });
    if (roleErr) throw roleErr;
    cookies[role] = await signInCookies(email);
    kept[role] = { email, ...cookies[role].jar };
  }

  console.log("Admin's landing follows the device");
  const phone = await page("/home", cookies.admin.header, IPHONE);
  expect(goes(phone, "/home/management"), `a phone lands on the Management home (${phone.status} → ${phone.location})`);
  const tablet = await page("/home", cookies.admin.header, IPAD);
  expect(goes(tablet, "/admin"), `a tablet lands on Settings (${tablet.status} → ${tablet.location})`);
  const desk = await page("/home", cookies.admin.header, WINDOWS);
  expect(goes(desk, "/admin"), `a desk lands on Settings (${desk.status} → ${desk.location})`);

  console.log("Admin opens the homes and has the switch");
  const mgmt = await page("/home/management", cookies.admin.header, IPHONE);
  expect(mgmt.status === 200, `Admin opens /home/management (${mgmt.status})`);
  expect(tilesIn(mgmt.html).length > 0, `the Management home has tiles (${tilesIn(mgmt.html).join(" ")})`);
  expect(has(mgmt.html, "/admin") && has(mgmt.html, "/home/staff") && has(mgmt.html, "/home/volunteer"), "the switch lists Settings and the other roles");
  expect(!has(mgmt.html, "/home/admin") && !has(mgmt.html, "/home/public_viewer"), "the switch lists neither Admin nor the public viewer");
  const settings = await page("/admin", cookies.admin.header, WINDOWS);
  expect(settings.status === 200 && has(settings.html, "/home/management"), "Settings has the switch too");
  const staffHome = await page("/home/staff", cookies.admin.header, IPHONE);
  expect(staffHome.status === 200 && onHome(staffHome.html, "/stocktake"), "Admin sees the staff home, with Stocktake on it");
  const vetHome = await page("/home/vet", cookies.admin.header, IPHONE);
  expect(vetHome.status === 200 && onHome(vetHome.html, "/appointments"), "Admin sees the vet home, with Appointments on it");
  const noSuch = await page("/home/no_such_role", cookies.admin.header, IPHONE);
  expect(notFound(noSuch), `a role that does not exist is a 404 (${noSuch.status})`);
  const publicViewer = await page("/home/public_viewer", cookies.admin.header, IPHONE);
  expect(notFound(publicViewer), `the public viewer has no home (${publicViewer.status})`);
  const adminHome = await page("/home/admin", cookies.admin.header, IPHONE);
  expect(goes(adminHome, "/admin"), "/home/admin goes to Settings");

  console.log("Nobody but Admin opens another role's home");
  for (const role of ["management", "staff", "volunteer", "vet"]) {
    for (const target of ["/home/management", "/home/staff", `/home/${role}`]) {
      const r = await page(target, cookies[role].header, IPHONE);
      expect(goes(r, "/no-access") && !r.html.includes("min-h-28"), `${role} opening ${target} is refused (${r.status} → ${r.location})`);
    }
    const a = await page("/admin", cookies[role].header, IPHONE);
    expect(!has(a.html, "/home/management"), `${role} is not shown the switch on Settings`);
  }

  console.log("Each role lands on its own home");
  const m = await page("/home", cookies.management.header, IPHONE);
  expect(m.status === 200 && onHome(m.html, "/residents") && onHome(m.html, "/management/recurring-jobs") && !onHome(m.html, "/admin/zones"), `management: tiles, no Settings page (${tilesIn(m.html).join(" ")})`);
  expect(!has(m.html, "/home/staff"), "management has no switch");
  const s = await page("/home", cookies.staff.header, IPHONE);
  expect(s.status === 200 && onHome(s.html, "/stocktake") && onHome(s.html, "/maintenance"), `staff: Stocktake and Maintenance (${tilesIn(s.html).join(" ")})`);
  expect(!onHome(s.html, "/management/recurring-jobs") && !onHome(s.html, "/appointments"), "staff: none of Management's pages, no appointments");
  const v = await page("/home", cookies.volunteer.header, IPHONE);
  expect(v.status === 200 && onHome(v.html, "/residents") && onHome(v.html, "/enclosures"), `volunteer: Residents and Enclosures (${tilesIn(v.html).join(" ")})`);
  expect(!onHome(v.html, "/management/recurring-jobs"), "volunteer: not Management's pages");
  const vt = await page("/home", cookies.vet.header, IPHONE);
  expect(goes(vt, "/appointments"), `vet: lands on Appointments (${vt.status} → ${vt.location})`);
  const out = await page("/home", "", IPHONE);
  expect((out.location ?? "").startsWith("/login"), `signed out: sent to sign in (${out.status} → ${out.location})`);
} finally {
  if (keepFile) {
    writeFileSync(keepFile, JSON.stringify({ ids: made, accounts: kept }, null, 2));
    console.log(`  kept ${made.length} throwaway login(s); cookies and ids in ${keepFile}. Delete with --cleanup ${keepFile}`);
  } else {
    for (const id of made) {
      const { error } = await service.auth.admin.deleteUser(id);
      if (error) console.error(`  could not delete ${id}: ${error.message}`);
    }
    console.log(`  deleted ${made.length} throwaway login(s)`);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} expectation(s) failed.`);
  process.exit(1);
}
console.log("\nAll expectations held.");
