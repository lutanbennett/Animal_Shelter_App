// Settings -> Security's role picker, in a real browser against DEV and a running dev server, at 375 px:
//
//   node scripts/worktree.mjs dev                                        (another terminal)
//   node scripts/check-security-role-picker.mjs [http://localhost:<port>]
//   node scripts/check-security-role-picker.mjs --keep                   (leave the logins in dev)
//   node scripts/check-security-role-picker.mjs --shots <dir>            (save a screenshot per step)
//
// What it asserts (docs/decisions/2026-10-11-security-role-picker.md):
//   - the create form, as an admin who has passed the authenticator step, offers every live role from `roles`
//     in docs/roles-and-permissions.md's order, Staff not among them, and the configured roles by their Thai
//     names in Thai;
//   - creating a login as 2IC, Head of Maintenance and Head of Medical THROUGH THE PAGE writes user_roles with
//     role_id = that role's row and nothing else: user_roles has no enum column since 0181, so the old write that
//     copied the row's legacy_role is gone, and the page still has to create the login (the path it sat on);
//   - the users table names the configured role, not the enum it borrows (a 2IC must not read "Volunteer");
//   - changing a role in the table moves role_id, both ways (to Management and back);
//   - each new login, signed in for real, is made to choose a password, then passes the access gate:
//     it is on the volunteer floor exactly when its role's scope says so, my_permissions() is exactly its role's cells, it opens its own
//     page and not Settings -> Security.
// No password is read from .env.local: the admin's is made per run, each new login's is read off the page's
// one-time notice. Nothing is printed but results. Dev only. Exit 0 all passed, 1 a check failed, 2 could not run.
import { createHmac, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright-core";
import { giveRole } from "./lib/user-role.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);

const args = process.argv.slice(2);
const KEEP = args.includes("--keep");
const SHOTS = args.includes("--shots") ? args[args.indexOf("--shots") + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") {
  console.error(`check-security-role-picker: refusing: ${projectRef(env)} is not the dev project`);
  process.exit(2);
}
const base = (args.find((a) => /^https?:/.test(a)) ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`).replace(/\/$/, "");
const supaUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = createClient(supaUrl, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const tag = randomBytes(4).toString("hex");
const made = [];
let failures = 0;
const check = (ok, what, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${what}${!ok && detail ? `\n        ${detail}` : ""}`);
};

/** The picker's order (role-options.ts ORDER): every live role on dev, Admin first, Public viewer last. */
const EXPECTED_ORDER = ["Admin", "Management", "2IC", "Head of Maintenance", "Head of Medical", "Volunteer", "Doctor", "Public viewer"];
/**
 * Each configured role and a page its cells open. The page none of them may open is the cash-flow report
 * (reports.cashflow), asserted absent from their cells first: the Director's draft gives these roles more than
 * their names suggest (the 2IC has weights, the Head of Medical the stock count), so "another role's page" is
 * not a safe refusal to expect.
 */
const CONFIGURED = [
  { key: "second_in_command", name: "2IC", opens: "/stocktake" },
  { key: "head_of_maintenance", name: "Head of Maintenance", opens: "/maintenance" },
  { key: "head_of_medical", name: "Head of Medical", opens: "/medical/weight" },
];
const NOT = { path: "/management/cashflow", activity: "reports.cashflow" };

let exitCode = 0;
try {
  await fetch(`${base}/login`, { redirect: "manual" });
} catch {
  console.error(`check-security-role-picker: nothing is answering at ${base}. Start it: node scripts/worktree.mjs dev`);
  process.exit(2);
}

let browser;
try {
  browser = await launch();
  await run();
  exitCode = failures ? 1 : 0;
} catch (error) {
  console.error(error);
  exitCode = 2;
} finally {
  await browser?.close();
  if (KEEP) console.log(`\n--keep: ${made.length} login(s) ending "${tag}@example.invalid" are left in dev.`);
  else await cleanup();
}
console.log(failures ? `\n${failures} check(s) failed.` : exitCode === 0 ? "\nAll checks passed." : "");
process.exit(exitCode);

// ---------------------------------------------------------------------------------------------------------

async function run() {
  const roles = await rolesByKey();
  const adminCookies = await makeAdmin();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await context.addCookies([...adminCookies, { name: "locale", value: "en", url: base }]);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  // 1. The picker
  await page.goto(`${base}/admin/security`, { waitUntil: "networkidle" });
  check(new URL(page.url()).pathname === "/admin/security", "the test admin reaches Settings -> Security", page.url());
  const createOptions = await page.locator("select#role option").allTextContents();
  check(JSON.stringify(createOptions) === JSON.stringify(EXPECTED_ORDER), "the create form offers every live role, in order", JSON.stringify(createOptions));
  check(!createOptions.includes("Staff"), "Staff is not offered");
  await shot(page, "1-security-en");

  await context.addCookies([{ name: "locale", value: "th", url: base }]);
  await page.reload({ waitUntil: "networkidle" });
  const thai = await page.locator("select#role option").allTextContents();
  for (const key of ["second_in_command", "head_of_maintenance", "head_of_medical"]) {
    check(thai.includes(roles[key].name_th), `in Thai, ${roles[key].name} reads ${roles[key].name_th}`, JSON.stringify(thai));
  }
  await shot(page, "2-security-th");
  await context.addCookies([{ name: "locale", value: "en", url: base }]);
  await page.reload({ waitUntil: "networkidle" });

  // 2. Create one login per configured role, through the form
  const logins = [];
  for (const role of CONFIGURED) {
    const email = `rolepicker-${role.key.replace(/_/g, "-")}-${tag}@example.invalid`;
    const form = page.locator("form").filter({ has: page.locator("select#role") });
    await form.locator("#email").fill(email);
    await form.locator("#name").fill(`Role picker ${role.name}`);
    await form.locator("select#role").selectOption(role.key);
    await form.locator("button[type=submit]").click();
    const notice = form.locator("code");
    await notice.waitFor({ timeout: 30_000 });
    const temporaryPassword = (await notice.textContent()).trim();
    const success = await form.locator("p.text-success").textContent();
    check(success.includes(`as ${role.name}.`), `${role.name}: the form says it was created as ${role.name}`, success);

    const user = await userByEmail(email);
    made.push(user.id);
    const row = await roleRow(user.id);
    check(row.role_id === roles[role.key].id, `${role.name}: user_roles.role_id is the ${role.key} row`, JSON.stringify(row));
    check(!("role" in row), `${role.name}: user_roles has no enum column`, JSON.stringify(row));
    logins.push({ ...role, email, userId: user.id, temporaryPassword });
    await page.reload({ waitUntil: "networkidle" });
  }

  // 3. The users table names each by its own role
  for (const login of logins) {
    const shown = await selectedRoleInTable(page, login.email);
    check(shown === login.name, `${login.name}: the users table shows "${login.name}"`, `shows "${shown}"`);
  }
  await page.locator("tr", { hasText: logins[0].email }).scrollIntoViewIfNeeded();
  await shot(page, "3-users-table");

  // 4. Changing a role in the table keeps the pair in step, both ways
  const medical = logins.find((l) => l.key === "head_of_medical");
  // Through Doctor and Admin too: their special cases follow the role's key (the clinic box; 2-step set-up opened).
  for (const to of ["management", "doctor", "admin", "head_of_medical"]) {
    await page.locator("tr", { hasText: medical.email }).locator("select").first().selectOption(to);
    await page.locator("tr", { hasText: medical.email }).locator("+ tr .text-success").waitFor({ timeout: 30_000 });
    const row = await roleRow(medical.userId);
    check(row.role_id === roles[to].id, `changed in the table to ${roles[to].name}: role_id is the ${to} row`, JSON.stringify(row));
    await page.reload({ waitUntil: "networkidle" });
    if (to === "doctor") {
      const box = await page.locator("tr", { hasText: medical.email }).getByText("Not linked to a doctor").count();
      check(box === 1, "as Doctor, the row shows its Doctor box (not linked yet)");
    }
    if (to === "admin") {
      const { data } = await service.auth.admin.getUserById(medical.userId);
      check(typeof data.user?.app_metadata?.two_step_setup_until === "string", "made Admin, the login's 2-step set-up is opened");
    }
  }
  check(consoleErrors.length === 0, "no browser console errors on Settings -> Security", consoleErrors.slice(0, 3).join(" | "));
  await context.close();

  // 5. Each new login, signed in for real
  for (const login of logins) {
    const jar = new Map();
    const ssr = ssrClient(jar);
    const { error } = await ssr.auth.signInWithPassword({ email: login.email, password: login.temporaryPassword });
    check(!error, `${login.name}: signs in with the temporary password the page showed`, error?.message);
    if (error) continue;

    const { data: onFloor } = await ssr.rpc("on_volunteer_floor");
    check(onFloor === (roles[login.key].scope_residents === "who_and_where"), `${login.name}: on_volunteer_floor() follows its scope_residents (${roles[login.key].scope_residents})`, String(onFloor));
    const { data: perms } = await ssr.rpc("my_permissions");
    check(perms?.role?.key === login.key, `${login.name}: my_permissions() names the role ${login.key}`, JSON.stringify(perms?.role));
    const want = await cellsOf(roles[login.key].id);
    const got = cellsFromPerms(perms);
    check(JSON.stringify(got) === JSON.stringify(want), `${login.name}: my_permissions() is exactly its role's ${Object.keys(want).length} cells`,
      `got ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`);

    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    await ctx.addCookies([...[...jar].map(([name, value]) => ({ name, value, url: base })), { name: "locale", value: "en", url: base }]);
    const p = await ctx.newPage();
    await p.goto(`${base}/home`, { waitUntil: "networkidle" });
    check(new URL(p.url()).pathname === "/account/password", `${login.name}: is made to choose a password first`, p.url());
    const newPassword = randomBytes(18).toString("base64url");
    if (await p.locator("#current").count()) await p.locator("#current").fill(login.temporaryPassword);
    await p.locator("#password").fill(newPassword);
    await p.locator("#confirm").fill(newPassword);
    await Promise.all([
      p.waitForURL((u) => new URL(u).pathname !== "/account/password", { timeout: 30_000 }),
      p.locator("form").filter({ has: p.locator("#confirm") }).locator("button[type=submit]").click(),
    ]);
    await p.waitForLoadState("networkidle");
    const landed = new URL(p.url()).pathname;
    check(!["/login", "/no-access", "/account/password"].includes(landed) && landed !== "/", `${login.name}: then lands inside the app`, landed);
    await shot(p, `4-${login.key}-landing`);

    await p.goto(`${base}${login.opens}`, { waitUntil: "networkidle" });
    check(new URL(p.url()).pathname === login.opens, `${login.name}: opens ${login.opens}`, p.url());
    await shot(p, `5-${login.key}-own-page`);
    check(!(NOT.activity in want), `${login.name}: holds no ${NOT.activity} cell`);
    await p.goto(`${base}${NOT.path}`, { waitUntil: "networkidle" });
    check(new URL(p.url()).pathname !== NOT.path, `${login.name}: is turned away from ${NOT.path}`, p.url());
    await p.goto(`${base}/admin/security`, { waitUntil: "networkidle" });
    check(!new URL(p.url()).pathname.startsWith("/admin/security"), `${login.name}: is turned away from Settings -> Security`, p.url());
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------------------------------------

async function rolesByKey() {
  const { data, error } = await service.from("roles").select("id, key, name, name_th, scope_residents");
  if (error) throw new Error(`reading roles: ${error.message}`);
  return Object.fromEntries(data.map((r) => [r.key, r]));
}

async function userByEmail(email) {
  const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`listing logins: ${error.message}`);
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`the page did not create ${email}`);
  return user;
}

async function roleRow(userId) {
  const { data, error } = await service.from("user_roles").select("*").eq("user_id", userId).single();
  if (error) throw new Error(`reading user_roles: ${error.message}`);
  return data;
}

async function cellsOf(roleId) {
  const { data, error } = await service.from("role_permissions").select("activity, level").eq("role_id", roleId);
  if (error) throw new Error(`reading role_permissions: ${error.message}`);
  return Object.fromEntries(data.map((c) => [c.activity, c.level]).sort(([a], [b]) => a.localeCompare(b)));
}

/** my_permissions()'s cells, whichever of its shapes: {cells: {activity: level}} or a flat map. */
function cellsFromPerms(perms) {
  const cells = perms?.cells ?? perms?.permissions ?? perms ?? {};
  return Object.fromEntries(
    Object.entries(cells).filter(([, v]) => typeof v === "number" && v > 0).sort(([a], [b]) => a.localeCompare(b)),
  );
}

async function selectedRoleInTable(page, email) {
  return (await page.locator("tr", { hasText: email }).locator("select").first().locator("option:checked").textContent())?.trim();
}

function ssrClient(jar) {
  return createServerClient(supaUrl, anonKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
}

/** A throwaway admin with an approved authenticator app, signed in and stepped up to aal2. Its cookies. */
async function makeAdmin() {
  const email = `rolepicker-admin-${tag}@example.invalid`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await service.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: "Role picker check admin" },
  });
  if (error) throw new Error(`creating the admin login: ${error.message}`);
  made.push(data.user.id);
  const { error: roleError } = await giveRole(service, data.user.id, "admin");
  if (roleError) throw new Error(`giving the admin login its role: ${roleError.message}`);

  const jar = new Map();
  const ssr = ssrClient(jar);
  const { error: signInError } = await ssr.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`signing in as the admin: ${signInError.message}`);
  const { data: enrolled, error: enrolError } = await ssr.auth.mfa.enroll({ factorType: "totp", friendlyName: `check ${tag}` });
  if (enrolError) throw new Error(`enrolling the admin's app: ${enrolError.message}`);
  // Security trusts only the factor an admin approved (src/lib/auth/two-step.ts).
  const { error: approveError } = await service.auth.admin.updateUserById(data.user.id, { app_metadata: { two_step_factor: enrolled.id } });
  if (approveError) throw new Error(`approving the admin's app: ${approveError.message}`);
  const { error: verifyError } = await ssr.auth.mfa.challengeAndVerify({ factorId: enrolled.id, code: totp(enrolled.totp.secret) });
  if (verifyError) throw new Error(`stepping the admin up: ${verifyError.message}`);
  return [...jar].map(([name, value]) => ({ name, value, url: base }));
}

/** RFC 6238: the code an authenticator app shows for this secret now. */
function totp(base32Secret, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of base32Secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function shot(page, name) {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: false });
}

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

async function cleanup() {
  for (const id of made) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.warn(`  cleanup: could not delete login ${id}: ${error.message}`);
  }
}
