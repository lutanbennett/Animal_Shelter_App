// Residents list sorting (claude/residents-list-sort), by role, against DEV and a running dev server:
//
//   node scripts/worktree.mjs dev                      (in another terminal)
//   node scripts/check-residents-sort.mjs [http://localhost:<port>]
//
// Makes a throwaway admin login and a throwaway volunteer login (who reads resident_who_and_where),
// then for every sortable column, both ways, checks that /residents lists residents in the order
// the database and Settings → Zones / Enclosures say, and that /residents/export (the Download) is
// in that same order. Deletes both logins at the end. Exits 0 when every expectation held.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { giveRole } from "./lib/user-role.mjs";
import { exitWith } from "./lib/exit.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("refusing: not the dev project");

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
const made = [];

async function makeLogin(role) {
  const email = `harness-sort-${role}-${tag}@example.invalid`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  made.push(data.user.id);
  const { error: roleErr } = await giveRole(service, data.user.id, role);
  if (roleErr) throw roleErr;
  const jar = new Map();
  const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error: signErr } = await ssr.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

const get = async (path, cookie) => (await fetch(`${base}${path}`, { headers: { cookie } })).text();
const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

try {
  const [{ data: zones }, { data: enclosures }, { data: rows }] = await Promise.all([
    service.from("zones").select("id, name, sort_order"),
    service.from("enclosures").select("id, name, zone_id, sort_order"),
    service.from("resident_list_view").select("resident_id, name, resident_code, current_status, enclosure_id, zone_id, zone_name").neq("current_status", "Deceased"),
  ]);
  const zoneRank = new Map([...zones].filter((z) => z.name !== "Lifecycle").sort((a, b) => (a.sort_order ?? 1e9) - (b.sort_order ?? 1e9) || natural.compare(a.name, b.name)).map((z, i) => [z.id, i]));
  const encRank = new Map(
    [...enclosures]
      .sort((a, b) => (zoneRank.get(a.zone_id) ?? 1e9) - (zoneRank.get(b.zone_id) ?? 1e9) || (a.sort_order ?? 1e9) - (b.sort_order ?? 1e9) || natural.compare(a.name, b.name))
      .map((e, i) => [e.id, i]),
  );
  const place = (s) => (["Resident", "Unassigned"].includes(s) ? 0 : ["Outreach", "Hospitalised", "Fostered"].includes(s) ? 1 : null);
  const keyOf = {
    zone: (r) => (r.zone_id && zoneRank.has(r.zone_id) ? zoneRank.get(r.zone_id) : null),
    enclosure: (r) => (r.enclosure_id && encRank.has(r.enclosure_id) ? encRank.get(r.enclosure_id) : null),
  };
  console.log(`  (${rows.length} living residents, ${zoneRank.size} zones)`);

  for (const role of ["admin", "volunteer"]) {
    console.log(role);
    const cookie = await makeLogin(role);
    const idsOf = (html) => [...new Set([...html.matchAll(/href="\/residents\/([0-9a-f-]{36})"/g)].map((m) => m[1]))];
    const byName = new Map(rows.map((r) => [r.resident_id, r]));
    for (const key of ["id", "name", "enclosure", "zone", "status", "location"]) {
      for (const dir of ["asc", "desc"]) {
        const html = await get(`/residents?sort=${key}&dir=${dir}`, cookie);
        const got = idsOf(html).filter((id) => byName.has(id));
        const ok = got.length === rows.length;
        const sign = dir === "desc" ? -1 : 1;
        let sorted = true;
        for (let i = 1; i < got.length && sorted; i++) {
          const a = byName.get(got[i - 1]);
          const b = byName.get(got[i]);
          let x, y;
          if (key === "zone" || key === "enclosure") [x, y] = [keyOf[key](a), keyOf[key](b)];
          else if (key === "location") [x, y] = [place(a.current_status), place(b.current_status)];
          else if (key === "id") [x, y] = [a.resident_code, b.resident_code];
          else if (key === "status") [x, y] = [a.current_status ?? "", b.current_status ?? ""];
          else [x, y] = [a.name, b.name];
          if (typeof x === "string") sorted = sign * (key === "name" ? new Intl.Collator("en", { sensitivity: "base" }).compare(x, y) : x < y ? -1 : x > y ? 1 : 0) <= 0;
          else if (x === null || y === null) sorted = !(x === null && y !== null);
          else sorted = sign * (x - y) <= 0;
          if (!sorted) console.log(`     : ${a.name} (${x}) before ${b.name} (${y})`);
        }
        expect(ok && sorted, `${role}: ?sort=${key}&dir=${dir} lists all ${rows.length} in order (${got.length} found)`);
        {
          const csv = await get(`/residents/export?sort=${key}&dir=${dir}`, cookie);
          const csvCodes = csv.replace(/^\uFEFF/, "").split(/\r?\n/).slice(1).map((l) => l.split(",")[0]).filter(Boolean);
          const pageCodes = got.map((id) => byName.get(id).resident_code);
          if (csvCodes.join("|") !== pageCodes.join("|")) { const j = csvCodes.findIndex((c, n) => c !== pageCodes[n]); console.log("    first difference at", j, csvCodes.slice(j, j + 3), pageCodes.slice(j, j + 3)); }
          expect(csvCodes.join("|") === pageCodes.join("|"), `${role}: Download for ${key} ${dir} is in the same order as the page (${csvCodes.length} rows)`);
        }
      }
    }
    expect(/aria-sort="ascending"/.test(await get("/residents?sort=zone", cookie)), `${role}: the Zone heading says aria-sort=ascending`);
    expect(/aria-sort="descending"/.test(await get("/residents?sort=zone&dir=desc", cookie)), `${role}: the Zone heading says aria-sort=descending`);
  }
} finally {
  for (const id of made) await service.auth.admin.deleteUser(id);
}
console.log(failures.length ? `\n${failures.length} FAILED` : "\nall held");
await exitWith(failures.length ? 1 : 0);
