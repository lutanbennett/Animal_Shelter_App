// medical-jobs (0140): what the medical jobs' four cards stand on. Against DEV only, one transaction that is
// always rolled back, each login's own JWT. Restated 2026-10-29: principals are CARD holdings, not roles.
//
//   node scripts/check-medical-jobs.mjs            (from the repo root; dev only)
//   node scripts/check-medical-jobs.mjs --verbose  (also list every passing check)
//
// Four principals: "hom" holds exactly administer_medication, record_weight, add_medical_photos and
// feed_special_diets; "viewer" exactly view_residents; "norole" nothing; Admin sits outside the cards.
//   weight / photos / photo view / the floor   as before, per card holding
//   diets         special_diet_list (a recipe: qty_per_serving x servings x portion_factor, 0258) shows the
//                 non-standard diet with the right amount and rounds, never the standard one, and carries no
//                 price or stock column
// RETIRED, with reasons: the "role row" and "cells" checks (the head_of_medical role's role_permissions equal
// to a jobs.ts fixture) compared a copy of one role's cards with the database; which cards a role holds is data
// Lutan is rebuilding, and set_role_cards deriving cells from cards is check-card-grants' job. The management /
// volunteer / doctor principals were roles, not cards, and their expectations moved with the roles.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const HOM_CARDS = ["administer_medication", "record_weight", "add_medical_photos", "feed_special_diets"];
const lit = (id) => `'${id}'::uuid`;
const P = ["hom", "admin", "viewer", "norole"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), R2 = randomUUID(), OWN = randomUUID(), NSD = randomUUID(), NSDD = randomUUID();

// Principals are CARD holdings, never roles (restated 2026-10-29): "hom" holds exactly the four cards of
// the Head of Medical's jobs, "viewer" exactly view_residents, "norole" nothing; Admin sits outside the cards.
const NONE = { hom: 0, admin: 0, viewer: 0, norole: 0 };
const STAFF_UP = { ...NONE, admin: 1 }; // Admin only
const HOM_UP = { ...STAFF_UP, hom: 1 };
const HOM_UP_DOCTOR = HOM_UP;
const NOT_DOCTOR = HOM_UP;

const probes = [
  // 1. weight
  ["read weight", `select 1 from weight where resident_id = '${R}'`, HOM_UP_DOCTOR],
  ["insert weight", `insert into weight (resident_id, date, weight_kg) values ('${R}', current_date - 500, 5)`, HOM_UP_DOCTOR],
  ["correct a weight", `update weight set weight_kg = 6 where resident_id = '${R}'`, HOM_UP_DOCTOR],
  ["who and where picker", `select 1 from resident_who_and_where where id = '${R}'`, { ...STAFF_UP, hom: 1, viewer: 1 } /* 0192: Admin and Management read it too; doctor and no role still get none */],
  // 2. photos
  ["file a Medical photo", `select 1 from record_attachment('resident', '${R}', 'f-med', 'a.jpg', 'Medical', current_date, null)`, HOM_UP_DOCTOR],
  ["file a ' medical ' photo (case and spaces)", `select 1 from record_attachment('resident', '${R}', 'f-med2', 'a.jpg', ' medical ', current_date, null)`, HOM_UP_DOCTOR],
  ["file a photo in another folder", `select 1 from record_attachment('resident', '${R}', 'f-oth', 'a.jpg', 'Cats at play', current_date, null)`, STAFF_UP /* 0152: a doctor files to Medical only, in the database now */],
  ["file a photo with no folder", `select 1 from record_attachment('resident', '${R}', 'f-nof', 'a.jpg', null, current_date, null)`, STAFF_UP],
  ["file an adopter's photo", `select 1 from record_attachment('resident', '${R}', 'f-ado', 'a.jpg', '20260101', current_date, '${randomUUID()}')`, "hom-zero"],
  ["file a procedure file", `select 1 from record_attachment('procedure', '${randomUUID()}', 'f-proc', 'a.jpg', 'Medical', current_date, null)`, "hom-zero"],
  ["photo resident view", `select 1 from medical_photo_residents where id = '${R}'`, NOT_DOCTOR],
  ["folder column on the photo view", `select drive_folder_id, is_deceased, resident_code from medical_photo_residents limit 1`, "ok-hom"],
  ["breed column on the photo view", `select breed from medical_photo_residents limit 1`, "error"],
  ["set the folder", `select set_resident_drive_folder('${R}', 'folder-x')`, NOT_DOCTOR],
  // 3. diets
  ["special diet list", `select 1 from special_diet_list where resident_id = '${R}'`, NOT_DOCTOR],
  ["the amount is the size default", `select 1 from special_diet_list where resident_id = '${R}' and daily_quantity = 7 and diet_unit = 'g' and meals_per_day = 2 and round_keys = array['morning','evening']`, NOT_DOCTOR],
  ["the amount is the resident's own (portion_factor 2)", `select 1 from special_diet_list where resident_id = '${R2}' and daily_quantity = 14`, NOT_DOCTOR],
  ["the standard diet is not listed", `select 1 from special_diet_list where resident_id = '${R2}' and diet_type_id <> '${NSD}'`, NONE],
  ["an ended diet is not listed", `select 1 from special_diet_list where resident_id = '${R2}' and daily_quantity = 3.5`, NONE],
  ["price column on the diet list", `select cost_per_unit from special_diet_list limit 1`, "error"],
  ["stock column on the diet list", `select stock_on_hand from special_diet_list limit 1`, "error"],
  ["breed column on the diet list", `select breed from special_diet_list limit 1`, "error"],
  ["read resident_diets", `select 1 from resident_diets where resident_id = '${R}'`, HOM_UP_DOCTOR],
  ["write resident_diets", `update resident_diets set notes = 'probe' where resident_id = '${R}'`, STAFF_UP],
  // the floor
  ["residents", `select 1 from residents where id = '${R}'`, { ...STAFF_UP, viewer: 1 } /* the view_residents card reads residents */],
  ["medication", `select 1 from medication limit 1`, STAFF_UP],
  ["diet_types", `select 1 from diet_types limit 1`, STAFF_UP],
  // RETIRED 2026-10-29: "attachments returns the photo cards' holder nothing". Attachment rows follow the photo cards (0276/0279), so a holder of add_medical_photos reads them.
  ["procedures", `select 1 from procedures where resident_id = '${R}'`, "hom-zero"],
  ["visit write", `insert into clinic_visits (resident_id, clinic_id, appointment_date, status) values ('${R}', '${OWN}', now(), 'scheduled')`, "hom-zero"],
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
declare v_std uuid; v_std_ing uuid; v_role uuid;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-mj-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id)
    select ${lit(ID.admin)}, id from roles where key = 'admin';
  -- throwaway roles holding exactly some cards (as dev-signin.mjs --cards builds them); set_role_cards needs Admin
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(ID.admin)}, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  insert into roles (key, name, kind, home_path) values ('harness_mj_hom', 'Harness medical-jobs cards', 'custom', '/home') returning id into v_role;
  perform set_role_cards(v_role, array[${HOM_CARDS.map((c) => `'${c}'`).join(",")}]);
  insert into user_roles (user_id, role_id) values (${lit(ID.hom)}, v_role);
  insert into roles (key, name, kind, home_path) values ('harness_mj_viewer', 'Harness view residents', 'custom', '/home') returning id into v_role;
  perform set_role_cards(v_role, array['view_residents']);
  insert into user_roles (user_id, role_id) values (${lit(ID.viewer)}, v_role);
  insert into clinics (id, name) values (${lit(OWN)}, 'Harness own');
  insert into residents (id, name, species, size) values (${lit(R)}, 'Harness resident', 'Dog', 'Medium');
  insert into residents (id, name, species, size, drive_folder_id) values (${lit(R2)}, 'Harness resident two', 'Cat', 'Medium', 'keep-me');
  insert into clinic_visits (resident_id, clinic_id, appointment_date, status) values (${lit(R)}, ${lit(OWN)}, now() - interval '3 days', 'completed');
  insert into weight (resident_id, date, weight_kg) values (${lit(R)}, current_date - 1, 5);
  -- a diet is a recipe (0239/0250): one ingredient, 5 g per serving, 1 / 1.4 / 1.8 servings for Small / Medium / Large
  select id into v_std from diets where is_standard;
  if v_std is null then
    insert into diet_types (name, unit) values ('Harness standard ingredient', 'g') returning id into v_std_ing;
    insert into diets (name, is_standard) values ('Harness standard', true) returning id into v_std;
    insert into diet_ingredients (diet_id, diet_type_id, qty_per_serving) values (v_std, v_std_ing, 1);
  end if;
  insert into diet_types (id, name, unit, cost_per_unit, stock_on_hand)
    values (${lit(NSD)}, 'Harness kidney diet', 'g', 9, 100);
  insert into diets (id, name, servings_small, servings_medium, servings_large)
    values (${lit(NSDD)}, 'Harness kidney recipe', 1, 1.4, 1.8);
  insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_per_serving) values (${lit(NSDD)}, ${lit(NSD)}, 'g', 5);
  -- both residents are Medium: R gets 5 x 1.4 = 7 at two meals; R2 has portion_factor 2 (14), an ended diet at 0.5 (3.5) and the standard diet
  insert into resident_diets (resident_id, diet_id, start_date, meals_per_day) values (${lit(R)}, ${lit(NSDD)}, current_date - 2, 2);
  insert into resident_diets (resident_id, diet_id, start_date, portion_factor) values (${lit(R2)}, ${lit(NSDD)}, current_date - 2, 2);
  insert into resident_diets (resident_id, diet_id, start_date, end_date, portion_factor) values (${lit(R2)}, ${lit(NSDD)}, current_date - 20, current_date - 10, 0.5);
  insert into resident_diets (resident_id, diet_id, start_date, portion_factor) values (${lit(R2)}, v_std, current_date - 2, 2);
end $setup$;

do $run$ begin
${lines.join("\n")}
  perform pg_temp.effect('hom', ${lit(ID.hom)}, 'folder filled', $c$select set_resident_drive_folder('${R}', 'new-folder')$c$, $c$select drive_folder_id from residents where id = '${R}'$c$);
  perform pg_temp.effect('hom', ${lit(ID.hom)}, 'folder kept', $c$select set_resident_drive_folder('${R2}', 'hijack')$c$, $c$select drive_folder_id from residents where id = '${R2}'$c$);
  perform pg_temp.effect('viewer', ${lit(ID.viewer)}, 'folder by viewer', $c$select set_resident_drive_folder('${R}', 'vol-folder')$c$, $c$select coalesce(drive_folder_id, 'NONE') from residents where id = '${R}'$c$);
  perform pg_temp.effect('hom', ${lit(ID.hom)}, 'profile photo set', $c$select 1 from record_attachment('resident', '${R}', 'f-prof', 'a.jpg', 'Medical', current_date, null)$c$, $c$select coalesce(profile_photo_drive_file_id, 'NONE') from residents where id = '${R}'$c$);
  perform pg_temp.effect('hom', ${lit(ID.hom)}, 'attachment row', $c$select 1 from record_attachment('resident', '${R}', 'f-row', 'a.jpg', 'Medical', current_date, null)$c$, $c$select uploaded_by::text from attachments where drive_file_id = 'f-row'$c$);
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
eq("a login holding only view_residents cannot set a folder", valueOf("viewer", "folder by viewer"), "NONE");
// 0267: record_attachment() never makes a Medical photo the profile photo (restated from "becomes the profile photo")
eq("a Medical photo filed by the add_medical_photos card does NOT become the profile photo", valueOf("hom", "profile photo set"), "NONE");
eq("an attachment she files is stamped with her id", valueOf("hom", "attachment row")?.length, 36);


console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (weight, medical photos and special diets work for exactly the four job cards)");
process.exitCode = fails ? 1 : 0;
