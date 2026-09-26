// Rollback harness for 0097_adoption_updates.sql against DEV only. One
// transaction: the migration twice (re-runnable), a throwaway resident and
// adopter, updates and tagged photos through record_attachment() as each
// role, the photo→update guarantees — then a deliberate `raise exception`
// carrying the evidence, so nothing can commit.
//
//   node scripts/check-adoption-updates.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0097_adoption_updates.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

create temp table who (who text primary key, uid uuid);
insert into who values
  ('management', gen_random_uuid()), ('staff', gen_random_uuid()),
  ('volunteer', gen_random_uuid()), ('vet', gen_random_uuid());
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0097-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from who;
insert into user_roles (user_id, role) select uid, who::app_role from who;
grant select on who to authenticated, anon;

do $$
declare
  v_res uuid;
  v_other_res uuid;
  v_adopter uuid;
  v_update uuid;
  v_other_update uuid;
  v_att uuid;
  v_profile boolean;
  v_n integer;
  v_err text;
  v_report text := '';
  r record;
begin
  select count(*) into v_n from attachments where adoption_update_id is not null;
  if v_n <> 0 then raise exception 'A0 existing attachments came out tagged: %', v_n; end if;
  if (select count(*) from pg_proc where proname = 'record_attachment') <> 1 then
    raise exception 'A0 record_attachment has more than one overload';
  end if;

  insert into residents (name) values ('harness-0097 Lucky') returning id into v_res;
  insert into residents (name) values ('harness-0097 Other') returning id into v_other_res;
  insert into contacts (name, type) values ('harness-0097 adopter', 'Carer') returning id into v_adopter;
  v_report := v_report || ' | A0 no existing photo tagged, one record_attachment';

  -- A1 staff writes an update; created_by is the caller whatever is sent.
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'staff'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into adoption_updates (resident_id, received_on, sender_contact_id, channel, note, created_by)
    values (v_res, '2026-09-20', v_adopter, 'line', 'Settling in well', gen_random_uuid())
    returning id into v_update;
  insert into adoption_updates (resident_id, received_on, channel)
    values (v_other_res, '2026-09-21', 'visit') returning id into v_other_update;
  foreach v_err in array array['sms', 'LINE', ''] loop
    begin
      insert into adoption_updates (resident_id, received_on, channel) values (v_res, '2026-09-22', v_err);
      reset role;
      raise exception 'A1 channel % accepted', quote_literal(v_err);
    exception when check_violation then null;
    end;
  end loop;
  reset role;
  if (select created_by from adoption_updates where id = v_update) is distinct from (select uid from who where who = 'staff') then
    raise exception 'A1 created_by not stamped from the caller';
  end if;
  v_report := v_report || ' | A1 staff writes, created_by forced to caller, channel sms / LINE / empty refused';

  -- A2 a volunteer reads updates and cannot write one, but tags a photo to one.
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'volunteer'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from adoption_updates where resident_id in (v_res, v_other_res);
  begin
    insert into adoption_updates (resident_id, received_on, channel) values (v_res, '2026-09-22', 'email');
    reset role;
    raise exception 'A2 volunteer wrote an update';
  exception when insufficient_privilege then null;
  end;
  select (x.attachment).id, x.is_profile into v_att, v_profile
    from record_attachment(p_owner_type => 'resident', p_owner_id => v_res, p_drive_file_id => 'harness-0097-a',
                           p_file_name => 'a.jpg', p_sub_folder => 'Adoption', p_date_taken => '2026-09-20',
                           p_adoption_update_id => v_update) x;
  reset role;
  if v_n <> 2 then raise exception 'A2 volunteer reads % updates', v_n; end if;
  select a.adoption_update_id, a.owner_id, u.channel, u.received_on, u.sender_contact_id into r
    from attachments a join adoption_updates u on u.id = a.adoption_update_id where a.id = v_att;
  if r.adoption_update_id is distinct from v_update or r.channel <> 'line' or r.sender_contact_id is distinct from v_adopter or not v_profile then
    raise exception 'A2 tagged photo wrong: %', row_to_json(r);
  end if;
  v_report := v_report || ' | A2 volunteer reads, cannot write an update, tags a photo; photo reaches sender, date, channel in one join; first photo still becomes profile';

  -- A3 the existing six-argument call shape (the live route) still works, untagged.
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'staff'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select (x.attachment).id into v_att
    from record_attachment(p_owner_type => 'resident', p_owner_id => v_res, p_drive_file_id => 'harness-0097-b',
                           p_file_name => 'b.jpg', p_sub_folder => 'Shelter', p_date_taken => '2026-09-01') x;
  -- A4 refusals through the function.
  begin
    perform record_attachment(p_owner_type => 'resident', p_owner_id => v_res, p_drive_file_id => 'harness-0097-c',
                              p_adoption_update_id => v_other_update);
    reset role;
    raise exception 'A4 tagged with another resident''s update';
  exception when raise_exception then
    if sqlerrm not like 'That adoption update is not about this resident.%' then raise; end if;
  end;
  begin
    perform record_attachment(p_owner_type => 'project', p_owner_id => v_res, p_drive_file_id => 'harness-0097-d',
                              p_adoption_update_id => v_update);
    reset role;
    raise exception 'A4 tagged a project attachment';
  exception when raise_exception then
    if sqlerrm not like 'That adoption update is not about this resident.%' then raise; end if;
  end;
  reset role;
  if (select adoption_update_id from attachments where id = v_att) is not null then
    raise exception 'A3 six-argument call came out tagged';
  end if;
  v_report := v_report || ' | A3 six named arguments still resolve, untagged | A4 function refuses another resident''s update and a non-resident owner';

  -- A5 the table refuses the same even without the function.
  begin
    update attachments set adoption_update_id = v_other_update where id = v_att;
    raise exception 'A5 FK let a photo point at another resident''s update';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into attachments (owner_type, owner_id, drive_file_id, adoption_update_id)
      values ('project', v_res, 'harness-0097-e', v_update);
    raise exception 'A5 project attachment tagged';
  exception when check_violation or foreign_key_violation then null;
  end;
  v_report := v_report || ' | A5 composite FK and check hold for direct writes';

  -- A6 an update with photos cannot be deleted; untagged, it can.
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'management'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    delete from adoption_updates where id = v_update;
    reset role;
    raise exception 'A6 update with photos was deleted';
  exception when foreign_key_violation then null;
  end;
  update adoption_updates set note = 'edited by management' where id = v_update;
  get diagnostics v_n = row_count;
  reset role;
  if v_n <> 1 then raise exception 'A6 management could not edit'; end if;
  update attachments set adoption_update_id = null where adoption_update_id = v_update;
  delete from adoption_updates where id = v_update;
  v_report := v_report || ' | A6 delete refused while photos point at it, allowed once untagged; management edits';

  -- A7 vet reads, anon refused.
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'vet'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from adoption_updates where id = v_other_update;
  if v_n <> 1 then reset role; raise exception 'A7 vet cannot read an update'; end if;
  update adoption_updates set note = 'vet' where id = v_other_update;
  get diagnostics v_n = row_count;
  reset role;
  if v_n <> 0 then raise exception 'A7 vet edited an update'; end if;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin
    perform 1 from adoption_updates;
    reset role;
    raise exception 'A7 anon read adoption_updates';
  exception when insufficient_privilege then null;
  end;
  begin
    perform record_attachment(p_owner_type => 'resident', p_owner_id => v_res, p_drive_file_id => 'x');
    reset role;
    raise exception 'A7 anon called record_attachment';
  exception when insufficient_privilege then null;
  end;
  reset role;
  v_report := v_report || ' | A7 vet reads but cannot edit, anon refused on table and function';

  raise exception 'HARNESS-OK 0097 twice%', v_report;
end $$;
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
