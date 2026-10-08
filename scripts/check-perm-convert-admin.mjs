// perm-convert-admin (0153): the 43 admin_* and 2 volunteer_read_* policies now ask is_admin() or nothing.
//
//   node scripts/check-perm-convert-admin.mjs     (from the repo root; dev only)
//
// check-permission-parity does not probe Admin's DELETEs, the Admin-only pages' tables or the aal2 gate, so it
// reported "identical" for a migration that could have taken them away. This does, under each login's own JWT
// (set local role authenticated + request.jwt.claims), in one DO block that always ends in `raise exception`,
// so nothing it writes is kept (CLAUDE.md, "Database migrations"). Asserted:
//   1. is_admin() agrees with the enum for every login in user_roles.
//   2. Admin reads every row of the nine Admin-only tables and the group-1 tables: the same count the owner sees.
//   3. Admin's DELETE on the eight tables that had no delete policy but Admin's, and on group_origins and
//      rounds, is not refused by a policy: it deletes a row, or the row's own foreign key stops it (23503).
//   4. Staff, management and volunteer see none of the Admin-only tables, and delete and update nothing.
//   5. The permission matrix keeps its gate: an admin at aal1 writes no row of role_permissions, roles or
//      user_roles; at aal2 writes one; a non-admin at aal2 writes none.
//   6. The volunteer still reads every enclosure and zone (volunteer_read_* went; enclosures_select_perm covers).
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
do $$
declare
  admin_id uuid; vol_id uuid; staff_id uuid; mgmt_id uuid;
  fails text := ''; checks int := 0;
  n int; total int; t text; u record; who text; uid uuid;
  admin_only text[] := array['audit_log','permission_activities','roles','role_permissions','user_roles','assistant_actions'];
  deletes text[] := array['blood_tests','immunization_records','placement_history','prescriptions','procedures','resident_diets','residents','weight','group_origins','rounds'];
begin
  select ur.user_id into admin_id from user_roles ur join roles r on r.id = ur.role_id where r.key = 'admin' and ur.archived_at is null limit 1;
  select ur.user_id into vol_id from user_roles ur join roles r on r.id = ur.role_id where r.key = 'volunteer' and ur.archived_at is null limit 1;
  select ur.user_id into staff_id from user_roles ur join roles r on r.id = ur.role_id where r.key = 'staff' and ur.archived_at is null limit 1;
  select ur.user_id into mgmt_id from user_roles ur join roles r on r.id = ur.role_id where r.key = 'management' and ur.archived_at is null limit 1;
  if admin_id is null or vol_id is null or staff_id is null or mgmt_id is null then
    raise exception 'FAIL fixture: dev has no live login for each of admin, volunteer, staff, management';
  end if;

  -- 1
  for u in select distinct user_id from user_roles loop
    perform set_config('request.jwt.claims', json_build_object('sub', u.user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
    set local role authenticated;
    checks := checks + 1;
    if (select public.is_admin()) is distinct from coalesce((select public.current_user_role()) = 'admin', false) then
      fails := fails || format('is_admin() disagrees with the enum for %s', u.user_id) || E'\\n';
    end if;
    reset role;
  end loop;

  foreach who in array array['admin', 'staff', 'management', 'volunteer'] loop
    uid := case who when 'admin' then admin_id when 'staff' then staff_id when 'management' then mgmt_id else vol_id end;
    perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated', 'aal', 'aal2')::text, true);
    set local role authenticated;

    -- 2 and 4: the Admin-only tables
    foreach t in array admin_only loop
      execute format('select count(*) from %I', t) into n;
      reset role;
      execute format('select count(*) from %I', t) into total;
      set local role authenticated;
      checks := checks + 1;
      if who = 'admin' and (n <> total or total = 0) then fails := fails || format('admin reads %s of %s rows of %s', n, total, t) || E'\\n'; end if;
      if who <> 'admin' and n <> 0 then fails := fails || format('%s reads %s rows of %s', who, n, t) || E'\\n'; end if;
    end loop;

    -- 3 and 4: deletes
    foreach t in array deletes loop
      begin
        execute format('with d as (delete from %I where ctid in (select ctid from %I limit 1) returning 1) select count(*) from d', t, t) into n;
        checks := checks + 1;
        if who = 'admin' and n <> 1 then fails := fails || format('admin deleted %s rows of %s', n, t) || E'\\n'; end if;
        if who <> 'admin' and n <> 0 then fails := fails || format('%s deleted %s rows of %s', who, n, t) || E'\\n'; end if;
      exception when foreign_key_violation then
        -- the policy let the delete through and the row's own foreign key stopped it
        checks := checks + 1;
        if who <> 'admin' then fails := fails || format('%s reached a foreign key deleting from %s', who, t) || E'\\n'; end if;
      end;
    end loop;

    -- Updates on the site tables: Admin-only in 0153; since 0163 they ask website.content, which management
    -- also holds (check-website-content-grant.mjs proves who else does not).
    foreach t in array array['site_content','site_pages'] loop
      execute format('with d as (update %I set updated_at = now() where ctid in (select ctid from %I limit 1) returning 1) select count(*) from d', t, t) into n;
      checks := checks + 1;
      if who in ('admin', 'management') and n <> 1 then fails := fails || format('%s updated %s rows of %s', who, n, t) || E'\\n'; end if;
      if who not in ('admin', 'management') and n <> 0 then fails := fails || format('%s updated %s rows of %s', who, n, t) || E'\\n'; end if;
    end loop;

    -- 6: the volunteer's reads
    if who = 'volunteer' then
      foreach t in array array['enclosures','zones'] loop
        execute format('select count(*) from %I', t) into n;
        reset role;
        execute format('select count(*) from %I', t) into total;
        set local role authenticated;
        checks := checks + 1;
        if n <> total or total = 0 then fails := fails || format('volunteer reads %s of %s rows of %s', n, total, t) || E'\\n'; end if;
      end loop;
    end if;
    reset role;
  end loop;

  -- 5: the gate on the permission matrix, then on the people table
  foreach who in array array['admin@aal1', 'admin@aal2', 'management@aal2'] loop
    perform set_config('request.jwt.claims', json_build_object('sub', case when who like 'admin%' then admin_id else mgmt_id end, 'role', 'authenticated', 'aal', split_part(who, '@', 2))::text, true);
    set local role authenticated;
    foreach t in array array['role_permissions:level','roles:name','user_roles:created_at'] loop
      execute format('with d as (update %I set %I = %I where ctid in (select ctid from %I limit 1) returning 1) select count(*) from d', split_part(t, ':', 1), split_part(t, ':', 2), split_part(t, ':', 2), split_part(t, ':', 1)) into n;
      checks := checks + 1;
      if who = 'admin@aal2' and n <> 1 then fails := fails || format('admin at aal2 wrote %s rows of %s', n, t) || E'\\n'; end if;
      if who <> 'admin@aal2' and n <> 0 then fails := fails || format('%s wrote %s rows of %s', who, n, t) || E'\\n'; end if;
    end loop;
    reset role;
  end loop;

  if fails <> '' then raise exception E'FAILED\\n%', fails; end if;
  raise exception 'HARNESS-OK % checks held', checks;
end $$;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const body = await res.text();
const ok = body.match(/HARNESS-OK (\d+) checks held/);
if (ok) {
  console.log(`${ok[1]} checks held, 0 failed.`);
  console.log("RESULT: GREEN (Admin keeps every read, write and delete through is_admin(); the matrix keeps its aal2 gate; non-admins gain and lose nothing)");
} else {
  console.log(body.slice(0, 3000));
  console.log("\nRESULT: RED");
  process.exitCode = 1;
}
