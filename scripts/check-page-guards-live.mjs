// page-guard-fixes: the four medical edit pages and the record hub, against DEV and the worktree's dev server.
//
//   node scripts/worktree.mjs dev                 (in another terminal)
//   node scripts/check-page-guards-live.mjs
//
// Makes throwaway logins that each hold exactly one card (Manage medical, View medical, Food forecast), through
// giveCards, and deletes them and their throwaway roles at the end, whatever happened.
//   edit pages   a read-only holder (View medical) is refused; Manage medical opens each with its form
//   hub          View medical reaches the hub or its card; a login with no resident.record is refused;
//                Manage medical opens it
// It also prints what RLS returns the read-only login for each row, which is what says the old pages were a wrong
// door rather than a leak: they render only what the login's own client reads. Exits 0 when all held.
// Restated by card 2026-10-29: it used to sign in as the volunteer, Head of Medical and management roles.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { exitWith } from "./lib/exit.mjs";
import { giveCards } from "./lib/user-role.mjs";

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
const cleanups = [];
// Logins are built from CARDS, not roles (a role is a transient grouping that gets rebuilt):
//   editor    Manage medical    edits weight, prescriptions, diets and visits, and reads the resident record
//   reader    View medical      reads the same, edits none of it
//   norecord  Food forecast     opens the app, holds one unrelated card and no resident.record
const LOGINS = { editor: ["medical_records"], reader: ["view_medical"], norecord: ["food_forecast"] };
try {
  const who = {};
  for (const [r, cards] of Object.entries(LOGINS)) {
    const email = `harness-guard-${r}-${tag}@example.invalid`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    made.push(data.user.id);
    const { error: gErr, cleanup } = await giveCards(service, data.user.id, cards);
    cleanups.push(cleanup);
    if (gErr) throw gErr;
    who[r] = await signIn(email);
  }

  console.log("What RLS returns each login for the sample rows");
  for (const as of ["reader"]) for (const [t, id] of [["weight", W.id], ["prescriptions", P.id], ["resident_diets", D.id], ["clinic_visits", V.id], ["residents", RES]]) {
    const { data, error } = await who[as].db.from(t).select("id").eq("id", id);
    console.log(`  ${as} select ${t} by id: ${error ? `error ${error.message}` : `${data.length} row(s)`}`);
  }

  console.log("Task 1: the four edit pages");
  for (const [k, path] of Object.entries(EDIT)) {
    const v = await page(path, who.reader.cookie);
    expect(v.loc === "/no-access", `a read-only (View medical) login is refused the ${k} edit (${show(v)})`);
    const m = await page(path, who.editor.cookie);
    expect(m.status === 200 && hasForm(m), `a Manage medical login opens the ${k} edit with its form (${show(m)})`);
  }
  console.log("Task 2: the record hub");
  const rh = await page(`/residents/${RES}`, who.reader.cookie);
  expect(rh.status === 200 && !rh.nf && rh.loc !== "/no-access", `a View medical login opens the hub or its card (${show(rh)})`);
  const nh = await page(`/residents/${RES}`, who.norecord.cookie);
  expect(nh.loc === "/no-access", `a login with no resident.record is refused (${show(nh)})`);
  const mh = await page(`/residents/${RES}`, who.editor.cookie);
  expect(mh.status === 200 && !mh.loc && !mh.nf, `a Manage medical login opens the hub (${show(mh)})`);
} finally {
  for (const id of made) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.error(`  could not delete ${id}: ${error.message}`);
  }
  for (const c of cleanups) await c();
  console.log(`  deleted ${made.length} throwaway login(s) and the harness role(s)`);
}
console.log(fails.length ? `\n${fails.length} FAILED` : "\nall held");
await exitWith(fails.length ? 1 : 0);
