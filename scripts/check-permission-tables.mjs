// Rollback harness for 0132_permission_tables.sql against DEV only. One
// transaction: the live tables and seed, has_permission() and my_permissions()
// as each kind of login, every guard, the RLS on the three tables, the audit
// trigger, and a replay of the file, then a deliberate `raise exception`
// carrying the evidence, so nothing can commit. Safe to run any number of times.
//
//   node scripts/check-permission-tables.mjs     (from the repo root; dev only)
//
// Fixtures (all rolled back): one login each for admin, management, staff, vet,
// volunteer and public_viewer; a login with no user_roles row; a staff login
// that is archived; a login whose configured role has been archived.
//
// It checks
//   A  the seed: six roles, 58 activities, 52 / 39 / 13 / 3 cells for
//      management / staff / vet / volunteer and none for admin or public_viewer,
//      every Yes/No cell at level 2, and every real login on dev has a role_id
//      that agrees with its enum value
//   B  has_permission(): the four "answers no" cases the paper makes security
//      relevant (a missing cell, an unknown activity, an archived role, a person
//      with no role), plus an archived person, a signed-out caller, a null
//      argument and a mistyped level; and seeded cells answering yes, read apart
//      from edit, Admin yes for everything (an unknown activity included)
//   C  my_permissions(): shape and counts for admin, staff and vet; null for the
//      two with no live role
//   D  the guards: Admin and public_viewer take no cells, cannot be deleted,
//      archived, renamed or re-kinded; a Yes/No activity refuses level 1; the
//      user_roles.role_id bridge in both directions; a role with no legacy_role
//      cannot be held yet; the last active admin cannot be taken away (checked
//      at commit, so a swap in one transaction is fine)
//   E  RLS: an admin at aal2 reads and writes the matrix, at aal1 only reads;
//      no other role and not anon reaches it; permission_activities is read only
//   F  audit: the seed left no audit rows (but 0134's 21 deletions of the volunteer's cells, logged with no actor), and a cell edit logs one with its actor
//   H  every role x every activity x read and edit under that role's own login (696
//      answers) equals the cell in the paper's §4 table, which the script reads itself
//   G  the file replays: same rows afterwards, a shelter's edit to a cell kept
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^\d+_permission_tables\.sql$/.test(f));
if (!file) throw new Error("no *_permission_tables.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

// H: the expected cells, read from the paper's §4 table at run time and not from the
// migration, so the seed is checked against the document it claims to copy.
const paper = readFileSync(join(root, "docs/roles-and-permissions.md"), "utf8").split("\n");
const start = paper.findIndex((l) => l.startsWith("| Key | Activity | Kind | Admin | Mgmt | Staff | Vet | Vol |"));
if (start < 0) throw new Error("§4 table not found in docs/roles-and-permissions.md");
const ROLE_COLUMN = { management: 5, staff: 6, vet: 7, volunteer: 8 };
const LEVEL = { E: 2, R: 1, Y: 2 };
const expected = [];
let activityCount = 0;
for (const line of paper.slice(start + 2)) {
  if (!line.startsWith("|")) break;
  const c = line.split("|").map((x) => x.trim());
  const m = /^`([a-z_.]+)`$/.exec(c[1] ?? "");
  if (!m) continue;
  activityCount++;
  for (const [role, i] of Object.entries(ROLE_COLUMN)) {
    const v = c[i].replace(/\*/g, "").replace("°", "");
    if (v !== "–") expected.push(`('${role}', '${m[1]}', ${LEVEL[v]})`);
  }
}
// RE-BASELINED 2026-10-06 (director-draft-apply): the volunteer's expected cells are the Director's draft 2, not the paper's R1 column
// (3 cells -> 5). The paper is not rewritten; the vet column is NOT overridden, see eq_known() below.
{
  const { cellsFor } = await import(pathToFileURL(join(root, "src/lib/roles-draft/resolve.ts")).href);
  const { ACTIVITIES } = await import(pathToFileURL(join(root, "src/lib/permissions/catalogue.ts")).href);
  const draft = JSON.parse(readFileSync(join(root, "src/lib/roles-draft/draft-2.json"), "utf8"));
  const kept = expected.filter((e) => !e.startsWith("('volunteer',"));
  expected.length = 0;
  expected.push(...kept, ...cellsFor(draft, "volunteer", Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.kind]))).map((c) => `('volunteer', '${c.activity}', ${c.level})`));
}
if (activityCount !== 58) throw new Error(`expected 58 activities in §4, parsed ${activityCount}`);

const sql = `
begin;

-- Run a scalar expression as a login. p_role is the Postgres role (null uid with
-- 'service_role' = the service role). Returns the result as text, or 'ERR:' and
-- the SQLSTATE if it raised.
create function pg_temp.q(p_uid uuid, p_expr text, p_aal text default 'aal1', p_pgrole text default 'authenticated')
returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims',
    case when p_uid is null then json_build_object('role', p_pgrole)::text
         else json_build_object('sub', p_uid, 'role', p_pgrole, 'aal', p_aal)::text end, true);
  execute format('set local role %I', p_pgrole);
  begin
    execute 'select (' || p_expr || ')::text' into v;
  exception when others then v := 'ERR:' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

-- Run a statement as a login. Returns the row count; -1 if a privilege or RLS
-- refused it, -2 for any other error (a trigger or constraint, for instance).
create function pg_temp.try(p_uid uuid, p_sql text, p_aal text default 'aal1', p_pgrole text default 'authenticated')
returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims',
    case when p_uid is null then json_build_object('role', p_pgrole)::text
         else json_build_object('sub', p_uid, 'role', p_pgrole, 'aal', p_aal)::text end, true);
  execute format('set local role %I', p_pgrole);
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

create function pg_temp.eq(p_label text, p_got text, p_want text) returns void language plpgsql as $f$
begin
  if p_got is distinct from p_want then
    raise exception 'HARNESS-FAIL %: got %, wanted %', p_label, coalesce(p_got, 'null'), coalesce(p_want, 'null');
  end if;
end $f$;

-- A disagreement we are deliberately NOT flattening (director-draft-apply, 2026-10-06): the check carries on past it and the
-- run still ends RED, naming it. See eq_known() and the end of the run.
create temp table harness_known_red (label text, got text, want text);
create function pg_temp.eq_known(p_label text, p_got text, p_want text) returns void language plpgsql as $f$
begin
  if p_got is distinct from p_want then
    insert into harness_known_red values (p_label, coalesce(p_got, 'null'), coalesce(p_want, 'null'));
  end if;
end $f$;

create temp table harness_baseline as
select count(*)::bigint as audit_rows,
       -- an actor-less UPDATE of a role row is 0155 moving the 2IC's contacts scope to name_phone (director-answers-schema, q6); an actor-less UPDATE of a cell is scripts/load-role-draft.mjs changing a level (draft 1, 2026-10-05; RE-BASELINED director-draft-apply): a script, not a person in Settings
count(*) filter (where actor is not null or (op <> 'DELETE' and op <> 'INSERT' and not (op = 'UPDATE' and table_name in ('role_permissions', 'roles'))) or (op = 'INSERT' and table_name not in ('roles', 'role_permissions')) or (op = 'DELETE' and table_name <> 'role_permissions'))::bigint as not_0134
from audit_log where table_name in ('roles', 'role_permissions');
grant select on harness_baseline to authenticated, service_role;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values
  ('admin', gen_random_uuid()), ('admin2', gen_random_uuid()), ('management', gen_random_uuid()), ('staff', gen_random_uuid()),
  ('vet', gen_random_uuid()), ('volunteer', gen_random_uuid()), ('public_viewer', gen_random_uuid()),
  ('norole', gen_random_uuid()), ('archperson', gen_random_uuid()), ('archrole', gen_random_uuid()),
  ('sync', gen_random_uuid());
grant select on harness_ids to authenticated, service_role;

create temp table harness_expected (role_key text not null, activity text not null, level int not null);
insert into harness_expected values
${expected.join(",\n")};

do $setup$
declare r record;
begin
  for r in select * from harness_ids loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-perm-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role)
  select id, (case when who = 'admin2' then 'admin' else who end)::app_role from harness_ids
   where who in ('admin', 'admin2', 'management', 'staff', 'vet', 'volunteer', 'public_viewer');
  insert into user_roles (user_id, role, archived_at)
  select id, 'staff', now() from harness_ids where who = 'archperson';
end $setup$;

-- A configured role that borrows 'staff', holds one cell, and is later archived.
-- (kind custom with a legacy_role: allowed, and not part of the one-per-enum index)
insert into roles (key, name, kind, legacy_role) values ('harness_archived', 'Harness archived', 'custom', 'staff');
insert into role_permissions (role_id, activity, level)
select id, 'stock.count', 2 from roles where key = 'harness_archived';
insert into user_roles (user_id, role_id, role)
select h.id, r.id, 'staff' from harness_ids h, roles r where h.who = 'archrole' and r.key = 'harness_archived';

do $h$
declare
  v_report text := '';
  n bigint;
  t text;
  v_admin uuid := (select id from harness_ids where who = 'admin');
  v_mgmt  uuid := (select id from harness_ids where who = 'management');
  v_staff uuid := (select id from harness_ids where who = 'staff');
  v_vet   uuid := (select id from harness_ids where who = 'vet');
  v_vol   uuid := (select id from harness_ids where who = 'volunteer');
  v_pub   uuid := (select id from harness_ids where who = 'public_viewer');
  v_none  uuid := (select id from harness_ids where who = 'norole');
  v_archp uuid := (select id from harness_ids where who = 'archperson');
  v_archr uuid := (select id from harness_ids where who = 'archrole');
  v_sync  uuid := (select id from harness_ids where who = 'sync');
  v_role_admin uuid := (select id from roles where key = 'admin');
  v_role_pub uuid := (select id from roles where key = 'public_viewer');
  v_role_staff uuid := (select id from roles where key = 'staff');
  v_role_custom uuid;
  v_raised boolean;
  v_before bigint;
  v_who text;
  v_act record;
  v_exp int;
  v_checked int := 0;
begin
  -- A: the seed.
  perform pg_temp.eq('A roles', (select count(*) from roles where key in ('admin','management','staff','vet','volunteer','public_viewer'))::text, '6');
  perform pg_temp.eq('A activities', (select count(*) from permission_activities)::text, '58');
  perform pg_temp.eq('A yesno+level', (select count(*) filter (where kind = 'yesno') || '/' || count(*) filter (where kind = 'level') from permission_activities), '39/19');
  -- RE-BASELINED 2026-10-06 (director-draft-apply): the Director's draft 2 is the agreed state of the volunteer (3 -> 5: the
  -- residents list, who and where, the map and its enclosures read, own recurring jobs, the assistant). The VET stays at the
  -- paper's 13 and is checked with eq_known(): the draft gives vets only the microchip (2 cells) and Lutan said vets are on hold,
  -- so the paper and the draft genuinely disagree. That is recorded, not flattened: the run stays RED until someone decides.
  for t in select unnest(array['management:52', 'staff:39', 'volunteer:5', 'admin:0', 'public_viewer:0']) loop
    perform pg_temp.eq('A cells ' || split_part(t, ':', 1),
      (select count(*) from role_permissions rp join roles r on r.id = rp.role_id where r.key = split_part(t, ':', 1))::text,
      split_part(t, ':', 2));
  end loop;
  perform pg_temp.eq_known('A cells vet (paper 13, draft gives the microchip only)',
    (select count(*) from role_permissions rp join roles r on r.id = rp.role_id where r.key = 'vet')::text, '13');
  perform pg_temp.eq('A yesno cells at level 2', (select count(*) from role_permissions rp join permission_activities a on a.key = rp.activity where a.kind = 'yesno' and rp.level <> 2)::text, '0');
  perform pg_temp.eq('A requires all empty', (select count(*) from permission_activities where requires <> '[]'::jsonb)::text, '0');
  perform pg_temp.eq('A real logins have role_id', (select count(*) from user_roles where role_id is null)::text, '0');
  perform pg_temp.eq('A real logins agree with the enum', (select count(*) from user_roles ur join roles r on r.id = ur.role_id where r.legacy_role is distinct from ur.role)::text, '0');
  perform pg_temp.eq('A scopes vet', (select scope_residents || '/' || scope_clinical || '/' || scope_contacts || '/' || scope_photos || '/' || sees_login_emails from roles where key = 'vet'), 'own_clinic/own_clinic/name_type/medical_only/false');
  perform pg_temp.eq('A scopes volunteer', (select scope_contacts || '/' || sees_login_emails from roles where key = 'volunteer'), 'name_phone/false');
  v_report := v_report || 'A: 6 roles, 58 activities, cells 52/39/13/5/0/0, role_id agrees with the enum on every real login | ';

  -- B: has_permission().
  -- the four answers-no cases
  perform pg_temp.eq('B missing cell', pg_temp.q(v_staff, 'has_permission(''stock.purchasing'')'), 'false');
  perform pg_temp.eq('B unknown activity', pg_temp.q(v_staff, 'has_permission(''no.such_activity'')'), 'false');
  perform pg_temp.eq('B archived role (cell exists)', pg_temp.q(v_archr, 'has_permission(''stock.count'')'), 'true');
  update roles set archived_at = now() where key = 'harness_archived';
  perform pg_temp.eq('B archived role', pg_temp.q(v_archr, 'has_permission(''stock.count'')'), 'false');
  perform pg_temp.eq('B archived role, read', pg_temp.q(v_archr, 'has_permission(''stock.count'', ''read'')'), 'false');
  perform pg_temp.eq('B person with no role', pg_temp.q(v_none, 'has_permission(''stock.count'')'), 'false');
  -- and the neighbours of those
  perform pg_temp.eq('B archived person', pg_temp.q(v_archp, 'has_permission(''stock.count'')'), 'false');
  perform pg_temp.eq('B signed out (service role, no login)', pg_temp.q(null, 'has_permission(''stock.count'')', 'aal1', 'service_role'), 'false');
  perform pg_temp.eq('B anon cannot call it', pg_temp.q(null, 'has_permission(''stock.count'')', 'aal1', 'anon'), 'ERR:42501');
  perform pg_temp.eq('B null activity', pg_temp.q(v_admin, 'has_permission(null)'), 'false');
  perform pg_temp.eq('B mistyped level', pg_temp.q(v_staff, 'has_permission(''stock.count'', ''raed'')'), 'false');
  perform pg_temp.eq('B mistyped level, admin', pg_temp.q(v_admin, 'has_permission(''stock.count'', ''raed'')'), 'false');
  -- seeded yes, and read apart from edit
  perform pg_temp.eq('B staff delivery', pg_temp.q(v_staff, 'has_permission(''stock.delivery'')'), 'true');
  -- 0134 narrowed the volunteer to who and where, the enclosures and the map
  perform pg_temp.eq('B volunteer stocktake (taken away in 0134)', pg_temp.q(v_vol, 'has_permission(''stock.count'')'), 'false');
  perform pg_temp.eq('B volunteer weight read (taken away in 0134)', pg_temp.q(v_vol, 'has_permission(''medical.weight'', ''read'')'), 'false');
  perform pg_temp.eq('B volunteer resident read', pg_temp.q(v_vol, 'has_permission(''resident.record'', ''read'')'), 'true');
  perform pg_temp.eq('B volunteer resident edit', pg_temp.q(v_vol, 'has_permission(''resident.record'')'), 'false');
  perform pg_temp.eq('B staff clinics read', pg_temp.q(v_staff, 'has_permission(''clinics.list'', ''read'')'), 'true');
  perform pg_temp.eq('B staff clinics edit', pg_temp.q(v_staff, 'has_permission(''clinics.list'')'), 'false');
  perform pg_temp.eq('B management microchip (finding B, ruled 2026-10-07 q8: 0155 gave it)', pg_temp.q(v_mgmt, 'has_permission(''resident.microchip'')'), 'true');
  perform pg_temp.eq('B vet microchip', pg_temp.q(v_vet, 'has_permission(''resident.microchip'')'), 'true');
  perform pg_temp.eq('B staff cashflow', pg_temp.q(v_staff, 'has_permission(''reports.cashflow'', ''read'')'), 'false');
  perform pg_temp.eq('B management cashflow', pg_temp.q(v_mgmt, 'has_permission(''reports.cashflow'')'), 'true');
  perform pg_temp.eq('B admin anything', pg_temp.q(v_admin, 'has_permission(''audit.undo'')'), 'true');
  perform pg_temp.eq('B admin unknown activity (rule 8: yes before any cell)', pg_temp.q(v_admin, 'has_permission(''no.such_activity'')'), 'true');
  perform pg_temp.eq('B public viewer', pg_temp.q(v_pub, 'has_permission(''resident.record'', ''read'')'), 'false');
  perform pg_temp.eq('B management does not hold admin-only', pg_temp.q(v_mgmt, 'has_permission(''audit.view'')'), 'false');
  v_report := v_report || 'B: the four answers-no cases, archived person, signed out, anon refused, null, mistyped level; seeded yes, read vs edit, admin yes incl. unknown | ';

  -- C: my_permissions().
  perform pg_temp.eq('C admin is_admin', pg_temp.q(v_admin, '(my_permissions() ->> ''is_admin'')'), 'true');
  perform pg_temp.eq('C admin cells', pg_temp.q(v_admin, '(select count(*) from jsonb_object_keys(my_permissions() -> ''permissions''))'), '58');
  perform pg_temp.eq('C staff cells', pg_temp.q(v_staff, '(select count(*) from jsonb_object_keys(my_permissions() -> ''permissions''))'), '39');
  perform pg_temp.eq('C staff role', pg_temp.q(v_staff, '(my_permissions() -> ''role'' ->> ''key'')'), 'staff');
  perform pg_temp.eq('C staff delivery level', pg_temp.q(v_staff, '(my_permissions() -> ''permissions'' ->> ''stock.delivery'')'), '2');
  perform pg_temp.eq('C vet scopes', pg_temp.q(v_vet, '(my_permissions() -> ''scopes'' ->> ''contacts'') || ''/'' || (my_permissions() -> ''scopes'' ->> ''residents'')'), 'name_type/own_clinic');
  perform pg_temp.eq('C public viewer opens_app', pg_temp.q(v_pub, '(my_permissions() -> ''role'' ->> ''opens_app'')'), 'false');
  perform pg_temp.eq('C public viewer cells', pg_temp.q(v_pub, '(my_permissions() -> ''permissions'')::text'), '{}');
  perform pg_temp.eq('C no role', pg_temp.q(v_none, '(my_permissions() is null)'), 'true');
  perform pg_temp.eq('C archived role', pg_temp.q(v_archr, '(my_permissions() is null)'), 'true');
  perform pg_temp.eq('C archived person', pg_temp.q(v_archp, '(my_permissions() is null)'), 'true');
  perform pg_temp.eq('C anon cannot call it', pg_temp.q(null, '(my_permissions() is null)', 'aal1', 'anon'), 'ERR:42501');
  v_report := v_report || 'C: my_permissions shape and counts; null for no role, archived role, archived person | ';

  -- H: every role against every activity, at both levels, under the role's own login.
  -- The expectation is the paper's §4 table, read by the script (harness_expected).
  for v_who in select unnest(array['admin', 'management', 'staff', 'vet', 'volunteer', 'public_viewer']) loop
    for v_act in select key from permission_activities order by sort loop
      v_exp := case v_who when 'admin' then 2 else coalesce(
                 (select level from harness_expected e where e.role_key = v_who and e.activity = v_act.key), 0) end;
      -- the vet is the paper-versus-draft disagreement: recorded by eq_known, not flattened
      if v_who = 'vet' then
        perform pg_temp.eq_known('H vet ' || v_act.key || ' read',
          pg_temp.q((select id from harness_ids where who = v_who), format('has_permission(%L, ''read'')', v_act.key)), (v_exp >= 1)::text);
        perform pg_temp.eq_known('H vet ' || v_act.key || ' edit',
          pg_temp.q((select id from harness_ids where who = v_who), format('has_permission(%L)', v_act.key)), (v_exp >= 2)::text);
      else
      perform pg_temp.eq('H ' || v_who || ' ' || v_act.key || ' read',
        pg_temp.q((select id from harness_ids where who = v_who), format('has_permission(%L, ''read'')', v_act.key)),
        (v_exp >= 1)::text);
      perform pg_temp.eq('H ' || v_who || ' ' || v_act.key || ' edit',
        pg_temp.q((select id from harness_ids where who = v_who), format('has_permission(%L)', v_act.key)),
        (v_exp >= 2)::text);
      end if;
      v_checked := v_checked + 2;
    end loop;
  end loop;
  perform pg_temp.eq('H answers checked', v_checked::text, '696');
  perform pg_temp.eq('H expected cells', (select count(*) from harness_expected)::text, '109'); -- 107 on the paper; the volunteer is 5 under the draft
  v_report := v_report || 'H: 696 answers, six roles x 58 activities x read and edit, equal the paper''s §4 table | ';

  n := pg_temp.try(null, format('insert into role_permissions (role_id, activity, level) values (%L, ''stock.count'', 2)', v_role_admin), 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: a cell for admin was accepted (%)', n; end if;
  n := pg_temp.try(null, format('insert into role_permissions (role_id, activity, level) values (%L, ''stock.count'', 2)', v_role_pub), 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: a cell for public_viewer was accepted (%)', n; end if;
  n := pg_temp.try(null, format('insert into role_permissions (role_id, activity, level) values (%L, ''stock.count'', 1)', v_role_staff), 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: level 1 on a Yes/No activity was accepted (%)', n; end if;
  n := pg_temp.try(null, format('update role_permissions set level = 1 where role_id = %L and activity = ''stock.delivery''', v_role_staff), 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: a cell was updated to level 1 on a Yes/No activity (%)', n; end if;
  n := pg_temp.try(null, format('insert into role_permissions (role_id, activity, level) values (%L, ''no.such_activity'', 2)', v_role_staff), 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: a cell for an unknown activity was accepted (%)', n; end if;
  n := pg_temp.try(null, format('insert into role_permissions (role_id, activity, level) values (%L, ''stock.delivery'', 2)', v_role_staff), 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: a duplicate cell was accepted (%)', n; end if;
  n := pg_temp.try(null, 'update permission_activities set kind = ''yesno'' where key = ''facility.enclosures''', 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: an activity with Read cells became Yes/No (%)', n; end if;
  n := pg_temp.try(null, 'delete from roles where key in (''admin'', ''public_viewer'')', 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: a fixed role was deleted (%)', n; end if;
  foreach t in array array['update roles set archived_at = now() where key = ''admin''',
                           'update roles set key = ''boss'' where key = ''admin''',
                           'update roles set kind = ''default'' where key = ''public_viewer''',
                           'update roles set legacy_role = ''staff'' where key = ''admin''',
                           'insert into roles (key, name, kind) values (''admin2'', ''x'', ''fixed'')',
                           'insert into roles (key, name, kind, legacy_role) values (''boss'', ''x'', ''fixed'', ''staff'')',
                           'insert into roles (key, name, kind, legacy_role) values (''admin'', ''x'', ''default'', ''staff'')',
                           'insert into roles (key, name, kind) values (''harness_bad'', ''x'', ''default'')',
                           'insert into roles (key, name, kind, scope_photos) values (''harness_bad'', ''x'', ''custom'', ''everything'')',
                           'insert into roles (key, name, kind, scope_residents) values (''harness_bad'', ''x'', ''custom'', ''who_and_where'')',
                           'insert into roles (key, name, kind, home_path) values (''harness_bad'', ''x'', ''custom'', ''home'')',
                           'insert into roles (key, name, kind) values (''Harness Bad'', ''x'', ''custom'')'] loop
    n := pg_temp.try(null, t, 'aal1', 'service_role');
    if n <> -2 then raise exception 'HARNESS-FAIL D: accepted: % (%)', t, n; end if;
  end loop;
  v_report := v_report || 'D: no cells for admin / public_viewer, Yes/No stays level 2, unknown activity and duplicate cell refused, fixed roles immutable, bad scope values refused | ';

  -- the role_id bridge
  insert into user_roles (user_id, role) values (v_sync, 'staff');
  perform pg_temp.eq('D insert fills role_id', (select role_id::text from user_roles where user_id = v_sync), v_role_staff::text);
  update user_roles set role = 'vet' where user_id = v_sync;
  perform pg_temp.eq('D enum change moves role_id', (select r.key from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = v_sync), 'vet');
  update user_roles set role_id = (select id from roles where key = 'volunteer') where user_id = v_sync;
  perform pg_temp.eq('D role_id change moves the enum', (select role::text from user_roles where user_id = v_sync), 'volunteer');
  insert into roles (key, name, kind) values ('harness_nolegacy', 'Harness no legacy', 'custom') returning id into v_role_custom;
  n := pg_temp.try(null, format('update user_roles set role_id = %L where user_id = %L', v_role_custom, v_sync), 'aal1', 'service_role');
  if n <> -2 then raise exception 'HARNESS-FAIL D: a role with no legacy_role was assigned (%)', n; end if;
  perform pg_temp.eq('D failed assignment changed nothing', (select role::text from user_roles where user_id = v_sync), 'volunteer');
  v_report := v_report || 'D: user_roles.role_id filled on insert, follows the enum, drives the enum, refuses a role with no legacy_role | ';

  -- the last admin, judged at commit
  set constraints user_roles_keep_an_admin immediate;
  v_raised := false;
  begin
    update user_roles set archived_at = now() where role_id = v_role_admin;
  exception when check_violation then v_raised := true;
  end;
  if not v_raised then raise exception 'HARNESS-FAIL D: every admin was archived'; end if;
  v_raised := false;
  begin
    delete from user_roles where role_id = v_role_admin;
  exception when check_violation then v_raised := true;
  end;
  if not v_raised then raise exception 'HARNESS-FAIL D: every admin was deleted'; end if;
  v_raised := false;
  begin
    update user_roles set role = 'staff' where role_id = v_role_admin;
  exception when check_violation then v_raised := true;
  end;
  if not v_raised then raise exception 'HARNESS-FAIL D: every admin was demoted'; end if;
  -- one admin going while another remains is fine
  update user_roles set role = 'staff' where user_id = v_admin;
  update user_roles set role = 'admin' where user_id = v_admin;
  -- deferred: archive them all, restore one, judged only when forced
  set constraints user_roles_keep_an_admin deferred;
  update user_roles set archived_at = now() where role_id = v_role_admin;
  update user_roles set archived_at = null where user_id = v_admin;
  set constraints user_roles_keep_an_admin immediate;
  -- deferred and not restored: forced check refuses
  set constraints user_roles_keep_an_admin deferred;
  update user_roles set archived_at = now() where role_id = v_role_admin;
  v_raised := false;
  begin
    set constraints user_roles_keep_an_admin immediate;
  exception when check_violation then v_raised := true;
  end;
  if not v_raised then raise exception 'HARNESS-FAIL D: a deferred loss of every admin passed the check'; end if;
  update user_roles set archived_at = null where user_id = v_admin;
  v_report := v_report || 'D: last admin cannot be archived, deleted or demoted; swap inside one transaction passes; deferred loss is caught | ';

  -- E: RLS and grants.
  perform pg_temp.eq('E admin reads roles', pg_temp.q(v_admin, '(select count(*) from roles where key = ''admin'')', 'aal2'), '1');
  perform pg_temp.eq('E admin reads cells', pg_temp.q(v_admin, '(select count(*) from role_permissions)', 'aal1'), (select count(*)::text from role_permissions));
  perform pg_temp.eq('E admin reads catalogue', pg_temp.q(v_admin, '(select count(*) from permission_activities)', 'aal1'), '58');
  foreach t in array array['management', 'staff', 'vet', 'volunteer', 'public_viewer'] loop
    foreach n in array array[1, 2, 3] loop
      perform pg_temp.eq('E ' || t || ' reads table ' || n,
        pg_temp.q((select id from harness_ids where who = t),
                  format('(select count(*) from %s)', (array['roles', 'role_permissions', 'permission_activities'])[n::int])),
        '0');
    end loop;
  end loop;
  n := pg_temp.try(null, 'select 1 from roles', 'aal1', 'anon');
  if n <> -1 then raise exception 'HARNESS-FAIL E: anon reached roles (%)', n; end if;
  n := pg_temp.try(null, 'select 1 from role_permissions', 'aal1', 'anon');
  if n <> -1 then raise exception 'HARNESS-FAIL E: anon reached role_permissions (%)', n; end if;
  n := pg_temp.try(null, 'select 1 from permission_activities', 'aal1', 'anon');
  if n <> -1 then raise exception 'HARNESS-FAIL E: anon reached permission_activities (%)', n; end if;
  -- writes: only an admin at aal2, only to roles and role_permissions
  n := pg_temp.try(v_admin, format('insert into role_permissions (role_id, activity, level) select id, ''medical.weight'', 1 from roles where key = ''harness_archived''', v_role_staff), 'aal1');
  if n <> -1 then raise exception 'HARNESS-FAIL E: an admin at aal1 wrote a cell (%)', n; end if;
  n := pg_temp.try(v_staff, format('insert into role_permissions (role_id, activity, level) values (%L, ''medical.weight'', 1)', (select id from roles where key = 'harness_archived')), 'aal2');
  if n <> -1 then raise exception 'HARNESS-FAIL E: staff at aal2 wrote a cell (%)', n; end if;
  n := pg_temp.try(v_admin, 'update role_permissions set level = 1 where activity = ''medical.weight''', 'aal1');
  if n <> 0 and n <> -1 then raise exception 'HARNESS-FAIL E: an admin at aal1 updated cells (%)', n; end if;
  n := pg_temp.try(v_admin, 'insert into permission_activities (key, kind, area, sort) values (''harness.new'', ''level'', ''x'', 999)', 'aal2');
  if n <> -1 then raise exception 'HARNESS-FAIL E: an admin inserted into the catalogue through the API (%)', n; end if;
  -- the audit baseline for F, taken before the first permitted write
  select audit_rows into v_before from harness_baseline;
  n := pg_temp.try(v_admin, 'insert into role_permissions (role_id, activity, level) select id, ''medical.weight'', 1 from roles where key = ''harness_archived''', 'aal2');
  if n <> 1 then raise exception 'HARNESS-FAIL E: an admin at aal2 could not write a cell (%)', n; end if;
  n := pg_temp.try(v_admin, 'update role_permissions set level = 2 where activity = ''medical.weight'' and role_id = (select id from roles where key = ''harness_archived'')', 'aal2');
  if n <> 1 then raise exception 'HARNESS-FAIL E: an admin at aal2 could not edit a cell (%)', n; end if;
  n := pg_temp.try(v_admin, 'delete from role_permissions where activity = ''medical.weight'' and role_id = (select id from roles where key = ''harness_archived'')', 'aal2');
  if n <> 1 then raise exception 'HARNESS-FAIL E: an admin at aal2 could not remove a cell (%)', n; end if;
  n := pg_temp.try(v_admin, 'delete from roles where key = ''admin''', 'aal2');
  if n <> -2 then raise exception 'HARNESS-FAIL E: an admin deleted the admin role (%)', n; end if;
  n := pg_temp.try(v_admin, 'insert into role_permissions (role_id, activity, level) select id, ''stock.count'', 2 from roles where key = ''admin''', 'aal2');
  if n <> -2 then raise exception 'HARNESS-FAIL E: an admin at aal2 gave Admin a cell (%)', n; end if;
  v_report := v_report || 'E: matrix readable and writable by an admin at aal2 only; aal1, other roles and anon refused; catalogue read only | ';

  -- F: audit.
  -- 0132's seed logged nothing. 0134 deleted 21 of the volunteer's cells with the triggers live, so the log holds exactly
  -- those rows (no actor, a DELETE of a role_permissions row) and, since R2, the INSERTs of a configured role's own
  -- migration (no actor: 0136, 0141, 0143 add a roles row and its cells) and nothing else.
  perform pg_temp.eq('F seed left no audit rows but 0134''s deletions', (select not_0134 from harness_baseline)::text, '0');
  perform pg_temp.eq('F three cell writes logged', (select count(*) from audit_log where table_name = 'role_permissions' and actor is not null)::text, '3');
  perform pg_temp.eq('F by whom', (select count(*) from audit_log where table_name = 'role_permissions' and actor = v_admin)::text, '3');
  perform pg_temp.eq('F ops', (select string_agg(op, ',' order by id) from audit_log where table_name = 'role_permissions' and actor = v_admin), 'INSERT,UPDATE,DELETE');
  perform pg_temp.eq('F role edits logged', (select count(*) from audit_log where table_name = 'roles' and op = 'UPDATE' and new_row ->> 'key' = 'harness_archived')::text, '1');
  v_report := v_report || 'F: seed logged nothing; insert, update and delete of a cell each logged with the admin as actor | ';

  -- G: the file replays.
  update role_permissions set level = 2
   where activity = 'facility.enclosures' and role_id = (select id from roles where key = 'volunteer');
  update permission_activities set area = 'tampered' where key = 'stock.delivery';
  -- the replay alters user_roles, which Postgres refuses while deferred events are pending
  set constraints user_roles_keep_an_admin immediate;
  execute 'create temp table harness_pre as select count(*)::bigint as audit_rows, (select count(*) from role_permissions rp join roles r on r.id = rp.role_id where r.key in (''management'', ''staff'', ''vet'', ''volunteer''))::bigint as live_cells from audit_log where table_name in (''roles'', ''role_permissions'')';
end;
$h$;

${migration}

do $h2$
begin
  perform pg_temp.eq('G roles after replay', (select count(*) from roles where key in ('admin','management','staff','vet','volunteer','public_viewer'))::text, '6');
  perform pg_temp.eq('G activities after replay', (select count(*) from permission_activities)::text, '58');
  -- replaying 0132 alone puts back the 21 volunteer cells 0134 deleted (52+39+13+24); that is what the seed file says
  perform pg_temp.eq('G cells after replay', (select count(*) from role_permissions rp join roles r on r.id = rp.role_id where r.key in ('management','staff','vet','volunteer'))::text, '128');
  perform pg_temp.eq('G a shelter edit survives the replay', (select level::text from role_permissions rp join roles r on r.id = rp.role_id where r.key = 'volunteer' and rp.activity = 'facility.enclosures'), '2');
  perform pg_temp.eq('G the catalogue is restored', (select area from permission_activities where key = 'stock.delivery'), 'stock');
  -- 0132 alone writes nothing it did not already hold, EXCEPT the seed cells missing from the live roles: those come back as logged inserts
  -- RE-BASELINED 2026-10-06 (director-draft-apply): the replay restores every seed cell the live roles no longer hold, so it logs 122 minus
  -- the live cells it found (21 on a pristine post-0134 database; more once the Director's draft has narrowed the vet and widened the volunteer)
  perform pg_temp.eq('G replay logged exactly the seed cells the live roles lacked', (select count(*) from audit_log where table_name in ('roles', 'role_permissions'))::text, (select audit_rows + (128 - live_cells) from harness_pre)::text);

  if exists (select 1 from harness_known_red) then
    raise exception '%', 'HARNESS-KNOWN-RED every other check held; recorded disagreements with the draft: ' || (select string_agg(label || ': got ' || got || ', paper wants ' || want, '; ') from harness_known_red);
  end if;
  raise exception '%', format('HARNESS-OK %s asserted live | A: 6 roles, 58 activities, cells 52/39/13/3/0/0 | B: four answers-no cases, archived person, signed out, anon, null, mistyped level, seeded yes, read vs edit, admin yes | C: my_permissions | D: guards, role_id bridge, last admin | E: RLS at aal1/aal2, anon | F: audit | H: 660 answers (6 roles x 58 activities x read/edit) equal section 4 of the paper | G: replay keeps a shelter edit',
    ${JSON.stringify(file).replace(/"/g, "'")});
end;
$h2$;
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
