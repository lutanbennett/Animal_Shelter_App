// Bill photos are LISTED, not just permitted. Against DEV only, read-only.
//
//   node scripts/check-bill-photos-listed.mjs
//
// check-bills-roles.mjs asks who may see a bill photo; it never asked whether a page lists one. On 2026-10-13
// all four places ordered their photo query by attachments.created_at, a column that table does not have
// (it is uploaded_at), PostgREST returned an error, the code read `data ?? []` and every bill showed "Add a
// photo". This reads the source and the dev schema:
//   1. every query on `attachments` under src/ orders only by columns attachments really has;
//   2. each of the four photo places (maintenance job, delivery, clinic visit, inbox card) uses such a query
//      and does something with its `error`;
//   3. that same select + order actually runs on dev for each owner type.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = async (query) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${body.message ?? JSON.stringify(body)}`);
  return body;
};

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (process.argv.includes("--verbose")) console.log(`ok    ${s}`); };

const cols = new Set((await sql("select column_name from information_schema.columns where table_schema='public' and table_name='attachments'")).map((r) => r.column_name));
if (!cols.has("uploaded_at")) fail("attachments has no uploaded_at any more; update this check");

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : []; });
// A chain starts at .from("attachments") and runs to the .returns< / .maybeSingle / .single / ; that ends it.
const chains = [];
for (const f of walk("src")) {
  const s = readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  for (const m of s.matchAll(/\.from\("attachments"\)([\s\S]*?)(?:\.returns<|\.maybeSingle|\.single\(|;)/g)) chains.push({ f: f.replaceAll("\\", "/"), body: m[1] });
}
for (const { f, body } of chains) {
  for (const o of body.matchAll(/\.order\("([a-z_]+)"/g)) {
    if (cols.has(o[1])) pass(`${f}: orders attachments by ${o[1]}`);
    else fail(`${f}: orders attachments by ${o[1]}, which attachments does not have`);
  }
}

const places = [
  ["a maintenance job's bills", "src/lib/maintenance/bills.ts", "maintenance_bill"],
  ["deliveries and clinic visits (BillPhotosSection)", "src/lib/bills/photos.ts", "stock_receipt"],
  ["the Bills inbox cards", "src/app/bills/page.tsx", "bill_inbox"],
];
for (const [label, file, owner] of places) {
  const s = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const i = s.indexOf(`"${owner}"`);
  const near = i < 0 ? "" : s.slice(i, i + 1500);
  if (i < 0) fail(`${label}: no attachments query for ${owner} in ${file}`);
  else if (!/uploaded_at/.test(near)) fail(`${label}: photo query is not ordered by uploaded_at`);
  else if (!/error/.test(s.slice(i, i + 2500))) fail(`${label}: photo query's error is never read`);
  else pass(`${label}: ordered by uploaded_at and error read`);
}

for (const t of ["maintenance_bill", "stock_receipt", "clinic_visit", "bill_inbox"]) {
  try {
    await sql(`select id, owner_id, drive_file_id, file_name from attachments where owner_type = '${t}' order by uploaded_at asc limit 1`);
    pass(`photo query runs on dev for ${t}`);
  } catch (e) { fail(`photo query for ${t} errors on dev: ${e.message}`); }
}

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (all four bill-photo places order by a real column and read their error)");
process.exitCode = fails ? 1 : 0;
