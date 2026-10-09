// website-content-grant (0163): Management holds website.content and the three site tables write on that cell.
// Against DEV only, one transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-website-content-grant.mjs     (from the repo root; dev only)
//
// It works whether or not 0163 is applied on dev yet: "before" first puts back what 0163 replaces (no cell, the
// three is_admin() policies of 0153), then "after" replays the 0163 file itself. So both phases are measured in the
// same transaction against the same rows, and the file is proved to replay.
//
// For each login, in each phase:
//   cell      has_permission('website.content') and ('website.content','read'): what requirePermission() and
//             can() ask for /admin/website and every action on it
//   writes    an update of site_content and site_pages (to their own values) and an insert into
//             site_content_photos, each counted as the rows the policy let through; impact_baselines (0156,
//             already on the cell) as the control that the cell was always the right door
//
// Expected: admin yes in both phases; management no before, yes after; the 2IC, staff, volunteer, doctor and the
// public viewer no in both (nobody but Management is widened); anon refused.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0163_management_website_content.sql"), "utf8");
const LEGACY = ["admin", "management", "staff", "volunteer", "doctor", "public_viewer"];
const ID = Object.fromEntries([...LEGACY, "sic"].map((p) => [p, randomUUID()]));
const lit = (id) => `'${id}'::uuid`;
// Who should be able to write, by phase. Everyone else must read no and write 0 rows.
const WRITERS = { before: ["admin"], after: ["admin", "management"] };

const sql = `
begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-web-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from (values ${Object.entries(ID).map(([p, id]) => `('${p}', ${lit(id)})`).join(",")}) as u(who, id);
insert into user_roles (user_id, role)
  select id, who::app_role from (values ${LEGACY.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
insert into user_roles (user_id, role_id, role) select ${lit(ID.sic)}, id, legacy_role from roles where key = 'second_in_command';

create temp table who (who text primary key, uid uuid);
insert into who values ${Object.entries(ID).map(([p, id]) => `('${p}', ${lit(id)})`).join(",")}, ('anon', null);
create temp table seen (phase text, who text, probe text, n bigint);
grant all on seen to anon, authenticated;

-- One probe under one login: a count, or -1 when refused outright.
create function pg_temp.probe(p_phase text, p_who text, p_uid uuid) returns void language plpgsql as $f$
declare
  v_probe text;
  v_sql text;
  v bigint;
begin
  for v_probe, v_sql in values
    ('cell edit', $q$select count(*) from (select 1 where has_permission('website.content')) q$q$),
    ('cell read', $q$select count(*) from (select 1 where has_permission('website.content', 'read')) q$q$),
    ('site_content update', $q$with d as (update site_content set tagline = tagline returning 1) select count(*) from d$q$),
    ('site_pages update', $q$with d as (update site_pages set updated_at = updated_at where ctid in (select ctid from site_pages limit 1) returning 1) select count(*) from d$q$),
    ('site_content_photos insert', $q$with d as (insert into site_content_photos (drive_file_id, alt) values ('harness-web', 'harness') returning 1) select count(*) from d$q$),
    ('impact_baselines update (control)', $q$with d as (update impact_baselines set label = label where ctid in (select ctid from impact_baselines limit 1) returning 1) select count(*) from d$q$)
  loop
    if p_uid is null then
      perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
      set local role anon;
    else
      perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
      set local role authenticated;
    end if;
    begin
      execute v_sql into v;
    exception when insufficient_privilege then v := -1;
    end;
    reset role;
    perform set_config('request.jwt.claims', '', true);
    insert into seen values (p_phase, p_who, v_probe, v);
  end loop;
end $f$;

-- BEFORE: what 0163 replaces, put back inside this transaction.
delete from role_permissions where activity = 'website.content';
alter policy admin_update_site_content on site_content
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy admin_write_site_content_photos on site_content_photos
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy admin_update_site_pages on site_pages
  using ((select public.is_admin())) with check ((select public.is_admin()));
select pg_temp.probe('before', who, uid) from who;

-- AFTER: the file itself.
${migration}
select pg_temp.probe('after', who, uid) from who;

do $h$
declare
  r record;
  v_bad text := '';
  v_report text := '';
  v_rows int;
  v_photo int;
begin
  select count(*) into v_rows from site_pages;
  if v_rows = 0 then v_bad := v_bad || ' no site_pages row on dev to probe;'; end if;
  select count(*) into v_rows from impact_baselines;
  if v_rows = 0 then v_bad := v_bad || ' no impact_baselines row on dev to probe;'; end if;

  for r in select * from seen order by phase desc, who, probe loop
    if r.who = 'anon' then
      if r.probe like 'cell%' and r.n > 0 then v_bad := v_bad || format(' %s anon %s = %s;', r.phase, r.probe, r.n); end if;
      if r.probe not like 'cell%' and r.n > 0 then v_bad := v_bad || format(' %s anon %s = %s;', r.phase, r.probe, r.n); end if;
    elsif r.who = any (case r.phase when 'before' then array[${WRITERS.before.map((w) => `'${w}'`).join(",")}] else array[${WRITERS.after.map((w) => `'${w}'`).join(",")}] end) then
      if r.n <> 1 then v_bad := v_bad || format(' %s %s %s = %s, expected 1;', r.phase, r.who, r.probe, r.n); end if;
    elsif r.probe = 'impact_baselines update (control)' and r.phase = 'before' and r.who = 'management' then
      -- before: no cell, so the 0156 policy refused Management too
      if r.n > 0 then v_bad := v_bad || format(' before management %s = %s;', r.probe, r.n); end if;
    else
      if r.n > 0 then v_bad := v_bad || format(' %s %s %s = %s, expected none;', r.phase, r.who, r.probe, r.n); end if;
    end if;
  end loop;

  select string_agg(format('%s/%s: %s', phase, who,
           string_agg_inner), ' | ' order by phase desc, who) into v_report
    from (select phase, who, string_agg(format('%s=%s', probe, n), ', ' order by probe) as string_agg_inner
            from seen where who in ('admin', 'management', 'sic') group by phase, who) s;

  if v_bad <> '' then raise exception 'FAIL%  || %', v_bad, v_report; end if;
  raise exception 'HARNESS-OK website-content-grant | before: only admin holds the cell and writes site_content, site_pages, site_content_photos; management refused on all three | after (0163 replayed): admin and management hold it and write all three; 2IC, staff, volunteer, doctor, public_viewer still no and 0 rows; anon refused | %', v_report;
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
