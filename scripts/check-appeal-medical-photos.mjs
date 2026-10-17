// Rollback harness for 0216_appeal_medical_photos.sql against DEV only.
// One transaction, a deliberate `raise exception` carrying the evidence, so nothing commits.
//
//   node scripts/check-appeal-medical-photos.mjs     (from the repo root; dev only)
//
// The point of 0216 is that a Medical-folder photo is readable by a signed-out visitor ONLY through a medical_ok
// row on a PUBLISHED appeal. So this proves the negatives as hard as the positive: the same photo is refused when
// it is not on an appeal, when the appeal is a draft or unpublished, when the box is unticked, when the resident is
// hidden, and it is refused on every other public view. "Public" is asked the way the photo proxy asks it
// (is_public_drive_file as anon) and by reading the views as anon.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

create function pg_temp.as_anon(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  v := is_public_drive_file(p);
  reset role;
  return v;
end $f$;

-- Does anon see the file on any public resident view?
create function pg_temp.anon_elsewhere(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  select exists (select 1 from public_resident_photos where drive_file_id = p)
      or exists (select 1 from public_resident_cards where profile_photo_drive_file_id = p)
      or exists (select 1 from public_resident_profiles where profile_photo_drive_file_id = p)
      or exists (select 1 from public_recent_adoptions where profile_photo_drive_file_id = p) into v;
  reset role;
  return v;
end $f$;

create function pg_temp.anon_view_has(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  select exists (select 1 from public_appeal_photos where drive_file_id = p)
      or exists (select 1 from public_appeals where cover_drive_file_id = p) into v;
  reset role;
  return v;
end $f$;

do $h$
declare
  r_pub uuid; r_other uuid; v_app uuid; v_ph uuid;
  a_med uuid; a_med2 uuid; a_plain uuid; a_pdf uuid; a_foreign uuid;
  v_ok boolean; v_user uuid; v_n int;
begin
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0216 Public', 'Dog', true, 'R-H216A') returning id into r_pub;
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0216 Other', 'Dog', true, 'R-H216B') returning id into r_other;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder)
    values ('resident', r_pub, 'h0216medOnAppeal', 'wound.jpg', 'Medical') returning id into a_med;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder)
    values ('resident', r_pub, 'h0216medNotOnAppeal', 'scan.jpg', 'Medical') returning id into a_med2;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder)
    values ('resident', r_pub, 'h0216plain', 'happy.jpg', null) returning id into a_plain;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder)
    values ('resident', r_pub, 'h0216medPdf', 'report.pdf', 'Medical') returning id into a_pdf;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder)
    values ('resident', r_other, 'h0216foreignMed', 'x.jpg', 'Medical') returning id into a_foreign;
  insert into appeals (resident_id, title, target_amount, status, published)
    values (r_pub, 'Harness 0216', 1000, 'live', true) returning id into v_app;

  -- A. the guard
  begin
    insert into appeal_photos (appeal_id, attachment_id) values (v_app, a_med);
    raise exception 'FAIL A1 a Medical file attached without medical_ok';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    insert into appeal_photos (appeal_id, attachment_id, medical_ok) values (v_app, a_pdf, true);
    raise exception 'FAIL A2 a non-image attached with medical_ok';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    insert into appeal_photos (appeal_id, attachment_id, medical_ok) values (v_app, a_foreign, true);
    raise exception 'FAIL A3 another resident photo attached with medical_ok';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- B. before it is ticked, nothing Medical is public
  insert into appeal_photos (appeal_id, attachment_id) values (v_app, a_plain);
  if not pg_temp.as_anon('h0216plain') then raise exception 'FAIL B1 the ordinary appeal photo should stay public'; end if;
  if pg_temp.as_anon('h0216medOnAppeal') or pg_temp.as_anon('h0216medNotOnAppeal') then
    raise exception 'FAIL B2 a Medical file is public with no medical_ok row';
  end if;

  -- C. ticked on a published appeal: public through the appeal views and the proxy, and only there
  insert into appeal_photos (appeal_id, attachment_id, medical_ok) values (v_app, a_med, true) returning id into v_ph;
  if not pg_temp.as_anon('h0216medOnAppeal') then raise exception 'FAIL C1 ticked photo not served on a published appeal'; end if;
  if not pg_temp.anon_view_has('h0216medOnAppeal') then raise exception 'FAIL C2 ticked photo missing from public_appeal_photos'; end if;
  set local role anon;
  select is_medical into v_ok from public_appeal_photos where drive_file_id = 'h0216medOnAppeal';
  reset role;
  if v_ok is distinct from true then raise exception 'FAIL C3 is_medical not true'; end if;
  if pg_temp.anon_elsewhere('h0216medOnAppeal') then raise exception 'FAIL C4 ticked photo leaked onto a resident view'; end if;
  if pg_temp.as_anon('h0216medNotOnAppeal') or pg_temp.anon_view_has('h0216medNotOnAppeal') or pg_temp.anon_elsewhere('h0216medNotOnAppeal') then
    raise exception 'FAIL C5 a Medical photo NOT on the appeal became public';
  end if;
  if pg_temp.as_anon('h0216foreignMed') then raise exception 'FAIL C6 foreign Medical photo public'; end if;
  select count(*) into v_n from appeal_photos where id = v_ph and medical_ok_at is not null;
  if v_n <> 1 then raise exception 'FAIL C7 medical_ok_at not stamped'; end if;

  -- D. every way of withdrawing it, immediately
  update appeals set published = false where id = v_app;
  if pg_temp.as_anon('h0216medOnAppeal') or pg_temp.anon_view_has('h0216medOnAppeal') then raise exception 'FAIL D1 still public after unpublish'; end if;
  update appeals set published = true where id = v_app;
  if not pg_temp.as_anon('h0216medOnAppeal') then raise exception 'FAIL D2 not public again on republish'; end if;
  update appeals set status = 'draft', published = false where id = v_app;
  if pg_temp.as_anon('h0216medOnAppeal') then raise exception 'FAIL D3 public while a draft'; end if;
  update appeals set status = 'live', published = true where id = v_app;
  update appeal_photos set medical_ok = false where id = v_ph;
  if pg_temp.as_anon('h0216medOnAppeal') or pg_temp.anon_view_has('h0216medOnAppeal') then raise exception 'FAIL D4 still public after untick'; end if;
  select count(*) into v_n from appeal_photos where id = v_ph and medical_ok_by is null and medical_ok_at is null;
  if v_n <> 1 then raise exception 'FAIL D4b audit stamp not cleared on untick'; end if;
  update appeal_photos set medical_ok = true where id = v_ph;
  update residents set is_public_visible = false where id = r_pub;
  if pg_temp.as_anon('h0216medOnAppeal') then raise exception 'FAIL D5 public after the resident was hidden'; end if;
  update residents set is_public_visible = true where id = r_pub;
  delete from appeal_photos where id = v_ph;
  if pg_temp.as_anon('h0216medOnAppeal') then raise exception 'FAIL D6 public after the row was removed'; end if;

  -- E. who may tick it: a signed-in user without appeal.medical_photo is refused
  select ur.user_id into v_user from user_roles ur
    where ur.archived_at is null
      and not exists (select 1 from user_roles x join roles r on r.id = x.role_id
                       where x.user_id = ur.user_id and x.archived_at is null and r.key = 'admin')
    limit 1;
  if v_user is not null and not exists (select 1 from role_permissions where activity = 'appeal.medical_photo') then
    perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
    begin
      -- the trigger is security definer, so the caller's role does not matter; auth.uid() comes from the claim
      insert into appeal_photos (appeal_id, attachment_id, medical_ok) values (v_app, a_med, true);
      raise exception 'FAIL E1 a user without appeal.medical_photo ticked a medical photo';
    exception when others then
      if sqlerrm like 'FAIL%' then raise; end if;
    end;
  end if;

  raise exception 'HARNESS-OK guard refuses Medical without medical_ok, non-image, foreign resident | unticked Medical not public | ticked Medical public to anon on a published appeal by view and proxy, with is_medical, and nowhere else | Medical not on the appeal refused | unpublish, draft, untick, hidden resident, deleted row each withdraw it at once | audit stamp set and cleared | non-permitted user refused';
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
