// prescription-schedule backfill (0283): the FIX LIST. Read-only.
//
//   node scripts/check-prescription-schedule-backfill.mjs            (dev, the default)
//   node scripts/check-prescription-schedule-backfill.mjs --env production
//
// Takes NO arguments except an optional --env. Run it bare.
//
// Lists every current prescription whose dose count (what its frequency says: doses_per_day, 1 for an
// interval, 0 for as needed) differs from the number of rounds ticked on it, so a person can fix each
// one. NEVER guessed, never repaired here: under the recurring-schedule design the ticked times ARE the
// count, so a prescription saved as 4x daily (three ticks plus a note) would quietly become 3x daily and
// medicine would vanish from the forecast. This only reads.
//
// Exit 0: nothing disagrees. Exit 1: at least one prescription is listed. Exit 2: could not run.
// A prescription whose dose count lives only in its notes (hourly etc.) is not in the forecast by design.
import { parseEnvArg, loadEnv, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
if (rest.length) {
  console.error(`takes no arguments except --env (got: ${rest.join(" ")})`);
  await exitWith(2);
} else {
  const code = await run(envName);
  await exitWith(code);
}

async function run(envName) {
  const env = loadEnv(envName);
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !token) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required.");
    return 2;
  }
  const ref = projectRef(env);
  console.log(`prescription-schedule backfill fix list: ${envName} (${ref})`);

  const sql = `
    select p.id, r.name as resident, m.name as medication, f.label as frequency,
           case when f.doses_per_day is not null then f.doses_per_day
                when f.interval_count is not null then 1 else 0 end as dose_count,
           coalesce((select string_agg(rd.key, '+' order by rd.sort_order)
                       from prescription_rounds pr join rounds rd on rd.id = pr.round_id
                      where pr.prescription_id = p.id), '') as ticks,
           (select count(*) from prescription_rounds pr where pr.prescription_id = p.id)::int as tick_count,
           coalesce(p.notes, '') as notes
      from prescriptions p
      join residents r on r.id = p.resident_id
      join medication m on m.id = p.medication_id
      left join frequency f on f.id = p.frequency_id
     where p.archived_at is null
       and (p.end_date is null or p.end_date >= current_date)
       and (case when f.doses_per_day is not null then f.doses_per_day
                 when f.interval_count is not null then 1 else 0 end)
           <> (select count(*) from prescription_rounds pr where pr.prescription_id = p.id)
     order by r.name, m.name`;

  let rows;
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text);
    rows = text ? JSON.parse(text) : [];
  } catch (e) {
    console.error(`query failed: ${e.message}`);
    return 2;
  }

  if (!rows.length) {
    console.log("OK: every current prescription's dose count matches its ticks.");
    return 0;
  }
  console.log(`${rows.length} current prescription(s) to fix by hand (dose count vs ticks):\n`);
  for (const r of rows) {
    console.log(`- ${r.resident}: ${r.medication}  [${r.frequency ?? "no frequency"}]  doses/day ${r.dose_count}, ticks ${r.tick_count} (${r.ticks || "none"})${r.notes ? `  notes: ${r.notes}` : ""}`);
  }
  console.log("\nFix each one in the app, then run this again. Nothing was changed.");
  return 1;
}
