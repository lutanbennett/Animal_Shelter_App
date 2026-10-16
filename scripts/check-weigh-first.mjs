// weigh_first_visits() (0207), the narrow read behind Record Weight's "Weigh these first".
// Against DEV only, one transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-weigh-first.mjs            (from the repo root; dev only)
//   node scripts/check-weigh-first.mjs --verbose  (also list every passing check)
//
// What it holds:
//   who        the Head of Medical, admin and management read the list; a volunteer, a doctor and
//              a login with no role read NOTHING from it (the function asks medical.weight at edit)
//   the floor  the Head of Medical still cannot read clinic_visits itself, which is the whole point
//              of the function existing — this feature must not widen her cells to be easier
//   narrow     the function yields three columns and no more: a visit's id, status, reason or
//              doctor cannot be selected through it
//   the window yesterday or today on the SHELTER's calendar, and the boundary is asserted at the
//              four instants that define it rather than at whatever hour this is run:
//                (today-1) 00:00:00 Bangkok        in
//                (today-1) 00:00:00 Bangkok -1s    out
//                today     23:59:59 Bangkok        in
//                (today+1) 00:00:00 Bangkok        out
//              The first of those discriminates a UTC window from a Bangkok one at EVERY hour of
//              the day: it is 17:00Z two days before, so a UTC reading puts it outside the window.
//              A visit at 01:00 Bangkok today (18:00Z yesterday) is checked by name, because that
//              is the case the backlog item asks for.
//   excluded   cancelled, archived, two days ago, tomorrow
//   split      a resident already weighed today is STILL returned here. The weight comparison is
//              the app's (src/lib/medical/weigh-first.ts, held by weigh-first.test.mjs), because
//              `weight` is a table the Head of Medical may read. If that ever moves into SQL, this
//              check is the one that should fail first.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
const P = ["hom", "admin", "management", "volunteer", "doctor", "norole"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const CLINIC = randomUUID();

const NONE = { hom: 0, admin: 0, management: 0, volunteer: 0, doctor: 0, norole: 0 };
/** Who holds medical.weight at edit, and so who the function answers at all. */
const WEIGHERS = { ...NONE, hom: 1, admin: 1, management: 1 };

// Bangkok's today, in SQL, and an instant built from a Bangkok wall-clock day and time.
const BKK = "public.shelter_time_zone()";
const TODAY = `((now() at time zone ${BKK})::date)`;
const at = (dayOffset, time) =>
  `((${TODAY} + ${dayOffset}) + time '${time}') at time zone ${BKK}`;

/**
 * [name, when the visit is, whether it should come back]. Each gets its own resident, so a count
 * through the function is unambiguous.
 */
const CASES = [
  ["yesterday 09:30", at(-1, "09:30"), true, "'scheduled'", "null"],
  ["today 01:00 Bangkok (18:00Z yesterday)", at(0, "01:00"), true, "'scheduled'", "null"],
  ["today 13:00", at(0, "13:00"), true, "'completed'", "null"],
  ["window opens: yesterday 00:00:00 Bangkok", at(-1, "00:00:00"), true, "'scheduled'", "null"],
  ["one second before it opens", `${at(-1, "00:00:00")} - interval '1 second'`, false, "'scheduled'", "null"],
  ["window closes: today 23:59:59 Bangkok", at(0, "23:59:59"), true, "'scheduled'", "null"],
  ["one second after it closes", at(1, "00:00:00"), false, "'scheduled'", "null"],
  ["two days ago", at(-2, "09:30"), false, "'scheduled'", "null"],
  ["cancelled today", at(0, "09:30"), false, "'cancelled'", "null"],
  ["archived today", at(0, "09:30"), false, "'scheduled'", "now()"],
  // The split: weighed today and still returned. The weight row is added below.
  ["yesterday, already weighed today", at(-1, "09:30"), true, "'scheduled'", "null"],
];
const CASE_ID = CASES.map(() => randomUUID());
const WEIGHED = CASE_ID[CASES.length - 1];

const probes = [
  // One probe per case: how many rows the function yields for that resident.
  ...CASES.map(([name], i) => [
    `window: ${name}`,
    `select 1 from public.weigh_first_visits() where resident_id = ${lit(CASE_ID[i])}`,
    CASES[i][2] ? WEIGHERS : "weighers-zero",
  ]),
  // The clinic's name does come through, since a row has to say where the animal was seen.
  [
    "clinic name is returned",
    `select 1 from public.weigh_first_visits() where resident_id = ${lit(CASE_ID[0])} and clinic_name = 'Harness clinic'`,
    WEIGHERS,
  ],
  // Narrow: three columns and no more.
  ["no status column", `select status from public.weigh_first_visits()`, "error"],
  ["no visit id column", `select id from public.weigh_first_visits()`, "error"],
  ["no reason column", `select reason from public.weigh_first_visits()`, "error"],
  ["no doctor column", `select doctor_name from public.weigh_first_visits()`, "error"],
  // The floor this feature must not widen.
  [
    "clinic_visits direct",
    `select 1 from clinic_visits where resident_id = ${lit(CASE_ID[0])}`,
    { ...NONE, admin: 1, management: 1 },
  ],
  // Hers already, and the reason the comparison stays in the app.
  ["weight direct", `select 1 from weight where resident_id = ${lit(WEIGHED)}`, WEIGHERS],
];

const lines = [];
for (const [name, sql] of probes) {
  for (const who of P) lines.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, $n$${name}$n$, $q$${sql}$q$);`);
}

const harness = `
begin;
create temp table res (who text, tbl text, n bigint);
grant all on res to authenticated;
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
  insert into res values (p_who, p_name, v);
end $f$;

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-wf-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id)
    select u.id, ro.id from (values ${["admin", "management", "volunteer", "doctor"].map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id) join roles ro on ro.key = u.who;
  insert into user_roles (user_id, role_id) select ${lit(ID.hom)}, id from roles where key = 'head_of_medical';

  insert into clinics (id, name) values (${lit(CLINIC)}, 'Harness clinic');
  -- An explicit resident_code per row: the column's own default collides when several are
  -- inserted in one statement, and these are rolled back anyway.
  insert into residents (id, name, species, resident_code)
  select u.id, 'Harness ' || u.n, 'Dog', 'HARNESS-WF-' || u.n
    from (values ${CASE_ID.map((id, i) => `(${lit(id)}, ${i})`).join(",")}) as u(id, n);
  insert into clinic_visits (resident_id, clinic_id, appointment_date, status, archived_at) values
${CASES.map(([, when, , status, archived], i) => `    (${lit(CASE_ID[i])}, ${lit(CLINIC)}, ${when}, ${status}, ${archived})`).join(",\n")};
  -- The last case is weighed today, and must still come back from the function.
  insert into weight (resident_id, date, weight_kg) values (${lit(WEIGHED)}, ${TODAY}, 7.5);
end $setup$;

do $run$ begin
${lines.join("\n")}
end $run$;

-- What the clock actually was when this ran, so the output says whether the UTC and Bangkok days
-- differed at the time (they do only between 00:00 and 07:00 Thai).
do $when$ begin
  insert into res select 'clock', 'bkk:' || ${TODAY} || ' utc:' || (now() at time zone 'UTC')::date, 0;
end $when$;
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
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 2000)}`);
const rows = JSON.parse(m[1]);
const get = (who, tbl) => rows.find((r) => r.who === who && r.tbl === tbl)?.n;

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };

const clock = rows.find((r) => r.who === "clock");
if (clock) console.log(`clock at run time — ${clock.tbl.replace("bkk:", "Bangkok ").replace(" utc:", ", UTC ")}\n`);

for (const [name, , exp] of probes) {
  if (exp === "error") {
    const n = get("hom", name);
    if (n === -2) pass(`${name}: refused as a missing column`);
    else fail(`${name}: expected an error, got ${n} — the function is returning more than three columns`);
    continue;
  }
  if (exp === "weighers-zero") {
    let bad = P.filter((who) => get(who, name) >= 1);
    if (bad.length === 0) pass(`${name}: returned to nobody`);
    else fail(`${name}: should be outside the window, but ${bad.join(", ")} got it`);
    continue;
  }
  for (const who of P) {
    const n = get(who, name), want = exp[who];
    const label = `${name} as ${who}: ${want ? "returned" : "not returned"}`;
    if ((n >= 1) === Boolean(want)) pass(label);
    else fail(`${label} — got ${n}`);
  }
}

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(
  fails
    ? "RESULT: RED"
    : "RESULT: GREEN (the window is the shelter's, the list is the weighers', and clinic_visits stays shut)",
);
process.exitCode = fails ? 1 : 0;
