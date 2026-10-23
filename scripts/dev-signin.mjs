// A signed-in browser session on DEV for one role, with no password handed to anyone:
//
//   node scripts/dev-signin.mjs <role> [--port N]     print the snippet that signs the browser in
//   node scripts/dev-signin.mjs --cards a,b [--port N] the same, for a login holding EXACTLY these cards and nothing else
//   node scripts/dev-signin.mjs --remove <role>        delete only that role's login (a roles.key, or a dev_signin_cards_<hash> key)
//   node scripts/dev-signin.mjs --remove --cards a,b   delete only the login and throwaway role for exactly those cards
//   node scripts/dev-signin.mjs --remove all           delete every dev-signin login (and card-scoped role), signing every stream out
//
// --cards (docs/card-walkthrough.md; docs/decisions/2026-10-22-card-walkthrough-generated.md): the cards are card keys from
// src/lib/permissions/cards.ts. The script makes one throwaway role per set of cards (key dev_signin_cards_<hash>), hands it the
// cards through set_role_cards() with the bundle cards.ts computes, and signs in a login holding only that role. No extras, so a
// card that silently leans on another card's permission fails for this login, not in front of a real person.

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
import { createHash } from "node:crypto";
import { giveRole } from "./lib/user-role.mjs";
import { loadCards } from "./lib/load-cards.mjs";

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
const CARD_ROLE_PREFIX = "dev_signin_cards_";

async function allUsers() {
  const out = [];
  for (let page = 1; ; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    out.push(...data.users);
    if (data.users.length < 200) return out;
  }
}

// "Database error deleting user" says nothing. The usual cause is a row the login created (created_by, uploaded_by, ...)
// in a table whose foreign key to auth.users does not cascade, so name those tables and counts. It only reads.
async function whatHolds(userId) {
  const sql = `do $held$ declare r record; n int; out text = ''; begin
    for r in select c.conrelid::regclass::text t, a.attname col from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
      where c.contype = 'f' and c.confrelid = 'auth.users'::regclass and c.confdeltype not in ('c', 'n') loop
      execute format('select count(*) from %s where %I = %L', r.t, r.col, '${userId}') into n;
      if n > 0 then out = out || r.t || '.' || r.col || ' (' || n || ' row(s)); '; end if;
    end loop;
    raise exception 'HOLDS %', out; end $held$`;
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    let msg = ""; try { msg = JSON.parse(await res.text()).message ?? ""; } catch {}
    const m = /HOLDS ([^\n]*)/.exec(msg);
    return m && m[1].trim() ? `  still referenced by: ${m[1].trim()}\n  Those are dev rows this login created while you tested; delete or reassign them, then run --remove again.` : "  no foreign-key references found; the cause is something else (a trigger on auth.users?)";
  } catch (e) {
    return `  could not look up what holds it: ${e.message}`;
  }
}

const args = process.argv.slice(2);
const cardRoleKey = (list) => CARD_ROLE_PREFIX + createHash("sha1").update([...new Set(list)].sort().join(",")).digest("hex").slice(0, 8);
const loginEmail = (role) => `${PREFIX}${role.startsWith(CARD_ROLE_PREFIX) ? role.slice(CARD_ROLE_PREFIX.length) : role}${DOMAIN}`.replace(/_/g, "-");
if (args.includes("--remove")) {
  // Other streams share this project and hold their own logins: removing is always by name, never a blanket sweep by default.
  const rmIdx = args.indexOf("--remove");
  const rmCards = args.indexOf("--cards");
  const named = args[rmIdx + 1] && !args[rmIdx + 1].startsWith("--") ? args[rmIdx + 1] : null;
  let target = null; // null = everything (only via "all")
  if (rmCards >= 0) {
    const list = (args[rmCards + 1] ?? "").split(",").map((k) => k.trim()).filter(Boolean);
    if (!list.length) throw new Error("--cards needs a comma-separated list of card keys");
    target = cardRoleKey(list);
  } else if (named && named !== "all") target = named;
  else if (!named) throw new Error("--remove needs a role, --cards a,b, or the word all (all signs every other stream out)");
  const cardRoles = await service.from("roles").select("id, key").like("key", `${CARD_ROLE_PREFIX}%`);
  if (cardRoles.error) throw cardRoles.error;
  if (target) cardRoles.data = cardRoles.data.filter((r) => r.key === target);
  const wantEmail = target ? loginEmail(target) : null;
  const mine = (await allUsers()).filter((u) => u.email?.startsWith(PREFIX) && u.email.endsWith(DOMAIN) && (!wantEmail || u.email === wantEmail));
  for (const u of mine) {
    await service.from("user_roles").delete().eq("user_id", u.id);
    const { error } = await service.auth.admin.deleteUser(u.id);
    console.log(`${error ? "FAILED" : "removed"} ${u.email}${error ? `: ${error.message}` : ""}`);
    if (error) console.log(await whatHolds(u.id));
  }
  // After the logins: a role with a login on it is refused deletion. role_cards and role_permissions go first, by hand.
  for (const r of cardRoles.data) {
    await service.from("role_cards").delete().eq("role_id", r.id);
    await service.from("role_permissions").delete().eq("role_id", r.id);
    const { error } = await service.from("roles").delete().eq("id", r.id);
    console.log(`${error ? "FAILED" : "removed"} role ${r.key}${error ? `: ${error.message}` : ""}`);
  }
  if (!mine.length && !cardRoles.data.length) console.log("nothing to remove");
  process.exit(0);
}

const portIdx = args.indexOf("--port");
const cardsIdx = args.indexOf("--cards");
const cardsArg = cardsIdx >= 0 ? args[cardsIdx + 1] : null;
if (cardsIdx >= 0 && (!cardsArg || cardsArg.startsWith("--"))) throw new Error("--cards needs a comma-separated list of card keys");
const positional = args.find((a, i) => !a.startsWith("--") && i !== (portIdx >= 0 ? portIdx + 1 : -1) && i !== (cardsIdx >= 0 ? cardsIdx + 1 : -1));
let role = positional;
if (cardsArg && positional) throw new Error("give a role or --cards, not both");
if (!role && !cardsArg) throw new Error("usage: node scripts/dev-signin.mjs <role> [--port N]   |   --cards a,b [--port N]   |   --remove");
const portArg = portIdx >= 0 ? args[portIdx + 1] : null;
const port = portArg ?? readFileSync(join(root, ".port"), "utf8").trim();

let cardKeys = null;
if (cardsArg) {
  const { CARD_KEYS, isCardKey, bundleJson } = await loadCards(root);
  cardKeys = [...new Set(cardsArg.split(",").map((k) => k.trim()).filter(Boolean))];
  const bad = cardKeys.filter((k) => !isCardKey(k));
  if (!cardKeys.length || bad.length) throw new Error(`not card keys: ${bad.join(", ") || "(none given)"}. Cards: ${CARD_KEYS.join(", ")}`);
  role = cardRoleKey(cardKeys);
  // Resident scope "all", clinical scope "any". "who_and_where" was the first choice and was wrong: it is on_volunteer_floor(),
  // so /residents/[id] redirects the login to /r/[id] and no card could reach the resident hub. The cards decide what the login
  // can do; the scope only decides which residents it sees (docs/decisions/2026-10-22-card-logins-get-a-real-scope.md).
  const { error: upErr } = await service.from("roles").upsert(
    { key: role, name: `Dev sign-in: ${cardKeys.join(", ")}`.slice(0, 120), kind: "custom", opens_app: true, home_path: "/home", scope_residents: "all", scope_clinical: "any", sees_login_emails: false },
    // No ignoreDuplicates: a throwaway role made by an older run (who_and_where) is corrected on the next run.
    { onConflict: "key" },
  );
  if (upErr) throw upErr;
  const { data: made, error: madeErr } = await service.from("roles").select("id").eq("key", role).single();
  if (madeErr) throw madeErr;
  const { error: setErr } = await service.rpc("set_role_cards", { p_role: made.id, p_cards: cardKeys, p_bundle: bundleJson(cardKeys) });
  if (setErr) throw setErr;
}

const { data: roleRow, error: roleErr } = await service.from("roles").select("id").eq("key", role).maybeSingle();
if (roleErr) throw roleErr;
if (!roleRow) throw new Error(`no role with key "${role}"`);

const email = loginEmail(role);
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
console.error(`${email} is ${cardKeys ? `holding only the cards ${cardKeys.join(", ")}` : `a ${role}`} on dev. Run this in javascript_tool on http://localhost:${port}, then navigate to /my:`);
console.log(`${sets.join(";")};location.href="/my"`);
