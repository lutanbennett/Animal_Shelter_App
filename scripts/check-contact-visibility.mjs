// What a doctor login and a volunteer may read of the shelter's address book,
// asserted against the LIVE schema on DEV. One transaction: fixtures, what each
// role can read, then a deliberate `raise exception` carrying the evidence — so
// nothing can commit.
//
//   node scripts/check-contact-visibility.mjs     (from the repo root; dev only)
//
// It used to replay 0126 (*_narrow_contacts_for_vets_and_volunteers.sql) twice.
// Later files redefined the views it creates (the replay then failed with "cannot
// drop columns from view"), and 0172 renamed vet_contacts to doctor_contacts and
// the vet role to doctor, so it asserts the live schema instead
// (docs/decisions/2026-10-02-replay-or-assert-live.md). The "before the file a
// vet could read a carer's phone" step went with the replay.
//
// It asserts refusals, not renders (backlog DB-5, DB-8):
//   A  a doctor login reads no row of contacts itself, and cannot select phone,
//      email, address, LINE, WhatsApp, Messenger or notes from doctor_contacts
//      (the columns are not there), nor read volunteer_contacts
//   B  a doctor login reads every contact's id, name and type through doctor_contacts
//   C  a volunteer reads no row of contacts itself, and cannot select email,
//      address, LINE, WhatsApp, Messenger, notes or type from
//      volunteer_contacts, nor read doctor_contacts
//   D  a volunteer reads no name or phone through volunteer_contacts either:
//      0134 took the address book from the volunteer (until then it read every
//      name and the real phone, which is what this asserted)
//   E  management and admin still read every column of contacts; staff read no
//      row of it since 0170 (until then they read every column, which is what
//      this asserted; since 0173 a live staff login cannot be made, so a harness
//      custom role carrying the retired Staff role's cells stands in); none of the
//      three gets a row from either narrow view;
//      anon has no privilege on them
//   F  app_users: a doctor login and a volunteer see the logins but every email
//      is null; management and admin still see the emails; display_name
//      is unchanged for all of them
//   G  check_carer_type is security definer, so a volunteer's placement write
//      does not depend on reading contacts
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

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
  ('doctor', gen_random_uuid()), ('volunteer', gen_random_uuid()), ('clerk', gen_random_uuid()),
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
  from harness_ids where who not in ('carer', 'clerk');
  -- clerk: Staff was this login until 0173 retired it; a custom role carrying its cells reaches the same path
  insert into roles (key, name, kind, legacy_role) values ('harness_contacts_clerk', 'Harness clerk', 'custom', 'management');
  insert into role_permissions (role_id, activity, level)
    select (select id from roles where key = 'harness_contacts_clerk'), rp.activity, rp.level
      from role_permissions rp join roles s on s.id = rp.role_id where s.key = 'staff';
  insert into user_roles (user_id, role_id, role)
    select (select id from harness_ids where who = 'clerk'), id, legacy_role from roles where key = 'harness_contacts_clerk';
end $setup$;

do $h$
declare
  v_doc uuid := (select id from harness_ids where who = 'doctor');
  v_vol uuid := (select id from harness_ids where who = 'volunteer');
  v_clerk uuid := (select id from harness_ids where who = 'clerk');
  v_mgmt uuid := (select id from harness_ids where who = 'mgmt');
  v_admin uuid := (select id from harness_ids where who = 'admin');
  v_carer uuid := (select id from harness_ids where who = 'carer');
  v_total bigint := (select count(*) from contacts);
  col text;
  uid uuid;
  n bigint;
  v_emails bigint;
  v_names bigint;
  v_report text := '';
begin
  -- A: a doctor login reads nothing from contacts itself, and has no private column in its view.
  n := pg_temp.try(v_doc, 'select * from contacts');
  if n <> 0 then raise exception 'HARNESS-FAIL A: doctor read % rows of contacts', n; end if;
  foreach col in array array['phone', 'email', 'address', 'line_id', 'whatsapp', 'messenger_id', 'notes'] loop
    n := pg_temp.try(v_doc, format('select %I from contacts', col));
    if n > 0 then raise exception 'HARNESS-FAIL A: doctor read % rows of contacts.%', n, col; end if;
    n := pg_temp.try(v_doc, format('select %I from doctor_contacts', col));
    if n <> -2 then raise exception 'HARNESS-FAIL A: doctor_contacts has a column %, gave %', col, n; end if;
  end loop;
  n := pg_temp.try(v_doc, 'select * from volunteer_contacts');
  if n <> 0 then raise exception 'HARNESS-FAIL A: doctor read % rows of volunteer_contacts', n; end if;
  v_report := v_report || 'A: doctor reads 0 rows of contacts, no phone/email/address/LINE/WhatsApp/Messenger/notes column in doctor_contacts, 0 of volunteer_contacts | ';

  -- B: a doctor login reads id, name and type for every contact.
  n := pg_temp.try(v_doc, 'select id, name, type from doctor_contacts');
  if n <> v_total then raise exception 'HARNESS-FAIL B: doctor read % of % contacts', n, v_total; end if;
  v_report := v_report || format('B: doctor reads id/name/type of %s/%s contacts | ', n, v_total);

  -- C: a volunteer likewise.
  n := pg_temp.try(v_vol, 'select * from contacts');
  if n <> 0 then raise exception 'HARNESS-FAIL C: volunteer read % rows of contacts', n; end if;
  foreach col in array array['email', 'address', 'line_id', 'whatsapp', 'messenger_id', 'notes', 'type'] loop
    n := pg_temp.try(v_vol, format('select %I from contacts', col));
    if n > 0 then raise exception 'HARNESS-FAIL C: volunteer read % rows of contacts.%', n, col; end if;
    n := pg_temp.try(v_vol, format('select %I from volunteer_contacts', col));
    if n <> -2 then raise exception 'HARNESS-FAIL C: volunteer_contacts has a column %, gave %', col, n; end if;
  end loop;
  n := pg_temp.try(v_vol, 'select * from doctor_contacts');
  if n <> 0 then raise exception 'HARNESS-FAIL C: volunteer read % rows of doctor_contacts', n; end if;
  v_report := v_report || 'C: volunteer reads 0 rows of contacts, only id/name/phone are columns of volunteer_contacts, 0 of doctor_contacts | ';

  -- D: since 0134 (Lutan, 2026-10-03) a volunteer loses the names and phones too: no row of volunteer_contacts.
  -- Before 0134 this asserted the opposite (every name, the real phone); a replay of 0126 hid that it had gone stale.
  n := pg_temp.try(v_vol, 'select name, phone from volunteer_contacts');
  if n > 0 then raise exception 'HARNESS-FAIL D: volunteer read % of % contacts through volunteer_contacts (0134 took them away)', n, v_total; end if;
  v_report := v_report || format('D: volunteer reads no name/phone through volunteer_contacts (0134; gave %s) | ', n);

  -- E: management and admin keep everything; since 0170 staff (here the clerk carrying Staff cells, 0173) read no row of the table (they name a contact
  -- through picker_contacts); the narrow views are empty for all three; anon is refused.
  foreach uid in array array[v_clerk, v_mgmt, v_admin] loop
    n := pg_temp.try(uid, 'select phone, email, address, line_id, whatsapp, messenger_id, notes from contacts');
    if uid = v_clerk and n > 0 then raise exception 'HARNESS-FAIL E: clerk (Staff cells) read % rows of contacts (0170 took them away)', n; end if;
    if uid <> v_clerk and n <> v_total then raise exception 'HARNESS-FAIL E: % read % of % contacts', uid, n, v_total; end if;
    n := pg_temp.try(uid, 'select * from doctor_contacts');
    if n <> 0 then raise exception 'HARNESS-FAIL E: % read % rows of doctor_contacts', uid, n; end if;
    n := pg_temp.try(uid, 'select * from volunteer_contacts');
    if n <> 0 then raise exception 'HARNESS-FAIL E: % read % rows of volunteer_contacts', uid, n; end if;
  end loop;
  n := pg_temp.try(null, 'select * from doctor_contacts');
  if n <> -1 then raise exception 'HARNESS-FAIL E: anon doctor_contacts gave %', n; end if;
  n := pg_temp.try(null, 'select * from volunteer_contacts');
  if n <> -1 then raise exception 'HARNESS-FAIL E: anon volunteer_contacts gave %', n; end if;
  v_report := v_report || 'E: management/admin read all columns, clerk (Staff cells) 0 rows (0170), all three 0 rows of the narrow views, anon refused | ';

  -- F: app_users emails. (Staff left the email readers when 0173 retired it.)
  foreach uid in array array[v_doc, v_vol] loop
    v_emails := pg_temp.scalar(uid, 'select count(*) filter (where email is not null) from app_users')::bigint;
    v_names := pg_temp.scalar(uid, 'select count(*) filter (where display_name is not null) from app_users')::bigint;
    if v_emails <> 0 then raise exception 'HARNESS-FAIL F: % saw % login emails', uid, v_emails; end if;
    if v_names = 0 then raise exception 'HARNESS-FAIL F: % saw no display names', uid; end if;
  end loop;
  foreach uid in array array[v_mgmt, v_admin] loop
    v_emails := pg_temp.scalar(uid, 'select count(*) filter (where email is not null) from app_users')::bigint;
    if v_emails = 0 then raise exception 'HARNESS-FAIL F: % saw no login emails', uid; end if;
  end loop;
  v_report := v_report || 'F: doctor and volunteer see logins with every email null, display_name intact; management/admin see emails | ';

  -- G: the carer-type trigger does not need the caller to read contacts.
  if not (select prosecdef from pg_proc where proname = 'check_carer_type' and pronamespace = 'public'::regnamespace) then
    raise exception 'HARNESS-FAIL G: check_carer_type is not security definer';
  end if;
  v_report := v_report || 'G: check_carer_type is security definer';

  raise exception '%', format('HARNESS-OK contact visibility, live schema | %s', v_report);
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
