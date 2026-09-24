// Rollback harness for 0079_public_enclosures.sql against DEV only.
// One transaction: the migration, assertions against real rows, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-public-enclosures.mjs     (from the repo root; dev only)
//
// The point of 0079 is what a visitor who scans a kennel's QR code cannot
// see, so the view is read with `set local role anon`, as the website reads
// it: capacity and notes, the Lifecycle pseudo-enclosures, and anyone who
// has died, been adopted, gone to hospital or moved out must all be
// invisible, and each resident must be exactly their public_resident_cards
// row — no field more, no field less.
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0079_public_enclosures.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

-- What anon sees of one enclosure / one resident card, as json (null when not visible).
create function pg_temp.anon_enclosure(p_id uuid) returns jsonb language plpgsql as $f$
declare v jsonb;
begin
  set local role anon;
  select to_jsonb(p) into v from public_enclosures p where p.id = p_id;
  reset role;
  return v;
end $f$;
create function pg_temp.anon_card(p_id uuid) returns jsonb language plpgsql as $f$
declare v jsonb;
begin
  set local role anon;
  select to_jsonb(c) into v from public_resident_cards c where c.id = p_id;
  reset role;
  return v;
end $f$;
-- Every resident id anon can find on any enclosure page.
create function pg_temp.anon_listed() returns uuid[] language plpgsql as $f$
declare v uuid[];
begin
  set local role anon;
  select coalesce(array_agg((r ->> 'id')::uuid), '{}') into v
    from public_enclosures p, jsonb_array_elements(p.residents) r;
  reset role;
  return v;
end $f$;

do $h$
declare
  v_zone uuid; v_e1 uuid; v_e2 uuid; v_e3 uuid;
  v_life_zone uuid; v_hosp uuid; v_dead uuid; v_adopted uuid;
  r_a uuid; r_b uuid; r_c uuid; r_d uuid; r_e uuid;
  v_row jsonb; v_n int; v_m int; v_listed uuid[]; v_rejected boolean;
begin
  select id into v_life_zone from zones where name = 'Lifecycle';
  select id into v_hosp from enclosures where zone_id = v_life_zone and name = 'Hospital';
  select id into v_dead from enclosures where zone_id = v_life_zone and name = 'Deceased';
  select id into v_adopted from enclosures where zone_id = v_life_zone and name = 'Adopted';
  if v_hosp is null or v_dead is null or v_adopted is null then raise exception 'FAIL setup Lifecycle rows missing'; end if;

  insert into zones (name, name_th, internal) values ('Harness 0079 Zone', 'โซนทดสอบ', true) returning id into v_zone;
  insert into enclosures (name, name_th, zone_id, capacity, notes)
    values ('Harness 0079 Kennel', 'กรงทดสอบ', v_zone, 7, 'harness 0079 staff-only note') returning id into v_e1;
  insert into enclosures (name, zone_id, capacity) values ('Harness 0079 Run', v_zone, 3) returning id into v_e2;
  insert into enclosures (name, zone_id) values ('Harness 0079 Empty', v_zone) returning id into v_e3;

  -- A lives in e1. B died, C is in hospital, D was adopted — all from e1. E moved e1 → e2.
  insert into residents (name, species, bio) values ('Harness 0079 Alpha', 'Dog', 'public bio') returning id into r_a;
  insert into residents (name, species) values ('Harness 0079 Bravo', 'Dog') returning id into r_b;
  insert into residents (name, species) values ('Harness 0079 Charlie', 'Cat') returning id into r_c;
  insert into residents (name, species) values ('Harness 0079 Delta', 'Dog') returning id into r_d;
  insert into residents (name, species) values ('Harness 0079 Echo', 'Cat') returning id into r_e;
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
  select r, 'Intake', '2026-01-01', v_zone, v_e1 from unnest(array[r_a, r_b, r_c, r_d, r_e]) r;
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id, cause_of_death)
    values (r_b, 'Deceased', '2026-02-01', v_life_zone, v_dead, v_e1, 'harness 0079');
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (r_c, 'SendToHospital', '2026-02-01', v_life_zone, v_hosp, v_e1);
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
    values (r_d, 'Adopt', '2026-02-01', v_life_zone, v_adopted);
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
    values (r_e, 'ChangeEnclosure', '2026-02-01', v_zone, v_e2);

  -- A. the view's columns are exactly these; nothing staff-only is a column at all
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'public_enclosures';
  select count(*) into v_m from information_schema.columns
   where table_schema = 'public' and table_name = 'public_enclosures'
     and column_name in ('id', 'name', 'name_th', 'zone_name', 'zone_name_th', 'residents');
  if v_n <> 6 or v_m <> 6 then raise exception 'FAIL A view has % columns, % of the expected 6', v_n, v_m; end if;

  -- B. e1 as anon: names and zone, only Alpha, and no capacity / note anywhere in the row
  v_row := pg_temp.anon_enclosure(v_e1);
  if v_row is null then raise exception 'FAIL B enclosure not visible to anon'; end if;
  if v_row ->> 'name' <> 'Harness 0079 Kennel' or v_row ->> 'name_th' <> 'กรงทดสอบ'
     or v_row ->> 'zone_name' <> 'Harness 0079 Zone' or v_row ->> 'zone_name_th' <> 'โซนทดสอบ'
    then raise exception 'FAIL B names wrong: %', v_row - 'residents'; end if;
  if jsonb_array_length(v_row -> 'residents') <> 1 or v_row -> 'residents' -> 0 ->> 'id' <> r_a::text
    then raise exception 'FAIL B e1 should list only Alpha: %', v_row -> 'residents'; end if;
  if v_row::text like '%staff-only note%' or v_row ? 'capacity' or v_row ? 'notes'
    then raise exception 'FAIL B staff-only field reached anon: %', v_row; end if;

  -- C. the embedded card is exactly the resident's public_resident_cards row, as anon reads it
  if v_row -> 'residents' -> 0 <> pg_temp.anon_card(r_a)
    then raise exception 'FAIL C embedded card differs from public_resident_cards: % vs %',
      v_row -> 'residents' -> 0, pg_temp.anon_card(r_a); end if;

  -- D. the one who moved is on e2 only; an empty enclosure is listed with []
  v_row := pg_temp.anon_enclosure(v_e2);
  if jsonb_array_length(v_row -> 'residents') <> 1 or v_row -> 'residents' -> 0 ->> 'id' <> r_e::text
    then raise exception 'FAIL D e2 should list only Echo: %', v_row -> 'residents'; end if;
  v_row := pg_temp.anon_enclosure(v_e3);
  if v_row is null or v_row -> 'residents' <> '[]'::jsonb
    then raise exception 'FAIL D empty enclosure should be visible with []: %', v_row; end if;

  -- E. no Lifecycle enclosure is visible; the dead, hospitalised and adopted are on no page
  select count(*) into v_n from enclosures where zone_id = v_life_zone and pg_temp.anon_enclosure(id) is not null;
  if v_n <> 0 then raise exception 'FAIL E % Lifecycle enclosures visible to anon', v_n; end if;
  v_listed := pg_temp.anon_listed();
  if v_listed && array[r_b, r_c, r_d] then raise exception 'FAIL E a deceased / hospitalised / adopted resident is listed'; end if;

  -- F. real dev rows: every physical enclosure has one row, and every resident
  --    currently in one is listed exactly once, on that enclosure
  select count(*) into v_n from enclosures e join zones z on z.id = e.zone_id where z.name <> 'Lifecycle';
  set local role anon; select count(*) into v_m from public_enclosures; reset role;
  if v_n <> v_m then raise exception 'FAIL F % physical enclosures, % view rows', v_n, v_m; end if;
  select count(*) into v_n from resident_current_state s
    join enclosures e on e.id = s.current_enclosure_id join zones z on z.id = e.zone_id
   where z.name <> 'Lifecycle';
  if v_n <> cardinality(v_listed) then raise exception 'FAIL F % residents in physical enclosures, % listed', v_n, cardinality(v_listed); end if;
  select count(distinct x) into v_m from unnest(v_listed) x;
  if v_m <> cardinality(v_listed) then raise exception 'FAIL F a resident is listed twice'; end if;
  select count(*) into v_n from resident_current_state s
   where s.resident_id = any(v_listed) and s.current_status not in ('Resident', 'Outreach');
  if v_n <> 0 then raise exception 'FAIL F % listed residents are not Resident/Outreach', v_n; end if;

  -- G. anon cannot write through the view
  v_rejected := false;
  begin
    set local role anon;
    update public_enclosures set name = 'x' where id = v_e1;
    reset role;
  -- 42501 no privilege, or 55000 not updatable (a join view): either way refused
  exception when insufficient_privilege or object_not_in_prerequisite_state then v_rejected := true; reset role; end;
  if not v_rejected then raise exception 'FAIL G anon can update through the view'; end if;
  v_rejected := false;
  begin
    set local role anon;
    delete from public_enclosures where id = v_e1;
    reset role;
  exception when insufficient_privilege or object_not_in_prerequisite_state then v_rejected := true; reset role; end;
  if not v_rejected then raise exception 'FAIL G anon can delete through the view'; end if;

  raise exception 'HARNESS-OK exactly 6 columns | anon: names + zone, only the current resident, no capacity/notes | embedded card = public_resident_cards row | mover on new enclosure only, empty enclosure listed with [] | no Lifecycle enclosure; deceased/hospital/adopted on no page | real rows: % physical enclosures, % residents each listed once, all Resident/Outreach | anon update/delete refused | file ran twice',
    (select count(*) from enclosures e join zones z on z.id = e.zone_id where z.name <> 'Lifecycle'), cardinality(v_listed);
end;
$h$;
rollback;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
