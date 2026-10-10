// page-guard-fixes: the four medical edit pages and the record hub, against DEV and the worktree's dev server.
//
//   node scripts/worktree.mjs dev                 (in another terminal)
//   node scripts/check-page-guards-live.mjs
//
// Makes throwaway logins (volunteer, Head of Medical, management) and one throwaway configured role that opens the
// app, holds one unrelated cell and no resident.record, and does not answer 'volunteer' (legacy management): the role
// the hub's guard exists for, which no live role is today. All are deleted at the end, whatever happened.
//   edit pages   a Read-only holder (Head of Medical on diets, 0140) is refused; management opens each with its form
//   hub          volunteer and Head of Medical still reach /r/ (the redirect runs first); the no-record role is
//                refused; management opens it
// It also prints what RLS returns a volunteer and the Head of Medical for each row, which is what says the old pages
// were a wrong door rather than a leak: they render only what the login's own client reads. Exits 0 when all held.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("not dev");
const base = `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const tag = randomBytes(4).toString("hex");
const password = randomBytes(18).toString("base64url");
const fails = [];
const expect = (ok, what) => { console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`); if (!ok) fails.push(what); };

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
  return { cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; "), db: ssr };
}
async function page(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  const html = await res.text();
  const inBody = html.match(/NEXT_REDIRECT;(?:replace|push);([^;]+);/)?.[1] ?? null;
  const loc = (res.headers.get("location") ?? inBody ?? "").replace(/^https?:\/\/[^/]+/, "");
  const nf = res.status === 404 || html.includes("NEXT_HTTP_ERROR_FALLBACK;404");
  return { status: res.status, loc, nf, html };
}
const show = (r) => `${r.status}${r.loc ? ` → ${r.loc}` : ""}${r.nf ? " (404)" : ""}`;
const hasForm = (r) => /<form[\s>]/.test(r.html) && !r.loc && !r.nf;

// Sample rows: one of each, on a resident who is not deceased.
const live = async (table, cols = "id, resident_id") => {
  const { data, error } = await service.from(table).select(cols).limit(50);
  if (error) throw error;
  const { data: dead } = await service.from("resident_current_state").select("resident_id").eq("is_deceased", true);
  const deadSet = new Set((dead ?? []).map((d) => d.resident_id));
  return data.find((r) => !deadSet.has(r.resident_id));
};
const W = await live("weight");
const P = await live("prescriptions");
const D = await live("resident_diets");
const V = await live("clinic_visits");
const RES = W.resident_id;
const EDIT = { weight: `/weight/${W.id}/edit`, prescriptions: `/prescriptions/${P.id}/edit`, diets: `/diets/${D.id}/edit`, "clinic-visits": `/clinic-visits/${V.id}/edit` };

const made = [];
let customRoleId = null;
try {
  // A configured role that opens the app, holds one unrelated cell and no resident.record,
  // and does not answer 'volunteer' (legacy management, so current_user_role() says management).
  const { data: role, error: rErr } = await service.from("roles").insert({
    key: `harness_norecord_${tag}`, name: `Harness no record ${tag}`, kind: "custom", opens_app: true, home_path: "/home", legacy_role: "management",
  }).select("id").single();
  if (rErr) throw rErr;
  customRoleId = role.id;
  const { error: cErr } = await service.from("role_permissions").insert({ role_id: customRoleId, activity: "stock.count", level: 2 });
  if (cErr) throw cErr;

  const who = {};
  for (const r of ["volunteer", "head_of_medical", "management", "norecord"]) {
    const email = `harness-guard-${r}-${tag}@example.invalid`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    made.push(data.user.id);
    const row = r === "norecord"
      ? { user_id: data.user.id, role_id: customRoleId, role: "management" }
      : r === "head_of_medical"
        ? await service.from("roles").select("id, legacy_role").eq("key", r).single().then(({ data: x }) => ({ user_id: data.user.id, role_id: x.id, role: x.legacy_role }))
        : { user_id: data.user.id, role: r };
    const { error: urErr } = await service.from("user_roles").insert(row);
    if (urErr) throw urErr;
    who[r] = await signIn(email);
  }

  console.log("What RLS returns each login for the sample rows");
  for (const as of ["volunteer", "head_of_medical"]) for (const [t, id] of [["weight", W.id], ["prescriptions", P.id], ["resident_diets", D.id], ["clinic_visits", V.id], ["residents", RES]]) {
    const { data, error } = await who[as].db.from(t).select("id").eq("id", id);
    console.log(`  ${as} select ${t} by id: ${error ? `error ${error.message}` : `${data.length} row(s)`}`);
  }

  console.log("Task 1: the four edit pages");
  for (const [k, path] of Object.entries(EDIT)) {
    const v = await page(path, who.volunteer.cookie);
    expect(v.loc === "/no-access", `volunteer ${k} edit is refused (${show(v)})`);
    const m = await page(path, who.management.cookie);
    expect(m.status === 200 && hasForm(m), `management ${k} edit opens with its form (${show(m)})`);
  }
  const hd = await page(EDIT.diets, who.head_of_medical.cookie);
  expect(hd.loc === "/no-access", `Head of Medical diets edit is refused (${show(hd)})`);
  const hp = await page(EDIT.prescriptions, who.head_of_medical.cookie);
  expect(hp.loc === "/no-access", `Head of Medical prescriptions edit is refused (${show(hp)})`);

  console.log("Task 2: the record hub");
  const vh = await page(`/residents/${RES}`, who.volunteer.cookie);
  expect(vh.loc === `/r/${RES}`, `volunteer is still sent to the card (${show(vh)})`);
  const hh = await page(`/residents/${RES}`, who.head_of_medical.cookie);
  expect(hh.loc === `/r/${RES}`, `Head of Medical (answers volunteer) is sent to the card (${show(hh)})`);
  const nh = await page(`/residents/${RES}`, who.norecord.cookie);
  expect(nh.loc === "/no-access", `a configured role with no resident.record is refused (${show(nh)})`);
  const mh = await page(`/residents/${RES}`, who.management.cookie);
  expect(mh.status === 200 && !mh.loc && !mh.nf, `management opens the hub (${show(mh)})`);
} finally {
  for (const id of made) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.error(`  could not delete ${id}: ${error.message}`);
  }
  if (customRoleId) await service.from("roles").delete().eq("id", customRoleId);
  console.log(`  deleted ${made.length} throwaway login(s) and the harness role`);
}
console.log(fails.length ? `\n${fails.length} FAILED` : "\nall held");
process.exit(fails.length ? 1 : 0);
