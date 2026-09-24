// Rollback harness for 0080_social_urls.sql against DEV only.
// One transaction: the migration, assertions against the real site_content
// row, then a deliberate `raise exception` carrying the evidence — so nothing
// can commit.
//
//   node scripts/check-social-urls.mjs     (from the repo root; dev only)
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

const migration = readFileSync(join(root, "supabase/migrations/0080_social_urls.sql"), "utf8");

const sql = `
begin;
-- the row as it stood, minus the two new columns, to prove nothing else moved
create temp table harness_before on commit drop as
  select to_jsonb(s) - 'facebook_url' - 'instagram_url' as row from site_content s;

${migration}
-- a second run of the whole file must be harmless
${migration}

do $h$
declare
  v_n int; v_rows int; v_same boolean; v_rejected boolean; v_fb text; v_ig text;
begin
  -- A. still the singleton: one row, both new columns NULL, everything else unchanged
  select count(*) into v_rows from site_content;
  if v_rows <> 1 then raise exception 'FAIL A site_content has % rows, expected 1', v_rows; end if;
  select count(*) into v_n from site_content where facebook_url is not null or instagram_url is not null;
  if v_n <> 0 then raise exception 'FAIL A the new columns were back-filled'; end if;
  select (select row from harness_before) = (to_jsonb(s) - 'facebook_url' - 'instagram_url') into v_same from site_content s;
  if not v_same then raise exception 'FAIL A existing site_content values changed'; end if;

  -- B. shape: two nullable text columns, one check each even after two runs
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'site_content' and is_nullable = 'YES'
     and data_type = 'text' and column_name in ('facebook_url', 'instagram_url');
  if v_n <> 2 then raise exception 'FAIL B % of 2 columns are nullable text', v_n; end if;
  select count(*) into v_n from pg_constraint
   where conrelid = 'public.site_content'::regclass and contype = 'c'
     and (pg_get_constraintdef(oid) like '%facebook_url%' or pg_get_constraintdef(oid) like '%instagram_url%');
  if v_n <> 2 then raise exception 'FAIL B % check constraints on the new columns, expected 2', v_n; end if;

  -- C. what the admin form will save round-trips exactly
  update site_content
     set facebook_url = 'https://www.facebook.com/LannaCareForAnimals/',
         instagram_url = 'https://www.instagram.com/lannacare/';
  select facebook_url, instagram_url into v_fb, v_ig from site_content;
  if v_fb <> 'https://www.facebook.com/LannaCareForAnimals/' or v_ig <> 'https://www.instagram.com/lannacare/' then
    raise exception 'FAIL C urls did not round-trip: % / %', v_fb, v_ig;
  end if;

  -- D. the backstop: a javascript: or schemeless link is refused, on either column
  v_rejected := false;
  begin update site_content set facebook_url = 'javascript:alert(1)';
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL D javascript: facebook_url accepted'; end if;
  v_rejected := false;
  begin update site_content set instagram_url = 'instagram.com/lannacare';
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL D schemeless instagram_url accepted'; end if;

  -- E. clearing back to NULL ("not shown") is allowed
  update site_content set facebook_url = null, instagram_url = null;

  -- F. the public site reads them with the anon key
  update site_content set facebook_url = 'https://fb.com/lannacare';
  set local role anon;
  select facebook_url into v_fb from site_content;
  reset role;
  if v_fb is distinct from 'https://fb.com/lannacare' then raise exception 'FAIL F anon read %', v_fb; end if;

  raise exception 'HARNESS-OK singleton: % row, new columns NULL, other values unchanged | shape: 2 nullable text columns, 2 checks after two runs | https urls round-trip | javascript: and schemeless refused | clear to NULL ok | anon reads facebook_url | file ran twice', v_rows;
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
