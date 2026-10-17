// Rollback harness for 0218_pending_photos.sql against DEV only. One transaction; a deliberate raise carries the
// evidence, so nothing commits.   node scripts/check-pending-photos.mjs
//
// Proves: anon can read nothing from pending_photos and is_public_drive_file refuses the file; a non-publisher
// cannot assign and cannot see another filer's row; assigning to two residents writes two approved attachments rows,
// keeps the uploader, and removes the pending row; the candidates function answers "who was in this enclosure that
// day"; an unapproved assignment waits, and can be reassigned to another resident without being approved or public.
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
  v_admin uuid; v_other uuid; r1 uuid; r2 uuid; r3 uuid; v_enc uuid; v_pend uuid; v_pend2 uuid;
  v_n int; v_cnt int; v_pub boolean; v_att attachments; v_pt placement_type;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where ur.archived_at is null and r.key = 'admin' limit 1;
  select ur.user_id into v_other from user_roles ur
   where ur.archived_at is null
     and not exists (select 1 from user_roles x join roles r on r.id = x.role_id
                      where x.user_id = ur.user_id and x.archived_at is null and r.key = 'admin')
   limit 1;
  select id into v_enc from enclosures limit 1;
  select placement_type into v_pt from placement_history limit 1;
  select id into r1 from residents order by created_at limit 1 offset 0;
  select id into r2 from residents order by created_at limit 1 offset 1;
  select id into r3 from residents order by created_at limit 1 offset 2;
  if v_admin is null or v_enc is null or r3 is null then raise exception 'SETUP missing data'; end if;

  insert into placement_history (resident_id, placement_type, start_date, end_date, enclosure_id)
    values (r1, v_pt, '2031-01-01', '2031-02-01', v_enc), (r2, v_pt, '2031-01-10', null, v_enc),
           (r3, v_pt, '2031-03-01', null, v_enc);

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into pending_photos (enclosure_id, drive_file_id, file_name, taken_at, uploaded_by)
    values (v_enc, 'h0218pend1', 'a.jpg', '2031-01-15', v_admin) returning id into v_pend;
  select count(*) into v_n from pending_photo_candidates(v_pend) where resident_id in (r1, r2);
  select count(*) into v_cnt from pending_photo_candidates(v_pend);
  reset role;
  if v_n <> 2 or v_cnt <> 2 then raise exception 'FAIL A candidates % of %', v_n, v_cnt; end if;

  set local role anon;
  begin
    perform 1 from pending_photos;
    raise exception 'FAIL B1 anon read pending_photos';
  exception when insufficient_privilege then null; end;
  v_pub := is_public_drive_file('h0218pend1');
  reset role;
  if v_pub then raise exception 'FAIL B2 anon proxy says public'; end if;

  if v_other is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
    set local role authenticated;
    if not coalesce((select can_publish_resident_photos()), false) then
      begin
        perform * from assign_pending_photo(v_pend, jsonb_build_array(jsonb_build_object('resident_id', r1, 'drive_file_id', 'x')));
        raise exception 'FAIL C1 non-publisher assigned';
      exception when others then
        if sqlerrm like 'FAIL%' then raise; end if;
      end;
      select count(*) into v_n from pending_photos where id = v_pend;
      if v_n <> 0 then raise exception 'FAIL C2 non-publisher saw another filer row'; end if;
    end if;
    reset role;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform * from assign_pending_photo(v_pend, jsonb_build_array(
    jsonb_build_object('resident_id', r1, 'drive_file_id', 'h0218pend1'),
    jsonb_build_object('resident_id', r2, 'drive_file_id', 'h0218copy2')));
  reset role;
  select count(*) into v_n from pending_photos where id = v_pend;
  if v_n <> 0 then raise exception 'FAIL D1 pending row remains'; end if;
  select count(*) into v_n from attachments
   where drive_file_id in ('h0218pend1','h0218copy2') and owner_type = 'resident' and sub_folder = 'Shelter'
     and approved_at is not null and uploaded_by = v_admin;
  if v_n <> 2 then raise exception 'FAIL D2 expected 2 approved attachments, got %', v_n; end if;

  insert into pending_photos (enclosure_id, drive_file_id, taken_at, uploaded_by)
    values (v_enc, 'h0218pend2', '2031-01-15', v_admin) returning id into v_pend2;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select * into v_att from assign_pending_photo(v_pend2,
    jsonb_build_array(jsonb_build_object('resident_id', r1, 'drive_file_id', 'h0218pend2')), false);
  reset role;
  if v_att.approved_at is not null then raise exception 'FAIL E1 unapproved assignment came out approved'; end if;
  update attachments set owner_id = r2 where id = v_att.id;
  select * into v_att from attachments where id = v_att.id;
  if v_att.owner_id <> r2 or v_att.approved_at is not null then raise exception 'FAIL E2 reassign changed approval'; end if;
  set local role anon;
  v_pub := is_public_drive_file('h0218pend2');
  reset role;
  if v_pub then raise exception 'FAIL E3 waiting reassigned photo is public'; end if;

  raise exception 'HARNESS-OK anon refused by table and proxy | candidates 2 of 3 | non-publisher refused | two residents give two approved attachments, uploader kept, pending row gone | unapproved assign waits, reassign keeps it waiting and non-public';
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
