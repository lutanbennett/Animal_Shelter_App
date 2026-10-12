// The resident record's section pages, captured so two builds can be compared byte for byte.
// Written for the resident-page-split refactor (one file per section): "no behaviour change" is
// proved by running this on the old code and on the new and diffing, not asserted.
//
//   node scripts/worktree.mjs dev                                        (in another terminal)
//   node scripts/check-resident-sections.mjs --out before.json [http://localhost:<port>]
//   ... change the code ...
//   node scripts/check-resident-sections.mjs --out after.json  [http://localhost:<port>]
//   node scripts/check-resident-sections.mjs --compare before.json after.json
//
// Against DEV only. Makes one throwaway login per role (deleted at the end, whatever happened) and
// requests every section of a handful of residents as each: a rich record, a deceased one, an adopted
// one, a fostered one and one with empty sections, plus ?archived=1 on the tabs that have an archive.
// Each probe stores the status, the redirect and the <main> markup. --compare exits 0 only when every
// probe is identical, and prints each difference.
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { giveRole } from "./lib/user-role.mjs";

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

const SECTIONS = ["housing", "photos", "adoption-updates", "immunizations", "clinic-visits", "prescriptions", "diet", "weight", "procedures", "blood-tests"];
const ARCHIVE_TABS = ["immunizations", "clinic-visits", "prescriptions", "weight"];
const ROLES = ["admin", "management", "head_of_medical", "doctor", "volunteer", "head_of_maintenance", "public_viewer"];

if (args.includes("--compare")) {
  const [a, b] = args.slice(args.indexOf("--compare") + 1);
  const before = JSON.parse(readFileSync(a, "utf8"));
  const after = JSON.parse(readFileSync(b, "utf8"));
  const keys = new Set([...Object.keys(before.probes), ...Object.keys(after.probes)]);
  let diffs = 0;
  for (const k of keys) {
    if (before.probes[k] !== after.probes[k]) {
      diffs++;
      console.log(`DIFFERENT ${k}`);
    }
  }
  console.log(`${keys.size} probes, ${diffs} differences`);
  process.exit(diffs === 0 && keys.size > 0 ? 0 : 1);
}

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${projectRef(env)} is not the dev project`);
const out = flag("--out");
if (!out) throw new Error("--out <file> or --compare <a> <b>");
const base = args.find((a) => a.startsWith("http")) ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// Pick residents by what their record holds, so the empty states and the locked record are covered.
async function pick() {
  const { data: states } = await service.from("resident_current_state").select("resident_id, current_status, is_deceased");
  const count = async (table, id) =>
    (await service.from(table).select("id", { count: "exact", head: true }).eq("resident_id", id)).count ?? 0;
  const rows = [];
  for (const s of states ?? []) {
    rows.push({
      id: s.resident_id,
      status: s.current_status,
      deceased: s.is_deceased,
      n: (await count("prescriptions", s.resident_id)) + (await count("clinic_visits", s.resident_id)) + (await count("weight", s.resident_id)),
    });
  }
  const chosen = new Map();
  const add = (label, r) => r && !chosen.has(r.id) && chosen.set(r.id, label);
  add("rich", [...rows].filter((r) => !r.deceased).sort((a, b) => b.n - a.n)[0]);
  add("deceased", rows.filter((r) => r.deceased).sort((a, b) => b.n - a.n)[0]);
  add("adopted", rows.filter((r) => r.status === "Adopted" && !r.deceased).sort((a, b) => b.n - a.n)[0]);
  add("fostered", rows.filter((r) => /foster/i.test(r.status ?? "") && !r.deceased).sort((a, b) => b.n - a.n)[0]);
  add("empty", rows.filter((r) => !r.deceased && r.n === 0)[0]);
  return chosen;
}

const tag = randomBytes(4).toString("hex");
const password = randomBytes(18).toString("base64url");

async function signInCookie(email) {
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

async function fetchProbe(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  const html = await res.text();
  const redirect = res.headers.get("location") ?? html.match(/NEXT_REDIRECT;(?:replace|push);([^;]+);/)?.[1] ?? null;
  const notFound = res.status === 404 || html.includes("NEXT_HTTP_ERROR_FALLBACK;404");
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "";
  return JSON.stringify({ status: res.status, redirect, notFound, main });
}

const made = [];
try {
  const residents = await pick();
  console.log("residents:", [...residents].map(([id, label]) => `${label}=${id}`).join(" "));
  const probes = {};
  for (const role of ROLES) {
    const email = `harness-sections-${role}-${tag}@example.invalid`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    made.push(data.user.id);
    const { error: roleErr } = await giveRole(service, data.user.id, role);
    if (roleErr) throw roleErr;
    const cookie = await signInCookie(email);
    for (const [id, label] of residents) {
      const paths = [
        ...SECTIONS.map((s) => `/residents/${id}/${s}`),
        ...ARCHIVE_TABS.map((s) => `/residents/${id}/${s}?archived=1`),
        `/residents/${id}/nonsense`,
      ];
      for (const p of paths) {
        // The resident id differs only by label in the key, so before/after runs line up even if ids were re-picked.
        probes[`${role} ${label} ${p.replace(id, "<id>")}`] = (await fetchProbe(p, cookie)).replaceAll(id, "<id>");
      }
    }
    console.log(`  ${role}: done`);
  }
  writeFileSync(out, JSON.stringify({ base, probes }, null, 0));
  console.log(`${Object.keys(probes).length} probes written to ${out}`);
} finally {
  for (const id of made) await service.auth.admin.deleteUser(id);
}
