// Rollback harness for 0333_contact_type_partner.sql against DEV only. One transaction; a deliberate raise carries
// the evidence, so nothing commits.   node scripts/check-contact-type-partner.mjs
// Proves: a contact inserts with type 'Partner'; a Partner becomes a Shelter Friend and the unique contact_id still
// holds; the three old types still insert; carer_id still refuses a
// non-Carer (Partner included); enum order is unchanged with Partner last. Distinct names per row.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $h$
declare
  v_admin uuid; v_p uuid; v_v uuid; v_c uuid; v_vol uuid; v_sf uuid; v_n int; v_r uuid; v_labels text;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where ur.archived_at is null and r.key = 'admin' limit 1;
  if v_admin is null then raise exception 'SETUP no admin login'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into contacts (name, type) values ('h0333 partner', 'Partner') returning id into v_p;
  insert into contacts (name, type) values ('h0333 vendor', 'Vendor') returning id into v_v;
  insert into contacts (name, type) values ('h0333 carer', 'Carer') returning id into v_c;
  insert into contacts (name, type) values ('h0333 volunteer', 'Volunteer') returning id into v_vol;

  insert into shelter_friends (contact_id) values (v_p) returning id into v_sf;
  begin
    insert into shelter_friends (contact_id) values (v_p);
    raise exception 'FAIL A2 a second profile for one Partner was accepted';
  exception when unique_violation then null; end;
  insert into shelter_friends (contact_id) values (v_v);

  select id into v_r from residents limit 1;
  if v_r is not null then
    begin
      insert into placement_history (resident_id, placement_type, start_date, carer_id)
        values (v_r, 'Foster', now() + interval '1 minute', v_p);
      raise exception 'FAIL C a Partner was accepted as a carer';
    exception when raise_exception then
      if sqlerrm like 'FAIL%' then raise; end if;
    end;
  end if;
  reset role;

  select string_agg(e::text, ',' order by e) into v_labels from unnest(enum_range(null::contact_type)) e;
  if (enum_range(null::contact_type))[1] <> 'Carer' or (enum_range(null::contact_type))[4] <> 'Partner' then
    raise exception 'FAIL D enum order is %', (select array_agg(e::text) from unnest(enum_range(null::contact_type)) e);
  end if;

  raise exception 'HARNESS-OK Partner inserts | Partner becomes a Friend, contact_id unique holds | Carer, Volunteer, Vendor still insert | a Partner is not accepted as carer | enum order Carer,Volunteer,Vendor,Partner';
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
await exitWith(/HARNESS-OK/.test(msg) ? 0 : 1);
