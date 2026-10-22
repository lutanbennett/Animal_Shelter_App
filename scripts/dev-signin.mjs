// A signed-in browser session on DEV for one role, with no password handed to anyone:
//
//   node scripts/dev-signin.mjs <role> [--port N]     print the snippet that signs the browser in
//   node scripts/dev-signin.mjs --remove               delete every dev-signin login this script made
//
// <role> is a roles.key (admin, management, staff, volunteer, ...). The script keeps ONE disposable
// login per role (dev-signin-<role>@example.invalid, dev project only), gives it a fresh random
// password it never prints, signs in with it through the same cookie client the app uses, and prints
// a one-line snippet. Run the snippet in the browser pane's javascript_tool on http://localhost:<port>,
// then navigate: the session cookies are set, so the app sees a normal signed-in user.
//
// Why this and not the Google button: password sign-in never leaves the app, so the dev project's
// Redirect URLs (/auth/callback per port) are not involved. Why not DEV_TEST_USER_*: that account is
// a shared admin and reading its password is refused. The account is aal1 (password only), as in
// scripts/check-access-requests-card.mjs; pages that demand a second step will redirect to it.
// Cookies are per host, not per port, so the session is shared by every localhost port in that browser.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { giveRole } from "./lib/user-role.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${projectRef(env)} is not the dev project`);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const PREFIX = "dev-signin-";
const DOMAIN = "@example.invalid";

async function allUsers() {
  const out = [];
  for (let page = 1; ; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    out.push(...data.users);
    if (data.users.length < 200) return out;
  }
}

const args = process.argv.slice(2);
if (args.includes("--remove")) {
  const mine = (await allUsers()).filter((u) => u.email?.startsWith(PREFIX) && u.email.endsWith(DOMAIN));
  for (const u of mine) {
    await service.from("user_roles").delete().eq("user_id", u.id);
    const { error } = await service.auth.admin.deleteUser(u.id);
    console.log(`${error ? "FAILED" : "removed"} ${u.email}${error ? `: ${error.message}` : ""}`);
  }
  if (!mine.length) console.log("nothing to remove");
  process.exit(0);
}

const portIdx = args.indexOf("--port");
const role = args.find((a, i) => !a.startsWith("--") && (portIdx < 0 || i !== portIdx + 1));
if (!role) throw new Error("usage: node scripts/dev-signin.mjs <role> [--port N]   |   --remove");
const portArg = portIdx >= 0 ? args[portIdx + 1] : null;
const port = portArg ?? readFileSync(join(root, ".port"), "utf8").trim();

const { data: roleRow, error: roleErr } = await service.from("roles").select("id").eq("key", role).maybeSingle();
if (roleErr) throw roleErr;
if (!roleRow) throw new Error(`no role with key "${role}"`);

const email = `${PREFIX}${role}${DOMAIN}`;
const password = randomBytes(18).toString("base64url");
let user = (await allUsers()).find((u) => u.email === email);
if (user) {
  const { error } = await service.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
} else {
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
}
await service.from("user_roles").delete().eq("user_id", user.id);
const { error: giveErr } = await giveRole(service, user.id, role);
if (giveErr) throw giveErr;

const jar = new Map();
const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
  },
});
const { error: signErr } = await ssr.auth.signInWithPassword({ email, password });
if (signErr) throw signErr;

const sets = [...jar].map(([n, v]) => `document.cookie=${JSON.stringify(`${n}=${encodeURIComponent(v)}; path=/; max-age=3000; samesite=lax`)}`);
console.error(`${email} is a ${role} on dev. Run this in javascript_tool on http://localhost:${port}, then navigate to /my:`);
console.log(`${sets.join(";")};location.href="/my"`);
