// Rollback harness for 0120_contact_map_url_check.sql against DEV only.
// One transaction: the migration (twice), assertions, then a deliberate
// `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-contact-map-url.mjs     (from the repo root; dev only)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0120_contact_map_url_check.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

do $h$
declare
  v_n int; v_rejected boolean; v_u text;
begin
  select count(*) into v_n from pg_constraint
   where conrelid = 'public.site_content'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%contact_map_url%';
  if v_n <> 1 then raise exception 'FAIL A % checks on contact_map_url after two runs, expected 1', v_n; end if;

  update site_content set contact_map_url = 'https://maps.app.goo.gl/abc123';
  select contact_map_url into v_u from site_content;
  if v_u <> 'https://maps.app.goo.gl/abc123' then raise exception 'FAIL B https url did not round-trip'; end if;

  v_rejected := false;
  begin update site_content set contact_map_url = 'javascript:alert(1)';
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL C javascript: url accepted'; end if;
  v_rejected := false;
  begin update site_content set contact_map_url = 'maps.google.com/x';
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL C schemeless url accepted'; end if;

  update site_content set contact_map_url = null;

  raise exception 'HARNESS-OK one check after two runs | https round-trips | javascript: and schemeless refused | NULL ok';
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
