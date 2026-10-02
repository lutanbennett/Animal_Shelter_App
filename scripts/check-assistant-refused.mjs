// Rollback harness for 0130_assistant_action_refused.sql against DEV only.
// Run AFTER the migration is applied (the enum value must be committed).
//
//   node scripts/check-assistant-refused.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing: ends in a `raise`.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $h$
declare
  v_user uuid; v_vals text; v_id uuid; v_status text; v_before int; v_after int;
begin
  -- A. the enum now holds all four values, the original three first
  select string_agg(enumlabel, ',' order by enumsortorder) into v_vals
    from pg_enum where enumtypid = 'assistant_action_status'::regtype;
  if v_vals <> 'confirmed,cancelled,unmatched,refused' then raise exception 'FAIL A enum is %', v_vals; end if;

  -- B. a refusal row inserts and reads back, request text exactly as typed
  select id into v_user from auth.users limit 1;
  select count(*) into v_before from assistant_actions;
  insert into assistant_actions (user_id, request_text, status)
    values (v_user, '  Move Rex to  the VET  ', 'refused') returning id into v_id;
  select status::text into v_status from assistant_actions where id = v_id and request_text = '  Move Rex to  the VET  ';
  if v_status is distinct from 'refused' then raise exception 'FAIL B refused row did not read back'; end if;

  -- C. the three existing values still insert
  insert into assistant_actions (user_id, request_text, status) values
    (v_user, 'x', 'confirmed'), (v_user, 'x', 'cancelled'), (v_user, 'x', 'unmatched');
  select count(*) into v_after from assistant_actions;
  if v_after <> v_before + 4 then raise exception 'FAIL C row count % -> %', v_before, v_after; end if;

  -- D. an unknown value is still rejected
  begin
    insert into assistant_actions (user_id, request_text, status) values (v_user, 'x', 'bogus');
    raise exception 'FAIL D bogus status accepted';
  exception when invalid_text_representation then null; end;

  raise exception 'HARNESS-OK enum = %; refused row inserted and read back verbatim; confirmed/cancelled/unmatched still insert; bogus rejected', v_vals;
end
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
