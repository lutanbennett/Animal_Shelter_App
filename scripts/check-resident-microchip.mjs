// Rollback harness for 0113_resident_microchip_number.sql against DEV only.
// One transaction: the migration (twice), assertions against real rows, then
// a deliberate `raise exception` carrying the evidence — nothing can commit.
//
//   node scripts/check-resident-microchip.mjs     (from the repo root; dev only)
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

const migration = readFileSync(join(root, "supabase/migrations/0113_resident_microchip_number.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

do $h$
declare
  v_a uuid; v_b uuid; v_dead uuid;
  v_rows int; v_set int; v_n int;
  v_rejected boolean;
begin
  -- A. existing rows: none back-filled
  select count(*), count(*) filter (where microchip_number is not null or microchip_implanted_on is not null)
    into v_rows, v_set from residents;
  if v_set <> 0 then raise exception 'FAIL A % existing rows were back-filled', v_set; end if;

  -- B. shape: text and date, both nullable
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'residents' and is_nullable = 'YES'
     and ((column_name = 'microchip_number' and data_type = 'text')
       or (column_name = 'microchip_implanted_on' and data_type = 'date'));
  if v_n <> 2 then raise exception 'FAIL B % of 2 columns have the expected type and nullability', v_n; end if;

  -- C. many residents with no chip do not collide
  insert into residents (name) values ('harness 0113 a'), ('harness 0113 b');
  select id into v_a from residents where name = 'harness 0113 a';
  select id into v_b from residents where name = 'harness 0113 b';

  -- D. the check: exactly 15 digits, nothing else
  update residents set microchip_number = '985112345678901' where id = v_a;
  update residents set microchip_number = null where id = v_a;
  update residents set microchip_number = '000000000000000', microchip_implanted_on = '2026-01-31' where id = v_a;
  select count(*) into v_n from residents where id = v_a
    and microchip_number = '000000000000000' and microchip_implanted_on = date '2026-01-31';
  if v_n <> 1 then raise exception 'FAIL D leading zeros or the date did not round-trip'; end if;
  for v_n in 1..7 loop
    v_rejected := false;
    begin
      update residents set microchip_number = (array[
        '98511234567890',       -- 14 digits
        '9851123456789012',     -- 16 digits
        '985 112 345 678 901',  -- spaces
        '985-112-345-678-901',  -- dashes
        '98511234567890a',      -- a letter
        '123456789',            -- legacy 9-digit, ruled out
        ''                      -- empty string is not null
      ])[v_n] where id = v_b;
    exception when check_violation then v_rejected := true; end;
    if not v_rejected then raise exception 'FAIL D invalid chip variant % accepted', v_n; end if;
  end loop;

  -- E. unique where set: a duplicate is refused, on update and on insert
  v_rejected := false;
  begin update residents set microchip_number = '000000000000000' where id = v_b;
  exception when unique_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL E duplicate chip accepted on update'; end if;
  v_rejected := false;
  begin insert into residents (name, microchip_number) values ('harness 0113 c', '000000000000000');
  exception when unique_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL E duplicate chip accepted on insert'; end if;
  -- ...and clearing the first frees the number
  update residents set microchip_number = null where id = v_a;
  update residents set microchip_number = '000000000000000' where id = v_b;

  -- F. locked on death: a deceased resident's chip cannot be set or changed,
  -- while a bio edit (0052's open columns) still goes through.
  select r.id into v_dead from residents r where resident_is_deceased(r.id) limit 1;
  if v_dead is null then raise exception 'FAIL F setup: no deceased resident in dev'; end if;
  update residents set bio = coalesce(bio, '') where id = v_dead;
  v_rejected := false;
  begin update residents set microchip_number = '111111111111111' where id = v_dead;
  exception when restrict_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL F chip number changed on a deceased resident'; end if;
  v_rejected := false;
  begin update residents set microchip_implanted_on = '2026-01-01' where id = v_dead;
  exception when restrict_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL F implant date changed on a deceased resident'; end if;

  raise exception 'HARNESS-OK existing rows=% back-filled=0 | shape: text + date, nullable | many nulls coexist | check rejects 14 digits, 16 digits, spaces, dashes, a letter, legacy 9-digit and empty string; accepts 15 digits with leading zeros | partial unique rejects a duplicate on update and insert and frees on clear | deceased resident: chip and date locked, bio still editable | file ran twice', v_rows;
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
