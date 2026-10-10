// 0169 (community dogs, the schema half) exercised on dev without keeping anything:
// the file is applied inside begin…, 31 assertions run under real management, 2IC and
// anon sessions, and a final raise rolls it all back. Re-runnable before and after the
// file is applied (the migration is written to be).
//
//   node scripts/check-community-dogs-schema.mjs
//
// Covers: who writes (the community.outings cell, and that giving the 2IC the cell is all
// it takes), the stamps come from the session, the four constraints on an outing, the
// places list's unique live name and no delete, photos private by default and closed to
// anon, and public_impact_figures: an empty baseline is not public, and community_dogs /
// villages_sterilised count outings strictly after the baseline date.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
const mig = readFileSync(join(root, "supabase/migrations/0169_community_dogs.sql"), "utf8");
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
declare m uuid; s uuid; p uuid; o uuid; y date := shelter_date(now()) - 1;
begin
  select ur.user_id into m from user_roles ur join roles x on x.id = ur.role_id where x.key = 'management' and ur.archived_at is null limit 1;
  select ur.user_id into s from user_roles ur join roles x on x.id = ur.role_id where x.key = 'second_in_command' and ur.archived_at is null limit 1;  -- the 2IC: Staff until 0173 retired it
  insert into r (label, got, want) values ('logins found', (m is not null and s is not null)::text, 'true');
  insert into r (label, got, want) values ('mgmt adds place', pg_temp.try(m, $q$insert into community_places (name, kind) values ('Wat Probe', 'temple')$q$)::text, '1');
  insert into r (label, got, want) values ('2IC adds place', pg_temp.try(s, $q$insert into community_places (name, kind) values ('Ban Probe', 'village')$q$)::text, '-1');
  insert into r (label, got, want) values ('anon adds place', pg_temp.try(null, $q$insert into community_places (name, kind) values ('Anon', 'village')$q$, 'anon')::text, '-1');
  insert into r (label, got, want) values ('duplicate live name', pg_temp.try(m, $q$insert into community_places (name, kind) values (' wat probe ', 'temple')$q$)::text, '-2');
  insert into r (label, got, want) values ('bad kind', pg_temp.try(m, $q$insert into community_places (name, kind) values ('X', 'forest')$q$)::text, '-2');
  select id into p from community_places where name = 'Wat Probe';
  insert into r (label, got, want) values ('place created_by stamped', (select created_by from community_places where id = p)::text, m::text);
  insert into r (label, got, want) values ('mgmt outing today', pg_temp.try(m, format($q$insert into community_dog_outings (place_id, dog_count, fed, sterilised, sterilised_count, recorded_by) values (%L, 5, true, true, 2, %L)$q$, p, s))::text, '1');
  insert into r (label, got, want) values ('mgmt outing on baseline day', pg_temp.try(m, format($q$insert into community_dog_outings (outing_on, place_id, dog_count, treated, sterilised, sterilised_count) values (%L, %L, 7, true, true, 3)$q$, y, p))::text, '1');
  insert into r (label, got, want) values ('recorded_by from session, not request', (select recorded_by from community_dog_outings where dog_count = 5)::text, m::text);
  insert into r (label, got, want) values ('outing_on defaults to shelter today', (select outing_on from community_dog_outings where dog_count = 5)::text, shelter_date(now())::text);
  insert into r (label, got, want) values ('no tick', pg_temp.try(m, format($q$insert into community_dog_outings (place_id, dog_count) values (%L, 3)$q$, p))::text, '-2');
  insert into r (label, got, want) values ('sterilised without count', pg_temp.try(m, format($q$insert into community_dog_outings (place_id, dog_count, sterilised) values (%L, 3, true)$q$, p))::text, '-2');
  insert into r (label, got, want) values ('sterilised more than dogs', pg_temp.try(m, format($q$insert into community_dog_outings (place_id, dog_count, sterilised, sterilised_count) values (%L, 3, true, 4)$q$, p))::text, '-2');
  insert into r (label, got, want) values ('count without tick', pg_temp.try(m, format($q$insert into community_dog_outings (place_id, dog_count, fed, sterilised_count) values (%L, 3, true, 1)$q$, p))::text, '-2');
  insert into r (label, got, want) values ('zero dogs', pg_temp.try(m, format($q$insert into community_dog_outings (place_id, dog_count, fed) values (%L, 0, true)$q$, p))::text, '-2');
  insert into r (label, got, want) values ('no place', pg_temp.try(m, $q$insert into community_dog_outings (dog_count, fed) values (2, true)$q$)::text, '-2');
  insert into r (label, got, want) values ('2IC reads outings', pg_temp.q(s, '(select count(*) from community_dog_outings)'), '0');
  insert into r (label, got, want) values ('mgmt reads outings', pg_temp.q(m, '(select count(*) from community_dog_outings)'), '2');
  insert into r (label, got, want) values ('anon reads outings', pg_temp.q(null, '(select count(*) from community_dog_outings)', 'anon'), 'ERR:42501');
  insert into r (label, got, want) values ('2IC deletes outing', pg_temp.try(s, 'delete from community_dog_outings')::text, '0');
  insert into r (label, got, want) values ('mgmt deletes place (no grant)', pg_temp.try(m, 'delete from community_places')::text, '-1');
  select id into o from community_dog_outings where dog_count = 5;
  insert into r (label, got, want) values ('mgmt adds photo', pg_temp.try(m, format($q$insert into community_outing_photos (outing_id, drive_file_id) values (%L, 'probe-file')$q$, o))::text, '1');
  insert into r (label, got, want) values ('photo private by default', (select is_public from community_outing_photos where outing_id = o)::text, 'false');
  insert into r (label, got, want) values ('anon reads photos', pg_temp.q(null, '(select count(*) from community_outing_photos)', 'anon'), 'ERR:42501');
  insert into role_permissions (role_id, activity, level) select id, 'community.outings', 2 from roles where key = 'second_in_command';
  insert into r (label, got, want) values ('2IC given the cell adds outing', pg_temp.try(s, format($q$insert into community_dog_outings (place_id, dog_count, vaccinated) values (%L, 1, true)$q$, p))::text, '1');
  delete from community_dog_outings where dog_count = 1;
  delete from role_permissions where activity = 'community.outings' and role_id = (select id from roles where key = 'second_in_command');
  insert into r (label, got, want) values ('community_dogs row empty', (select (baseline_count is null and baseline_date is null)::text from impact_baselines where key = 'community_dogs'), 'true');
  insert into r (label, got, want) values ('empty row not public', pg_temp.q(null, $q$(select count(*) from public_impact_figures where key = 'community_dogs')$q$, 'anon'), '0');
  update impact_baselines set baseline_count = 100, baseline_date = y where key = 'community_dogs';
  update impact_baselines set baseline_count = 10, baseline_date = y where key = 'villages_sterilised';
  insert into r (label, got, want) values ('community_dogs total, baseline day excluded', pg_temp.q(null, $q$(select total from public_impact_figures where key = 'community_dogs')$q$, 'anon'), '105');
  insert into r (label, got, want) values ('villages_sterilised total, baseline day excluded', pg_temp.q(null, $q$(select total from public_impact_figures where key = 'villages_sterilised')$q$, 'anon'), '12');
  insert into r (label, got, want) values ('anon cannot write the view', (has_table_privilege('anon', 'public_impact_figures', 'delete') or has_table_privilege('authenticated', 'public_impact_figures', 'insert'))::text, 'false');
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
