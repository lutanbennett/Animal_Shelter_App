// Disposable ADOPTER login on the dev project (#l5gxn). Not a staff login: it holds no role and no card.
//   node scripts/dev-adopter-signin.mjs [--port N]     print the snippet that signs the browser in as the adopter
//   node scripts/dev-adopter-signin.mjs --remove       delete the fixture (auth user, contact, placement, resident, its updates)
// Makes: a confirmed-email auth user dev-adopter-l5gxn@example.invalid, a Carer contact with that email, a resident
// "Fixture l5gxn" (code R-L5GXN) and an open Adopt placement naming the contact as carer. Run the snippet in
// javascript_tool on http://localhost:<port>; it sets the session cookies and goes to /adopter-update.
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${projectRef(env)} is not the dev project`);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const EMAIL = "dev-adopter-l5gxn@example.invalid";
const CODE = "R-L5GXN";
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const port = arg("--port") ?? "3000";
const ok = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };

async function findUser() {
  for (let page = 1; ; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email === EMAIL);
    if (u || data.users.length < 200) return u;
  }
}

async function remove() {
  const res = ok(await service.from("residents").select("id").eq("resident_code", CODE), "find resident");
  for (const r of res) {
    ok(await service.from("adoption_updates").delete().eq("resident_id", r.id), "delete updates");
    ok(await service.from("placement_history").delete().eq("resident_id", r.id), "delete placements");
    ok(await service.from("residents").delete().eq("id", r.id), "delete resident");
  }
  ok(await service.from("contacts").delete().eq("email", EMAIL), "delete contact");
  const u = await findUser();
  if (u) await service.auth.admin.deleteUser(u.id);
  console.error("fixture removed");
}

if (process.argv.includes("--remove")) {
  await remove();
  process.exit(0);
}

let resident = ok(await service.from("residents").select("id").eq("resident_code", CODE).maybeSingle(), "find resident");
if (!resident) resident = ok(await service.from("residents").insert({ name: "Fixture l5gxn", species: "Dog", is_public_visible: false, resident_code: CODE }).select("id").single(), "make resident");
let contact = ok(await service.from("contacts").select("id").eq("email", EMAIL).maybeSingle(), "find contact");
if (!contact) contact = ok(await service.from("contacts").insert({ name: "Fixture Adopter l5gxn", type: "Carer", email: EMAIL }).select("id").single(), "make contact");
const open = ok(await service.from("placement_history").select("id").eq("resident_id", resident.id).eq("placement_type", "Adopt").is("end_date", null), "find placement");
if (!open.length) ok(await service.from("placement_history").insert({ resident_id: resident.id, placement_type: "Adopt", carer_id: contact.id, start_date: new Date().toISOString().slice(0, 10) }), "make placement");

const password = randomBytes(18).toString("base64url");
let user = await findUser();
if (user) ok(await service.auth.admin.updateUserById(user.id, { password, email_confirm: true }), "reset password");
else user = ok(await service.auth.admin.createUser({ email: EMAIL, password, email_confirm: true }), "make user").user;

const jar = new Map();
const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
  },
});
const { error: signErr } = await ssr.auth.signInWithPassword({ email: EMAIL, password });
if (signErr) throw signErr;
const sets = [...jar].map(([n, v]) => `document.cookie=${JSON.stringify(`${n}=${encodeURIComponent(v)}; path=/; max-age=3000; samesite=lax`)}`);
console.error(`${EMAIL} is an adopter of ${CODE} on dev (no role, no card). Run this in javascript_tool on http://localhost:${port}:`);
console.log(`${sets.join(";")};location.href="/adopter-update"`);
