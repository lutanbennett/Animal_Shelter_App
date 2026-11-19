// A signed-in browser session on DEV for one role, with no password handed to anyone:
//
//   node scripts/dev-signin.mjs <role> [--port N]     print the snippet that signs the browser in
//   node scripts/dev-signin.mjs --cards a,b [--port N] [--label x] the same, for a login holding EXACTLY these cards and nothing else.
//                                                      One login per card set PER PORT (or label): two streams with the same cards do not share a login.
//   ... add --shelter <key|id> to either form: the role (and login) is on that shelter instead of the default one
//   ... add --aal2 to either form: the session is then aal2 (a dev-only step-up, see scripts/lib/dev-aal2.mjs), so /platform
//                                                      and /admin/security can be pressed. The login is NOT given a role or card by it.
//   node scripts/dev-signin.mjs --remove <role>        delete only that role's login (a roles.key, or a dev_signin_cards_<hash>_<port> key)
//   node scripts/dev-signin.mjs --remove --cards a,b [--port N]   delete only the login and throwaway role for those cards on that port
//   node scripts/dev-signin.mjs --remove <role> --clear-held   also delete the test clinic visits / bulk batches that login created, when those are all that hold it
//   node scripts/dev-signin.mjs --remove all           delete every dev-signin login (and card-scoped role), signing every stream out
//
// --cards (docs/card-walkthrough.md; docs/decisions/2026-10-22-card-walkthrough-generated.md): the cards are card keys from
// src/lib/permissions/cards.ts. The script makes one throwaway role per set of cards (key dev_signin_cards_<hash>_<port>), hands it the
// cards through set_role_cards(), and signs in a login holding only that role. No extras, so a
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
import { scriptShelterHeaders } from "./lib/shelter-env.mjs";
import { createHash } from "node:crypto";
import { giveRole } from "./lib/user-role.mjs";
import { loadCards } from "./lib/load-cards.mjs";
import { stepUpToAal2 } from "./lib/dev-aal2.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${projectRef(env)} is not the dev project`);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
// --shelter <key|id> (#dvshl): the login's role lives on THAT shelter instead of the default one DEV_SHELTER_ID names.
const shelterOpt = (() => {
  const i = process.argv.indexOf("--shelter");
  if (i < 0) return null;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) throw new Error("--shelter needs a shelter key or id (shelters.key, e.g. test-shelter-2)");
  return v;
})();
let targetShelter = null; // { id, key } when --shelter is given
if (shelterOpt) {
  const bare = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shelterOpt);
  const { data, error } = await bare.from("shelters").select("id, key").eq(isId ? "id" : "key", shelterOpt).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`no shelter with key or id "${shelterOpt}"`);
  targetShelter = data;
}
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  // The shelter header makes every row this script writes take the dev shelter (0390 default), so the per-shelter policies (0392) can see it.
  // With --shelter it names the target shelter instead, so nothing the script writes lands on the default one.
  global: { headers: targetShelter ? { "x-shelter-id": targetShelter.id } : scriptShelterHeaders(env) },
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
// Dev-only test rows a login leaves behind that --clear-held may delete. Order matters: visits before the bulk batch they
// point at. Both are leaf tables (nothing references them), so deleting a throwaway login's rows takes nothing else with it.
// Any other table that holds the login stays a refusal that names it: that is real work, not test residue.
const CLEARABLE = ["clinic_visits", "bulk_appointments"];

async function whatHolds(userId, { raw = false } = {}) {
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
    if (raw) return m ? m[1].trim() : "";
    return m && m[1].trim() ? `  still referenced by: ${m[1].trim()}\n  Those are dev rows this login created while you tested; delete or reassign them, then run --remove again.` : "  no foreign-key references found; the cause is something else (a trigger on auth.users?)";
  } catch (e) {
    return `  could not look up what holds it: ${e.message}`;
  }
}

const args = process.argv.slice(2);
// One throwaway role and login per card set PER CALLER (the port, or --label), so two streams asking for the same cards get two
// logins and neither re-keys the other's password. Key: dev_signin_cards_<hash>_<port|label>.
const optVal = (name) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null; };
const labelArg = optVal("--label");
const callerPort = optVal("--port") ?? (() => { try { return readFileSync(join(root, ".port"), "utf8").trim(); } catch { return null; } })();
const callerSuffix = (labelArg ?? callerPort ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 16) + (targetShelter ? "_s" + targetShelter.id.slice(0, 6) : "");
if (args.includes("--label") && !labelArg) throw new Error("--label needs a value");
const cardRoleKey = (list) => CARD_ROLE_PREFIX + createHash("sha1").update([...new Set(list)].sort().join(",")).digest("hex").slice(0, 8) + (callerSuffix ? "_" + callerSuffix : "");
const loginEmail = (role) => `${PREFIX}${role.startsWith(CARD_ROLE_PREFIX) ? role.slice(CARD_ROLE_PREFIX.length) : role}${targetShelter && !role.startsWith(CARD_ROLE_PREFIX) ? "-s" + targetShelter.id.slice(0, 6) : ""}${DOMAIN}`.replace(/_/g, "-");
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
  const cardRoles = await service.from("roles").select("id, key").or(`key.like.${CARD_ROLE_PREFIX}%,key.like.dev_signin_admin_%`);
  if (cardRoles.error) throw cardRoles.error;
  // a throwaway Admin made by --shelter admin has its own key (see the sign-in half); removing "admin" on a shelter removes that one only
  const roleTarget = target === "admin" && targetShelter ? "dev_signin_admin_" + callerSuffix : target;
  if (target) cardRoles.data = cardRoles.data.filter((r) => r.key === roleTarget);
  const wantEmail = target ? loginEmail(target) : null;
  const mine = (await allUsers()).filter((u) => u.email?.startsWith(PREFIX) && u.email.endsWith(DOMAIN) && (!wantEmail || u.email === wantEmail));
  for (const u of mine) {
    await service.from("user_roles").delete().eq("user_id", u.id);
    if (args.includes("--clear-held")) {
      // "table.col (n row(s)); ..." -> only when every holder is a CLEARABLE table, so nothing real is deleted on the way.
      const held = [...(await whatHolds(u.id, { raw: true })).matchAll(/(\S+)\.(\S+) \((\d+) row/g)].map((m) => ({ table: m[1], col: m[2] }));
      const other = held.filter((h) => !CLEARABLE.includes(h.table));
      if (other.length) console.log(`not clearing ${u.email}: also held by ${other.map((h) => h.table + "." + h.col).join(", ")}, which is not test residue`);
      else {
        for (const t of CLEARABLE) for (const h of held.filter((x) => x.table === t)) {
          const { error } = await service.from(t).delete().eq(h.col, u.id);
          console.log(`${error ? "FAILED clearing" : "cleared"} ${t}.${h.col} for ${u.email}${error ? `: ${error.message}` : ""}`);
        }
      }
    }
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
const positional = args.find((a, i) => !a.startsWith("--") && i !== (portIdx >= 0 ? portIdx + 1 : -1) && i !== (cardsIdx >= 0 ? cardsIdx + 1 : -1) && i !== (args.indexOf("--label") >= 0 ? args.indexOf("--label") + 1 : -1) && i !== (args.indexOf("--shelter") >= 0 ? args.indexOf("--shelter") + 1 : -1));
let role = positional;
if (cardsArg && positional) throw new Error("give a role or --cards, not both");
if (!role && !cardsArg) throw new Error("usage: node scripts/dev-signin.mjs <role> [--port N]   |   --cards a,b [--port N]   |   --remove");
const portArg = portIdx >= 0 ? args[portIdx + 1] : null;
const port = portArg ?? readFileSync(join(root, ".port"), "utf8").trim();

let cardKeys = null;
if (cardsArg) {
  const { CARD_KEYS, isCardKey } = await loadCards(root);
  cardKeys = [...new Set(cardsArg.split(",").map((k) => k.trim()).filter(Boolean))];
  const bad = cardKeys.filter((k) => !isCardKey(k));
  if (!cardKeys.length || bad.length) throw new Error(`not card keys: ${bad.join(", ") || "(none given)"}. Cards: ${CARD_KEYS.join(", ")}`);
  role = cardRoleKey(cardKeys);
  // The cards decide what the login can do. The role columns that once scoped it (opens_app, scope_*) were dropped by 0264.
  const { error: upErr } = await service.from("roles").upsert(
    { key: role, name: `Dev sign-in: ${cardKeys.join(", ")}`.slice(0, 120), kind: "custom", home_path: "/home", ...(targetShelter ? { shelter_id: targetShelter.id } : {}) },
    // No ignoreDuplicates: a throwaway role made by an older run (who_and_where) is corrected on the next run.
    // TWO COLUMNS, AND DO NOT "TIDY" IT BACK TO "key". 0387 replaced roles' `unique (key)` with
    // `roles_shelter_key_key unique nulls not distinct (shelter_id, key)`, so a conflict target of
    // `key` alone matches no constraint and Postgres answers 42P10 ("there is no unique or exclusion
    // constraint matching the ON CONFLICT specification") — which is what broke every stream's
    // `--cards` login between 0387 landing and this fix (#dvsgn). The payload sets no shelter_id, so
    // it is null and NULLS NOT DISTINCT matches the existing row exactly as `key` used to; when part 5
    // of the tenancy programme starts filling shelter_id in, this target keeps working unchanged.
    { onConflict: "shelter_id,key" },
  );
  if (upErr) throw upErr;
  const { data: made, error: madeErr } = await service.from("roles").select("id").eq("key", role).single();
  if (madeErr) throw madeErr;
  const { error: setErr } = await service.rpc("set_role_cards", { p_role: made.id, p_cards: cardKeys });
  if (setErr) throw setErr;
}

let roleQ = service.from("roles").select("id").eq("key", role);
if (targetShelter) roleQ = roleQ.eq("shelter_id", targetShelter.id);
let { data: roleRow, error: roleErr } = await roleQ.maybeSingle();
if (!roleErr && !roleRow && targetShelter && role === "admin") {
  // A bare shelter has no Admin role (roles are per shelter since 0401, one is_admin per shelter since 0387). Make a throwaway one
  // whose key carries the port and shelter, so --remove --shelter removes it and nothing real on the shelter is touched.
  const adminKey = "dev_signin_admin_" + callerSuffix;
  const up = await service.from("roles").upsert({ key: adminKey, name: "Dev sign-in: admin", kind: "custom", home_path: "/home", is_admin: true, shelter_id: targetShelter.id }, { onConflict: "shelter_id,key" });
  if (up.error) throw up.error;
  ({ data: roleRow, error: roleErr } = await service.from("roles").select("id").eq("key", adminKey).eq("shelter_id", targetShelter.id).maybeSingle());
}
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
const { error: giveErr } = targetShelter ? await service.from("user_roles").insert({ user_id: user.id, role_id: roleRow.id }) : await giveRole(service, user.id, role);
if (giveErr) throw giveErr;

const jar = new Map();
const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: scriptShelterHeaders(env) },
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
  },
});
const { error: signErr } = await ssr.auth.signInWithPassword({ email, password });
if (signErr) throw signErr;
const wantAal2 = args.includes("--aal2");
if (wantAal2) await stepUpToAal2({ service, ssr, user, projectRef: projectRef(env) });

const sets = [...jar].map(([n, v]) => `document.cookie=${JSON.stringify(`${n}=${encodeURIComponent(v)}; path=/; max-age=3000; samesite=lax`)}`);
console.error(`${email} is ${wantAal2 ? "at aal2, " : ""}${cardKeys ? `holding only the cards ${cardKeys.join(", ")}` : `a ${role}`} on dev${targetShelter ? ` (shelter ${targetShelter.key})` : ""}. Run this in javascript_tool on http://localhost:${port}, then navigate to /my:`);
if (targetShelter) console.error(`The browser reads the shelter from the dev server, not the login: start it as  DEV_SHELTER_ID=${targetShelter.id} node scripts/worktree.mjs dev  (the shell value beats .env.local). Port ${port} is otherwise on the default shelter.`);
console.log(`${sets.join(";")};location.href="/my"`);
