// The facility map's details panel, against DEV and a running dev server:
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-map-details.mjs [http://localhost:<port>]
//
// Makes a throwaway admin and a throwaway volunteer, then, as each login:
//   - opens /enclosures?view=map and checks no count chip is drawn (the 2026-10-09 change)
//   - calls the panel's server action (loadEnclosurePanel) for an occupied on-site enclosure, the
//     way a tap does, and checks it returns that enclosure's residents, notes and maintenance
//   - opens /enclosures/<id> and checks the page shows the same residents (one loader, two callers)
// and that signed out, the action returns no details. The volunteer must get who and where only:
// the action answers through the same views the enclosure page reads (0134). Everything it made is
// deleted at the end. Exits 0 when every expectation held.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("refusing: not the dev project");

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const tag = randomBytes(4).toString("hex");
const password = randomBytes(18).toString("base64url");

async function signIn(email) {
  const jar = new Map();
  const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}
const page = async (path, cookie) => {
  const res = await fetch(`${base}${path}`, { headers: { cookie } });
  return { status: res.status, html: await res.text() };
};

// The action's id, from the dev server's manifest for the map's page (it exists once the page compiled).
function actionId() {
  for (const p of [".next/dev/server/app/enclosures/page/server-reference-manifest.json", ".next/server/app/enclosures/page/server-reference-manifest.json"]) {
    if (!existsSync(p)) continue;
    const manifest = JSON.parse(readFileSync(p, "utf8"));
    for (const [id, entry] of Object.entries(manifest.node ?? {})) if (entry.exportedName === "loadEnclosurePanel" || JSON.stringify(entry).includes("loadEnclosurePanel")) return id;
  }
  return null;
}
async function callAction(id, enclosureId, cookie) {
  const res = await fetch(`${base}/enclosures?view=map`, {
    method: "POST",
    headers: { "Next-Action": id, "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", cookie },
    body: JSON.stringify([enclosureId]),
  });
  return { status: res.status, body: await res.text() };
}

const users = [];
try {
  const cookies = {};
  for (const role of ["admin", "volunteer"]) {
    const { data, error } = await service.auth.admin.createUser({ email: `harness-mapdetails-${role}-${tag}@example.invalid`, password, email_confirm: true });
    if (error) throw error;
    users.push(data.user.id);
    const r = await service.from("user_roles").insert({ user_id: data.user.id, role });
    if (r.error) throw r.error;
    cookies[role] = await signIn(data.user.email);
  }

  // An occupied enclosure that is on a zone plan.
  const { data: occ } = await service.from("resident_list_view").select("enclosure_id, name").not("enclosure_id", "is", null);
  const { data: placed } = await service.from("enclosures").select("id, name, notes, map_shape, zones(internal, name)").not("map_shape", "is", null);
  const byEnclosure = new Map();
  for (const r of occ ?? []) byEnclosure.set(r.enclosure_id, [...(byEnclosure.get(r.enclosure_id) ?? []), r.name]);
  const target = (placed ?? []).find((e) => byEnclosure.has(e.id) && e.zones?.internal);
  if (!target) throw new Error("no occupied enclosure on a plan in dev to test with");
  const names = byEnclosure.get(target.id);
  console.log(`enclosure ${target.name}: ${names.length} resident(s)`);

  const map = await page("/enclosures?view=map", cookies.admin);
  expect(map.status === 200, `the admin opens the map (${map.status})`);
  expect(!/<rect[^>]*rx="0.9"/.test(map.html), "no count chip is drawn on the plan");

  const id = actionId();
  expect(Boolean(id), "the panel's action is in the dev server's manifest");
  if (id) {
    for (const role of ["admin", "volunteer"]) {
      const res = await callAction(id, target.id, cookies[role]);
      expect(res.status === 200 && res.body.includes('"ok":true'), `${role}: a tap loads the details (${res.status})`);
      expect(names.every((n) => res.body.includes(JSON.stringify(n).slice(1, -1))), `${role}: every resident in ${target.name} is in the panel`);
      expect(res.body.includes('"maintenanceJobs"') && res.body.includes('"residents"'), `${role}: residents and maintenance come back`);
      const hub = await page(`/enclosures/${target.id}`, cookies[role]);
      expect(hub.status === 200 && names.every((n) => hub.html.includes(n.replace(/&/g, "&amp;"))), `${role}: the enclosure page lists the same residents (${hub.status})`);
    }
    const anon = await callAction(id, target.id, "");
    expect(!anon.body.includes('"ok":true'), `signed out: no details (${anon.status})`);
    const missing = await callAction(id, "00000000-0000-0000-0000-000000000000", cookies.admin);
    expect(missing.body.includes('"ok":false'), "an enclosure that does not exist is a message, not a crash");
  }
} finally {
  for (const id of users) await service.auth.admin.deleteUser(id);
  console.log(`cleaned up ${users.length} throwaway logins`);
}

console.log(failures.length ? `${failures.length} failure(s)` : "all expectations held");
process.exit(failures.length ? 1 : 0);
