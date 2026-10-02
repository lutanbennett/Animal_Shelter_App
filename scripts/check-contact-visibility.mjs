// Rollback harness for *_narrow_contacts_for_vets_and_volunteers.sql against
// DEV only. One transaction: what a vet's own JWT can read before the file,
// the file (twice), then what each role can read afterwards, then a
// deliberate `raise exception` carrying the evidence — so nothing can
// commit. Safe to run before or after the file is applied.
//
//   node scripts/check-contact-visibility.mjs     (from the repo root; dev only)
//
// It asserts refusals, not renders (backlog DB-5, DB-8):
//   0  before the file a vet CAN read a carer's phone — so the later refusals
//      are the file's doing, not the harness failing to reach RLS (skipped,
//      and said so, once applied)
//   A  a vet reads no row of contacts itself, and cannot select phone, email,
//      address, LINE, WhatsApp, Messenger or notes from vet_contacts (the
//      columns are not there), nor read volunteer_contacts
//   B  a vet reads every contact's id, name and type through vet_contacts
//   C  a volunteer reads no row of contacts itself, and cannot select email,
//      address, LINE, WhatsApp, Messenger, notes or type from
//      volunteer_contacts, nor read vet_contacts
//   D  a volunteer reads every contact's name and phone through
//      volunteer_contacts, and the phone is the real one
//   E  staff, management and admin still read every column of contacts and
//      get no rows from either narrow view; anon has no privilege on them
//   F  app_users: a vet and a volunteer see the logins but every email is
//      null; staff, management and admin still see the emails; display_name
//      is unchanged for all of them
//   G  check_carer_type is security definer, so a volunteer's placement write
//      does not depend on reading contacts
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^\d+_narrow_contacts_for_vets_and_volunteers\.sql$/.test(f));
if (!file) throw new Error("no *_narrow_contacts_for_vets_and_volunteers.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;

-- Run one statement as a login (null = anon). Returns the row count, -1 if
-- refused for privilege, -2 if a column does not exist.
create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    set local role anon;
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
  end if;
  begin
    execute p_sql;
    get diagnostics v = row_count;
  exception
    when insufficient_privilege then v := -1;
    when undefined_column then v := -2;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

-- Read one scalar as a login: the first column of the first row.
create function pg_temp.scalar(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  execute p_sql into v;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values
  ('vet', gen_random_uuid()), ('volunteer', gen_random_uuid()), ('staff', gen_random_uuid()),
  ('mgmt', gen_random_uuid()), ('admin', gen_random_uuid()), ('carer', gen_random_uuid());
grant select on harness_ids to authenticated, service_role;

do $setup$
declare r record;
begin
  insert into contacts (id, name, type, phone, email, line_id)
  select id, 'Harness carer', 'Carer', '081-000-0000', 'harness-carer@example.invalid', 'harness-line'
  from harness_ids where who = 'carer';
  for r in select * from harness_ids where who <> 'carer' loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-contacts-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role)
  select id, case who when 'mgmt' then 'management' else who end::app_role
  from harness_ids where who <> 'carer';
end $setup$;

create temp table harness_before (applied_already boolean, vet_phone bigint);
grant all on harness_before to authenticated, service_role;
insert into harness_before
select not exists (select 1 from pg_policies where tablename = 'contacts' and policyname = 'vet_read_contacts'),
       pg_temp.try((select id from harness_ids where who = 'vet'),
         format('select phone from contacts where id = %L', (select id from harness_ids where who = 'carer')));

${migration}
${migration}

do $h$
declare
  v_vet uuid := (select id from harness_ids where who = 'vet');
  v_vol uuid := (select id from harness_ids where who = 'volunteer');
  v_staff uuid := (select id from harness_ids where who = 'staff');
  v_mgmt uuid := (select id from harness_ids where who = 'mgmt');
  v_admin uuid := (select id from harness_ids where who = 'admin');
  v_carer uuid := (select id from harness_ids where who = 'carer');
  v_total bigint := (select count(*) from contacts);
  v_applied boolean := (select applied_already from harness_before);
  v_before bigint := (select vet_phone from harness_before);
  col text;
  uid uuid;
  n bigint;
  v_emails bigint;
  v_names bigint;
  v_report text := '';
begin
  -- 0: the hole was real, and the harness reaches RLS.
  if v_applied then
    v_report := v_report || '0: skipped, file already applied on dev | ';
  elsif v_before <> 1 then
    raise exception 'HARNESS-FAIL 0: before the file a vet read the carer phone as % rows, expected 1', v_before;
  else
    v_report := v_report || '0: before the file a vet read a carer phone (1 row) | ';
  end if;

  -- A: a vet reads nothing from contacts itself, and has no private column in its view.
  n := pg_temp.try(v_vet, 'select * from contacts');
  if n <> 0 then raise exception 'HARNESS-FAIL A: vet read % rows of contacts', n; end if;
  foreach col in array array['phone', 'email', 'address', 'line_id', 'whatsapp', 'messenger_id', 'notes'] loop
    n := pg_temp.try(v_vet, format('select %I from contacts', col));
    if n > 0 then raise exception 'HARNESS-FAIL A: vet read % rows of contacts.%', n, col; end if;
    n := pg_temp.try(v_vet, format('select %I from vet_contacts', col));
    if n <> -2 then raise exception 'HARNESS-FAIL A: vet_contacts has a column %, gave %', col, n; end if;
  end loop;
  n := pg_temp.try(v_vet, 'select * from volunteer_contacts');
  if n <> 0 then raise exception 'HARNESS-FAIL A: vet read % rows of volunteer_contacts', n; end if;
  v_report := v_report || 'A: vet reads 0 rows of contacts, no phone/email/address/LINE/WhatsApp/Messenger/notes column in vet_contacts, 0 of volunteer_contacts | ';

  -- B: a vet reads id, name and type for every contact.
  n := pg_temp.try(v_vet, 'select id, name, type from vet_contacts');
  if n <> v_total then raise exception 'HARNESS-FAIL B: vet read % of % contacts', n, v_total; end if;
  v_report := v_report || format('B: vet reads id/name/type of %s/%s contacts | ', n, v_total);

  -- C: a volunteer likewise.
  n := pg_temp.try(v_vol, 'select * from contacts');
  if n <> 0 then raise exception 'HARNESS-FAIL C: volunteer read % rows of contacts', n; end if;
  foreach col in array array['email', 'address', 'line_id', 'whatsapp', 'messenger_id', 'notes', 'type'] loop
    n := pg_temp.try(v_vol, format('select %I from contacts', col));
    if n > 0 then raise exception 'HARNESS-FAIL C: volunteer read % rows of contacts.%', n, col; end if;
    n := pg_temp.try(v_vol, format('select %I from volunteer_contacts', col));
    if n <> -2 then raise exception 'HARNESS-FAIL C: volunteer_contacts has a column %, gave %', col, n; end if;
  end loop;
  n := pg_temp.try(v_vol, 'select * from vet_contacts');
  if n <> 0 then raise exception 'HARNESS-FAIL C: volunteer read % rows of vet_contacts', n; end if;
  v_report := v_report || 'C: volunteer reads 0 rows of contacts, only id/name/phone in volunteer_contacts, 0 of vet_contacts | ';

  -- D: and the volunteer's phone is the real one.
  n := pg_temp.try(v_vol, 'select name, phone from volunteer_contacts');
  if n <> v_total then raise exception 'HARNESS-FAIL D: volunteer read % of % contacts', n, v_total; end if;
  col := pg_temp.scalar(v_vol, format('select phone from volunteer_contacts where id = %L', v_carer));
  if col is distinct from '081-000-0000' then raise exception 'HARNESS-FAIL D: volunteer saw phone %', col; end if;
  v_report := v_report || format('D: volunteer reads name/phone of %s/%s contacts, phone intact | ', n, v_total);

  -- E: staff and above keep everything; the narrow views are empty for them; anon is refused.
  foreach uid in array array[v_staff, v_mgmt, v_admin] loop
    n := pg_temp.try(uid, 'select phone, email, address, line_id, whatsapp, messenger_id, notes from contacts');
    if n <> v_total then raise exception 'HARNESS-FAIL E: % read % of % contacts', uid, n, v_total; end if;
    n := pg_temp.try(uid, 'select * from vet_contacts');
    if n <> 0 then raise exception 'HARNESS-FAIL E: % read % rows of vet_contacts', uid, n; end if;
    n := pg_temp.try(uid, 'select * from volunteer_contacts');
    if n <> 0 then raise exception 'HARNESS-FAIL E: % read % rows of volunteer_contacts', uid, n; end if;
  end loop;
  n := pg_temp.try(null, 'select * from vet_contacts');
  if n <> -1 then raise exception 'HARNESS-FAIL E: anon vet_contacts gave %', n; end if;
  n := pg_temp.try(null, 'select * from volunteer_contacts');
  if n <> -1 then raise exception 'HARNESS-FAIL E: anon volunteer_contacts gave %', n; end if;
  v_report := v_report || 'E: staff/management/admin read all columns and 0 rows of the narrow views, anon refused | ';

  -- F: app_users emails.
  foreach uid in array array[v_vet, v_vol] loop
    v_emails := pg_temp.scalar(uid, 'select count(*) filter (where email is not null) from app_users')::bigint;
    v_names := pg_temp.scalar(uid, 'select count(*) filter (where display_name is not null) from app_users')::bigint;
    if v_emails <> 0 then raise exception 'HARNESS-FAIL F: % saw % login emails', uid, v_emails; end if;
    if v_names = 0 then raise exception 'HARNESS-FAIL F: % saw no display names', uid; end if;
  end loop;
  foreach uid in array array[v_staff, v_mgmt, v_admin] loop
    v_emails := pg_temp.scalar(uid, 'select count(*) filter (where email is not null) from app_users')::bigint;
    if v_emails = 0 then raise exception 'HARNESS-FAIL F: % saw no login emails', uid; end if;
  end loop;
  v_report := v_report || 'F: vet and volunteer see logins with every email null, display_name intact; staff/management/admin see emails | ';

  -- G: the carer-type trigger does not need the caller to read contacts.
  if not (select prosecdef from pg_proc where proname = 'check_carer_type' and pronamespace = 'public'::regnamespace) then
    raise exception 'HARNESS-FAIL G: check_carer_type is not security definer';
  end if;
  v_report := v_report || 'G: check_carer_type is security definer';

  raise exception '%', format('HARNESS-OK %s ran twice | %s | %s', ${JSON.stringify(file).replace(/"/g, "'")},
    case when v_applied then 'applied on dev' else 'pending on dev' end, v_report);
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
