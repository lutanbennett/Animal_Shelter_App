// Bills on a maintenance job, as real logins against DEV and a running dev server:
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-maintenance-bills-page.mjs [http://localhost:<port>]
//
// Makes a job with two bills (120.50 and 80, typed Actual cost 999) and three throwaway logins
// (management, head_of_maintenance, second_in_command), fetches /maintenance/<job> as each, and checks:
// Management sees both bills, their total 201 and the typed 999 marked unused; the two Heads see no
// Bills section, no "Add a bill", none of the bill amounts and not the total. The upload route refuses
// a Head with 403. Everything made is deleted at the end, whatever happened. Exits 0 when all held.
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { giveRole } from "./lib/user-role.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const tag = randomBytes(4).toString("hex");
const password = randomBytes(18).toString("base64url");
const JOB = randomUUID();
const users = [];

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
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

const get = async (path, cookie) => {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, html: await res.text() };
};

try {
  const { data: zone } = await service.from("zones").select("id").order("id").limit(1).single();
  const { error: jobErr } = await service
    .from("maintenance")
    .insert({ id: JOB, title: `Harness bills job ${tag}`, zone_id: zone.id, actual_cost: 999 });
  if (jobErr) throw jobErr;

  const mk = async (who, role) => {
    const email = `harness-mbills-${who}-${tag}@example.invalid`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    users.push(data.user.id);
    const { error: roleErr } = await giveRole(service, data.user.id, role);
    if (roleErr) throw roleErr;
    return { email, id: data.user.id };
  };
  const mgmt = await mk("mgmt", "management");
  const hm = await mk("hm", "head_of_maintenance");
  const sic = await mk("sic", "second_in_command");

  const { error: billErr } = await service.from("maintenance_bills").insert([
    { maintenance_id: JOB, amount: 120.5, note: "paint harness", added_by: mgmt.id },
    { maintenance_id: JOB, amount: 80, note: "timber harness", added_by: mgmt.id },
  ]);
  if (billErr) throw billErr;

  const path = `/maintenance/${JOB}`;
  const m = await get(path, await signInCookies(mgmt.email));
  expect(m.status === 200, `Management opens the job (${m.status})`);
  expect(m.html.includes("Add a bill"), "Management sees Add a bill");
  expect(m.html.includes("paint harness") && m.html.includes("timber harness"), "Management sees both bills' notes");
  expect(m.html.includes("120.50") && m.html.includes("80"), "Management sees both amounts");
  expect(m.html.includes("201") && /Bills total/.test(m.html), "Management sees the total, 201");
  expect(m.html.includes("999") && /not used while the job has bills/.test(m.html), "Management sees the typed 999 marked not used");
  expect(/Bills total[^<]*\(2 bills\)/.test(m.html), "the total says 2 bills");

  for (const [who, user] of [["Head of Maintenance", hm], ["2IC", sic]]) {
    const h = await get(path, await signInCookies(user.email));
    expect(h.status === 200, `${who} opens the job (${h.status})`);
    expect(!h.html.includes("Add a bill"), `${who} sees no Add a bill`);
    expect(!/Bills total/.test(h.html), `${who} sees no bills total`);
    expect(!/paint harness|timber harness/.test(h.html), `${who} sees no bill notes`);
    expect(!/120\.50|"amount":120\.5|\b201\b/.test(h.html), `${who}: no bill amount or total anywhere in the page (including its data)`);
    expect(h.html.includes("999") || h.html.includes("฿999"), `${who} still sees the typed Actual cost 999, as before`);
    const up = await fetch(`${base}/api/bills/maintenance_bill/${randomUUID()}`, {
      method: "POST",
      headers: { cookie: await signInCookies(user.email), origin: base },
      body: new FormData(),
    });
    expect(up.status === 403, `${who} is refused at the upload route (${up.status})`);
  }
} finally {
  await service.from("maintenance").delete().eq("id", JOB);
  for (const id of users) await service.auth.admin.deleteUser(id);
}

console.log(failures.length ? `\nRESULT: RED (${failures.length} failed)` : "\nRESULT: GREEN");
process.exitCode = failures.length ? 1 : 0;
