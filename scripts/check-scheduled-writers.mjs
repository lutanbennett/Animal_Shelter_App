// READ-ONLY: list every scheduled writer and every security-definer function on the LIVE database, and say for each whether
// its writes name a shelter (#pirow).
//
//   node scripts/check-scheduled-writers.mjs --env test            (test = the dev database)
//   node scripts/check-scheduled-writers.mjs --env test --verbose  (also lists the functions that write nothing)
//
// Since 0397 every shelter_id is NOT NULL and the column default (0390) reads only the x-shelter-id request header. A writer
// with no header (pg_cron, a service-role statement with no scriptShelterHeaders) therefore ERRORS instead of writing a hidden
// row. A grep of src/ cannot see pg_cron or a database function, so this reads cron.job and pg_proc themselves.
//
// One SELECT (cron.job, pg_proc and information_schema together) and nothing else: no writes, no DDL, no --apply path.
// It judges function BODIES by pattern, which is evidence but not proof: anything it cannot decide is printed under its own
// heading, never folded into "ok". It cannot see the Pi, production, or a writer that is not in the database.
// Exit 0 always for a reading; exit 1 only when the query itself fails, or with --strict when a writer sends no shelter.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const argv = process.argv.slice(2);
const verbose = argv.includes("--verbose");
const strict = argv.includes("--strict");
const { name: envName } = parseEnvArg(argv.filter((a) => a !== "--verbose" && a !== "--strict"));
const env = loadEnv(envName);
const ref = projectRef(env);

const sql = `select
  now() as read_at,
  current_database() as db,
  (select coalesce(json_agg(json_build_object('jobname', jobname, 'schedule', schedule, 'active', active, 'command', command) order by jobid), '[]'::json) from cron.job) as jobs,
  (select coalesce(json_agg(json_build_object('name', p.proname, 'definer', p.prosecdef, 'kind', p.prokind, 'src', p.prosrc) order by p.proname), '[]'::json)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f' and (p.prosecdef or p.prorettype = 'trigger'::regtype)
       and p.prosrc ~* '(insert|update|delete|merge)') as fns,
  (select coalesce(json_agg(table_name), '[]'::json) from information_schema.columns
     where table_schema = 'public' and column_name = 'shelter_id') as shelter_tables`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let row;
try { row = JSON.parse(text)[0]; } catch { /* reported below */ }
if (!res.ok || !row) {
  console.error(`check-scheduled-writers: query failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  process.exit(1);
}

const tenant = new Set(row.shelter_tables);
const strip = (s) => s.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

// Classify one body. Returns { bucket, why }.
//   sends     - every write to a shelter-bearing table names shelter_id (column list) or stamps from the row/request
//   none      - a write to a shelter-bearing table that names no shelter, so it leans on the header default and ERRORS without one
//   unknown   - dynamic SQL, or a write the pattern cannot tie to a table
//   nowrite   - touches no shelter-bearing table
function classify(src) {
  const body = strip(src);
  const writes = [];
  for (const m of body.matchAll(/\binsert\s+into\s+(?:public\.)?"?([a-z_0-9]+)"?\s*(\(([^)]*)\))?/gi)) {
    writes.push({ op: "insert", table: m[1].toLowerCase(), cols: (m[3] ?? "").toLowerCase() });
  }
  for (const m of body.matchAll(/\b(?:update|delete\s+from)\s+(?:public\.)?"?([a-z_0-9]+)"?/gi)) {
    writes.push({ op: "update/delete", table: m[1].toLowerCase(), cols: "" });
  }
  const dynamic = /\bexecute\b/i.test(body);
  const hit = writes.filter((w) => tenant.has(w.table));
  if (!hit.length) return { bucket: dynamic ? "unknown" : "nowrite", why: dynamic ? "uses EXECUTE (dynamic SQL), cannot read the target" : "writes no table that has a shelter_id" };
  const inserts = hit.filter((w) => w.op === "insert");
  const bare = inserts.filter((w) => !/\bshelter_id\b/.test(w.cols) && !/\binsert\s+into\s+\S+\s+select\b[\s\S]*shelter_id/i.test(body));
  if (bare.length) return { bucket: "none", why: `inserts into ${[...new Set(bare.map((w) => w.table))].join(", ")} without naming shelter_id` };
  if (dynamic) return { bucket: "unknown", why: "uses EXECUTE as well as named inserts" };
  return { bucket: "sends", why: inserts.length ? `every insert (${[...new Set(inserts.map((w) => w.table))].join(", ")}) names shelter_id` : `only updates/deletes ${[...new Set(hit.map((w) => w.table))].join(", ")}` };
}

const fns = row.fns.map((f) => ({ ...f, ...classify(f.src) }));
const byName = new Map(fns.map((f) => [f.name, f]));
console.log(`check-scheduled-writers (${envName}, database ${row.db}) read at ${row.read_at}`);
console.log(`  ${row.jobs.length} cron job(s); ${fns.length} writing function(s) (security definer or trigger); ${tenant.size} tables carry shelter_id.\n`);

console.log("SCHEDULED (cron.job) — every job, from the live catalogue:");
const jobRows = [];
for (const j of row.jobs) {
  const called = [...j.command.matchAll(/(?:public\.)?([a-z_0-9]+)\s*\(/gi)].map((m) => m[1]).filter((n) => byName.has(n));
  let bucket, why;
  if (called.length) {
    const rank = { none: 0, unknown: 1, sends: 2, nowrite: 3 };
    const worst = called.map((n) => byName.get(n)).sort((a, b) => rank[a.bucket] - rank[b.bucket])[0];
    bucket = worst.bucket; why = `calls ${called.join(", ")}: ${worst.why}`;
  } else if (/\b(insert|update|delete)\b/i.test(j.command)) {
    const c = classify(j.command); bucket = c.bucket; why = `inline SQL: ${c.why}`;
  } else { bucket = "unknown"; why = "calls no function in the list and holds no inline write; read the command"; }
  jobRows.push({ bucket });
  console.log(`  [${bucket.toUpperCase()}] ${j.jobname} ${j.schedule} active=${j.active}\n      ${why}\n      command: ${j.command.replace(/\s+/g, " ").slice(0, 160)}`);
}

const groups = { none: [], unknown: [], sends: [], nowrite: [] };
for (const f of fns) groups[f.bucket].push(f);
const label = { none: "SENDS NO SHELTER — errors without a request header", unknown: "CANNOT BE DETERMINED from here", sends: "SENDS A SHELTER", nowrite: "writes no shelter table (read only for this purpose)" };
for (const k of ["none", "unknown", "sends", "nowrite"]) {
  console.log(`\n${label[k]}: ${groups[k].length}`);
  if (k === "nowrite" && !verbose) { console.log("  (use --verbose to list)"); continue; }
  for (const f of groups[k]) console.log(`  ${f.name}${f.definer ? "" : " (trigger, invoker)"} — ${f.why}`);
}
console.log("\nLimits: bodies are judged by pattern; a function that calls another function that writes is not followed; trigger and");
console.log("definer functions run in a request WITH a header when a person caused them, so 'sends no shelter' is an error only where");
console.log("no request header exists (pg_cron, service-role statements with no scriptShelterHeaders). The Pi and production are not read.");
if (strict && (groups.none.length || jobRows.some((j) => j.bucket === "none"))) process.exitCode = 1;
