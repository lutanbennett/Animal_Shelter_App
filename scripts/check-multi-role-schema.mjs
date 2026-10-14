// multi-role-schema (0196/0197): a login may hold several roles and its rights are the union.
// Against DEV only. One transaction that always rolls back; every assertion is a `raise exception`.
//
//   node scripts/check-multi-role-schema.mjs
//
//   1  a Head of Medical given Head of Maintenance until today gets the maintenance cells, both role keys, and the main
//      role is still the one my_permissions().role names
//   2  the day after ends_on the extra role counts for nothing; ends_on = today still counts; starts_on = tomorrow does
//      not count yet. By shelter date, not UTC
//   3  restrictions only hold when every live role is restricted: a doctor who is also a Head of Medical is not a clinic
//      login; the volunteer floor lifts when a role reads every resident
//   4  private.app_users lists the person once
//   5  refused: Admin as additional, the public viewer as additional, dates on a main role, a second main role, turning
//      a main role into an additional one, an additional role with no main role
//   6  a login with one role is untouched (my_permissions lists one role key)
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const query = `
do $$
declare
  v_user uuid;
  v_med uuid := (select id from public.roles where key = 'head_of_medical');
  v_mnt uuid := (select id from public.roles where key = 'head_of_maintenance');
  v_doc uuid := (select id from public.roles where key = 'doctor');
  v_vol uuid := (select id from public.roles where key = 'volunteer');
  v_mgt uuid := (select id from public.roles where key = 'management');
  v_adm uuid := (select id from public.roles where key = 'admin');
  v_pub uuid := (select id from public.roles where key = 'public_viewer');
  v_today date := public.shelter_date(now());
  v_act text;
  v_n int;
  v_p jsonb;
  v_failed boolean;
begin
  select ur.user_id into v_user from public.user_roles ur
    join public.roles r on r.id = ur.role_id
   where r.key not in ('admin', 'public_viewer') and ur.archived_at is null and ur.is_main
   order by ur.user_id limit 1;
  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);

  select rp.activity into v_act from public.role_permissions rp
   where rp.role_id = v_mnt and rp.level = 2
     and not exists (select 1 from public.role_permissions m where m.role_id = v_med and m.activity = rp.activity and m.level >= 2)
   order by 1 limit 1;
  if v_act is null then raise exception 'FAIL setup: no activity separates the two heads'; end if;

  -- 6. one role first
  update public.user_roles set role_id = v_med where user_id = v_user and is_main;
  v_p := public.my_permissions();
  if jsonb_array_length(v_p -> 'roles') <> 1 or v_p #>> '{role,key}' <> 'head_of_medical' then raise exception 'FAIL 6 one-role shape: %', v_p; end if;
  if public.has_permission(v_act) then raise exception 'FAIL 6 the medical head already has %', v_act; end if;

  -- 1. add maintenance until today
  insert into public.user_roles (user_id, role_id, is_main, ends_on) values (v_user, v_mnt, false, v_today);
  if not public.has_permission(v_act) then raise exception 'FAIL 1 the extra role gives nothing'; end if;
  v_p := public.my_permissions();
  if jsonb_array_length(v_p -> 'roles') <> 2 or v_p #>> '{role,key}' <> 'head_of_medical' then raise exception 'FAIL 1 roles/main: %', v_p; end if;
  if (v_p #>> ('{permissions,' || v_act || '}')::text[])::int <> 2 then raise exception 'FAIL 1 cell not at the highest level'; end if;

  -- 2. expiry by shelter date
  update public.user_roles set ends_on = v_today - 1 where user_id = v_user and role_id = v_mnt;
  if public.has_permission(v_act) then raise exception 'FAIL 2 a lapsed role still counts'; end if;
  if jsonb_array_length(public.my_permissions() -> 'roles') <> 1 then raise exception 'FAIL 2 lapsed role still listed'; end if;
  update public.user_roles set ends_on = null, starts_on = v_today + 1 where user_id = v_user and role_id = v_mnt;
  if public.has_permission(v_act) then raise exception 'FAIL 2 a future role already counts'; end if;
  update public.user_roles set starts_on = null where user_id = v_user and role_id = v_mnt;
  if not public.has_permission(v_act) then raise exception 'FAIL 2 an open-ended extra role does not count'; end if;

  -- 3. restrictions need every role restricted
  delete from public.user_roles where user_id = v_user and not is_main;
  update public.user_roles set role_id = v_doc where user_id = v_user and is_main;
  if not public.is_clinic_login() or not public.photos_medical_only() then raise exception 'FAIL 3 a plain doctor is not restricted'; end if;
  insert into public.user_roles (user_id, role_id, is_main) values (v_user, v_med, false);
  if public.is_clinic_login() then raise exception 'FAIL 3 doctor + head still a clinic login'; end if;
  if not public.sees_all_clinical() then raise exception 'FAIL 3 doctor + head does not see all clinical'; end if;
  delete from public.user_roles where user_id = v_user and not is_main;
  update public.user_roles set role_id = v_vol where user_id = v_user and is_main;
  if not public.on_volunteer_floor() then raise exception 'FAIL 3 a plain volunteer is not on the floor'; end if;
  insert into public.user_roles (user_id, role_id, is_main) values (v_user, v_mgt, false);
  if public.on_volunteer_floor() then raise exception 'FAIL 3 volunteer + management still on the floor'; end if;
  if not public.sees_all_residents() then raise exception 'FAIL 3 volunteer + management does not see all residents'; end if;

  -- 4. once in app_users
  select count(*) into v_n from private.app_users where id = v_user;
  if v_n <> 1 then raise exception 'FAIL 4 app_users lists the person % times', v_n; end if;
  delete from public.user_roles where user_id = v_user and not is_main;

  -- 5. refusals
  v_failed := false;
  begin insert into public.user_roles (user_id, role_id, is_main) values (v_user, v_adm, false);
  exception when check_violation then v_failed := true; end;
  if not v_failed then raise exception 'FAIL 5 Admin as an additional role was accepted'; end if;
  v_failed := false;
  begin insert into public.user_roles (user_id, role_id, is_main) values (v_user, v_pub, false);
  exception when check_violation then v_failed := true; end;
  if not v_failed then raise exception 'FAIL 5 the public viewer as an additional role was accepted'; end if;
  v_failed := false;
  begin update public.user_roles set ends_on = v_today where user_id = v_user and is_main;
  exception when check_violation then v_failed := true; end;
  if not v_failed then raise exception 'FAIL 5 a main role took an end date'; end if;
  v_failed := false;
  begin insert into public.user_roles (user_id, role_id, is_main) values (v_user, v_med, true);
  exception when unique_violation then v_failed := true; end;
  if not v_failed then raise exception 'FAIL 5 a second main role was accepted'; end if;
  v_failed := false;
  begin update public.user_roles set is_main = false where user_id = v_user and is_main;
  exception when check_violation then v_failed := true; end;
  if not v_failed then raise exception 'FAIL 5 a main role was turned into an additional one'; end if;
  -- an additional role on a login that has no main role: use a throwaway auth user
  insert into auth.users (id, instance_id, aud, role, email) values
    ('00000000-0000-4000-8000-000000000196', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'multi-role-check@example.invalid');
  v_failed := false;
  begin insert into public.user_roles (user_id, role_id, is_main) values ('00000000-0000-4000-8000-000000000196', v_med, false);
  exception when check_violation then v_failed := true; end;
  if not v_failed then raise exception 'FAIL 5 an additional role with no main role was accepted'; end if;

  raise exception 'PASS';
end $$;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const message = JSON.parse(await res.text()).message ?? "";
if (/ERROR:\s+P0001: PASS/.test(message)) {
  console.log("ok   all six groups pass (rolled back, nothing kept)");
} else {
  console.log(`FAIL ${message}`);
  process.exitCode = 1;
}
