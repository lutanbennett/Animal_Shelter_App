// Rollback harness for 0095_recurring_jobs.sql against DEV only.
// One transaction: the migration (twice), the recurrence rule against real
// calendar dates, the table constraints and triggers, harness logins calling
// record_recurring_job() / reassign_recurring_job() as each role, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-recurring-jobs.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
//
// Expected dates were worked out from the calendar, not from the SQL: first
// Mondays Oct 2026–Feb 2027 are 5 Oct, 2 Nov, 7 Dec, 4 Jan, 1 Feb; last
// Fridays are 30 Oct, 27 Nov, 25 Dec, 29 Jan, 26 Feb; 5 Oct 2026 and
// 21 Dec 2026 are Mondays, 7 Oct 2026 a Wednesday, 1 Oct 2026 a Thursday.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0095_recurring_jobs.sql"), "utf8");

// [label, repeat, every, weekdays, month_day, week_of_month, starts_on, ends_on, from, to, expected]
const rules = [
  ["R1 weekly Mon", "weekly", 1, "{1}", null, null, "2026-10-05", null, "2026-10-01", "2026-10-31",
    "2026-10-05 2026-10-12 2026-10-19 2026-10-26"],
  ["R2 fortnightly Mon, starts Wed", "weekly", 2, "{1}", null, null, "2026-10-07", null, "2026-10-01", "2026-11-20",
    "2026-10-19 2026-11-02 2026-11-16"],
  ["R3 fortnightly Mon, starts Mon", "weekly", 2, "{1}", null, null, "2026-10-05", null, "2026-10-01", "2026-11-20",
    "2026-10-05 2026-10-19 2026-11-02 2026-11-16"],
  ["R4 weekly Mon+Thu", "weekly", 1, "{1,4}", null, null, "2026-10-01", null, "2026-09-28", "2026-10-10",
    "2026-10-01 2026-10-05 2026-10-08"],
  ["R5 fortnightly across year end", "weekly", 2, "{1}", null, null, "2026-12-21", null, "2026-12-01", "2027-02-01",
    "2026-12-21 2027-01-04 2027-01-18 2027-02-01"],
  ["R6 monthly on the 31st", "monthly_day", 1, null, 31, null, "2026-01-01", null, "2026-01-01", "2026-12-31",
    "2026-01-31 2026-02-28 2026-03-31 2026-04-30 2026-05-31 2026-06-30 2026-07-31 2026-08-31 2026-09-30 2026-10-31 2026-11-30 2026-12-31"],
  ["R7 the 31st in a leap February", "monthly_day", 1, null, 31, null, "2028-01-01", null, "2028-02-01", "2028-03-01",
    "2028-02-29"],
  ["R8 every 3 months on the 15th", "monthly_day", 3, null, 15, null, "2026-10-01", null, "2026-10-01", "2027-12-31",
    "2026-10-15 2027-01-15 2027-04-15 2027-07-15 2027-10-15"],
  ["R9 first Monday", "monthly_weekday", 1, "{1}", null, 1, "2026-10-01", null, "2026-10-01", "2027-02-28",
    "2026-10-05 2026-11-02 2026-12-07 2027-01-04 2027-02-01"],
  ["R10 last Friday", "monthly_weekday", 1, "{5}", null, -1, "2026-10-01", null, "2026-10-01", "2027-02-28",
    "2026-10-30 2026-11-27 2026-12-25 2027-01-29 2027-02-26"],
  ["R11 ends_on is inclusive", "weekly", 1, "{1}", null, null, "2026-10-05", "2026-10-19", "2026-10-01", "2026-10-31",
    "2026-10-05 2026-10-12 2026-10-19"],
  ["R12 starts mid-month, day already past", "monthly_day", 1, null, 10, null, "2026-10-15", null, "2026-10-01", "2026-12-31",
    "2026-11-10 2026-12-10"],
  ["R13 Sunday is 7", "weekly", 1, "{7}", null, null, "2026-10-01", null, "2026-10-01", "2026-10-14",
    "2026-10-04 2026-10-11"],
];

const q = (v) => (v === null ? "null" : `'${v}'`);
const ruleChecks = rules
  .map(([label, repeat, every, wd, md, wom, start, end, from, to, expected]) => `
  v := pg_temp.dates(${q(repeat)}, ${every}, ${q(wd)}, ${md ?? "null"}::int, ${wom ?? "null"}::int, ${q(start)}, ${q(end)}, ${q(from)}, ${q(to)});
  if v is distinct from '${expected}' then raise exception 'FAIL ${label}: got [%]', v; end if;
  v_report := v_report || ' | ${label}: ' || v;`)
  .join("\n");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

create function pg_temp.dates(p_repeat text, p_every int, p_weekdays smallint[], p_md int, p_wom int,
                              p_start date, p_end date, p_from date, p_to date)
returns text language sql as $f$
  select coalesce(string_agg(d::text, ' ' order by d), '')
    from recurrence_dates(p_repeat, p_every, p_weekdays, p_md::smallint, p_wom::smallint, p_start, p_end, p_from, p_to) d
$f$;

create temp table who (who text primary key, uid uuid);
insert into who values
  ('management', gen_random_uuid()), ('admin', gen_random_uuid()),
  ('staff', gen_random_uuid()), ('staff2', gen_random_uuid()), ('volunteer', gen_random_uuid()),
  ('vet', gen_random_uuid()), ('public_viewer', gen_random_uuid()), ('archived', gen_random_uuid()),
  ('roleless', gen_random_uuid()), ('anon', null);
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0095-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from who where uid is not null;
insert into user_roles (user_id, role, archived_at)
select uid,
       (case who when 'staff2' then 'staff' when 'archived' then 'staff' else who end)::app_role,
       case who when 'archived' then now() end
  from who where who not in ('roleless', 'anon');
grant select on who to authenticated, anon;

-- Run one statement as a login ('anon' = signed out). Returns its single
-- text value, 'NULL', or 'ERR <sqlstate> <message>'. Writes are kept unless
-- the statement raised.
create function pg_temp.as_login(p_who text, p_sql text) returns text language plpgsql as $f$
declare v_uid uuid; v text;
begin
  select uid into v_uid from who where who = p_who;
  if p_who = 'anon' then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    set local role anon;
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
  end if;
  begin
    execute p_sql into v;
    v := coalesce(v, 'NULL');
  exception when others then v := 'ERR ' || sqlstate || ' ' || sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

-- record / reassign as a login, returning the row as JSON
create function pg_temp.rec(p_who text, p_job uuid, p_on date, p_outcome text, p_note text default null)
returns text language sql as $f$
  select pg_temp.as_login(p_who, format(
    'select row_to_json(r)::text from record_recurring_job(%L, %L, %L, %L) r', p_job, p_on, p_outcome, p_note))
$f$;
create function pg_temp.reassign(p_who text, p_job uuid, p_on date, p_whos text[], p_note text default null)
returns text language sql as $f$
  select pg_temp.as_login(p_who, format(
    'select row_to_json(r)::text from reassign_recurring_job(%L, %L, %L::uuid[], %L) r', p_job, p_on,
    (select coalesce(array_agg(coalesce(w.uid, '00000000-0000-0000-0000-00000000dead'::uuid)), '{}')
       from unnest(p_whos) x left join who w on w.who = x), p_note))
$f$;

do $h$
declare
  v text; v2 text; v_n int; v_id uuid; v_ts timestamptz;
  j1 uuid; ja uuid; jb uuid; jc uuid; jfree uuid;
  v_report text := '';
  v_staff uuid := (select uid from who where who = 'staff');
  v_vol uuid := (select uid from who where who = 'volunteer');
  v_mgmt uuid := (select uid from who where who = 'management');
begin
  -- =====================================================================
  -- R. The rule against real dates
  -- =====================================================================
${ruleChecks}

  -- R14. the session time zone cannot move a date (the generate_series /
  -- timestamptz trap): R2 and R10 again at both ends of the world
  set local timezone = 'Pacific/Kiritimati';
  v := pg_temp.dates('weekly', 2, '{1}', null::int, null::int, '2026-10-07', null, '2026-10-01', '2026-11-20')
       || ' / ' || pg_temp.dates('monthly_weekday', 1, '{5}', null::int, -1, '2026-10-01', null, '2026-10-01', '2027-02-28');
  set local timezone = 'Pacific/Pago_Pago';
  v2 := pg_temp.dates('weekly', 2, '{1}', null::int, null::int, '2026-10-07', null, '2026-10-01', '2026-11-20')
       || ' / ' || pg_temp.dates('monthly_weekday', 1, '{5}', null::int, -1, '2026-10-01', null, '2026-10-01', '2027-02-28');
  set local timezone = 'UTC';
  if v <> v2 or v <> '2026-10-19 2026-11-02 2026-11-16 / 2026-10-30 2026-11-27 2026-12-25 2027-01-29 2027-02-26' then
    raise exception 'FAIL R14: UTC+14 [%] vs UTC-11 [%]', v, v2;
  end if;

  -- R15. properties over five years (60 months): every month_day 1–31 falls
  -- exactly once a month; every (week_of_month, weekday) exactly once a month,
  -- the Nth in days 7N-6..7N and "last" in the month's final seven days;
  -- fortnightly dates are exactly 14 days apart
  create temp table five_years as select date '2026-01-01' + i as d from generate_series(0, date '2030-12-31' - date '2026-01-01') i;
  for i in 1..31 loop
    select count(*) into v_n from five_years
     where recurrence_occurs_on(d, 'monthly_day', 1, null, i::smallint, null, '2026-01-01', null);
    if v_n <> 60 then raise exception 'FAIL R15: month_day % fell % times in 60 months', i, v_n; end if;
  end loop;
  for wd in 1..7 loop
    foreach v_n in array array[1, 2, 3, 4, -1] loop
      if (select count(*) from five_years
           where recurrence_occurs_on(d, 'monthly_weekday', 1, array[wd]::smallint[], null, v_n::smallint, '2026-01-01', null)) <> 60
         or exists (select 1 from five_years
                     where recurrence_occurs_on(d, 'monthly_weekday', 1, array[wd]::smallint[], null, v_n::smallint, '2026-01-01', null)
                       and (extract(isodow from d) <> wd
                        or (v_n > 0 and extract(day from d)::int not between 7 * v_n - 6 and 7 * v_n)
                        or (v_n = -1 and extract(month from d + 7) = extract(month from d)))) then
        raise exception 'FAIL R15: week_of_month % weekday % wrong', v_n, wd;
      end if;
    end loop;
  end loop;
  if exists (select 1 from (select d - lag(d) over (order by d) as gap
                              from five_years
                             where recurrence_occurs_on(d, 'weekly', 2, '{3}', null, null, '2026-01-01', null)) g
              where gap is not null and gap <> 14) then
    raise exception 'FAIL R15: fortnightly gaps not all 14 days';
  end if;
  v_report := v_report || ' | R14 same dates at UTC+14 and UTC-11 | R15 60/60 months for every month_day and every Nth/last weekday, fortnightly gaps all 14';

  -- R16. a range over two years is refused
  begin
    perform recurrence_dates('weekly', 1, '{1}', null, null, '2026-01-01', null, '2026-01-01', '2028-03-01');
    raise exception 'FAIL R16: 790-day range accepted';
  exception when raise_exception then
    if sqlerrm not like 'Ask for at most two years%' then raise; end if;
  end;

  -- =====================================================================
  -- T. Table constraints, defaults and triggers (as the migration's owner)
  -- =====================================================================
  insert into recurring_jobs (title, repeat, weekdays) values ('harness 0095 defaults', 'weekly', '{1}') returning id into v_id;
  if (select row(starts_on, overdue_from, active, time_of_day, every, ends_on, depends_on_job_id, link_path)
        from recurring_jobs where id = v_id)
     is distinct from row(shelter_today(), shelter_today(), true, 'anytime'::text, 1, null::date, null::uuid, null::text) then
    raise exception 'FAIL T1 defaults: %', (select row_to_json(j) from recurring_jobs j where id = v_id);
  end if;

  -- T2. each of these must be refused by a check constraint
  foreach v in array array[
    $$('weekly', null, null, null, 1, null)$$,          -- weekly, no weekdays
    $$('weekly', '{}', null, null, 1, null)$$,          -- weekly, empty weekdays
    $$('weekly', '{0}', null, null, 1, null)$$,         -- weekday 0
    $$('weekly', '{8}', null, null, 1, null)$$,         -- weekday 8
    $$('weekly', '{1,null}', null, null, 1, null)$$,    -- a null weekday
    $$('weekly', '{1}', 5, null, 1, null)$$,            -- weekly with month_day
    $$('weekly', '{1}', null, null, 0, null)$$,         -- every 0
    $$('weekly', '{1}', null, null, 53, null)$$,        -- every 53
    $$('monthly_day', null, null, null, 1, null)$$,     -- monthly_day, no day
    $$('monthly_day', null, 32, null, 1, null)$$,       -- day 32
    $$('monthly_day', null, 0, null, 1, null)$$,        -- day 0
    $$('monthly_day', '{1}', 5, null, 1, null)$$,       -- monthly_day with weekdays
    $$('monthly_weekday', '{1,2}', null, 1, 1, null)$$, -- two weekdays
    $$('monthly_weekday', '{1}', null, 5, 1, null)$$,   -- a 5th week
    $$('monthly_weekday', '{1}', null, 0, 1, null)$$,   -- week 0
    $$('monthly_weekday', '{1}', null, null, 1, null)$$,-- no week
    $$('yearly', '{1}', null, null, 1, null)$$,         -- unknown repeat
    $$('weekly', '{1}', null, null, 1, '2000-01-01')$$  -- ends before it starts
  ] loop
    begin
      execute 'insert into recurring_jobs (title, repeat, weekdays, month_day, week_of_month, every, ends_on) values (''harness 0095 bad'', '
              || substr(v, 2);
      raise exception 'FAIL T2: accepted %', v;
    exception when check_violation then null;
    end;
  end loop;
  foreach v in array array['https://evil.example', '//evil.example', '/\\evil.example', 'stocktake', ''] loop
    begin
      insert into recurring_jobs (title, repeat, weekdays, link_path) values ('harness 0095 link', 'weekly', '{1}', v);
      raise exception 'FAIL T2: link_path % accepted', v;
    exception when check_violation then null;
    end;
  end loop;
  foreach v in array array['   ', ''] loop
    begin
      insert into recurring_jobs (title, repeat, weekdays) values (v, 'weekly', '{1}');
      raise exception 'FAIL T2: title [%] accepted', v;
    exception when check_violation then null;
    end;
  end loop;
  insert into recurring_jobs (title, repeat, weekdays, link_path, time_of_day) values
    ('harness 0095 link ok', 'weekly', '{1}', '/stocktake?tab=diets', 'morning'),
    ('harness 0095 root ok', 'weekly', '{1}', '/', 'evening');
  v_report := v_report || ' | T1 defaults today/today/active/anytime | T2 18 bad rules, 5 bad links, 2 blank titles refused; /stocktake?tab=diets and / accepted';

  -- T3. dependency cycles refused: self, two-step, three-step
  insert into recurring_jobs (title, repeat, weekdays) values ('harness 0095 A', 'weekly', '{1}') returning id into ja;
  insert into recurring_jobs (title, repeat, weekdays, depends_on_job_id) values ('harness 0095 B', 'weekly', '{1}', ja) returning id into jb;
  insert into recurring_jobs (title, repeat, weekdays, depends_on_job_id) values ('harness 0095 C', 'weekly', '{1}', jb) returning id into jc;
  begin
    update recurring_jobs set depends_on_job_id = ja where id = ja;
    raise exception 'FAIL T3: self-dependency accepted';
  exception when check_violation or raise_exception then
    if sqlstate = 'P0001' and sqlerrm like 'FAIL%' then raise; end if;
  end;
  foreach v_id in array array[jb, jc] loop
    begin
      update recurring_jobs set depends_on_job_id = v_id where id = ja;
      raise exception 'FAIL T3: cycle through % accepted', v_id;
    exception when raise_exception then
      if sqlerrm <> 'A job cannot wait for itself, directly or through other jobs.' then raise; end if;
    end;
  end loop;
  -- deleting the job waited for releases the waiter
  delete from recurring_jobs where id = ja;
  if (select depends_on_job_id from recurring_jobs where id = jb) is not null then raise exception 'FAIL T3: set null on delete'; end if;

  -- T4. overdue_from: kept on a plain edit, reset to today on resume or a rule change
  update recurring_jobs set overdue_from = '2000-01-01', active = false where id = jc;
  update recurring_jobs set title = 'harness 0095 C renamed', ends_on = '2030-01-01', time_of_day = 'afternoon' where id = jc;
  if (select overdue_from from recurring_jobs where id = jc) <> '2000-01-01' then raise exception 'FAIL T4: plain edit moved overdue_from'; end if;
  update recurring_jobs set active = true where id = jc;
  if (select overdue_from from recurring_jobs where id = jc) <> shelter_today() then raise exception 'FAIL T4: resume did not reset overdue_from'; end if;
  foreach v in array array['weekdays = ''{2}''', 'every = 2', 'starts_on = ''2026-01-05''',
                           'repeat = ''monthly_day'', weekdays = null, month_day = 3'] loop
    update recurring_jobs set overdue_from = '2000-01-01' where id = jc;
    execute format('update recurring_jobs set %s where id = %L', v, jc);
    if (select overdue_from from recurring_jobs where id = jc) <> shelter_today() then
      raise exception 'FAIL T4: % did not reset overdue_from', v;
    end if;
  end loop;
  -- T5. updated_at moves on a real change only (touch_updated_at, 0078)
  update recurring_jobs set updated_at = '2000-01-01' where id = jc;
  if (select updated_at from recurring_jobs where id = jc) <> now() then raise exception 'FAIL T5: updated_at settable'; end if;
  v_report := v_report || ' | T3 self / 2-step / 3-step cycles refused, delete releases | T4 overdue_from kept on title/ends_on/time edit, reset on resume, weekdays, every, starts_on, repeat | T5 updated_at';

  -- =====================================================================
  -- F. The functions, as each role. J1: every Monday from 3 Aug 2026,
  -- usually staff's. All "done" dates are in the past, so the harness does
  -- not depend on the day it runs.
  -- =====================================================================
  insert into recurring_jobs (title, repeat, weekdays, starts_on, link_path)
  values ('harness 0095 stocktake', 'weekly', '{1}', '2026-08-03', '/stocktake') returning id into j1;
  insert into recurring_job_assignees (job_id, user_id) values (j1, v_staff);

  -- F1. the assignee marks a date done: stamped by the function, not the caller
  v := pg_temp.rec('staff', j1, '2026-08-10', 'done', '  counted everything  ');
  if (select row(outcome, done_by, done_at, note, reassigned_at) from recurring_job_occurrences where job_id = j1 and occurs_on = '2026-08-10')
     is distinct from row('done'::text, v_staff, now(), 'counted everything'::text, null::timestamptz) then
    raise exception 'FAIL F1: %', v;
  end if;
  -- re-recording overwrites; skipped with no note stores null
  v := pg_temp.rec('staff', j1, '2026-08-10', 'skipped', '   ');
  if (select row(outcome, note) from recurring_job_occurrences where job_id = j1 and occurs_on = '2026-08-10')
     is distinct from row('skipped'::text, null::text) then raise exception 'FAIL F1 overwrite: %', v; end if;

  -- F2. refusals
  v := pg_temp.rec('staff2', j1, '2026-08-17', 'done');
  if v <> 'ERR P0001 Only the people this job is assigned to, or management, can record it.' then raise exception 'FAIL F2 not assigned: %', v; end if;
  v := pg_temp.rec('vet', j1, '2026-08-17', 'done');
  if v <> 'ERR P0001 Only the people this job is assigned to, or management, can record it.' then raise exception 'FAIL F2 vet: %', v; end if;
  v := pg_temp.rec('staff', j1, '2026-08-18', 'done');
  if v <> 'ERR P0001 This job does not fall on 18 Aug 2026.' then raise exception 'FAIL F2 Tuesday: %', v; end if;
  v := pg_temp.rec('staff', j1, '2026-07-27', 'done');
  if v <> 'ERR P0001 This job does not fall on 27 Jul 2026.' then raise exception 'FAIL F2 before start: %', v; end if;
  v := pg_temp.rec('staff', j1, '2027-01-04', 'done');
  if v <> 'ERR P0001 A job cannot be marked done before its day. It can be skipped ahead.' then raise exception 'FAIL F2 future done: %', v; end if;
  v := pg_temp.rec('staff', j1, '2026-08-17', 'finished');
  if v <> 'ERR P0001 A job can be marked done or skipped.' then raise exception 'FAIL F2 bad outcome: %', v; end if;
  v := pg_temp.rec('staff', gen_random_uuid(), '2026-08-17', 'done');
  if v <> 'ERR P0001 That recurring job no longer exists.' then raise exception 'FAIL F2 no job: %', v; end if;
  foreach v2 in array array['public_viewer', 'roleless', 'archived'] loop
    v := pg_temp.rec(v2, j1, '2026-08-17', 'done');
    if v <> 'ERR P0001 Not authorized to record a recurring job.' then raise exception 'FAIL F2 %: %', v2, v; end if;
  end loop;
  v := pg_temp.rec('anon', j1, '2026-08-17', 'done');
  if v not like 'ERR 42501 permission denied for function record_recurring_job%' then raise exception 'FAIL F2 anon: %', v; end if;
  if (select count(*) from recurring_job_occurrences where job_id = j1) <> 1 then raise exception 'FAIL F2: a refusal wrote a row'; end if;

  -- F3. skipping ahead is allowed; clearing removes a row that says nothing else
  v := pg_temp.rec('staff', j1, '2027-01-04', 'skipped', 'shelter closed');
  if (select outcome from recurring_job_occurrences where job_id = j1 and occurs_on = '2027-01-04') <> 'skipped' then raise exception 'FAIL F3 skip ahead: %', v; end if;
  v := pg_temp.rec('staff', j1, '2027-01-04', null);
  if exists (select 1 from recurring_job_occurrences where job_id = j1 and occurs_on = '2027-01-04') then raise exception 'FAIL F3: cleared row kept: %', v; end if;
  -- management and admin may record any job
  v := pg_temp.rec('management', j1, '2026-08-17', 'done');
  v2 := pg_temp.rec('admin', j1, '2026-08-24', 'skipped');
  if (select count(*) from recurring_job_occurrences where job_id = j1 and done_by in (v_mgmt, (select uid from who where who = 'admin'))) <> 2 then
    raise exception 'FAIL F3 management/admin: % / %', v, v2;
  end if;
  v_report := v_report || ' | F1 assignee done, stamped by the function, note trimmed, overwrite | F2 not-assigned, vet, wrong weekday, before start, done ahead, bad outcome, missing job, public_viewer, role-less, archived refused; anon by grant | F3 skip ahead, clear deletes, management/admin record any';

  -- =====================================================================
  -- G. Reassigning one date (someone off sick)
  -- =====================================================================
  v := pg_temp.reassign('staff', j1, '2026-08-31', array['volunteer']);
  if v <> 'ERR P0001 Only management can reassign a job.' then raise exception 'FAIL G1 staff: %', v; end if;

  v := pg_temp.reassign('management', j1, '2026-08-31', array['volunteer'], 'staff off sick');
  if (select row(outcome, reassigned_by, reassigned_at, reassign_note) from recurring_job_occurrences where job_id = j1 and occurs_on = '2026-08-31')
     is distinct from row(null::text, v_mgmt, now(), 'staff off sick'::text)
     or (select array_agg(user_id) from recurring_job_occurrence_assignees where job_id = j1 and occurs_on = '2026-08-31') <> array[v_vol] then
    raise exception 'FAIL G2 reassign: %', v;
  end if;
  -- the usual assignee cannot record the covered date; the cover can; the
  -- next week is still the usual assignee's and not the cover's
  v := pg_temp.rec('staff', j1, '2026-08-31', 'done');
  if v <> 'ERR P0001 This date of the job has been handed to someone else.' then raise exception 'FAIL G3 usual on covered date: %', v; end if;
  v := pg_temp.rec('volunteer', j1, '2026-09-07', 'done');
  if v <> 'ERR P0001 Only the people this job is assigned to, or management, can record it.' then raise exception 'FAIL G3 cover next week: %', v; end if;
  v := pg_temp.rec('volunteer', j1, '2026-08-31', 'done');
  if (select row(outcome, done_by, reassigned_by) from recurring_job_occurrences where job_id = j1 and occurs_on = '2026-08-31')
     is distinct from row('done'::text, v_vol, v_mgmt) then raise exception 'FAIL G3 cover records: %', v; end if;
  v := pg_temp.rec('staff', j1, '2026-09-07', 'done');
  if v like 'ERR%' then raise exception 'FAIL G3 usual next week: %', v; end if;
  -- clearing an outcome keeps the reassignment
  v := pg_temp.rec('volunteer', j1, '2026-08-31', null);
  if (select row(outcome, done_at, reassigned_by) from recurring_job_occurrences where job_id = j1 and occurs_on = '2026-08-31')
     is distinct from row(null::text, null::timestamptz, v_mgmt) then raise exception 'FAIL G3 clear keeps cover: %', v; end if;
  v := pg_temp.rec('volunteer', j1, '2026-08-31', 'done');

  -- G4. a recorded date is history: neither reassigned nor handed back
  v := pg_temp.reassign('management', j1, '2026-08-31', array['staff2']);
  v2 := pg_temp.reassign('management', j1, '2026-08-31', array[]::text[]);
  if v <> 'ERR P0001 That date has already been marked done or skipped.' or v2 <> v then raise exception 'FAIL G4: % / %', v, v2; end if;

  -- G5. who can be cover: not archived, not public_viewer, not role-less, not nobody
  foreach v2 in array array['archived', 'public_viewer', 'roleless', 'no-such-login'] loop
    v := pg_temp.reassign('management', j1, '2026-09-14', array['staff2', v2]);
    if v <> 'ERR P0001 A job can only be reassigned to someone who can still sign in.' then raise exception 'FAIL G5 %: %', v2, v; end if;
  end loop;
  v := pg_temp.reassign('management', j1, '2026-09-15', array['staff2']);
  if v <> 'ERR P0001 This job does not fall on 15 Sep 2026.' then raise exception 'FAIL G5 Tuesday: %', v; end if;
  if exists (select 1 from recurring_job_occurrences where job_id = j1 and occurs_on in ('2026-09-14', '2026-09-15')) then
    raise exception 'FAIL G5: a refused reassignment wrote a row';
  end if;

  -- G6. changing the cover replaces the team; duplicates collapse; an empty
  -- list hands the date back and leaves no row behind
  v := pg_temp.reassign('admin', j1, '2026-09-14', array['volunteer', 'staff2', 'staff2']);
  v := pg_temp.reassign('management', j1, '2026-09-14', array['staff2']);
  if (select array_agg(user_id) from recurring_job_occurrence_assignees where job_id = j1 and occurs_on = '2026-09-14')
     <> array[(select uid from who where who = 'staff2')] then raise exception 'FAIL G6 replace: %', v; end if;
  v := pg_temp.reassign('management', j1, '2026-09-14', null);
  if v not like '{"job_id":null,%' or exists (select 1 from recurring_job_occurrences where job_id = j1 and occurs_on = '2026-09-14')
     or exists (select 1 from recurring_job_occurrence_assignees where job_id = j1 and occurs_on = '2026-09-14') then
    raise exception 'FAIL G6 hand back: %', v;
  end if;
  -- a future week can be covered ahead
  v := pg_temp.reassign('management', j1, '2027-01-04', array['staff2'], 'staff on leave');
  if v like 'ERR%' then raise exception 'FAIL G6 ahead: %', v; end if;
  v_report := v_report || ' | G1 staff cannot reassign | G2 one date to the volunteer, stamped | G3 usual assignee refused on it, cover refused next week, cover records, clear keeps cover | G4 recorded date frozen | G5 archived, public_viewer, role-less, unknown, wrong weekday refused, nothing written | G6 replace, dedupe, hand back, ahead';

  -- =====================================================================
  -- K. Access to the tables themselves
  -- =====================================================================
  -- K1. every staff role reads the jobs and history; public_viewer reads none; anon refused
  foreach v2 in array array['staff', 'vet', 'volunteer', 'management'] loop
    v := pg_temp.as_login(v2, format('select (select count(*) from recurring_jobs where id = %L) || ''/'' || (select count(*) from recurring_job_occurrences where job_id = %L) || ''/'' || (select count(*) from recurring_job_assignees where job_id = %L) || ''/'' || (select count(*) from recurring_job_occurrence_assignees where job_id = %L)', j1, j1, j1, j1));
    if v <> '1/6/1/2' then raise exception 'FAIL K1 % reads %', v2, v; end if;
  end loop;
  foreach v2 in array array['public_viewer', 'archived', 'roleless'] loop
    v := pg_temp.as_login(v2, 'select (select count(*) from recurring_jobs) + (select count(*) from recurring_job_occurrences) + (select count(*) from recurring_job_assignees) + (select count(*) from recurring_job_occurrence_assignees) + (select count(*) from recurring_job_staffing)');
    if v <> '0' then raise exception 'FAIL K1 % reads % rows', v2, v; end if;
  end loop;
  foreach v in array array['recurring_jobs', 'recurring_job_occurrences', 'recurring_job_assignees', 'recurring_job_occurrence_assignees', 'recurring_job_staffing'] loop
    v2 := pg_temp.as_login('anon', format('select count(*)::text from %I', v));
    if v2 not like 'ERR 42501 permission denied%' then raise exception 'FAIL K1 anon % : %', v, v2; end if;
  end loop;

  -- K2. staff cannot write templates or history directly; management can
  -- write templates but not history (the functions are its only door)
  v := pg_temp.as_login('staff', $$insert into recurring_jobs (title, repeat, weekdays) values ('harness 0095 staff', 'weekly', '{1}') returning 'inserted'$$);
  if v not like 'ERR 42501 new row violates row-level security%' then raise exception 'FAIL K2 staff insert job: %', v; end if;
  v := pg_temp.as_login('staff', format($$with u as (update recurring_jobs set title = 'x' where id = %L returning 1) select count(*)::text from u$$, j1));
  if v <> '0' then raise exception 'FAIL K2 staff update job: %', v; end if;
  v := pg_temp.as_login('staff', format($$insert into recurring_job_assignees (job_id, user_id) values (%L, %L) returning 'x'$$, j1, (select uid from who where who = 'staff2')));
  if v not like 'ERR 42501 new row violates row-level security%' then raise exception 'FAIL K2 staff assign: %', v; end if;
  foreach v2 in array array['staff', 'management'] loop
    v := pg_temp.as_login(v2, format($$insert into recurring_job_occurrences (job_id, occurs_on, outcome, done_by, done_at) values (%L, '2026-09-21', 'done', %L, '2000-01-01') returning 'x'$$, j1, v_staff));
    if v not like 'ERR 42501 permission denied%' then raise exception 'FAIL K2 % backdates history: %', v2, v; end if;
    v := pg_temp.as_login(v2, format($$update recurring_job_occurrences set done_at = '2000-01-01' where job_id = %L returning 'x'$$, j1));
    if v not like 'ERR 42501 permission denied%' then raise exception 'FAIL K2 % edits history: %', v2, v; end if;
    v := pg_temp.as_login(v2, format($$insert into recurring_job_occurrence_assignees (job_id, occurs_on, user_id) values (%L, '2027-01-04', %L) returning 'x'$$, j1, v_staff));
    if v not like 'ERR 42501 permission denied%' then raise exception 'FAIL K2 % writes cover: %', v2, v; end if;
  end loop;
  v := pg_temp.as_login('management', $$insert into recurring_jobs (title, repeat, weekdays) values ('harness 0095 mgmt', 'weekly', '{2}') returning (created_by = auth.uid())::text$$);
  if v <> 'true' then raise exception 'FAIL K2 management insert job / created_by: %', v; end if;

  -- K3. recurring_job_dates as staff: J1's Mondays in August, from its start
  v := pg_temp.as_login('staff', format($$select string_agg(occurs_on::text, ' ' order by occurs_on) from recurring_job_dates('2026-07-27', '2026-08-31') where job_id = %L$$, j1));
  if v <> '2026-08-03 2026-08-10 2026-08-17 2026-08-24 2026-08-31' then raise exception 'FAIL K3 dates: %', v; end if;
  v := pg_temp.as_login('public_viewer', $$select count(*)::text from recurring_job_dates('2026-08-01', '2026-08-31')$$);
  if v <> '0' then raise exception 'FAIL K3 public_viewer dates: %', v; end if;

  -- K4. staffing: live, then stranded when the only assignee is archived;
  -- an archived-only or public_viewer-only job is stranded from the start
  v := pg_temp.as_login('staff', format('select live_assignees || ''/'' || archived_assignees from recurring_job_staffing where job_id = %L', j1));
  if v <> '1/0' then raise exception 'FAIL K4 live: %', v; end if;
  update user_roles set archived_at = now() where user_id = v_staff;
  v := pg_temp.as_login('management', format('select live_assignees || ''/'' || archived_assignees from recurring_job_staffing where job_id = %L', j1));
  if v <> '0/1' then raise exception 'FAIL K4 archived: %', v; end if;
  update user_roles set archived_at = null where user_id = v_staff;
  insert into recurring_job_assignees (job_id, user_id) values (jb, (select uid from who where who = 'public_viewer'));
  v := pg_temp.as_login('management', format('select live_assignees || ''/'' || archived_assignees from recurring_job_staffing where job_id = %L', jb));
  if v <> '0/0' then raise exception 'FAIL K4 public_viewer only: %', v; end if;
  v := pg_temp.as_login('management', format('select live_assignees || ''/'' || archived_assignees from recurring_job_staffing where job_id = %L', jc));
  if v <> '0/0' then raise exception 'FAIL K4 unassigned: %', v; end if;

  -- K5. history holds the job; a job without history deletes (and takes its
  -- assignees); deleting a login cascades its assignments and nulls done_by
  v := pg_temp.as_login('management', format('delete from recurring_jobs where id = %L returning ''deleted''', j1));
  if v not like 'ERR 23503 %' then raise exception 'FAIL K5 delete with history: %', v; end if;
  insert into recurring_jobs (title, repeat, weekdays) values ('harness 0095 free', 'weekly', '{1}') returning id into jfree;
  insert into recurring_job_assignees (job_id, user_id) values (jfree, v_staff);
  v := pg_temp.as_login('management', format('delete from recurring_jobs where id = %L returning ''deleted''', jfree));
  if v <> 'deleted' or exists (select 1 from recurring_job_assignees where job_id = jfree) then raise exception 'FAIL K5 delete free: %', v; end if;
  delete from auth.users where id = v_vol;
  if exists (select 1 from recurring_job_occurrence_assignees where user_id = v_vol)
     or (select done_by from recurring_job_occurrences where job_id = j1 and occurs_on = '2026-08-31') is not null
     or (select outcome from recurring_job_occurrences where job_id = j1 and occurs_on = '2026-08-31') <> 'done' then
    raise exception 'FAIL K5 login delete';
  end if;
  v_report := v_report || ' | K1 staff/vet/volunteer/management read all four tables; public_viewer, archived, role-less read nothing; anon refused on all five | K2 staff cannot write jobs or assignees; nobody writes history or cover directly; management writes jobs, created_by stamped | K3 recurring_job_dates from start, public_viewer none | K4 staffing 1/0, 0/1 archived, public_viewer-only and unassigned 0 | K5 history blocks delete, free job deletes with assignees, login delete cascades cover and keeps outcome';

  -- =====================================================================
  -- H. Security settings and grants as written
  -- =====================================================================
  if exists (select 1 from pg_proc
              where oid in ('record_recurring_job(uuid, date, text, text)'::regprocedure,
                            'reassign_recurring_job(uuid, date, uuid[], text)'::regprocedure)
                and not (prosecdef and 'search_path=public' = any (proconfig))) then
    raise exception 'FAIL H: a write function is not security definer with search_path=public';
  end if;
  if exists (select 1 from pg_proc
              where oid in ('recurring_job_dates(date, date)'::regprocedure,
                            'recurrence_occurs_on(date, text, integer, smallint[], smallint, smallint, date, date)'::regprocedure)
                and prosecdef) then
    raise exception 'FAIL H: a read function is security definer';
  end if;
  foreach v in array array['record_recurring_job(uuid, date, text, text)', 'reassign_recurring_job(uuid, date, uuid[], text)',
                           'recurring_job_dates(date, date)',
                           'recurrence_occurs_on(date, text, integer, smallint[], smallint, smallint, date, date)',
                           'recurrence_dates(text, integer, smallint[], smallint, smallint, date, date, date, date)'] loop
    if has_function_privilege('anon', v, 'execute') or not has_function_privilege('authenticated', v, 'execute')
       or not has_function_privilege('service_role', v, 'execute') then
      raise exception 'FAIL H: grants on %', v;
    end if;
  end loop;

  raise exception 'HARNESS-OK 0095 twice%', v_report;
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
