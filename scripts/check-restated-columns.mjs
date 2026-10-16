// 0213 exercised on dev without keeping anything. Inside begin…rollback it puts the two columns back to the
// shape 0007/0004 give a from-zero build (integer nullable; zones.internal not null), runs the file, and asserts
// the result is dev's shape with both views back and readable. It also prints the due-date arithmetic for every
// interval in use under both shapes.
//
//   node scripts/check-restated-columns.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
const mig = readFileSync(join(root, "supabase/migrations/0213_restate_hand_edited_columns.sql"), "utf8");
const sql = `
begin;
create temp table r (n serial, label text, got text, want text);
-- the rounding comparison, before touching anything: dev's numeric shape
insert into r (label, got, want) select 'numeric ' || name || ' (' || interval_months || 'm), dose 1..3 from 2026-01-31',
  string_agg((date '2026-01-31' + (k * interval_months || ' months')::interval)::date::text, ',' order by k), 'see integer line'
  from immunization_types, generate_series(1,3) k group by name, interval_months;
-- rebuild shape: integer, nullable; zones.internal not null
drop view immunization_next_due; drop view picker_immunization_types;
alter table immunization_types alter column interval_months drop not null;
alter table immunization_types drop constraint interval_months_positive;
alter table immunization_types alter column interval_months type integer;
alter table zones alter column internal set not null;
insert into r (label, got, want) select 'integer ' || name || ' (' || interval_months || 'm), dose 1..3 from 2026-01-31',
  string_agg((date '2026-01-31' + (k * interval_months || ' months')::interval)::date::text, ',' order by k), 'see numeric line'
  from immunization_types, generate_series(1,3) k group by name, interval_months;
${mig}
insert into r (label, got, want) select 'interval_months type', data_type || '/' || is_nullable, 'numeric/NO' from information_schema.columns where table_name = 'immunization_types' and column_name = 'interval_months';
insert into r (label, got, want) select 'zones.internal', is_nullable || '/' || coalesce(column_default,'-'), 'YES/true' from information_schema.columns where table_name = 'zones' and column_name = 'internal';
insert into r (label, got, want) values ('views back', (select count(*)::text from pg_class where relname in ('immunization_next_due','picker_immunization_types')), '2');
insert into r (label, got, want) values ('next_due readable', (select (count(*) >= 0)::text from immunization_next_due), 'true');
insert into r (label, got, want) values ('due_dates callable', (select (count(*) >= 0)::text from immunization_due_dates(date '2026-01-01', date '2027-12-31')), 'true');
insert into r (label, got, want) values ('anon cannot read next_due', has_table_privilege('anon','immunization_next_due','select')::text, 'false');
insert into r (label, got, want) values ('authenticated reads picker', has_table_privilege('authenticated','picker_immunization_types','select')::text, 'true');
insert into r (label, got, want) values ('constraint back', (select count(*)::text from pg_constraint where conname = 'interval_months_positive'), '1');
-- running the file a second time changes nothing
${mig}
insert into r (label, got, want) select 're-run type', data_type, 'numeric' from information_schema.columns where table_name = 'immunization_types' and column_name = 'interval_months';
do $$ begin raise exception 'RESULT%RESULT', (select json_agg(json_build_object('l', label, 'got', got, 'want', want) order by n) from r); end $$;
`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const body = await res.json().catch(() => null);
const msg = body?.message ?? JSON.stringify(body);
const m = msg.match(/RESULT(\[[\s\S]*\])RESULT/);
if (!m) { console.log(res.status, msg.slice(0, 2000)); process.exit(1); }
const rows = JSON.parse(m[1]);
let bad = 0;
for (const x of rows) {
  if (x.want.startsWith("see ")) { console.log(`info ${x.l}: ${x.got}`); continue; }
  const ok = x.got === x.want;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${x.l}: got ${x.got}${ok ? "" : ` want ${x.want}`}`);
}
console.log(bad ? `${bad} FAILED` : "all held (rolled back, nothing kept)");
process.exitCode = bad ? 1 : 0;
