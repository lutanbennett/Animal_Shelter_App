// The dashboard's daily "residents at the shelter" line (src/lib/management/daily-count.ts) against a straight count.
// Against DEV, read-only. For a few dates it counts the residents whose placement was open at the end of that day and
// was not Fostered / Adopted / Deceased, and compares that with the daily series. A gap means a placement is missing
// a type (or an Outreach animal is being counted) — a finding about the data, not something to fudge in the chart.
//
//   node scripts/check-daily-count.mjs
import { join } from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { exitWith } from "./lib/exit.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const srcUrl = pathToFileURL(join(root, "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(srcUrl)} + spec.slice(2) + ".ts", ctx);
        if (spec.startsWith(".") && !/\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const { dailySeries, DAILY_COUNT_PLACEMENTS } = await import(pathToFileURL(join(root, "src/lib/management/daily-count.ts")).href);
const { addDaysIso, todayIso } = await import(pathToFileURL(join(root, "src/lib/format.ts")).href);

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(body));
  return body;
}

const list = DAILY_COUNT_PLACEMENTS.map((t) => `'${t}'`).join(",");
const rows = await sql(`select resident_id, placement_type::text, start_date, end_date from placement_history where placement_type::text in (${list})`);
const today = todayIso();
const first = addDaysIso(today, -364);
const series = dailySeries(rows, first, today);

let failed = 0;
const dates = [first, addDaysIso(first, 90), addDaysIso(first, 180), addDaysIso(first, 270), addDaysIso(today, -7), today];
for (const d of dates) {
  const endOfDay = `(('${addDaysIso(d, 1)}'::date)::timestamp at time zone 'Asia/Bangkok')`;
  const [{ n }] = await sql(`
    select count(distinct ph.resident_id)::int as n
    from placement_history ph
    join enclosures e on e.id = ph.enclosure_id
    join zones z on z.id = e.zone_id
    where ph.start_date < ${endOfDay} and (ph.end_date is null or ph.end_date >= ${endOfDay})
      and not (z.name = 'Lifecycle' and e.name in ('Fostered','Adopted','Deceased'))`);
  const got = series.find((p) => p.date === d).atShelter;
  if (got !== n) { failed++; console.log(`FAIL ${d}: series ${got}, straight count ${n} (gap ${got - n})`); }
  else console.log(`ok   ${d}: ${got}`);
}
exitWith(failed ? 1 : 0);
