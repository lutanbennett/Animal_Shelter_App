// Settings → Who does what, as each role sees it, against the running dev server. Dev only.
// docs/decisions/2026-10-11-who-does-what-view.md
//
//   node scripts/check-who-does-what-page.mjs                     (the worktree's own port, from .port)
//   node scripts/check-who-does-what-page.mjs http://localhost:3001
//
// Throwaway logins (Admin, Management, Volunteer, 2IC), each signed in with the app's own SSR client,
// fetch the page and both landings. It asserts
//   who opens it    Admin and Management get the page; Volunteer and the 2IC are sent to the no-access
//                   page; signed out goes to /login. The landings offer the tile to exactly the first two
//   every box       each rendered box says what role_permissions holds for that role and activity, for
//                   all 60 activities and every live role, read straight from the database here
//   every mark      a box carries a "fixed for now" mark exactly when FIXED_FOR_NOW marks it as shown
//   Admin           a line "everything, always", not a column
//   the CSV         one row per activity, plus the heading
// and removes its logins at the end, pass or fail. The page reads with the service role after its guard,
// so the Management run is the one that proves the page works for someone RLS would refuse.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("refusing: not the dev project");
const { ACTIVITIES } = await import(pathToFileURL(join(root, "src/lib/permissions/catalogue.ts")).href);
const { fixedFor } = await import(pathToFileURL(join(root, "src/lib/permissions/fixed-for-now.ts")).href);
const { default: en } = await import(pathToFileURL(join(root, "src/lib/i18n/dictionaries/en.ts")).href);
const w = en.admin.whoDoesWhat;

const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

async function signInCookies(email, password) {
  const jar = new Map();
  const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // English, so the words below are the en dictionary's.
  return [...jar].map(([n, v]) => `${n}=${v}`).concat("locale=en").join("; ");
}

async function page(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

const decode = (s) =>
  s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

// React streams a long page out of order: a cell can arrive as <template id="P:n"> with its content later in
// <table hidden><tr id="S:n">…</tr></table> (or <div hidden id="S:n"> outside a table). Put each segment
// back where its placeholder is, until none are left.
function assemble(html) {
  const seg = new Map(
    [
      ...html.matchAll(/<table hidden><tr id="S:(\d+)">([\s\S]*?)<\/tr><\/table>/g),
      ...html.matchAll(/<div hidden id="S:(\d+)">([\s\S]*?)<\/div>/g),
    ].map((m) => [m[1], m[2]]),
  );
  for (let i = 0; i < 50 && /<template id="P:\d+"><\/template>/.test(html); i++) {
    html = html.replace(/<template id="P:(\d+)"><\/template>/g, (m, n) => seg.get(n) ?? m);
  }
  return html;
}
/** The flight data the page streams (self.__next_f), joined, so a prop split across chunks reads whole. */
function flight(html) {
  return [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map((m) => JSON.parse(m[1])).join("");
}

const tag = randomBytes(4).toString("hex");
const made = [];
async function login(roleKey) {
  const email = `harness-wdw-${roleKey}-${tag}@example.invalid`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  made.push(data.user.id);
  const { data: role } = await service.from("roles").select("id").eq("key", roleKey).single();
  const { error: e2 } = await service.from("user_roles").insert({ user_id: data.user.id, role_id: role.id });
  if (e2) throw e2;
  return signInCookies(email, password);
}

try {
  // The truth: live roles and their cells, read here, not through the page.
  const { data: roles } = await service.from("roles").select("id, key, name").is("archived_at", null).eq("opens_app", true).neq("key", "admin");
  const { data: cells } = await service.from("role_permissions").select("role_id, activity, level");
  const keyOf = new Map(roles.map((r) => [r.id, r.key]));
  const cell = new Map(cells.filter((c) => keyOf.has(c.role_id)).map((c) => [`${keyOf.get(c.role_id)}|${c.activity}`, c.level]));
  const kindOf = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.kind]));
  const word = (kind, level) => (kind === "yesno" ? (level >= 2 ? w.levels.yes : w.levels.no) : level >= 2 ? w.levels.edit : level === 1 ? w.levels.read : w.levels.none);

  console.log("Who opens it");
  const out = await page("/admin/who-does-what", null);
  expect(out.status >= 300 && out.status < 400 && /\/login/.test(out.location ?? ""), `signed out is sent to /login (${out.status} → ${out.location})`);
  const cookies = {};
  for (const k of ["admin", "management", "volunteer", "second_in_command"]) cookies[k] = await login(k);
  for (const k of ["volunteer", "second_in_command"]) {
    const r = await page("/admin/who-does-what", cookies[k]);
    // redirect() inside a streamed page arrives as a 200 carrying the redirect in its payload, not a 3xx.
    const toNoAccess = (r.status >= 300 && r.status < 400 && r.location?.startsWith("/no-access")) || (r.status === 200 && /NEXT_REDIRECT;[a-z]+;\/no-access/.test(r.html));
    const refused = toNoAccess && !r.html.includes(w.adminNote);
    expect(refused, `${k} is sent to /no-access, and sees none of the grid (${r.status}${r.location ? ` → ${r.location}` : ""})`);
  }
  for (const [landing, k, offered] of [
    ["/admin", "admin", true],
    ["/management", "admin", true],
    ["/management", "management", true],
    ["/management", "second_in_command", false],
  ]) {
    const r = await page(landing, cookies[k]);
    if (r.status !== 200) {
      expect(!offered, `${landing} as ${k}: ${r.status} (no landing, so no tile)`);
      continue;
    }
    expect(r.html.includes('href="/admin/who-does-what"') === offered, `${landing} as ${k} ${offered ? "offers" : "does not offer"} the tile`);
  }

  for (const k of ["admin", "management"]) {
    console.log(`\nThe grid, as ${k}`);
    const r = await page("/admin/who-does-what", cookies[k]);
    expect(r.status === 200, `opens (${r.status}${r.location ? ` → ${r.location}` : ""})`);
    if (r.status !== 200) continue;
    const html = assemble(r.html);
    if (process.env.WDW_DUMP) (await import("node:fs")).writeFileSync(`${process.env.WDW_DUMP}/${k}.html`, html);
    expect(html.includes(w.adminNote), `Admin is the line "${w.adminNote.slice(0, 30)}…"`);
    const head = /<thead>([\s\S]*?)<\/thead>/.exec(html)?.[1] ?? "";
    const cols = [...head.matchAll(/<th[^>]*scope="col"[^>]*>([\s\S]*?)<\/th>/g)].map((m) => decode(m[1])).slice(1);
    expect(!cols.includes("Admin"), "Admin is not a column");
    const colKeys = cols.map((c) => roles.find((r) => r.name === c)?.key);
    expect(cols.length === roles.length && colKeys.every(Boolean), `a column for each of the ${roles.length} live roles: ${cols.join(", ")}`);

    const rows = new Map();
    for (const m of html.matchAll(/<tr[^>]*><th scope="row"[^>]*>([\s\S]*?)<\/th>([\s\S]*?)<\/tr>/g)) {
      const tds = [...m[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((t) => ({
        word: decode(t[1].replace(/<a[\s\S]*?<\/a>|<span role="img"[\s\S]*?<\/span><\/span>/g, "")),
        marks: (t[1].match(/href="#fixed-/g) ?? []).length,
      }));
      rows.set(decode(m[1]), tds);
    }
    expect(rows.size === ACTIVITIES.length, `a row for each of the ${ACTIVITIES.length} activities (${rows.size})`);
    let boxes = 0, wrong = [], marks = 0, badMarks = [];
    for (const a of ACTIVITIES) {
      const tds = rows.get(w.activities[a.key]);
      if (!tds) { wrong.push(`${a.key}: no row`); continue; }
      colKeys.forEach((rk, i) => {
        boxes++;
        const want = word(kindOf[a.key], cell.get(`${rk}|${a.key}`) ?? 0);
        if (tds[i]?.word !== want) wrong.push(`${rk} ${a.key}: shows "${tds[i]?.word}", the database holds "${want}"`);
        const wantMarks = fixedFor(rk, a.key).filter((e) => e.shown).length;
        marks += tds[i]?.marks ?? 0;
        if ((tds[i]?.marks ?? 0) !== wantMarks) badMarks.push(`${rk} ${a.key}: ${tds[i]?.marks} mark(s), FIXED_FOR_NOW has ${wantMarks}`);
      });
    }
    expect(wrong.length === 0, `every one of ${boxes} boxes says what role_permissions holds${wrong.length ? `:\n        ${wrong.slice(0, 10).join("\n        ")}` : ""}`);
    expect(badMarks.length === 0, `"fixed for now" marks on exactly the boxes FIXED_FOR_NOW shows (${marks})${badMarks.length ? `:\n        ${badMarks.slice(0, 10).join("\n        ")}` : ""}`);
    // The CSV is a prop of the download button. A long string travels in the flight data as a text row,
    // `<id>:T<byte length in hex>,<text>`, so read exactly that many bytes from where it starts.
    const fl = flight(r.html);
    const at = fl.indexOf("Area,Activity,Admin");
    const len = /:T([0-9a-f]+),$/.exec(fl.slice(Math.max(0, at - 24), at))?.[1];
    const csv = at >= 0 && len ? Buffer.from(fl.slice(at)).subarray(0, parseInt(len, 16)).toString() : "";
    const csvRows = csv.split("\r\n").filter(Boolean).length;
    expect(csvRows === ACTIVITIES.length + 1, `the CSV holds the heading and ${ACTIVITIES.length} rows (${csvRows})`);
  }
} finally {
  for (const id of made) await service.auth.admin.deleteUser(id);
  console.log(`\nRemoved ${made.length} harness login(s).`);
}

console.log(failures.length ? `\n${failures.length} FAILED` : "\nOK");
process.exit(failures.length ? 1 : 0);
