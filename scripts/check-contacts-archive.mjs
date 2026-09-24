// Rollback harness for 0075_contacts_archive.sql against DEV only.
// One transaction: the migration, assertions against real rows, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-contacts-archive.mjs     (from the repo root; dev only)
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

const migration = readFileSync(join(root, "supabase/migrations/0075_contacts_archive.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

do $h$
declare
  v_contact uuid; v_user uuid; v_n int;
  v_rows int; v_backfilled int; v_carer boolean;
  v_rejected boolean;
begin
  -- A. existing rows: all still there, none back-filled
  select count(*), count(*) filter (where archived_at is not null or archived_by is not null or archive_reason is not null)
    into v_rows, v_backfilled from contacts;
  if v_backfilled <> 0 then raise exception 'FAIL A % existing rows were back-filled', v_backfilled; end if;

  -- B. shape: three nullable columns of the right type; archived_by -> auth.users, on delete set null
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'contacts' and is_nullable = 'YES'
     and ((column_name = 'archived_at' and data_type = 'timestamp with time zone')
       or (column_name = 'archived_by' and data_type = 'uuid')
       or (column_name = 'archive_reason' and data_type = 'text'));
  if v_n <> 3 then raise exception 'FAIL B % of 3 columns have the expected type and nullability', v_n; end if;
  select count(*) into v_n from pg_constraint
   where conrelid = 'public.contacts'::regclass and contype = 'f'
     and confrelid = 'auth.users'::regclass and confdeltype = 'n';
  if v_n <> 1 then raise exception 'FAIL B % on-delete-set-null FKs to auth.users', v_n; end if;

  -- The contact the feature exists for: one with placement history, which
  -- deleteContact refuses. Any contact if dev has none.
  select carer_id into v_contact from placement_history where carer_id is not null limit 1;
  v_carer := v_contact is not null;
  if v_contact is null then select id into v_contact from contacts limit 1; end if;
  select id into v_user from auth.users limit 1;
  if v_contact is null or v_user is null then raise exception 'FAIL setup: no contact or login in dev'; end if;

  -- C. archive round-trips at full precision; who and why are optional
  update contacts set archived_at = '2026-09-24 10:11:12.345678+07', archived_by = v_user, archive_reason = 'moved to Chiang Rai'
   where id = v_contact;
  select count(*) into v_n from contacts
   where id = v_contact and archived_at = '2026-09-24 03:11:12.345678+00'
     and archived_by = v_user and archive_reason = 'moved to Chiang Rai';
  if v_n <> 1 then raise exception 'FAIL C archive did not round-trip'; end if;
  update contacts set archived_by = null, archive_reason = null where id = v_contact;

  -- D. the constraint: who/why cannot outlive archived_at
  update contacts set archive_reason = 'x' where id = v_contact;
  v_rejected := false;
  begin update contacts set archived_at = null where id = v_contact;
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL D restore leaving archive_reason accepted'; end if;

  update contacts set archive_reason = null, archived_by = v_user where id = v_contact;
  v_rejected := false;
  begin update contacts set archived_at = null where id = v_contact;
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL D restore leaving archived_by accepted'; end if;

  v_rejected := false;
  begin insert into contacts (name, type, archive_reason) values ('harness 0075', 'Volunteer', 'x');
  exception when check_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL D live contact with a reason accepted'; end if;

  -- E. a full restore clears cleanly; a new contact is live by default
  update contacts set archived_at = null, archived_by = null, archive_reason = null where id = v_contact;
  insert into contacts (name, type) values ('harness 0075', 'Volunteer');

  raise exception 'HARNESS-OK existing rows=% back-filled=% | shape: 3 nullable columns, archived_by FK on delete set null | archive round-trip (carer with placement history: %), who/why optional | constraint rejects restore leaving reason, restore leaving archived_by, live row with reason | full restore and plain insert ok | file ran twice', v_rows, v_backfilled, v_carer;
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
