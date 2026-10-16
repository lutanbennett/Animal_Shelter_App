// 0210 (appeals, the schema half) exercised on dev without keeping anything: the file is applied inside begin...,
// assertions run under real admin, management and anon sessions, and a final raise rolls it all back.
//
//   node scripts/check-appeals-schema.mjs
//
// Covers: who writes (appeal.run: admin yes, management and anon no), a draft is invisible to anon and cannot be
// marked published, publishing makes it visible, a gift designated to the appeal moves raised_amount while a gift
// designated to the resident does not, the public view carries no donor column, a Medical / non-image / other
// resident's photo is refused and a photo refiled to Medical leaves the public view and the photo proxy, links must
// be https, closing needs an outcome, designation 'appeal' needs an appeal, and the Thai queue picks up the prose.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
const mig = readFileSync(join(root, "supabase/migrations/0210_appeals.sql"), "utf8");
const sql = `
begin;
${mig}
create function pg_temp.q(p_uid uuid, p_expr text, p_pgrole text default 'authenticated') returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims', case when p_uid is null then json_build_object('role', p_pgrole)::text
    else json_build_object('sub', p_uid, 'role', p_pgrole, 'aal', 'aal1')::text end, true);
  execute format('set local role %I', p_pgrole);
  begin execute 'select (' || p_expr || ')::text' into v; exception when others then v := 'ERR:' || sqlstate; end;
  reset role; return v;
end $f$;
create function pg_temp.try(p_uid uuid, p_sql text, p_pgrole text default 'authenticated') returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims', case when p_uid is null then json_build_object('role', p_pgrole)::text
    else json_build_object('sub', p_uid, 'role', p_pgrole, 'aal', 'aal1')::text end, true);
  execute format('set local role %I', p_pgrole);
  begin execute p_sql; get diagnostics v = row_count;
  exception when insufficient_privilege then v := -1; when others then v := -2; end;
  reset role; return v;
end $f$;
create temp table r (n serial, label text, got text, want text);
do $$
declare a uuid; m uuid; res uuid; res2 uuid; ap uuid; photo uuid; med uuid; txt uuid; other uuid; don uuid; don2 uuid;
begin
  select ur.user_id into a from user_roles ur join roles x on x.id = ur.role_id where x.key = 'admin' and ur.archived_at is null limit 1;
  select ur.user_id into m from user_roles ur join roles x on x.id = ur.role_id where x.key = 'management' and ur.archived_at is null limit 1;
  select id into res from residents rr where is_public_visible and not exists (select 1 from private.resident_current_state s where s.resident_id = rr.id and s.current_status = 'Deceased') order by id limit 1;
  select id into res2 from residents where id <> res order by id limit 1;
  insert into r (label, got, want) values ('logins and residents found', (a is not null and m is not null and res is not null and res2 is not null)::text, 'true');

  insert into r (label, got, want) values ('anon cannot read the table', pg_temp.q(null, '(select count(*) from appeals)', 'anon'), 'ERR:42501');
  insert into r (label, got, want) values ('management cannot create',
    pg_temp.try(m, format($q$insert into appeals (resident_id, title, target_amount) values (%L, 'X', 100)$q$, res))::text, '-1');
  insert into r (label, got, want) values ('anon cannot create',
    pg_temp.try(null, format($q$insert into appeals (resident_id, title, target_amount) values (%L, 'X', 100)$q$, res), 'anon')::text, '-1');
  insert into r (label, got, want) values ('admin creates a draft',
    pg_temp.try(a, format($q$insert into appeals (resident_id, title, target_amount, what_is_wrong) values (%L, 'Probe appeal', 15000, 'A lump that needs a biopsy')$q$, res))::text, '1');
  select id into ap from appeals where title = 'Probe appeal';
  insert into r (label, got, want) values ('created_by from session', (select created_by from appeals where id = ap)::text, a::text);
  insert into r (label, got, want) values ('draft invisible to anon', pg_temp.q(null, format($q$(select count(*) from public_appeals where id = %L)$q$, ap), 'anon'), '0');
  insert into r (label, got, want) values ('draft cannot be published',
    pg_temp.try(a, format($q$update appeals set published = true where id = %L$q$, ap))::text, '-2');
  insert into r (label, got, want) values ('zero or negative target refused',
    pg_temp.try(a, format($q$update appeals set target_amount = 0 where id = %L$q$, ap))::text, '-2');
  insert into r (label, got, want) values ('http link refused',
    pg_temp.try(a, format($q$update appeals set social_links = array['http://facebook.com/x'] where id = %L$q$, ap))::text, '-2');
  insert into r (label, got, want) values ('javascript link refused',
    pg_temp.try(a, format($q$update appeals set social_links = array['javascript:alert(1)'] where id = %L$q$, ap))::text, '-2');
  insert into r (label, got, want) values ('https link accepted',
    pg_temp.try(a, format($q$update appeals set social_links = array['https://www.facebook.com/x/posts/1'] where id = %L$q$, ap))::text, '1');
  insert into r (label, got, want) values ('closing needs an outcome',
    pg_temp.try(a, format($q$update appeals set status = 'closed' where id = %L$q$, ap))::text, '-2');

  -- photos
  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name) values ('resident', res, 'Shelter', 'appeal-probe-ok', 'ok.jpg') returning id into photo;
  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name) values ('resident', res, 'Medical', 'appeal-probe-med', 'wound.jpg') returning id into med;
  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name) values ('resident', res, 'Shelter', 'appeal-probe-pdf', 'report.pdf') returning id into txt;
  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name) values ('resident', res2, 'Shelter', 'appeal-probe-other', 'other.jpg') returning id into other;
  insert into r (label, got, want) values ('Medical photo refused', pg_temp.try(a, format($q$insert into appeal_photos (appeal_id, attachment_id) values (%L, %L)$q$, ap, med))::text, '-2');
  insert into r (label, got, want) values ('non-image refused', pg_temp.try(a, format($q$insert into appeal_photos (appeal_id, attachment_id) values (%L, %L)$q$, ap, txt))::text, '-2');
  insert into r (label, got, want) values ('another resident photo refused', pg_temp.try(a, format($q$insert into appeal_photos (appeal_id, attachment_id) values (%L, %L)$q$, ap, other))::text, '-2');
  insert into r (label, got, want) values ('shelter photo accepted as cover', pg_temp.try(a, format($q$insert into appeal_photos (appeal_id, attachment_id, is_cover, is_graphic) values (%L, %L, true, true)$q$, ap, photo))::text, '1');
  insert into r (label, got, want) values ('second cover refused', (pg_temp.try(a, format($q$insert into appeal_photos (appeal_id, attachment_id, is_cover) select %L, id, true from attachments where id = %L$q$, ap, photo)) < 0)::text, 'true');
  insert into r (label, got, want) values ('management cannot attach', pg_temp.try(m, format($q$insert into appeal_photos (appeal_id, attachment_id) values (%L, %L)$q$, ap, photo))::text, '-1');

  -- publish
  update appeals set status = 'live', published = true where id = ap;
  insert into r (label, got, want) values ('published_at stamped', (select (published_at is not null)::text from appeals where id = ap), 'true');
  insert into r (label, got, want) values ('live appeal visible to anon', pg_temp.q(null, format($q$(select count(*) from public_appeals where id = %L)$q$, ap), 'anon'), '1');
  insert into r (label, got, want) values ('raised starts at 0', pg_temp.q(null, format($q$(select raised_amount from public_appeals where id = %L)$q$, ap), 'anon'), '0.00');
  insert into r (label, got, want) values ('cover photo served', pg_temp.q(null, $q$is_public_drive_file('appeal-probe-ok')$q$, 'anon'), 'true');
  insert into r (label, got, want) values ('cover flagged graphic', pg_temp.q(null, format($q$(select cover_is_graphic from public_appeals where id = %L)$q$, ap), 'anon'), 'true');

  -- gifts
  insert into r (label, got, want) values ('appeal designation needs an appeal',
    pg_temp.try(a, $q$insert into donations (received_on, donor_name, method, designation) values (current_date, 'Probe donor', 'cash', 'appeal')$q$)::text, '-2');
  insert into r (label, got, want) values ('appeal id needs the appeal designation',
    pg_temp.try(a, format($q$insert into donations (received_on, donor_name, method, designation, designation_appeal_id) values (current_date, 'Probe donor', 'cash', 'general', %L)$q$, ap))::text, '-2');
  insert into donations (received_on, donor_name, method, designation, designation_appeal_id) values (current_date, 'SECRET DONOR NAME', 'bank_transfer', 'appeal', ap) returning id into don;
  insert into donation_lines (donation_id, position, description, amount) values (don, 0, 'Biopsy', 2500);
  insert into donation_lines (donation_id, position, description, amount) values (don, 1, 'Meds', 500.50);
  insert into donation_lines (donation_id, position, description, amount) values (don, 2, 'In kind bag of food', null);
  insert into donations (received_on, donor_name, method, designation, designation_resident_id) values (current_date, 'Resident donor', 'cash', 'resident', res) returning id into don2;
  insert into donation_lines (donation_id, position, description, amount) values (don2, 0, 'For the dog', 9999);
  insert into r (label, got, want) values ('appeal gifts counted, in-kind adds nothing', pg_temp.q(null, format($q$(select raised_amount from public_appeals where id = %L)$q$, ap), 'anon'), '3000.50');
  insert into r (label, got, want) values ('resident-designated gift not counted', pg_temp.q(null, format($q$(select raised_amount < 9999 from public_appeals where id = %L)$q$, ap), 'anon'), 'true');
  insert into r (label, got, want) values ('raised_as_of set', pg_temp.q(null, format($q$(select (raised_as_of is not null) from public_appeals where id = %L)$q$, ap), 'anon'), 'true');
  insert into r (label, got, want) values ('view has no donor_name', pg_temp.q(null, '(select count(donor_name) from public_appeals)', 'anon'), 'ERR:42703');
  insert into r (label, got, want) values ('anon cannot read donations', pg_temp.q(null, '(select count(*) from donations)', 'anon'), 'ERR:42501');
  insert into r (label, got, want) values ('anon cannot read donation lines', pg_temp.q(null, '(select count(*) from donation_lines)', 'anon'), 'ERR:42501');
  insert into r (label, got, want) values ('over-raising allowed', (select (pg_temp.try(a, format($q$update appeals set target_amount = 100 where id = %L$q$, ap)) = 1)::text), 'true');
  insert into r (label, got, want) values ('raised can exceed target', pg_temp.q(null, format($q$(select raised_amount > target_amount from public_appeals where id = %L)$q$, ap), 'anon'), 'true');
  insert into r (label, got, want) values ('appeal with gifts cannot be deleted', pg_temp.try(a, format($q$delete from appeals where id = %L$q$, ap))::text, '-2');

  -- refile to Medical later: leaves the public site at once
  update attachments set sub_folder = 'Medical' where id = photo;
  insert into r (label, got, want) values ('refiled photo leaves the photo view', pg_temp.q(null, format($q$(select count(*) from public_appeal_photos where appeal_id = %L)$q$, ap), 'anon'), '0');
  insert into r (label, got, want) values ('refiled photo not served', pg_temp.q(null, $q$is_public_drive_file('appeal-probe-ok')$q$, 'anon'), 'false');
  insert into r (label, got, want) values ('refiled photo is no longer the cover', pg_temp.q(null, format($q$(select cover_drive_file_id is null from public_appeals where id = %L)$q$, ap), 'anon'), 'true');

  -- close
  insert into r (label, got, want) values ('close with outcome', pg_temp.try(a, format($q$update appeals set status = 'closed', outcome_note = 'Surgery went well' where id = %L$q$, ap))::text, '1');
  insert into r (label, got, want) values ('closed_at stamped', (select (closed_at is not null)::text from appeals where id = ap), 'true');
  insert into r (label, got, want) values ('closed appeal still public with outcome', pg_temp.q(null, format($q$(select outcome_note from public_appeals where id = %L)$q$, ap), 'anon'), 'Surgery went well');

  -- unpublish and a resident who is not public
  update appeals set published = false where id = ap;
  insert into r (label, got, want) values ('unpublished disappears', pg_temp.q(null, format($q$(select count(*) from public_appeals where id = %L)$q$, ap), 'anon'), '0');
  update appeals set published = true where id = ap;
  update residents set is_public_visible = false where id = res;
  insert into r (label, got, want) values ('non-public resident hides the appeal', pg_temp.q(null, format($q$(select count(*) from public_appeals where id = %L)$q$, ap), 'anon'), '0');

  insert into r (label, got, want) values ('title queued for Thai', (select (count(*) > 0)::text from translations where table_name = 'appeals' and row_id = ap and column_name = 'title'), 'true');
  insert into r (label, got, want) values ('what_is_wrong queued for Thai', (select (count(*) > 0)::text from translations where table_name = 'appeals' and row_id = ap and column_name = 'what_is_wrong'), 'true');
  insert into r (label, got, want) values ('nobody can write the views', (has_table_privilege('anon', 'public_appeals', 'delete') or has_table_privilege('authenticated', 'public_appeals', 'insert') or has_table_privilege('anon', 'public_appeal_photos', 'update'))::text, 'false');
  insert into r (label, got, want) values ('appeal.run: admin only (no role_permissions row)', (select count(*)::text from role_permissions where activity = 'appeal.run'), '0');
end $$;
do $$ begin raise exception 'RESULT%RESULT', (select json_agg(json_build_object('l', label, 'got', got, 'want', want) order by n) from r); end $$;
`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const body = await res.json().catch(() => null);
const msg = body?.message ?? JSON.stringify(body);
const m = msg.match(/RESULT(\[[\s\S]*\])RESULT/);
if (!m) { console.log(res.status, msg.slice(0, 2000)); process.exit(1); }
const rows = JSON.parse(m[1]);
let bad = 0;
for (const x of rows) {
  const ok = x.got === x.want;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${x.l}: got ${x.got}${ok ? "" : ` want ${x.want}`}`);
}
console.log(bad ? `${bad} FAILED` : `all ${rows.length} held (rolled back, nothing kept)`);
process.exitCode = bad ? 1 : 0;