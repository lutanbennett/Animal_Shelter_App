// remove-staff-role (0173): Staff is retired. Against DEV only, one transaction that is always rolled back.
//
//   node scripts/check-staff-retired.mjs   (from the repo root; dev only)
//
//   A  the staff roles row is archived, and it is the only archived role
//   B  no live login holds Staff
//   C  un-archiving a login that held Staff is refused
//   D  moving a live login onto Staff (through the enum, as the app writes it) is refused
//   E  moving a live login between two live roles still works
//   F  a fresh login given Staff is refused
//   G  0173's lock-out guard stops the file while a live login holds Staff
//
// The harness ends by raising HARNESS-OK, so success arrives as an error carrying that word and nothing is kept.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// The guard block of 0173 on its own, so G can run it against a state where it must stop.
const file = readFileSync(join(process.cwd(), "supabase/migrations/0173_retire_staff_role.sql"), "utf8");
const guard = file.slice(file.indexOf("do $$"), file.indexOf("end $$;") + "end $$".length);

const refused = (label, sql) => `
  begin
    ${sql}
    raise exception 'FAIL ${label}: allowed';
  exception when check_violation then null;
  end;`;

const query = `
begin;
do $h$
declare
  v_mgmt uuid := (select ur.user_id from public.user_roles ur join public.roles r on r.id = ur.role_id
                   where r.key = 'management' and ur.archived_at is null limit 1);
  v_old  uuid := (select ur.user_id from public.user_roles ur join public.roles r on r.id = ur.role_id
                   where r.key = 'staff' limit 1);
  v_new  uuid := (select u.id from auth.users u where not exists (select 1 from public.user_roles ur where ur.user_id = u.id) limit 1);
begin
  if (select archived_at from public.roles where key = 'staff') is null then raise exception 'FAIL A: staff live'; end if;
  if (select count(*) from public.roles where archived_at is not null) <> 1 then raise exception 'FAIL A: archived count'; end if;
  if exists (select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
              where r.key = 'staff' and ur.archived_at is null) then raise exception 'FAIL B'; end if;
  if v_old is not null then
    ${refused("C", "update public.user_roles set archived_at = null where user_id = v_old;")}
  end if;
  ${refused("D", "update public.user_roles set role = 'staff' where user_id = v_mgmt;")}
  update public.user_roles set role = 'volunteer' where user_id = v_mgmt;
  if (select r.key from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.user_id = v_mgmt) <> 'volunteer' then
    raise exception 'FAIL E';
  end if;
  if v_new is not null then
    ${refused("F", "insert into public.user_roles (user_id, role) values (v_new, 'staff');")}
  end if;
  -- G: put Staff back live for one login, then the guard must stop.
  update public.roles set archived_at = null where key = 'staff';
  update public.user_roles set role = 'staff' where user_id = v_mgmt;
  begin
    execute $g$ ${guard} $g$;
    raise exception 'FAIL G: guard let it through';
  exception when check_violation then
    if sqlerrm not like '%cannot be retired%' then raise; end if;
  end;
  raise exception 'HARNESS-OK';
end $h$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const body = await res.text();
if (body.includes("HARNESS-OK")) {
  console.log("staff retired: HARNESS-OK (A-G asserted on dev, rolled back)");
} else {
  console.error(body);
  process.exit(1);
}
