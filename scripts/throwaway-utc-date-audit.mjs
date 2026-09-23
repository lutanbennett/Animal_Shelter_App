// THROWAWAY — the one-off audit behind docs/utc-date-audit-2026-09-23.md.
// Read-only: the API call sets read_only and the script refuses anything that
// isn't a select/with. Delete once the report is merged.
//
//   node scripts/throwaway-utc-date-audit.mjs                # summary (dev)
//   node scripts/throwaway-utc-date-audit.mjs --rows         # + candidate rows
//   node scripts/throwaway-utc-date-audit.mjs --env production
//   node scripts/throwaway-utc-date-audit.mjs --sql "select 1"
//
// Connects the way scripts/apply-migrations.mjs does: Management API query
// endpoint, SUPABASE_ACCESS_TOKEN, project ref from NEXT_PUBLIC_SUPABASE_URL.
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const token = env.SUPABASE_ACCESS_TOKEN;
// A worktree deliberately has no .env.deploy.production (scripts/worktree.mjs
// copies .env.local only), so `--env production` can't resolve the production
// ref here. SUPABASE_ACCESS_TOKEN is a personal token that sees every project,
// and a project ref is not a secret — `--project <ref>` aims at one directly.
// Read-only either way.
const projectIndex = args.indexOf("--project");
const projectRef = projectIndex >= 0 ? args[projectIndex + 1] : refOf(env);

async function query(sql) {
  if (!/^\s*(select|with)\b/i.test(sql)) throw new Error("read-only script: selects only");
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql, read_only: true }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try { message = JSON.parse(text).message ?? text; } catch { /* raw */ }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

console.error(`Environment: ${envName} — project ${projectRef}`);

if (args.includes("--list-projects")) {
  const res = await fetch("https://api.supabase.com/v1/projects", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const projects = await res.json();
  for (const p of projects) console.log(`${p.id}  ${p.name}  (${p.region}, created ${p.created_at})`);
  process.exit(0);
}

const sqlIndex = args.indexOf("--sql");
if (sqlIndex >= 0) {
  console.log(JSON.stringify(await query(args[sqlIndex + 1]), null, 2));
  process.exit(0);
}

// Every date column whose row carries a timestamptz written at the same
// moment. `stamp` is that reference column; `defaulted` marks the ones a form
// pre-fills with today (the rest are audited anyway, for completeness).
const TARGETS = [
  { table: "residents", column: "intake_date", stamp: "created_at", defaulted: true },
  { table: "residents", column: "age_estimated_on", stamp: "created_at", defaulted: true },
  { table: "weight", column: "date", stamp: "created_at", defaulted: true },
  { table: "blood_tests", column: "date", stamp: "created_at", defaulted: true },
  { table: "immunization_records", column: "date_administered", stamp: "created_at", defaulted: true },
  { table: "prescriptions", column: "start_date", stamp: "created_at", defaulted: true },
  { table: "prescriptions", column: "end_date", stamp: "created_at", defaulted: false },
  { table: "resident_diets", column: "start_date", stamp: "created_at", defaulted: true },
  { table: "resident_diets", column: "end_date", stamp: "created_at", defaulted: false },
  { table: "procedures", column: "date", stamp: "created_at", defaulted: true },
  { table: "attachments", column: "date_taken", stamp: "uploaded_at", defaulted: true },
  { table: "maintenance", column: "date_created", stamp: "created_at", defaulted: true },
  { table: "maintenance", column: "due_date", stamp: "created_at", defaulted: true },
  { table: "maintenance", column: "date_completed", stamp: "created_at", defaulted: true },
  { table: "group_origins", column: "date", stamp: "created_at", defaulted: true },
  { table: "project_folders", column: "project_date", stamp: "created_at", defaulted: true },
];

// Bangkok local date/time of the row's stamp. A stored date exactly one day
// before that date, written while the stamp's Bangkok clock read 00:00–07:00,
// is a candidate: that is precisely the window in which UTC's "today" was
// still yesterday here.
const bkk = (stamp) => `(${stamp} at time zone 'Asia/Bangkok')`;

function summarySql({ table, column, stamp }) {
  const d = `${bkk(stamp)}::date`;
  const inWindow = `${bkk(stamp)}::time < time '07:00'`;
  return `
    select
      count(*)::int as rows_total,
      count(*) filter (where ${column} is not null and ${stamp} is not null)::int as examined,
      count(*) filter (where ${stamp} is not null and ${inWindow})::int as written_in_window,
      count(*) filter (where ${column} = ${d})::int as same_day,
      count(*) filter (where ${column} = ${d} - 1 and ${inWindow})::int as candidates,
      count(*) filter (where ${column} = ${d} - 1 and not (${inWindow}))::int as day_early_outside,
      count(*) filter (where ${column} < ${d} - 1)::int as older,
      count(*) filter (where ${column} > ${d})::int as later,
      min(${column}) filter (where ${column} = ${d} - 1 and ${inWindow})::text as first_candidate,
      max(${column}) filter (where ${column} = ${d} - 1 and ${inWindow})::text as last_candidate,
      min(${stamp})::text as first_row,
      max(${stamp})::text as last_row
    from ${table}
  `;
}

function rowsSql({ table, column, stamp }) {
  const d = `${bkk(stamp)}::date`;
  return `
    select id::text as id,
           ${column}::text as stored_date,
           ${bkk(stamp)}::text as bangkok_written_at,
           ${stamp}::text as written_at_utc
    from ${table}
    where ${column} = ${d} - 1
      and ${bkk(stamp)}::time < time '07:00'
    order by ${stamp}
  `;
}

const out = { env: envName, project: projectRef, generated_at: new Date().toISOString(), tables: [] };

for (const target of TARGETS) {
  let summary;
  try {
    [summary] = await query(summarySql(target));
  } catch (error) {
    console.error(`  ${target.table}.${target.column}: FAILED — ${error.message}`);
    out.tables.push({ ...target, error: error.message });
    continue;
  }
  const entry = { ...target, ...summary };
  if (args.includes("--rows") && summary.candidates > 0) {
    entry.rows = await query(rowsSql(target));
  }
  out.tables.push(entry);
  console.error(
    `  ${target.table}.${target.column}: ${summary.candidates} candidate(s) of ` +
      `${summary.examined} examined` +
      (summary.candidates ? ` — ${summary.first_candidate} … ${summary.last_candidate}` : ""),
  );
}

// The other half of the audit: the Deceased cascade (0049:118) closes open
// prescriptions with `new.start_date::date`, cast in the database's UTC
// session. A death recorded before 07:00 Bangkok therefore end-dates the
// course the day before the animal died. The placement's own timestamptz is
// correct, so this one IS detectable — but only here, not via created_at,
// because the prescription row is updated rather than created.
out.deceased_cascade = await query(`
  select r.name,
         ph.start_date::text                                     as death_instant_utc,
         (ph.start_date at time zone 'Asia/Bangkok')::text        as death_bangkok,
         (ph.start_date)::date::text                              as utc_date_used,
         (ph.start_date at time zone 'Asia/Bangkok')::date::text  as true_bangkok_date,
         p.id::text                                               as prescription_id,
         p.end_date::text                                         as prescription_end_date
  from placement_history ph
  join residents r on r.id = ph.resident_id
  join prescriptions p on p.resident_id = ph.resident_id
  where ph.placement_type = 'Deceased'
    and p.end_date = (ph.start_date)::date
    and (ph.start_date)::date <> (ph.start_date at time zone 'Asia/Bangkok')::date
  order by ph.start_date
`);
console.error(`  deceased cascade: ${out.deceased_cascade.length} prescription(s) closed a day early`);

console.log(JSON.stringify(out, null, 2));
