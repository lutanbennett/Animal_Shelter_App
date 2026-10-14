// Rollback harness for 0195_security_schema_fold.sql against DEV only. One transaction, then a deliberate
// `raise exception` carrying the evidence, so nothing commits.
//
//   node scripts/check-security-schema-fold.mjs     (from the repo root; dev only)
//
//   F2  per role: who reads site_content / site_pages / site_content_photos (website.content or reports.cashflow
//       holders only); anon still reads the public_site_* views
//   F4  nine tables carry the audit trigger; an update on each table that has rows writes one audit row with a
//       row_id; app.actor names the actor when auth.uid() is null; a garbage app.actor is ignored, not raised
//   W1  maintenance_bills.bill_date defaults to shelter_today(); the round-status views still answer
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
  r record; t text; n int; ev text := ''; a uuid := gen_random_uuid(); cnt_before int; cnt_after int; last record;
begin
  -- F2: each role's view of the three tables
  for r in select ro.key, (select ur.user_id from user_roles ur where ur.role_id = ro.id and ur.archived_at is null limit 1) uid
             from roles ro where ro.archived_at is null loop
    continue when r.uid is null;
    perform set_config('request.jwt.claims', json_build_object('sub', r.uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
    select count(*) into n from site_content;
    ev := ev || r.key || '=' || n || '/' || (select count(*) from site_pages) || '/' || (select count(*) from site_content_photos) || ' ';
    reset role;
    perform set_config('request.jwt.claims', '', true);
  end loop;
  ev := 'F2 (site_content/pages/photos rows per role) ' || ev;
  set local role anon;
  select count(*) into n from public_site_content; ev := ev || '| anon public_site_content=' || n;
  select count(*) into n from public_site_pages; ev := ev || ' public_site_pages=' || n;
  begin perform 1 from site_content; ev := ev || ' | anon base table: ' || (select count(*) from site_content) || ' rows'; exception when others then ev := ev || ' | anon base table refused'; end;
  reset role;

  -- F4: trigger present and writes a row, per table
  for t in select unnest(array['placement_history','user_roles','maintenance','maintenance_bills','bills_inbox','stock_receipts','blood_tests','procedures','resident_diets']) loop
    if not exists (select 1 from pg_trigger where tgname = 'audit_' || t and not tgisinternal) then
      raise exception 'FAIL F4 no audit trigger on %', t;
    end if;
    execute format('select count(*) from %I', t) into n;
    if n = 0 then ev := ev || ' | ' || t || ': trigger present, no rows to touch'; continue; end if;
    select count(*) into cnt_before from audit_log where table_name = t;
    if t = 'user_roles' then update user_roles set created_at = created_at + interval '1 second' where user_id = (select user_id from user_roles limit 1);
    elsif t = 'placement_history' then update placement_history set notes = coalesce(notes,'') || '.' where id = (select id from placement_history limit 1);
    elsif t = 'maintenance' then update maintenance set title = title || '.' where id = (select id from maintenance limit 1);
    elsif t = 'maintenance_bills' then update maintenance_bills set amount = amount + 1 where id = (select id from maintenance_bills limit 1);
    elsif t = 'bills_inbox' then update bills_inbox set created_at = created_at + interval '1 second' where id = (select id from bills_inbox limit 1);
    elsif t = 'stock_receipts' then update stock_receipts set note = coalesce(note,'') || '.' where id = (select id from stock_receipts limit 1);
    elsif t = 'blood_tests' then update blood_tests set date = date + 1 where id = (select id from blood_tests limit 1);
    elsif t = 'procedures' then update procedures set date = date + 1 where id = (select id from procedures limit 1);
    elsif t = 'resident_diets' then update resident_diets set start_date = start_date + 1 where id = (select id from resident_diets limit 1);
    end if;
    select count(*) into cnt_after from audit_log where table_name = t;
    if cnt_after <> cnt_before + 1 then raise exception 'FAIL F4 % wrote % audit rows, wanted 1', t, cnt_after - cnt_before; end if;
    ev := ev || ' | ' || t || ': update audited';
  end loop;

  -- F4: app.actor fallback, and garbage ignored
  perform set_config('app.actor', a::text, true);
  update maintenance set title = title || '.' where id = (select id from maintenance limit 1);
  select * into last from audit_log where table_name = 'maintenance' order by at desc, id desc limit 1;
  if last.actor is distinct from a then raise exception 'FAIL F4 app.actor not used (got %)', last.actor; end if;
  perform set_config('app.actor', 'not-a-uuid', true);
  update maintenance set title = title || '.' where id = (select id from maintenance limit 1);
  select * into last from audit_log where table_name = 'maintenance' order by at desc, id desc limit 1;
  if last.actor is not null then raise exception 'FAIL F4 garbage app.actor produced an actor'; end if;
  ev := ev || ' | app.actor named, garbage ignored';

  -- W1
  if (select pg_get_expr(adbin, adrelid) from pg_attrdef where adrelid = 'maintenance_bills'::regclass
        and adnum = (select attnum from pg_attribute where attrelid = 'maintenance_bills'::regclass and attname = 'bill_date')) not like '%shelter_today%'
  then raise exception 'FAIL W1 bill_date default'; end if;
  perform count(*) from prescription_round_status; perform count(*) from resident_diet_round_status;
  ev := ev || ' | W1 default shelter_today(), views answer';

  raise exception 'HARNESS-OK %', ev;
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
