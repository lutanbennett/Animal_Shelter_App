// Rollback harness for 0332_pending_photos_enclosure_nullable.sql against DEV only. One transaction; a deliberate
// raise carries the evidence, so nothing commits.   node scripts/check-pending-photos-null-enclosure.mjs
// Proves: a NULL-enclosure row inserts; the filer/approver sees it and a third login does not; anon cannot read it
// and the proxy says it is not public; a non-null row still inserts; the candidates function answers "nobody" (not an
// error) for the NULL row; assigning the NULL row to a resident works. A distinct fake drive id per row.
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
  v_admin uuid; v_other uuid; r1 uuid; v_enc uuid; v_null uuid; v_nn uuid;
  v_n int; v_pub boolean; v_att attachments;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where ur.archived_at is null and r.key = 'admin' limit 1;
  select ur.user_id into v_other from user_roles ur
   where ur.archived_at is null
     and not exists (select 1 from user_roles x join roles r on r.id = x.role_id
                      where x.user_id = ur.user_id and x.archived_at is null and r.key = 'admin')
   limit 1;
  select id into v_enc from enclosures limit 1;
  select id into r1 from residents limit 1;
  if v_admin is null or r1 is null then raise exception 'SETUP missing data admin=% resident=%', v_admin, r1; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into pending_photos (enclosure_id, drive_file_id, file_name, uploaded_by)
    values (null, 'h0332null1', 'n.jpg', v_admin) returning id into v_null;
  if v_enc is not null then
    insert into pending_photos (enclosure_id, drive_file_id, file_name, uploaded_by)
      values (v_enc, 'h0332encl1', 'e.jpg', v_admin) returning id into v_nn;
  end if;
  select count(*) into v_n from pending_photos where id = v_null;
  if v_n <> 1 then raise exception 'FAIL A filer cannot see the NULL row'; end if;
  select count(*) into v_n from pending_photo_candidates(v_null);
  if v_n <> 0 then raise exception 'FAIL B candidates for NULL enclosure returned %', v_n; end if;
  reset role;

  set local role anon;
  begin
    perform 1 from pending_photos;
    raise exception 'FAIL C1 anon read pending_photos';
  exception when insufficient_privilege then null; end;
  v_pub := is_public_drive_file('h0332null1');
  reset role;
  if v_pub then raise exception 'FAIL C2 NULL-enclosure photo public'; end if;

  if v_other is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
    set local role authenticated;
    if not coalesce((select can_approve_photos()), false) then
      select count(*) into v_n from pending_photos where id in (v_null, coalesce(v_nn, v_null));
      if v_n <> 0 then raise exception 'FAIL D third login saw % rows', v_n; end if;
    end if;
    reset role;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select * into v_att from assign_pending_photo(v_null,
    jsonb_build_array(jsonb_build_object('resident_id', r1, 'drive_file_id', 'h0332null1')));
  reset role;
  select count(*) into v_n from pending_photos where id = v_null;
  if v_n <> 0 then raise exception 'FAIL E pending NULL row remains after assign'; end if;
  if v_att.drive_file_id <> 'h0332null1' then raise exception 'FAIL E2 attachment not written'; end if;

  raise exception 'HARNESS-OK NULL enclosure inserts | non-null still inserts | filer sees it | anon refused, not public | third login blind | candidates empty not error | assign works';
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
