// Per-card check of the resident photo table (attachments, owner_type = 'resident').
//
// Asks: does a login holding EXACTLY ONE photo card, and nothing else, get exactly the table access that
// card applies? And is a login holding no cards refused? Never per role: a role is a transient grouping
// of cards (CLAUDE.md, "All analysis is by CARD"). Admin sits outside the card system and is not asked.
// Replaces the retired per-role check-perm-convert-photos (docs/decisions/2026-10-29-harness-restate-permission-checks.md).
//
// Against the DEV database, live schema, one transaction that is always rolled back (nothing commits).
// For each card it builds a disposable login (set_role_cards, as check-role-write-policies does) and
// tries, under that login's own JWT, the five things the policies decide:
//
//   read a Medical-folder photo        asks photos.resident_medical (read)   0276
//   read any other resident photo      asks resident.record (read)           0264
//   insert a Medical-folder photo      asks photos.resident_add + photos.medical_add     0278 / insert_perm
//   insert a Shelter-folder photo      asks photos.resident_add + photos.resident_publish  insert_perm + folder guard
//   delete a resident photo            asks photos.resident_manage
//
// The expectation is read from the cells the card actually left on the login (role_permissions), so the
// check proves each policy answers to the activity named above, whatever a card grants this week. On top
// of that, the Medical READ is pinned (MEDICAL_READ below): Lutan ruled it twice (2026-10-27, 2026-10-28),
// so a card gaining or losing it must be a decision, not drift.
//
// MODELLING CAVEAT: reachability is not a property of a card alone (a tile, a group doorway, or another
// card in the set can open a page). This asks the TABLE, with exactly one card. Where an action needs two
// cards together (insert needs photos.resident_add AND photos.medical_add or photos.resident_publish),
// a card that holds only one of them is REPORTED as "needs another card", not hidden.
//
//   node scripts/check-photo-cards.mjs     (from the repo root; dev only; database only, no dev server needed)
//
// Exits 0 when every assertion held.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// Every card that holds a photo or resident-record cell today, plus one that holds none of them.
const CARDS = ["view_residents", "residents", "add_photos", "add_medical_photos", "approve_photos", "view_medical", "medical_records", "none"];
// The cards that may read the Medical folder (0276 + 0279). Anything else reading it, or any of these not, fails.
const MEDICAL_READ = ["view_medical", "medical_records", "add_medical_photos"];

const sql = `
begin;

create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
    get diagnostics v = row_count;
  exception
    when insufficient_privilege then v := -1;
    when others then v := -2;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $h$
declare
  v_res uuid := gen_random_uuid();
  v_who text;
  v_uid uuid;
  v_role uuid;
  n bigint;
  v_med_row uuid := gen_random_uuid();
  v_oth_row uuid := gen_random_uuid();
  v_del_row uuid;
  c_read_med boolean; c_read_oth boolean; c_ins_med boolean; c_ins_sh boolean; c_del boolean;
  g_med_read boolean; g_res_add boolean; g_med_add boolean; g_pub boolean; g_manage boolean; g_rec boolean;
  v_report text := '';
  v_notes text := '';
  v_med_readers text[] := ${JSON.stringify(MEDICAL_READ).replace(/^\[/, "array[").replace(/\]$/, "]").replace(/"/g, "'")};
begin
  insert into residents (id, name, species) values (v_res, 'Harness photo cards', 'Dog');
  insert into attachments (id, owner_type, owner_id, drive_file_id, sub_folder) values
    (v_med_row, 'resident', v_res, 'hpcMedical', 'Medical'),
    (v_oth_row, 'resident', v_res, 'hpcOther', 'Shelter');

  foreach v_who in array array[${CARDS.map((c) => `'${c}'`).join(",")}] loop
    v_uid := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-photocard-' || v_who || '-' || v_uid || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || v_who), now(), now());
    insert into roles (key, name, kind, home_path) values ('harness_cards_' || replace(v_uid::text, '-', ''), 'Harness ' || v_who, 'custom', '/home')
      returning id into v_role;
    if v_who <> 'none' then perform set_role_cards(v_role, array[v_who]); end if;
    insert into user_roles (user_id, role_id) values (v_uid, v_role);

    -- what this one card left on the login
    select coalesce(bool_or(activity = 'photos.resident_medical' and level >= 1), false),
           coalesce(bool_or(activity = 'photos.resident_add' and level >= 2), false),
           coalesce(bool_or(activity = 'photos.medical_add' and level >= 2), false),
           coalesce(bool_or(activity = 'photos.resident_publish' and level >= 2), false),
           coalesce(bool_or(activity = 'photos.resident_manage' and level >= 2), false),
           coalesce(bool_or(activity = 'resident.record' and level >= 1), false)
      into g_med_read, g_res_add, g_med_add, g_pub, g_manage, g_rec
      from role_permissions where role_id = v_role;

    -- pinned: exactly the named cards read Medical photos
    if g_med_read <> (v_who = any(v_med_readers)) then
      raise exception 'HARNESS-FAIL: card % applies photos.resident_medical=% but the ruling says %', v_who, g_med_read, (v_who = any(v_med_readers));
    end if;

    c_read_med := pg_temp.try(v_uid, format('select 1 from attachments where id = %L', v_med_row)) > 0;
    c_read_oth := pg_temp.try(v_uid, format('select 1 from attachments where id = %L', v_oth_row)) > 0;
    c_ins_med  := pg_temp.try(v_uid, format('insert into attachments (owner_type, owner_id, drive_file_id, sub_folder) values (''resident'', %L, %L, ''Medical'')', v_res, 'hpcIns1' || v_who)) = 1;
    c_ins_sh   := pg_temp.try(v_uid, format('insert into attachments (owner_type, owner_id, drive_file_id, sub_folder) values (''resident'', %L, %L, ''Shelter'')', v_res, 'hpcIns2' || v_who)) = 1;
    v_del_row := gen_random_uuid();
    insert into attachments (id, owner_type, owner_id, drive_file_id, sub_folder) values (v_del_row, 'resident', v_res, 'hpcDel' || v_who, 'Shelter');
    c_del := pg_temp.try(v_uid, format('delete from attachments where id = %L', v_del_row)) = 1;

    if c_read_med <> g_med_read then raise exception 'HARNESS-FAIL: card % Medical read=% but photos.resident_medical applied=%', v_who, c_read_med, g_med_read; end if;
    if c_read_oth <> g_rec     then raise exception 'HARNESS-FAIL: card % other-folder read=% but resident.record applied=%', v_who, c_read_oth, g_rec; end if;
    if c_ins_med  <> (g_res_add and g_med_add) then raise exception 'HARNESS-FAIL: card % Medical insert=% but resident_add=% medical_add=%', v_who, c_ins_med, g_res_add, g_med_add; end if;
    if c_ins_sh   <> (g_res_add and g_pub)     then raise exception 'HARNESS-FAIL: card % Shelter insert=% but resident_add=% resident_publish=%', v_who, c_ins_sh, g_res_add, g_pub; end if;
    if c_del      <> g_manage  then raise exception 'HARNESS-FAIL: card % delete=% but photos.resident_manage applied=%', v_who, c_del, g_manage; end if;
    if v_who = 'none' and (c_read_med or c_read_oth or c_ins_med or c_ins_sh or c_del) then
      raise exception 'HARNESS-FAIL: a login with no cards got photo-table access';
    end if;

    if g_res_add and not (g_med_add and g_pub) then
      v_notes := v_notes || v_who || ' holds photos.resident_add but needs another card to file (medical_add=' || g_med_add || ', publish=' || g_pub || ') ; ';
    end if;
    v_report := v_report || v_who || ':' || (case when c_read_med then 'M' else '-' end) || (case when c_read_oth then 'R' else '-' end)
      || (case when c_ins_med then 'm' else '-' end) || (case when c_ins_sh then 's' else '-' end) || (case when c_del then 'd' else '-' end) || ' | ';
  end loop;

  raise exception '%', 'HARNESS-OK ' || v_report || E'\\nNEEDS-ANOTHER-CARD ' || coalesce(nullif(v_notes, ''), 'none');
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
let body = text;
try { body = JSON.parse(text); } catch {}
const msg = typeof body === "object" && body?.message ? body.message : String(body);

if (/HARNESS-OK/.test(msg)) {
  const out = msg.replace(/^[\s\S]*?HARNESS-OK /, "");
  const [grid, needs] = out.split("\nNEEDS-ANOTHER-CARD ");
  console.log("card:  M=reads Medical R=reads other folders m=files Medical s=files Shelter d=deletes");
  for (const part of grid.split(" | ").filter(Boolean)) console.log("  " + part.trim());
  const needsText = (needs ?? "none").split("\nCONTEXT")[0].trim();
  console.log(`needs another card: ${needsText}`);
  console.log("\nall photo-table card answers hold");
} else {
  console.error(`FAIL ${msg.split("\n")[0]}`);
  process.exitCode = 1;
}
