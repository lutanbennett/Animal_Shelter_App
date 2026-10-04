// medical-jobs (0140): what the Head of Medical's three remaining jobs stand on. Against DEV only, one
// transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-medical-jobs.mjs            (from the repo root; dev only)
//   node scripts/check-medical-jobs.mjs --verbose  (also list every passing check)
//
// What it holds, for seven principals (the Head of Medical, admin, management, staff, volunteer, a vet, no role):
//   weight        the Head of Medical reads, adds and corrects a reading; a volunteer, no role and a vet
//                 outside their clinic cannot; staff and management still can
//   photos        record_attachment() files a resident photo in Medical for her, refuses any other folder, an
//                 adopter's photo, and a procedure file; the legacy roles are unchanged (staff files in any
//                 folder); the volunteer is still refused
//   photo view    medical_photo_residents answers the cell; set_resident_drive_folder() fills a missing folder
//                 and never overwrites one
//   diets         special_diet_list shows the non-standard diet with the right amount and rounds, never the
//                 standard one, and carries no price or stock column
//   the floor     she still cannot read residents, medication, diet_types or attachments
//   the cells     role_permissions = the jobs in jobs.ts plus the three cells 0140 granted ahead of their screens
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { bundleOfRole } = await import(pathToFileURL(join(process.cwd(), "src/lib/permissions/jobs.ts")).href);

// Cells 0140 grants ahead of the screens (batch 47) that will turn them into jobs. When a job in jobs.ts
// takes one over, delete it here: bundleOfRole() then carries it.
const AHEAD = new Map([["medical.weight", 2], ["photos.resident_add", 2], ["medical.diet", 1]]);

const lit = (id) => `'${id}'::uuid`;
const P = ["hom", "admin", "management", "staff", "volunteer", "vet", "norole"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), R2 = randomUUID(), OWN = randomUUID(), NSD = randomUUID();

const NONE = { hom: 0, admin: 0, management: 0, staff: 0, volunteer: 0, vet: 0, norole: 0 };
const STAFF_UP = { ...NONE, admin: 1, management: 1, staff: 1 };
const HOM_UP = { ...STAFF_UP, hom: 1 };
const HOM_UP_VET = { ...HOM_UP, vet: 1 }; // the harness resident has a visit at the vet's own clinic
const NOT_VET = HOM_UP; // gated on sees_all_clinical(): a vet (own clinic) gets none

const probes = [
  // 1. weight
  ["read weight", `select 1 from weight where resident_id = '${R}'`, HOM_UP_VET],
  ["insert weight", `insert into weight (resident_id, date, weight_kg) values ('${R}', current_date - 500, 5)`, HOM_UP_VET],
  ["correct a weight", `update weight set weight_kg = 6 where resident_id = '${R}'`, HOM_UP_VET],
  ["who and where picker", `select 1 from resident_who_and_where where id = '${R}'`, { ...NONE, hom: 1, volunteer: 1 }],
  // 2. photos
  ["file a Medical photo", `select 1 from record_attachment('resident', '${R}', 'f-med', 'a.jpg', 'Medical', current_date, null)`, HOM_UP_VET],
  ["file a ' medical ' photo (case and spaces)", `select 1 from record_attachment('resident', '${R}', 'f-med2', 'a.jpg', ' medical ', current_date, null)`, HOM_UP_VET],
  ["file a photo in another folder", `select 1 from record_attachment('resident', '${R}', 'f-oth', 'a.jpg', 'Cats at play', current_date, null)`, { ...STAFF_UP, vet: 1 }],
  ["file a photo with no folder", `select 1 from record_attachment('resident', '${R}', 'f-nof', 'a.jpg', null, current_date, null)`, { ...STAFF_UP, vet: 1 }],
  ["file an adopter's photo", `select 1 from record_attachment('resident', '${R}', 'f-ado', 'a.jpg', '20260101', current_date, '${randomUUID()}')`, "hom-zero"],
  ["file a procedure file", `select 1 from record_attachment('procedure', '${randomUUID()}', 'f-proc', 'a.jpg', 'Medical', current_date, null)`, "hom-zero"],
  ["photo resident view", `select 1 from medical_photo_residents where id = '${R}'`, NOT_VET],
  ["folder column on the photo view", `select drive_folder_id, is_deceased, resident_code from medical_photo_residents limit 1`, "ok-hom"],
  ["breed column on the photo view", `select breed from medical_photo_residents limit 1`, "error"],
  ["set the folder", `select set_resident_drive_folder('${R}', 'folder-x')`, NOT_VET],
  // 3. diets
  ["special diet list", `select 1 from special_diet_list where resident_id = '${R}'`, NOT_VET],
  ["the amount is the size default", `select 1 from special_diet_list where resident_id = '${R}' and daily_quantity = 7 and diet_unit = 'g' and meals_per_day = 2 and round_keys = array['morning','evening']`, NOT_VET],
  ["the amount is the resident's own", `select 1 from special_diet_list where resident_id = '${R2}' and daily_quantity = 11`, NOT_VET],
  ["the standard diet is not listed", `select 1 from special_diet_list where resident_id = '${R2}' and diet_type_id <> '${NSD}'`, NONE],
  ["an ended diet is not listed", `select 1 from special_diet_list where resident_id = '${R2}' and daily_quantity = 3`, NONE],
  ["price column on the diet list", `select cost_per_unit from special_diet_list limit 1`, "error"],
  ["stock column on the diet list", `select stock_on_hand from special_diet_list limit 1`, "error"],
  ["breed column on the diet list", `select breed from special_diet_list limit 1`, "error"],
  ["read resident_diets", `select 1 from resident_diets where resident_id = '${R}'`, HOM_UP_VET],
  ["write resident_diets", `update resident_diets set notes = 'probe' where resident_id = '${R}'`, { ...STAFF_UP, vet: 1 }],
  // the floor
  ["residents", `select 1 from residents where id = '${R}'`, { ...STAFF_UP, vet: 1 }],
  ["medication", `select 1 from medication limit 1`, { ...STAFF_UP, vet: 1 }],
  ["diet_types", `select 1 from diet_types limit 1`, { ...STAFF_UP, vet: 1 }],
  ["attachments", `select 1 from attachments limit 1`, "hom-zero"],
  ["procedures", `select 1 from procedures where resident_id = '${R}'`, "hom-zero"],
  ["visit write", `insert into vet_appointments (resident_id, vet_id, appointment_date, status) values ('${R}', '${OWN}', now(), 'scheduled')`, "hom-zero"],
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

-- what a call leaves behind, as a value read after it, as the caller
create function pg_temp.effect(p_who text, p_uid uuid, p_name text, p_call text, p_read text) returns void language plpgsql as $f$
declare v text;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
    begin execute p_call; exception when others then null; end;
    reset role;
    execute p_read into v;
    raise exception using errcode = 'P0999', message = 'probe-rollback';
  exception when sqlstate 'P0999' then null;
  end;
  insert into res values (p_who, p_name, case when v is null then -3 else 1 end);
  insert into res values (p_who, p_name || '=' || coalesce(v, 'NULL'), 0);
end $f$;

do $setup$
declare v_std uuid;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-mj-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${["admin", "management", "staff", "volunteer", "vet"].map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id, role) select ${lit(ID.hom)}, id, legacy_role from roles where key = 'head_of_medical';
  insert into vets (id, name, clinic_name) values (${lit(OWN)}, 'Harness own', 'Harness own');
  insert into vet_doctors (name, user_id, vet_id) values ('Harness vet', ${lit(ID.vet)}, ${lit(OWN)});
  insert into residents (id, name, species, size) values (${lit(R)}, 'Harness resident', 'Dog', 'Medium');
  insert into residents (id, name, species, size, drive_folder_id) values (${lit(R2)}, 'Harness resident two', 'Cat', 'Small', 'keep-me');
  insert into vet_appointments (resident_id, vet_id, appointment_date, status) values (${lit(R)}, ${lit(OWN)}, now() - interval '3 days', 'completed');
  insert into weight (resident_id, date, weight_kg) values (${lit(R)}, current_date - 1, 5);
  select id into v_std from diet_types where is_standard;
  if v_std is null then
    insert into diet_types (name, daily_qty_small, daily_qty_medium, daily_qty_large, is_standard) values ('Harness standard', 1, 1, 1, true) returning id into v_std;
  end if;
  insert into diet_types (id, name, unit, cost_per_unit, daily_qty_small, daily_qty_medium, daily_qty_large, stock_on_hand)
    values (${lit(NSD)}, 'Harness kidney diet', 'g', 9, 5, 7, 9, 100);
  -- R: the type's medium default (7) at two meals; R2: its own amount (11), plus an ended diet (3) and a standard one
  insert into resident_diets (resident_id, diet_type_id, start_date, meals_per_day) values (${lit(R)}, ${lit(NSD)}, current_date - 2, 2);
  insert into resident_diets (resident_id, diet_type_id, start_date, daily_quantity) values (${lit(R2)}, ${lit(NSD)}, current_date - 2, 11);
  insert into resident_diets (resident_id, diet_type_id, start_date, end_date, daily_quantity) values (${lit(R2)}, ${lit(NSD)}, current_date - 20, current_date - 10, 3);
  insert into resident_diets (resident_id, diet_type_id, start_date, daily_quantity) values (${lit(R2)}, v_std, current_date - 2, 13);
end $setup$;

do $run$ begin
${lines.join("\n")}
  perform pg_temp.effect('hom', ${lit(ID.hom)}, 'folder filled', $c$select set_resident_drive_folder('${R}', 'new-folder')$c$, $c$select drive_folder_id from residents where id = '${R}'$c$);
  perform pg_temp.effect('hom', ${lit(ID.hom)}, 'folder kept', $c$select set_resident_drive_folder('${R2}', 'hijack')$c$, $c$select drive_folder_id from residents where id = '${R2}'$c$);
  perform pg_temp.effect('volunteer', ${lit(ID.volunteer)}, 'folder by volunteer', $c$select set_resident_drive_folder('${R}', 'vol-folder')$c$, $c$select coalesce(drive_folder_id, 'NONE') from residents where id = '${R}'$c$);
  perform pg_temp.effect('hom', ${lit(ID.hom)}, 'profile photo set', $c$select 1 from record_attachment('resident', '${R}', 'f-prof', 'a.jpg', 'Medical', current_date, null)$c$, $c$select coalesce(profile_photo_drive_file_id, 'NONE') from residents where id = '${R}'$c$);
  perform pg_temp.effect('hom', ${lit(ID.hom)}, 'attachment row', $c$select 1 from record_attachment('resident', '${R}', 'f-row', 'a.jpg', 'Medical', current_date, null)$c$, $c$select uploaded_by::text from attachments where drive_file_id = 'f-row'$c$);
end $run$;

do $role$ begin
  insert into res select 'role', 'row', 0 where exists (select 1 from roles where key = 'head_of_medical' and kind = 'custom' and legacy_role = 'volunteer' and scope_photos = 'medical_only' and archived_at is null);
  insert into res select 'role', 'cell:' || rp.activity || ':' || rp.level, 0 from role_permissions rp join roles r on r.id = rp.role_id where r.key = 'head_of_medical';
end $role$;
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
const valueOf = (who, tbl) => rows.find((r) => r.who === who && r.tbl.startsWith(tbl + "="))?.tbl.slice(tbl.length + 1);

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };

for (const [name, , exp] of probes) {
  if (exp === "error") {
    const n = get("hom", name);
    if (n === -2) pass(`${name}: refused as a missing column`); else fail(`${name}: expected an error, got ${n}`);
    continue;
  }
  if (exp === "ok-hom") {
    const n = get("hom", name);
    if (n >= 0) pass(`${name}: the columns exist`); else fail(`${name}: expected to run, got ${n}`);
    continue;
  }
  if (exp === "hom-zero") {
    const n = get("hom", name);
    if (n <= 0) pass(`${name} as hom: refused or empty`); else fail(`${name}: the Head of Medical got ${n} row(s)`);
    continue;
  }
  for (const who of P) {
    const n = get(who, name), want = exp[who];
    const label = `${name} as ${who}: ${want ? "allowed" : "refused"}`;
    if ((n >= 1) === Boolean(want)) pass(label);
    else fail(`${label} — got ${n}`);
  }
}

const eq = (label, got, want) => (got === want ? pass(`${label} (${want})`) : fail(`${label}: expected ${want}, got ${got}`));
eq("set_resident_drive_folder fills a missing folder", valueOf("hom", "folder filled"), "new-folder");
eq("set_resident_drive_folder never overwrites a folder", valueOf("hom", "folder kept"), "keep-me");
eq("a volunteer cannot set a folder", valueOf("volunteer", "folder by volunteer"), "NONE");
eq("a first photo from her becomes the profile photo, as it does for staff (unchanged behaviour)", valueOf("hom", "profile photo set"), "f-prof");
eq("an attachment she files is stamped with her id", valueOf("hom", "attachment row")?.length, 36);

if (get("role", "row") === 0) pass("role row: custom, borrows volunteer, medical-only photos"); else fail("role row head_of_medical missing or wrong shape");
const have = new Map(rows.filter((r) => r.who === "role" && r.tbl.startsWith("cell:")).map((r) => r.tbl.split(":").slice(1)).map(([a, l]) => [a, Number(l)]));
const want = new Map([...bundleOfRole("head_of_medical")].map(([a, l]) => [a, l === "edit" ? 2 : 1]));
for (const [a, l] of AHEAD) if (!want.has(a)) want.set(a, l);
const same = have.size === want.size && [...want].every(([a, l]) => have.get(a) === l);
if (same) pass(`cells: role_permissions = jobs.ts plus the three granted ahead (${[...want.keys()].join(", ")})`);
else fail(`cells: role_permissions ${JSON.stringify([...have])} differ from ${JSON.stringify([...want])}`);

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (weight, medical photos and special diets work for the Head of Medical and no one else gained or lost)");
process.exitCode = fails ? 1 : 0;
