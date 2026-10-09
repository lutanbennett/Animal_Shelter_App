// thai-pdf-sara-am (2026-10-09): how many deceased residents' archive summaries, already written
// to Drive, were rendered with a ำ (SARA AM) somewhere in them, and so may need regenerating.
//
//   node scripts/count-sara-am-archives.mjs                    (test = the dev database)
//   node scripts/count-sara-am-archives.mjs --env production
//
// Before the fix, a ำ in a summary garbled the PDF's copy/search text, and in the bold header
// ("Name (Thai name)") it could also drop a character from the end of the line. This counts
// archived residents (deceased_archived_at set) with a ำ in any field the summary prints,
// and how many have it in the header. It only reads; regenerating is a separate decision
// (refresh-deceased-archive.ts, or the hub's Retry button per resident).
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, parseEnvArg, projectRef } = await import(
  pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href
);
const { name } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(name);
const ref = projectRef(env);

const sql = `
with a as (select id, resident_code, name, thai_name from residents where deceased_archived_at is not null),
hits as (
  select a.id, 'header' as place from a where concat_ws(' ', a.name, a.thai_name) like '%ำ%'
  union all select r.id, 'resident' from residents r join a on a.id = r.id where to_jsonb(r)::text like '%ำ%'
  union all select p.resident_id, 'housing' from placement_history p join a on a.id = p.resident_id
    left join enclosures e1 on e1.id = p.enclosure_id left join enclosures e2 on e2.id = p.previous_enclosure_id
    left join contacts c on c.id = p.carer_id
    where concat_ws(' ', p.notes, p.cause_of_death, e1.name, e2.name, c.name) like '%ำ%'
  union all select x.resident_id, 'immunizations' from immunization_records x join a on a.id = x.resident_id
    left join picker_immunization_types t on t.id = x.immunization_type_id
    where x.archived_at is null and concat_ws(' ', to_jsonb(x)::text, t.name) like '%ำ%'
  union all select x.resident_id, 'appointments' from clinic_visits x join a on a.id = x.resident_id
    left join clinics v on v.id = x.clinic_id where x.archived_at is null and concat_ws(' ', to_jsonb(x)::text, v.name) like '%ำ%'
  union all select x.resident_id, 'prescriptions' from prescriptions x join a on a.id = x.resident_id
    left join picker_medications m on m.id = x.medication_id where x.archived_at is null and concat_ws(' ', to_jsonb(x)::text, m.name) like '%ำ%'
  union all select x.resident_id, 'diets' from resident_diets x join a on a.id = x.resident_id
    left join picker_diet_types t on t.id = x.diet_type_id where concat_ws(' ', to_jsonb(x)::text, t.name) like '%ำ%'
  union all select x.resident_id, 'weights' from weight x join a on a.id = x.resident_id
    where x.archived_at is null and to_jsonb(x)::text like '%ำ%'
  union all select x.resident_id, 'procedures' from procedures x join a on a.id = x.resident_id
    left join procedure_types t on t.id = x.procedure_type_id where concat_ws(' ', to_jsonb(x)::text, t.name) like '%ำ%'
  union all select x.resident_id, 'blood tests' from blood_tests x join a on a.id = x.resident_id
    left join blood_test_types t on t.id = x.blood_test_type_id where concat_ws(' ', to_jsonb(x)::text, t.name) like '%ำ%'
  union all select x.owner_id, 'photos/files' from attachments x join a on a.id = x.owner_id
    where x.owner_type = 'resident' and to_jsonb(x)::text like '%ำ%'
)
select (select count(*) from a) as archived,
       (select count(distinct id) from hits) as with_sara_am,
       (select count(distinct id) from hits where place = 'header') as in_header,
       (select coalesce(json_agg(r order by r.resident_code), '[]') from (
          select a.resident_code, a.name, array_agg(distinct h.place) as places
          from hits h join a on a.id = h.id group by a.resident_code, a.name) r) as residents`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
if (!res.ok) {
  console.error(`${name} (${ref}): ${text}`);
  process.exit(1);
}
const [row] = JSON.parse(text);
console.log(`${name} (${ref}): ${row.archived} archived summaries, ${row.with_sara_am} with a ำ, ${row.in_header} of them in the header.`);
for (const r of row.residents) console.log(`  ${r.resident_code}  ${r.name}  (${r.places.join(", ")})`);
