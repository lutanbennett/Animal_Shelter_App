// Rollback harness for *_app_access_gate.sql (and the public_viewer role)
// against DEV only. One transaction: throwaway logins, what each of them can
// read before the migration, the migration (twice), what each can read
// after, then a deliberate `raise exception` carrying the evidence — so
// nothing can commit.
//
//   node scripts/check-app-access-gate.mjs     (from the repo root; dev only)
//
// The logins, each a new auth.users row with a user_roles row:
//   staff         the control: must read exactly what it read before
//   archived      role 'staff', archived_at set — current_user_role() null
//   roleless      no user_roles row at all
//   public_viewer role 'public_viewer' — only once *_public_viewer_role.sql
//                 has been applied (a new enum value cannot be used in the
//                 transaction that adds it); reported as skipped otherwise
//   anon          no JWT subject, role anon
//
// The rule being checked: after the migration, archived, roleless and
// public_viewer read nothing from any internal view or table, the same as
// each other, and exactly what anon reads from the public site.
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
const file = readdirSync(dir).find((f) => /^\d+_app_access_gate\.sql$/.test(f));
if (!file) throw new Error("no *_app_access_gate.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

// What a session without a staff role must not read. `-1` is "permission
// denied", which is what anon gets from all of these.
const INTERNAL = [
  "app_users",
  "current_placement",
  "resident_current_state",
  "immunization_compliance",
  "immunization_duplicate_check",
  "translation_queue",
  "translatable_fields",
  "resident_list_view",
  "immunization_next_due",
  "project_folder_summary",
  "residents",
  "contacts",
  "placement_history",
  "translations",
  "user_roles",
  "maintenance",
  "assistant_actions",
];
// Invoker functions granted to authenticated: rows with anything in them.
const FUNCTIONS = {
  "cashflow_forecast()": "select * from cashflow_forecast(current_date, current_date + 180) where amount <> 0 or missing_prices <> 0",
};
// What the public site reads with the anon key.
const PUBLIC = [
  "public_resident_profiles",
  "public_resident_cards",
  "public_resident_photos",
  "public_recent_adoptions",
  "public_shelter_stats",
  "public_enclosures",
  "public_projects",
  "public_project_photos",
  "public_shelter_friends",
  "public_site_pages",
  "site_content",
  "site_content_photos",
  "site_pages",
];

const queries = [
  ...INTERNAL.map((t) => [t, `select 1 from ${t}`, "internal"]),
  ...Object.entries(FUNCTIONS).map(([k, q]) => [k, q, "internal"]),
  ...PUBLIC.map((t) => [t, `select 1 from ${t}`, "public"]),
];
const qArray = (i) => `array[${queries.map((q) => `$q$${q[i]}$q$`).join(", ")}]`;

const sql = `
begin;

-- How many rows a login (null = anon) gets from a query; -1 if refused.
create function pg_temp.seen(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    set local role anon;
  else
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
  end if;
  begin
    execute 'select count(*) from (' || p_sql || ') q' into v;
  exception when insufficient_privilege then v := -1;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table seen (phase text, who text, label text, kind text, n bigint);
create temp table who (who text primary key, uid uuid);

do $h$
declare
  v_pv boolean := exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
                           where t.typname = 'app_role' and e.enumlabel = 'public_viewer');
  r record;
begin
  insert into who values
    ('staff', gen_random_uuid()), ('archived', gen_random_uuid()),
    ('roleless', gen_random_uuid()), ('anon', null);
  if v_pv then insert into who values ('public_viewer', gen_random_uuid()); end if;

  for r in select * from who where uid is not null loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-' || r.who || '-' || r.uid || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role) select uid, 'staff' from who where who = 'staff';
  insert into user_roles (user_id, role, archived_at) select uid, 'staff', now() from who where who = 'archived';
  if v_pv then
    execute $e$insert into user_roles (user_id, role) select uid, 'public_viewer' from who where who = 'public_viewer'$e$;
  end if;
end $h$;

-- Before the migration.
insert into seen
select 'before', w.who, q.label, q.kind, pg_temp.seen(w.uid, q.sql)
  from who w,
       unnest(${qArray(0)}, ${qArray(1)}, ${qArray(2)}) as q(label, sql, kind);

${migration}
-- a second run of the whole file must be harmless
${migration}

-- After.
insert into seen
select 'after', w.who, q.label, q.kind, pg_temp.seen(w.uid, q.sql)
  from who w,
       unnest(${qArray(0)}, ${qArray(1)}, ${qArray(2)}) as q(label, sql, kind);

do $h$
declare
  r record;
  v_report text := '';
  v_bad text := '';
  v_pv boolean := exists (select 1 from who where who = 'public_viewer');
  v_n bigint;
begin
  -- A. without a staff role, nothing internal after (0 rows, or refused for anon)
  for r in select * from seen where phase = 'after' and kind = 'internal'
             and who in ('archived', 'roleless', 'public_viewer') and n <> 0 loop
    v_bad := v_bad || format(' A:%s reads %s rows of %s;', r.who, r.n, r.label);
  end loop;
  for r in select * from seen where phase = 'after' and kind = 'internal' and who = 'anon' and n <> -1 loop
    v_bad := v_bad || format(' A:anon reads %s rows of %s;', r.n, r.label);
  end loop;

  -- B. the staff control reads exactly what it read before, everywhere
  for r in select b.label, b.n as before_n, a.n as after_n from seen b join seen a using (who, label)
            where b.phase = 'before' and a.phase = 'after' and who = 'staff' and a.n <> b.n loop
    v_bad := v_bad || format(' B:staff %s %s -> %s;', r.label, r.before_n, r.after_n);
  end loop;
  select count(*) into v_n from seen where phase = 'after' and who = 'staff' and kind = 'internal' and n > 0;
  if v_n < 8 then v_bad := v_bad || format(' B:staff reads only %s internal objects (setup?);', v_n); end if;

  -- C. everyone reads the public site exactly as anon does, before and after
  for r in select s.phase, s.who, s.label, s.n, a.n as anon_n from seen s
             join seen a on a.phase = s.phase and a.label = s.label and a.who = 'anon'
            where s.kind = 'public' and s.n <> a.n loop
    v_bad := v_bad || format(' C:%s %s %s reads %s, anon %s;', r.phase, r.who, r.label, r.n, r.anon_n);
  end loop;
  select count(*) into v_n from seen where phase = 'after' and who = 'anon' and kind = 'public' and n > 0;
  if v_n < 5 then v_bad := v_bad || format(' C:anon reads only %s public objects (setup?);', v_n); end if;

  -- D. public_viewer and archived are indistinguishable
  if v_pv then
    for r in select p.label, p.n as pv_n, a.n as ar_n from seen p join seen a using (phase, label)
              where p.phase = 'after' and p.who = 'public_viewer' and a.who = 'archived' and p.n <> a.n loop
      v_bad := v_bad || format(' D:%s public_viewer %s, archived %s;', r.label, r.pv_n, r.ar_n);
    end loop;
  end if;

  -- E. shape: six wrappers in public over six views in private, gated
  select count(*) into v_n from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'private' and c.relkind = 'v'
     and c.relname in ('app_users', 'current_placement', 'resident_current_state',
                       'immunization_compliance', 'immunization_duplicate_check', 'translation_queue');
  if v_n <> 6 then v_bad := v_bad || format(' E:%s of 6 views in private;', v_n); end if;
  select count(*) into v_n from pg_views
   where schemaname = 'public' and definition ilike '%has_app_access()%'
     and viewname in ('app_users', 'current_placement', 'resident_current_state',
                      'immunization_compliance', 'immunization_duplicate_check', 'translation_queue');
  if v_n <> 6 then v_bad := v_bad || format(' E:%s of 6 public wrappers gated;', v_n); end if;
  select count(*) into v_n from pg_views
   where schemaname = 'public' and viewname like 'public\\_%' and definition ilike '%has_app_access%';
  if v_n <> 0 then v_bad := v_bad || format(' E:%s public_* views reach the gate;', v_n); end if;

  if v_bad <> '' then raise exception 'FAIL%', v_bad; end if;

  -- The evidence: what was open before, per object, for the non-staff logins.
  for r in select b.label,
                  max(b.n) filter (where b.who = 'staff') as st,
                  max(b.n) filter (where b.who = 'archived') as ar,
                  max(b.n) filter (where b.who = 'roleless') as rl,
                  max(b.n) filter (where b.who = 'public_viewer') as pv
             from seen b where b.phase = 'before' and b.kind = 'internal'
            group by b.label
           having max(b.n) filter (where b.who in ('archived', 'roleless', 'public_viewer')) > 0
            order by b.label loop
    v_report := v_report || format(E'\\n  before: %s  staff=%s archived=%s roleless=%s public_viewer=%s',
                                   r.label, r.st, r.ar, r.rl, coalesce(r.pv::text, 'n/a'));
  end loop;
  raise exception '%', format(
    'HARNESS-OK %s | A: archived, roleless%s read 0 rows of %s internal objects after, anon refused all | B: staff control unchanged on every object | C: every login reads the %s public objects exactly as anon, before and after | D: %s | E: 6 views in private, 6 gated wrappers, no public_* view reaches the gate | file ran twice%s',
    ${JSON.stringify(file).replace(/"/g, "'")},
    case when v_pv then ', public_viewer' else '' end,
    ${INTERNAL.length + Object.keys(FUNCTIONS).length},
    ${PUBLIC.length},
    case when v_pv then 'public_viewer = archived on every object'
         else 'SKIPPED — public_viewer is not in app_role on dev yet (apply *_public_viewer_role.sql, then rerun)' end,
    v_report);
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
