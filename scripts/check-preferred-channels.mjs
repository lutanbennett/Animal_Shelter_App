// Rollback harness for 0111_site_content_preferred_channels.sql against DEV only.
// One transaction: assertions against the real site_content row, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
// The migration is re-run inside the transaction to prove it is re-runnable.
//
//   node scripts/check-preferred-channels.mjs     (from the repo root; dev only)
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

const migration = readFileSync(join(root, "supabase/migrations/0111_site_content_preferred_channels.sql"), "utf8");

const sql = `
begin;
${migration}

do $h$
declare
  v_n int; v_rows int; v_val text[]; v_rejected boolean;
begin
  -- A. still the singleton, and its row reads {line}: today's behaviour
  select count(*) into v_rows from site_content;
  if v_rows <> 1 then raise exception 'FAIL A site_content has % rows, expected 1', v_rows; end if;
  select preferred_channels into v_val from site_content;
  if v_val is distinct from array['line']::text[] then raise exception 'FAIL A existing row reads %', v_val; end if;

  -- B. shape: one NOT NULL text[] column, exactly one check after two runs
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'site_content' and column_name = 'preferred_channels'
     and is_nullable = 'NO' and data_type = 'ARRAY';
  if v_n <> 1 then raise exception 'FAIL B column shape wrong'; end if;
  select count(*) into v_n from pg_constraint
   where conrelid = 'public.site_content'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%preferred_channels%';
  if v_n <> 1 then raise exception 'FAIL B % checks on preferred_channels, expected 1', v_n; end if;

  -- C. an ordered list of every channel round-trips in order
  update site_content set preferred_channels = array['whatsapp','messenger','instagram','line','phone','email'];
  select preferred_channels into v_val from site_content;
  if v_val is distinct from array['whatsapp','messenger','instagram','line','phone','email']::text[] then
    raise exception 'FAIL C order lost: %', v_val;
  end if;

  -- D. an unknown channel, wrong case, and more than six entries are refused
  v_rejected := false;
  begin update site_content set preferred_channels = array['line','facebook'];
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL D unknown channel accepted'; end if;
  v_rejected := false;
  begin update site_content set preferred_channels = array['LINE'];
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL D upper-case channel accepted'; end if;
  v_rejected := false;
  begin update site_content set preferred_channels = array['line','line','line','line','line','line','line'];
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL D seven entries accepted'; end if;

  -- E. NULL is refused, empty is allowed
  v_rejected := false;
  begin update site_content set preferred_channels = null;
  exception when not_null_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL E NULL accepted'; end if;
  update site_content set preferred_channels = '{}';

  -- F. the public site reads it with the anon key
  update site_content set preferred_channels = array['messenger'];
  set local role anon;
  select preferred_channels into v_val from site_content;
  reset role;
  if v_val is distinct from array['messenger']::text[] then raise exception 'FAIL F anon read %', v_val; end if;

  raise exception 'HARNESS-OK singleton reads {line} | NOT NULL text[], 1 check after two runs | full ordered list round-trips | unknown / upper-case / 7 entries refused | NULL refused, empty allowed | anon reads it';
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
