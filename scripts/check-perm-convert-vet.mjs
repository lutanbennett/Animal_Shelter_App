// perm-convert-vet (0167): the vet's 54 policies ask is_clinic_login() instead of current_user_role() = 'vet'.
//
//   node scripts/check-perm-convert-vet.mjs                  (from the repo root; dev only)
//   node scripts/check-perm-convert-vet.mjs <migration.sql>  (run against another file, e.g. a mutant)
//
// The claim is "no vet, and nobody else, gains or loses a row", and check-permission-parity cannot make it: it
// probes cells, and these policies ask none. So, in ONE transaction that always ends in `raise exception` (nothing
// is kept), under each login's own JWT (set local role authenticated + request.jwt.claims):
//   1. BEFORE: for every login in user_roles, count the rows it can select on each of the 29 tables; for every
//      vet and one login of each other role, also the rows an update (col = col) and a delete reach. Each probe
//      runs in its own sub-block that is rolled back, so one probe's delete does not feed the next.
//   2. Run the migration file inside the same transaction.
//   3. AFTER: the same probes. Every answer must be identical (a count, or the same SQLSTATE).
//   4. is_clinic_login() agrees with current_user_role() = 'vet' for every login, and the vets do read rows (so
//      "identical" is not "identically empty").
// Before 0167 was applied to dev this compared the old policies with the new: 2,262 probes, 0 differences. A
// mutant that made is_clinic_login() answer no for everyone gave 196 differences, so it can fail. Since the apply
// the BEFORE side is already 0167, so steps 1-3 now prove the file re-runs as a no-op; step 4 still holds the line.
// Inserts are not probed: each insert policy's WITH CHECK is the same substitution as the update policy beside it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(process.argv[2] ?? join(root, "supabase/migrations/0167_perm_convert_vet.sql"), "utf8");
const probe = (phase) => `
do $p$
declare u record; t text; n int; res text; who text; col text; full_probe boolean;
  tabs text[] := array['adoption_updates','attachments','blood_test_types','blood_tests','bulk_appointments','diet_types','enclosures','frequency','immunization_records','immunization_types','medication','placement_history','prescriptions','procedure_types','procedures','recurring_job_assignees','recurring_job_occurrence_assignees','recurring_job_occurrences','recurring_jobs','resident_diets','residents','shelter_friends','translations','vet_appointments','vet_doctor_clinics','vet_doctors','vets','weight','zones'];
begin
  for u in select distinct on (ur.user_id) ur.user_id, coalesce(r.key, '?') as key,
             (r.key = 'vet' or ur.user_id in (select distinct on (r2.key) ur2.user_id from user_roles ur2 join roles r2 on r2.id = ur2.role_id where ur2.archived_at is null order by r2.key, ur2.user_id)) as full_probe
             from user_roles ur left join roles r on r.id = ur.role_id order by ur.user_id loop
    foreach t in array tabs loop
      foreach who in array (case when u.full_probe then array['select','update','delete'] else array['select'] end) loop
        select attname into col from pg_attribute where attrelid = ('public.' || t)::regclass and attnum > 0 and not attisdropped order by attnum limit 1;
        begin
          perform set_config('request.jwt.claims', json_build_object('sub', u.user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
          set local role authenticated;
          if who = 'select' then execute format('select count(*) from public.%I', t) into n;
          elsif who = 'update' then execute format('with x as (update public.%I set %I = %I returning 1) select count(*) from x', t, col, col) into n;
          else execute format('with x as (delete from public.%I returning 1) select count(*) from x', t) into n;
          end if;
          raise exception using errcode = 'ZZ001', message = n::text;
        exception when sqlstate 'ZZ001' then res := sqlerrm;
                  when others then res := 'ERR ' || sqlstate;
        end;
        insert into pg_temp.snap values ('${phase}', u.user_id, u.key, t, who, res);
      end loop;
    end loop;
  end loop;
end $p$;
`;
const final = `
do $f$
declare diffs int; total int; vets int; agree int; s text; uidt text; nlogins int;
begin
  select count(*) into total from pg_temp.snap where phase = 'before';
  select count(*) into diffs from pg_temp.snap a full join pg_temp.snap b
    on b.phase = 'after' and a.uid = b.uid and a.tab = b.tab and a.op = b.op
   where a.phase = 'before' and (b.res is distinct from a.res);
  select count(*) into vets from pg_temp.snap where phase = 'after' and key = 'vet' and op = 'select' and res <> '0';
  select string_agg(format('%s %s %s: %s -> %s', a.key, a.tab, a.op, a.res, b.res), '; ') into s
    from pg_temp.snap a join pg_temp.snap b on b.phase = 'after' and a.uid = b.uid and a.tab = b.tab and a.op = b.op
   where a.phase = 'before' and a.res is distinct from b.res;
  agree := 0; nlogins := 0;
  for uidt in select distinct user_id::text from user_roles loop
    nlogins := nlogins + 1;
    perform set_config('request.jwt.claims', json_build_object('sub', uidt, 'role', 'authenticated')::text, true);
    set local role authenticated;
    if (select public.is_clinic_login()) = coalesce((select public.current_user_role()) = 'vet', false) then agree := agree + 1; end if;
    reset role;
  end loop;
  raise exception 'RESULT probes=% differences=% vet-nonzero-reads=% is_clinic_login-agrees=%/% diffs: %',
    total, diffs, vets, agree, nlogins, coalesce(s, 'none');
end $f$;
`;

const query = `begin;
create temp table snap (phase text, uid uuid, key text, tab text, op text, res text);
${probe("before")}
${migration}
${probe("after")}
${final}
rollback;`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const body = await res.json();
// The report is the exception's message: the only way out of a transaction that keeps nothing.
const m = String(body?.message ?? "").match(/RESULT probes=(\d+) differences=(\d+) vet-nonzero-reads=(\d+) is_clinic_login-agrees=(\d+)\/(\d+) diffs: (.*)/);
if (!m) throw new Error(`harness did not report (${res.status}): ${JSON.stringify(body).slice(0, 800)}`);
const [, probes, diffs, vetReads, agree, logins, list] = m;
console.log(`${probes} probes, ${diffs} differences; vets read rows on ${vetReads} table probes; is_clinic_login() agrees with the enum for ${agree}/${logins} logins`);
if (Number(diffs)) console.log(`differences: ${list}`);
const ok = Number(diffs) === 0 && Number(vetReads) > 0 && agree === logins;
console.log(ok ? "\nRESULT: GREEN" : "\nRESULT: RED");
process.exitCode = ok ? 0 : 1;
