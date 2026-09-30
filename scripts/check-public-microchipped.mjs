// Rollback harness for 0117_public_is_microchipped.sql against DEV only, plus
// the app-side half of the 0116 contract (src/lib/residents/microchip.ts).
//
//   node scripts/check-public-microchipped.mjs     (from the repo root; dev only)
//
// Database: one transaction — the migration (twice), assertions as anon
// against a real public resident, then a deliberate `raise exception`
// carrying the evidence, so nothing can commit.
//
// App: the SQLSTATE each set_resident_microchip() refusal arrives with maps
// to its own message key, and readMicrochip() strips before the database
// sees the number and always returns both fields (the function overwrites
// the date with whatever it is given, so a missing date must be an explicit
// null, never an absent key). Exits 0 when every assertion held.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const chip = await import(pathToFileURL(join(root, "src/lib/residents/microchip.ts")).href);

let failed = false;
function check(ok, label) {
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}`);
  if (!ok) failed = true;
}

// --- App side ---------------------------------------------------------------
const expected = { "23001": "deceased", "42501": "notInScope", "23514": "invalid", "23505": "duplicate", P0002: "notFound" };
for (const [code, refusal] of Object.entries(expected)) {
  check(chip.microchipRefusal({ code }) === refusal, `SQLSTATE ${code} → ${refusal}`);
}
check(chip.microchipRefusal({ code: "XX000" }) === null, "an unplanned SQLSTATE is not dressed up as a known refusal");

function form(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}
const spaced = chip.readMicrochip(form({ microchipNumber: "985 112-345 678 901", microchipImplantedOn: "" }));
check(
  spaced.microchip_number === "985112345678901" && "microchip_implanted_on" in spaced && spaced.microchip_implanted_on === null,
  "spaces and dashes stripped; a blank date is sent as an explicit null",
);
const cleared = chip.readMicrochip(form({ microchipNumber: "  ", microchipImplantedOn: "2026-09-01" }));
check(cleared.microchip_number === null && cleared.microchip_implanted_on === "2026-09-01", "a blank number clears the chip, the date is still sent");
check("invalid" in chip.readMicrochip(form({ microchipNumber: "98511234567890" })), "14 digits refused before the database");

// --- Database side ----------------------------------------------------------
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const migration = readFileSync(join(root, "supabase/migrations/0117_public_is_microchipped.sql"), "utf8");

const sql = `
begin;
${migration}
${migration}

do $h$
declare
  v_id uuid; v_n int; v_b boolean; v_rejected boolean; v_type text;
begin
  -- A. shape: one new column, boolean, and no public view carries the number
  select data_type into v_type from information_schema.columns
   where table_schema = 'public' and table_name = 'public_resident_profiles' and column_name = 'is_microchipped';
  if v_type is distinct from 'boolean' then raise exception 'FAIL A is_microchipped is %', v_type; end if;
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name like 'public\\_%' and column_name in ('microchip_number', 'microchip_implanted_on');
  if v_n <> 0 then raise exception 'FAIL A % public view column(s) carry the chip', v_n; end if;

  -- B. a resident the public site already shows
  select id into v_id from public_resident_profiles limit 1;
  if v_id is null then raise exception 'FAIL B no public resident on dev to test with'; end if;
  update residents set microchip_number = null, microchip_implanted_on = null where id = v_id;

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select is_microchipped into v_b from public_resident_profiles where id = v_id;
  reset role;
  if v_b is distinct from false then raise exception 'FAIL B no chip reads as %, not false', v_b; end if;

  update residents set microchip_number = '985112345670117', microchip_implanted_on = date '2026-09-30' where id = v_id;
  set local role anon;
  select is_microchipped into v_b from public_resident_profiles where id = v_id;
  -- C. anon still cannot reach the number itself
  v_rejected := false;
  begin perform microchip_number from residents where id = v_id;
  exception when insufficient_privilege then v_rejected := true; end;
  reset role;
  if v_b is distinct from true then raise exception 'FAIL B a chip reads as %, not true', v_b; end if;
  if not v_rejected then raise exception 'FAIL C anon read residents.microchip_number'; end if;

  -- D. adopted and deceased residents stay off the view (the 0101 trap)
  select count(*) into v_n from public_resident_profiles p
    join private.resident_current_state s on s.resident_id = p.id
   where s.current_status in ('Adopted', 'Deceased');
  if v_n <> 0 then raise exception 'FAIL D % adopted/deceased resident(s) on the public view', v_n; end if;

  raise exception 'HARNESS-OK file ran twice | is_microchipped is boolean; no public view column carries the number or date | anon reads false then true for a public resident as a chip is set | anon still refused residents.microchip_number | no adopted or deceased resident on the view';
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
check(/HARNESS-OK/.test(msg), `database: ${msg}`);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = failed ? 1 : 0;
