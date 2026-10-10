// medication-rounds (0137, 0138): the rounds model against DEV, one transaction that is always rolled back.
//
//   node scripts/check-medication-rounds.mjs            (from the repo root; dev only)
//   node scripts/check-medication-rounds.mjs --verbose  (also list every passing check)
//
// What it holds:
//   vocabulary   three rounds, lunch is medication-only, food is morning + evening
//   back-fill    every real frequency, prescription and diet on dev has the rounds its schedule owes,
//                so no existing prescription falls in no round; nothing reads none or mismatch
//   defaults     a new frequency, prescription or diet is given rounds (1 -> morning,
//                2 -> morning + evening, 3 -> all, interval -> morning, as needed -> none); a changed
//                schedule re-defaults; a hand-ticked set survives an unrelated edit
//   visible      a frequency, prescription or diet with no rounds, or the wrong number, reads none /
//                mismatch, never ok
//   guards       lunch cannot be put on a diet
//   (no re-run: 0137 and 0138 name the 'vet' role, which 0172 renamed to 'doctor', so they no longer replay;
//   the checks run against the live schema, docs/decisions/2026-10-02-replay-or-assert-live.md)
//   access       who reads and who writes the mappings, each login's own JWT
//   functions    nobody signed in, Admin included, may call reset_prescription_rounds(), reset_frequency_rounds()
//                or reset_diet_rounds() (0170). They run as their owner and ask nothing of the caller; only the
//                owner-rights triggers call them. The access probes above never looked through them, which is how
//                a login with no role could put a prescription back on its default rounds.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
// No staff principal: 0173 retired Staff and a live staff login can no longer be made.
const P = ["admin", "management", "volunteer", "doctor", "norole"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID();

const probes = [
  ["read frequency_rounds", `select 1 from frequency_rounds limit 1`, { admin: 1, management: 1, doctor: 1, volunteer: 0, norole: 0 }],
  ["read rounds", `select 1 from rounds limit 1`, { admin: 1, management: 1, doctor: 1, volunteer: 1, norole: 1 }],
  ["write frequency_rounds", `delete from frequency_rounds where frequency_id = (select id from frequency where label = 'Once daily')`, { admin: 1, management: 1, doctor: 0, volunteer: 0, norole: 0 }],
  ["write rounds", `update rounds set name = name where key = 'lunch'`, { admin: 1, management: 0, doctor: 0, volunteer: 0, norole: 0 }],
  ["write prescription_rounds", `delete from prescription_rounds where prescription_id in (select id from prescriptions where resident_id = '${R}')`, { admin: 1, management: 1, doctor: 0, volunteer: 0, norole: 0 }],
];
// [function, the table its argument is an id of]: called with a real id, so a granted call would really reset it.
const RESETS = [["reset_prescription_rounds", "prescriptions"], ["reset_frequency_rounds", "frequency"], ["reset_diet_rounds", "resident_diets"]];
const fnProbes = RESETS.map(([fn]) => [`call ${fn}()`, null, Object.fromEntries(P.map((p) => [p, 0]))]);

const lines = [];
for (const [name, sql] of probes) for (const who of P) lines.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, $n$${name}$n$, $q$${sql}$q$);`);
const fnLines = [];
for (const [fn, table] of RESETS) for (const who of P) {
  fnLines.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, $n$call ${fn}()$n$, format('select %I(%L::uuid)', '${fn}', (select id from ${table} order by id limit 1)));`);
}

const harness = `
begin;
create temp table res (name text, ok boolean, detail text);
grant all on res to authenticated;
create function pg_temp.t(p_name text, p_ok boolean, p_detail text default '') returns void language sql as $f$
  insert into res values (p_name, coalesce(p_ok, false), p_detail) $f$;
create function pg_temp.keys(p_freq uuid) returns text language sql as $f$
  select coalesce(string_agg(r.key, '+' order by r.sort_order), '') from frequency_rounds fr join rounds r on r.id = fr.round_id where fr.frequency_id = p_freq $f$;
create function pg_temp.pkeys(p_rx uuid) returns text language sql as $f$
  select coalesce(string_agg(r.key, '+' order by r.sort_order), '') from prescription_rounds fr join rounds r on r.id = fr.round_id where fr.prescription_id = p_rx $f$;
create function pg_temp.dkeys(p_diet uuid) returns text language sql as $f$
  select coalesce(string_agg(r.key, '+' order by r.sort_order), '') from resident_diet_rounds fr join rounds r on r.id = fr.round_id where fr.resident_diet_id = p_diet $f$;
create function pg_temp.probe(p_who text, p_uid uuid, p_name text, p_sql text) returns void language plpgsql as $f$
declare v bigint := -2;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
    begin
      execute p_sql; get diagnostics v = row_count;
    exception when insufficient_privilege then v := -1; when others then v := -2;
    end;
    reset role;
    raise exception using errcode = 'P0999', message = 'probe-rollback';
  exception when sqlstate 'P0999' then null;
  end;
  insert into res values ('probe:' || p_name || ':' || p_who, v >= 1, v::text);
end $f$;

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-rd-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${["admin", "management", "volunteer", "doctor"].map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into residents (id, name, species) values (${lit(R)}, 'Harness resident', 'Dog');
end $setup$;

-- the live grants on the reset functions
do $fn$ begin
${fnLines.join("\n")}
end $fn$;

do $run$
declare
  f1 uuid; f2 uuid; f3 uuid; f4 uuid; fi uuid; fa uuid; d1 uuid; d2 uuid; dt uuid; med uuid;
  x1 uuid; x2 uuid; x3 uuid;
begin
  perform pg_temp.t('vocabulary: morning, lunch, evening in order',
    (select string_agg(key, '+' order by sort_order) from rounds) = 'morning+lunch+evening');
  perform pg_temp.t('vocabulary: lunch is medication only, the others are both',
    (select bool_and(for_medication) and not bool_or(for_food) filter (where key = 'lunch') and bool_and(for_food) filter (where key <> 'lunch') from rounds));

  -- back-fill
  perform pg_temp.t('back-fill: no frequency reads none or mismatch', not exists (select 1 from frequency_round_status where status <> 'ok'),
    (select string_agg(label || '=' || status, ', ') from frequency_round_status where status <> 'ok'));
  perform pg_temp.t('back-fill: Once daily -> morning', pg_temp.keys((select id from frequency where label = 'Once daily')) = 'morning');
  perform pg_temp.t('back-fill: Twice daily -> morning+evening', pg_temp.keys((select id from frequency where label = 'Twice daily')) = 'morning+evening');
  perform pg_temp.t('back-fill: Three times daily -> all three', pg_temp.keys((select id from frequency where label = 'Three times daily')) = 'morning+lunch+evening');
  perform pg_temp.t('back-fill: Every 12 hours -> morning+evening', pg_temp.keys((select id from frequency where label = 'Every 12 hours')) = 'morning+evening');
  perform pg_temp.t('back-fill: Weekly (an interval) -> morning', pg_temp.keys((select id from frequency where label = 'Weekly')) = 'morning');
  perform pg_temp.t('back-fill: As needed -> no rounds, and that reads ok', pg_temp.keys((select id from frequency where label = 'As needed')) = ''
    and (select status from frequency_round_status where label = 'As needed') = 'ok');
  perform pg_temp.t('back-fill: no existing prescription with a schedule is left in no round',
    not exists (select 1 from prescriptions p join frequency f on f.id = p.frequency_id
                 where (f.doses_per_day is not null or f.interval_count is not null)
                   and not exists (select 1 from prescription_rounds pr where pr.prescription_id = p.id)),
    (select count(*)::text from prescriptions p join frequency f on f.id = p.frequency_id where (f.doses_per_day is not null or f.interval_count is not null)
        and not exists (select 1 from prescription_rounds pr where pr.prescription_id = p.id)));
  perform pg_temp.t('back-fill: no current prescription reads none or mismatch', not exists (select 1 from prescription_round_status where status <> 'ok'),
    (select count(*)::text from prescription_round_status where status <> 'ok'));
  perform pg_temp.t('back-fill: no current diet reads none or mismatch', not exists (select 1 from resident_diet_round_status where status <> 'ok'),
    (select count(*)::text from resident_diet_round_status where status <> 'ok'));
  perform pg_temp.t('back-fill: every two-meal diet is morning+evening',
    not exists (select 1 from resident_diets d where d.meals_per_day = 2 and pg_temp.dkeys(d.id) <> 'morning+evening'));

  -- frequency defaults
  insert into frequency (label, doses_per_day) values ('H once', 1) returning id into f1;
  insert into frequency (label, doses_per_day) values ('H twice', 2) returning id into f2;
  insert into frequency (label, doses_per_day) values ('H thrice', 3) returning id into f3;
  insert into frequency (label, doses_per_day) values ('H four', 4) returning id into f4;
  insert into frequency (label, interval_count, interval_unit) values ('H fortnight', 2, 'week') returning id into fi;
  insert into frequency (label) values ('H prn') returning id into fa;
  perform pg_temp.t('insert: 1/day -> morning', pg_temp.keys(f1) = 'morning');
  perform pg_temp.t('insert: 2/day -> morning+evening', pg_temp.keys(f2) = 'morning+evening');
  perform pg_temp.t('insert: 3/day -> all three', pg_temp.keys(f3) = 'morning+lunch+evening');
  perform pg_temp.t('insert: interval -> morning', pg_temp.keys(fi) = 'morning');
  perform pg_temp.t('insert: as needed -> none, reads ok', pg_temp.keys(fa) = '' and (select status from frequency_round_status where frequency_id = fa) = 'ok');
  perform pg_temp.t('insert: 4/day has 3 rounds and READS mismatch (more doses than rounds)',
    (select status from frequency_round_status where frequency_id = f4) = 'mismatch');
  update frequency set doses_per_day = 3 where id = f1;
  perform pg_temp.t('update: 1/day -> 3/day re-defaults to all three', pg_temp.keys(f1) = 'morning+lunch+evening');
  delete from frequency_rounds where frequency_id = f1 and round_id = (select id from rounds where key = 'lunch');
  update frequency set label = 'H once renamed' where id = f1;
  perform pg_temp.t('update: a rename does not undo a hand edit of the rounds', pg_temp.keys(f1) = 'morning+evening');
  perform pg_temp.t('visible: 3/day with two rounds reads mismatch', (select status from frequency_round_status where frequency_id = f1) = 'mismatch');
  delete from frequency_rounds where frequency_id = f2;
  perform pg_temp.t('visible: 2/day with no rounds reads none, not ok', (select status from frequency_round_status where frequency_id = f2) = 'none');
  insert into frequency_rounds (frequency_id, round_id) select f2, id from rounds where key in ('morning', 'evening');

  -- prescriptions: the whiteboard case, Amoxicillin 2 tablets, Morning + Evening
  select id into med from medication order by id limit 1;
  insert into prescriptions (resident_id, medication_id, frequency_id, dose_quantity, start_date) values (${lit(R)}, med, f2, 2, current_date) returning id into x1;
  perform pg_temp.t('prescription insert: takes its frequency''s rounds (twice a day -> morning+evening)', pg_temp.pkeys(x1) = 'morning+evening');
  perform pg_temp.t('prescription: two ticks on a 2/day frequency reads ok', (select status from prescription_round_status where prescription_id = x1) = 'ok');
  delete from prescription_rounds where prescription_id = x1 and round_id = (select id from rounds where key = 'evening');
  update prescriptions set notes = 'unrelated edit' where id = x1;
  perform pg_temp.t('prescription: an unrelated edit does not re-default a hand-ticked set', pg_temp.pkeys(x1) = 'morning');
  perform pg_temp.t('prescription visible: one round on a 2/day frequency reads mismatch', (select status from prescription_round_status where prescription_id = x1) = 'mismatch');
  insert into prescription_rounds (prescription_id, round_id) select x1, id from rounds where key = 'lunch';
  perform pg_temp.t('prescription: lunch can be ticked (morning + lunch)', pg_temp.pkeys(x1) = 'morning+lunch');
  update prescriptions set frequency_id = f3 where id = x1;
  perform pg_temp.t('prescription: changing the frequency re-defaults (three times -> all three)', pg_temp.pkeys(x1) = 'morning+lunch+evening');
  insert into prescriptions (resident_id, medication_id, frequency_id, dose_quantity, start_date) values (${lit(R)}, med, fa, 1, current_date) returning id into x2;
  perform pg_temp.t('prescription: as needed owes no round and reads ok', pg_temp.pkeys(x2) = '' and (select status from prescription_round_status where prescription_id = x2) = 'ok');
  insert into prescriptions (resident_id, medication_id, frequency_id, dose_quantity, start_date) values (${lit(R)}, med, fi, 1, current_date) returning id into x3;
  perform pg_temp.t('prescription: an interval (fortnightly) goes in the morning', pg_temp.pkeys(x3) = 'morning');
  delete from prescription_rounds where prescription_id = x3;
  perform pg_temp.t('prescription visible: a scheduled dose with no round reads none, not ok', (select status from prescription_round_status where prescription_id = x3) = 'none');
  update prescriptions set end_date = current_date - 1, start_date = current_date - 5 where id = x3;
  perform pg_temp.t('prescription: an ended prescription drops out of the status view', not exists (select 1 from prescription_round_status where prescription_id = x3));

  -- diets
  select id into dt from diet_types order by id limit 1;
  insert into resident_diets (resident_id, diet_type_id, start_date, meals_per_day) values (${lit(R)}, dt, current_date, 2) returning id into d1;
  insert into resident_diets (resident_id, diet_type_id, start_date, meals_per_day) values (${lit(R)}, dt, current_date, 1) returning id into d2;
  perform pg_temp.t('diet insert: 2 meals -> morning+evening', pg_temp.dkeys(d1) = 'morning+evening');
  perform pg_temp.t('diet insert: 1 meal -> morning', pg_temp.dkeys(d2) = 'morning');
  update resident_diets set meals_per_day = 2 where id = d2;
  perform pg_temp.t('diet update: 1 -> 2 meals re-defaults to morning+evening', pg_temp.dkeys(d2) = 'morning+evening');
  update resident_diets set meals_per_day = 3 where id = d2;
  perform pg_temp.t('diet: 3 meals but only two food rounds reads mismatch', (select status from resident_diet_round_status where resident_diet_id = d2) = 'mismatch');
  delete from resident_diet_rounds where resident_diet_id = d1;
  perform pg_temp.t('diet visible: no rounds reads none', (select status from resident_diet_round_status where resident_diet_id = d1) = 'none');
  begin
    insert into resident_diet_rounds (resident_diet_id, round_id) select d1, id from rounds where key = 'lunch';
    perform pg_temp.t('guard: lunch refused on a diet', false, 'accepted');
  exception when others then perform pg_temp.t('guard: lunch refused on a diet', sqlerrm like '%not used for food%', sqlerrm); end;
end $run$;

do $access$ begin
${lines.join("\n")}
end $access$;
do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 1500)}`);
const rows = JSON.parse(m[1]);

let fails = 0, ok = 0;
for (const r of rows) {
  if (r.name.startsWith("probe:")) continue;
  if (r.ok) { ok++; if (verbose) console.log(`ok    ${r.name}`); }
  else { fails++; console.log(`FAIL  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`); }
}
for (const [name, , exp] of [...probes, ...fnProbes]) {
  for (const who of P) {
    const r = rows.find((x) => x.name === `probe:${name}:${who}`);
    const label = `${name} as ${who}: ${exp[who] ? "allowed" : "refused"}`;
    if (r && r.ok === Boolean(exp[who])) { ok++; if (verbose) console.log(`ok    ${label}`); }
    else { fails++; console.log(`FAIL  ${label} — got ${r?.detail}`); }
  }
}
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
