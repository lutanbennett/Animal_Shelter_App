// bills-inbox (0189, 0190): who may file, read and move a bill photo. Against DEV only, one transaction that
// is always rolled back, each login's own JWT.
//
//   node scripts/check-bills-roles.mjs            (from the repo root; dev only)
//   node scripts/check-bills-roles.mjs --verbose  (also list every passing check)
//
// Six principals: admin, management, the 2IC (stock.delivery, no medical.visits), the Head of Maintenance,
// a visiting doctor and a volunteer. What it holds:
//   filing         record_attachment() for a delivery, a clinic visit, an inbox card and a maintenance bill
//   the inbox      who may add, read and delete a card
//   matching       moving a photo from a card onto a delivery or a visit: the NEW owner's activity is asked
//                  as well as the old one's, so the 2IC can match to a delivery and not to a visit
//   the fences     the doctor is refused all four, whatever else the role holds (0174)
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
const P = ["admin", "management", "sic", "hm", "doctor", "volunteer"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), OWN = randomUUID(), JOB = randomUUID(), REC = randomUUID(), VISIT = randomUUID();
const CARD = randomUUID(), CARD2 = randomUUID(), PHOTO = randomUUID(), BILL = randomUUID(), BILL_PHOTO = randomUUID();

const NONE = { admin: 0, management: 0, sic: 0, hm: 0, doctor: 0, volunteer: 0 };
const MGMT = { ...NONE, admin: 1, management: 1 };
const DELIVERY = { ...MGMT, sic: 1 };

const file = (type, id) => `select * from record_attachment('${type}'::attachment_owner_type, '${id}', 'probe', 'probe.jpg')`;
const probes = [
  ["file on a delivery", file("stock_receipt", REC), DELIVERY],
  ["file on a clinic visit", file("clinic_visit", VISIT), MGMT],
  ["file on an inbox card", file("bill_inbox", CARD), DELIVERY],
  ["file on a maintenance bill", file("maintenance_bill", BILL), MGMT],
  // maintenance-bills (2026-10-13): the Heads and the 2IC read no bill, no amount and no total.
  ["read a job's bill (amount)", `select amount from maintenance_bills where id = '${BILL}'`, MGMT],
  ["read a job's bill total from the cost view", `select bills_total from maintenance_job_cost where maintenance_id = '${JOB}' and bill_count > 0`, MGMT],
  ["add a bill to a job", `insert into maintenance_bills (maintenance_id, amount) values ('${JOB}', 5)`, MGMT],
  ["read a bill's photo", `select 1 from attachments where id = '${BILL_PHOTO}'`, MGMT],
  ["add a card", `insert into bills_inbox (taken_by) values ('__UID__')`, DELIVERY],
  ["read a card", `select 1 from bills_inbox where id = '${CARD}'`, DELIVERY],
  ["delete a card", `delete from bills_inbox where id = '${CARD2}'`, DELIVERY],
  ["read a card's photo", `select 1 from attachments where id = '${PHOTO}'`, DELIVERY],
  ["move a photo onto a delivery", `update attachments set owner_type = 'stock_receipt', owner_id = '${REC}' where id = '${PHOTO}'`, DELIVERY],
  ["move a photo onto a visit", `update attachments set owner_type = 'clinic_visit', owner_id = '${VISIT}' where id = '${PHOTO}'`, MGMT],
  ["set a delivery's cost", `update stock_receipts set cost = 12 where id = '${REC}'`, DELIVERY],
  ["set a visit's cost", `update clinic_visits set cost = 12 where id = '${VISIT}'`, { ...MGMT, doctor: 1 }], // the doctor's own clinic's visit: a right it has always had (0110), not a bill
];

const lines = [];
for (const [name, sql] of probes) {
  for (const who of P) lines.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, $n$${name}$n$, $q$${sql.replace("__UID__", ID[who])}$q$);`);
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
declare v_med uuid;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-bills-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id)
    select u.id, ro.id from (values ('admin', ${lit(ID.admin)}), ('management', ${lit(ID.management)}), ('volunteer', ${lit(ID.volunteer)}), ('doctor', ${lit(ID.doctor)})) as u(who, id) join roles ro on ro.key = u.who;
  insert into user_roles (user_id, role_id) select ${lit(ID.sic)}, id from roles where key = 'second_in_command';
  insert into user_roles (user_id, role_id) select ${lit(ID.hm)}, id from roles where key = 'head_of_maintenance';
  insert into clinics (id, name) values (${lit(OWN)}, 'Harness own');
  with d as (insert into doctors (name, user_id) values ('Harness doctor', ${lit(ID.doctor)}) returning id) insert into doctor_clinics (clinic_id, doctor_id) select ${lit(OWN)}, id from d;
  insert into residents (id, name, species) values (${lit(R)}, 'Harness resident', 'Dog');
  select id into v_med from medication order by id limit 1;
  insert into stock_receipts (id, item_kind, medication_id, quantity) values (${lit(REC)}, 'medication', v_med, 1);
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, status) values (${lit(VISIT)}, ${lit(R)}, ${lit(OWN)}, now() - interval '1 day', 'completed');
  insert into maintenance (id, title, zone_id) values (${lit(JOB)}, 'Harness job', (select id from zones order by id limit 1));
  insert into maintenance_bills (id, maintenance_id, amount, added_by) values (${lit(BILL)}, ${lit(JOB)}, 1, ${lit(ID.management)});
  insert into attachments (id, owner_type, owner_id, drive_file_id, file_name) values (${lit(BILL_PHOTO)}, 'maintenance_bill', ${lit(BILL)}, 'probe', 'probe.jpg');
  insert into bills_inbox (id, taken_by) values (${lit(CARD)}, ${lit(ID.management)}), (${lit(CARD2)}, ${lit(ID.management)});
  insert into attachments (id, owner_type, owner_id, drive_file_id, file_name) values (${lit(PHOTO)}, 'bill_inbox', ${lit(CARD)}, 'probe', 'probe.jpg');
end $setup$;

do $run$ begin
${lines.join("\n")}
end $run$;

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
const get = (who, tbl) => rows.find((r) => r.who === who && r.tbl === tbl)?.n;

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };

for (const [name, , exp] of probes) {
  for (const who of P) {
    const n = get(who, name), want = exp[who];
    const label = `${name} as ${who}: ${want ? "allowed" : "refused"}`;
    if ((n >= 1) === Boolean(want)) pass(label);
    else fail(`${label} — got ${n}`);
  }
}

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (bills follow the activity of what they are for; the 2IC reaches deliveries and not visits; the doctor reaches none)");
process.exitCode = fails ? 1 : 0;
