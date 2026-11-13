// Dev rows to press controls against, made to order and re-makeable — DEV ONLY.
//
//   node scripts/dev-fixtures.mjs --status                 say what exists, change nothing
//   node scripts/dev-fixtures.mjs                          make (or repair) every fixture, then report
//   node scripts/dev-fixtures.mjs --login <email>          also a recurring job assigned to that login
//   node scripts/dev-fixtures.mjs --remove                 delete only the rows named `ZZ fixture …`
//
// Why this exists (#79sqf): five streams in a row stopped at the same wall. The control they had to
// press was drawn only for data the dev database did not hold — a deceased resident WITH a blood test,
// a resident with a SECOND photo, a bill waiting in the inbox. Each stream hand-made a row, pressed
// once, and left nothing the next stream could use. This is that data as a script, so a press is
// repeatable and nobody hand-makes a row again.
//
// Three rules it keeps, and why:
//   * Dev only. It refuses any project but the dev ref, the same guard scripts/dev-signin.mjs makes.
//   * Idempotent. Every row is found by its own distinctive name before it is made, so running it twice
//     makes nothing twice — and running it AFTER a press puts the pressable state back (the profile
//     photo goes back to photo 1, today's recurring occurrence is cleared), which is what a fixture is
//     for. Press, re-run, press again.
//   * Named `ZZ fixture …`, as the refusal-key streams name theirs, so the other live streams can see
//     at a glance that a row is not theirs and `--remove` can never take one of theirs. The dev
//     database is shared; this script deletes nothing it did not create.
//
// It goes through the Management API's SQL endpoint, not the Data API, because the tables it writes
// have `revoke all … from service_role` (0189 for bills_inbox) and RLS asks a card the script holds
// no login for. One `do` block does the writing so the deceased-lock bypass (0026) stays inside one
// transaction: a blood test cannot be inserted against a resident who is already dead, and the whole
// point of the fixture is a resident who is.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const statusOnly = has("--status");
const remove = has("--remove");
const loginEmail = valueOf("--login");

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : [];
}

const lit = (s) => (s == null ? "null" : `'${String(s).replace(/'/g, "''")}'`);

// ---------------------------------------------------------------------------
// What each fixture unlocks, so the report says why the row is there.
// ---------------------------------------------------------------------------
const REPORT = `
with deceased as (
  select r.id, r.name,
         (select count(*) from blood_tests b where b.resident_id = r.id) blood_tests,
         coalesce((select s.is_deceased from resident_current_state s where s.resident_id = r.id), false) is_deceased
    from residents r where r.name = 'ZZ fixture deceased'
),
photos as (
  select r.id, r.name, r.profile_photo_drive_file_id,
         (select count(*) from attachments a
           where a.owner_type = 'resident' and a.owner_id = r.id and a.approved_at is not null) approved_photos
    from residents r where r.name = 'ZZ fixture two photos'
),
bills as (
  select count(*) cards,
         (select count(*) from attachments a where a.owner_type = 'bill_inbox'
           and a.owner_id in (select id from bills_inbox where note like 'ZZ fixture bill %')) photos
    from bills_inbox where note like 'ZZ fixture bill %'
),
job as (select id, job_code, status from maintenance where title = 'ZZ fixture bill job'),
recurring as (
  select j.id, j.title,
         (select count(*) from recurring_job_assignees a where a.job_id = j.id) assignees,
         (select count(*) from recurring_job_occurrences o where o.job_id = j.id and o.occurs_on = shelter_today()) done_today
    from recurring_jobs j where j.title = 'ZZ fixture daily job'
),
friend as (
  select c.name, sf.published from contacts c join shelter_friends sf on sf.contact_id = c.id where c.name = 'ZZ fixture friend'
),
dietrx as (
  select r.name,
         (select count(*) from resident_diets d where d.resident_id = r.id and d.end_date is null) diets,
         (select count(*) from prescriptions p where p.resident_id = r.id and p.end_date is null and p.archived_at is null) rx
    from residents r where r.name = 'ZZ fixture diet and prescription'
),
kinds as (
  select count(*) filter (where key in ('materials', 'cleaning_products')) general_kinds,
         count(*) filter (where key = 'utilities') utility_kinds
    from bill_kinds where archived_at is null
)
select 'deceased resident with a blood test (row 4)' fixture,
       coalesce((select name || ': ' || blood_tests || ' blood test(s), is_deceased=' || is_deceased from deceased), 'MISSING') state
union all
select 'resident with a second photo (row 6b)',
       coalesce((select name || ': ' || approved_photos || ' approved photo(s), profile=' || coalesce(profile_photo_drive_file_id, 'none') from photos), 'MISSING')
union all
select 'bills inbox cards (row 9)', (select cards || ' card(s), ' || photos || ' photo(s)' from bills)
union all
select 'a job for match-bill-to-job (row 9)', coalesce((select job_code || ' ' || status from job), 'MISSING')
union all
select 'recurring job for /my take-back (row 1)',
       coalesce((select title || ': ' || assignees || ' assignee(s), acted-on today=' || done_today from recurring), 'MISSING (pass --login <email>)')
union all
select 'a Shelter Friend supplier (row 11a)', coalesce((select name || ': published=' || published from friend), 'MISSING')
union all
select 'resident with a diet and a prescription (rows 11b, 11c)', coalesce((select name || ': ' || diets || ' running diet(s), ' || rx || ' live prescription(s)' from dietrx), 'MISSING')
union all
select 'bill kinds the press needs', (select 'general-route ' || general_kinds || ', utility-route ' || utility_kinds from kinds)
-- The same four questions asked of the WHOLE of dev, not just this script's rows: a stream should know
-- whether somebody else's record would already do, before it makes one of its own (and then leave
-- theirs alone — a real resident's record is not a fixture).
union all
select 'elsewhere on dev: deceased with a blood test',
       (select count(*)::text from residents r
         where coalesce((select s.is_deceased from resident_current_state s where s.resident_id = r.id), false)
           and exists (select 1 from blood_tests b where b.resident_id = r.id)
           and r.name not like 'ZZ fixture %')
union all
select 'elsewhere on dev: 2+ approved photos',
       (select count(*)::text from residents r
         where (select count(*) from attachments a
                 where a.owner_type = 'resident' and a.owner_id = r.id and a.approved_at is not null) >= 2
           and r.name not like 'ZZ fixture %')
union all
select 'elsewhere on dev: bills inbox waiting',
       (select count(*)::text from bills_inbox where note is null or note not like 'ZZ fixture bill %')
`;

const MAKE = (loginId) => `
do $fx$
declare
  v_taker uuid;
  v_login uuid := ${loginId ? lit(loginId) + "::uuid" : "null"};
  v_res uuid;
  v_type uuid;
  v_encl uuid;
  v_zone uuid;
  v_photo_res uuid;
  v_bill uuid;
  v_job uuid;
  v_diet_res uuid;
  v_diet uuid;
  v_med uuid;
  v_contact uuid;
  i int;
begin
  -- 0026's lock makes a deceased resident's record read-only, which is exactly the state fixture A
  -- has to end in. Announcing the bypass for this transaction is how 0026 itself does the cascade.
  perform set_config('app.deceased_lock_bypass', 'on', true);

  select id into v_taker from auth.users order by created_at limit 1;
  if v_taker is null then raise exception 'no auth.users row to own the fixture rows'; end if;

  -- ---------------------------------------------------------------------
  -- A. A deceased resident WITH a blood test that has a result to correct.
  --    BloodTestList's Correct result form (row 4) is drawn only when the
  --    record is closed (isDeceased) and the login holds medical.blood_tests.
  -- ---------------------------------------------------------------------
  select id into v_res from residents where name = 'ZZ fixture deceased' limit 1;
  if v_res is null then
    insert into residents (name, species, intake_date, created_by)
    values ('ZZ fixture deceased', 'Dog', current_date - 60, v_taker)
    returning id into v_res;
  end if;

  select id into v_type from blood_test_types order by name limit 1;
  if v_type is null then
    insert into blood_test_types (name) values ('ZZ fixture panel') returning id into v_type;
  end if;

  if not exists (select 1 from blood_tests where resident_id = v_res) then
    insert into blood_tests (resident_id, blood_test_type_id, date, results, created_by)
    values (v_res, v_type, current_date - 20,
      'ZZ fixture result: HCT 38%, WBC 11.2, platelets 240. Text so the Correct result form has something to correct.',
      v_taker);
  end if;

  if not exists (
    select 1 from placement_history
     where resident_id = v_res and end_date is null and placement_type = 'Deceased'
  ) then
    update placement_history set end_date = now()
     where resident_id = v_res and end_date is null and start_date < now();
    select e.id into v_encl from enclosures e join zones z on z.id = e.zone_id
     where z.name = 'Lifecycle' and e.name = 'Deceased' limit 1;
    insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, created_by)
    values (v_res, 'Deceased', now() - interval '1 day',
            (select zone_id from enclosures where id = v_encl), v_encl, v_taker);
  end if;

  -- ---------------------------------------------------------------------
  -- B. A living resident with TWO approved photos, the first already the
  --    profile. PhotoGallery's Set as profile photo (row 6b) is disabled on
  --    the photo that already is one and absent unless the photo is public,
  --    so two approved, non-medical photos are what makes it pressable.
  --    Re-running puts the profile back on photo 1: press, re-run, press again.
  -- ---------------------------------------------------------------------
  select id into v_photo_res from residents where name = 'ZZ fixture two photos' limit 1;
  if v_photo_res is null then
    insert into residents (name, species, intake_date, created_by)
    values ('ZZ fixture two photos', 'Dog', current_date - 30, v_taker)
    returning id into v_photo_res;
  end if;

  if not exists (select 1 from placement_history where resident_id = v_photo_res and end_date is null) then
    select e.id into v_encl from enclosures e join zones z on z.id = e.zone_id
     where z.name = 'Lifecycle' and e.name = 'Unassigned' limit 1;
    insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, created_by)
    values (v_photo_res, 'Intake', now() - interval '30 days',
            (select zone_id from enclosures where id = v_encl), v_encl, v_taker);
  end if;

  for i in 1..2 loop
    if not exists (
      select 1 from attachments
       where owner_type = 'resident' and owner_id = v_photo_res
         and drive_file_id = 'zz-fixture-photo-' || i
    ) then
      insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, uploaded_by, media_kind)
      values ('resident', v_photo_res, 'Shelter', 'zz-fixture-photo-' || i,
              'ZZ fixture photo ' || i || '.jpg', v_taker, 'photo');
    end if;
  end loop;
  -- 0346 clears approved_at on INSERT for a website photo, whoever inserts it, so approving is a
  -- second step. The UPDATE path only refuses a signed-in login without the approve card; this runs
  -- as postgres with no auth.uid(), so it stamps. Without it the photo reads as "waiting" and
  -- PhotoGallery draws a sentence where Set as profile photo would be.
  update attachments set approved_at = now()
   where owner_type = 'resident' and owner_id = v_photo_res
     and drive_file_id in ('zz-fixture-photo-1', 'zz-fixture-photo-2')
     and approved_at is null;
  update residents set profile_photo_drive_file_id = 'zz-fixture-photo-1'
   where id = v_photo_res
     and coalesce(profile_photo_drive_file_id, '') <> 'zz-fixture-photo-1';

  -- ---------------------------------------------------------------------
  -- C. A maintenance job still Not Started, so the bills inbox offers a job to
  --    match a bill to (row 9's match control reads maintenance_job_picker).
  -- ---------------------------------------------------------------------
  if not exists (select 1 from maintenance where title = 'ZZ fixture bill job') then
    -- maintenance_before_write() refuses a job with neither zone nor enclosure, so it gets a real
    -- zone: any one that is not the Lifecycle pseudo-zone.
    select id into v_zone from zones where name <> 'Lifecycle' order by name limit 1;
    if v_zone is null then raise exception 'dev has no zone but Lifecycle — a maintenance job needs one'; end if;
    insert into maintenance (title, description, status, zone_id, job_code, created_by)
    values ('ZZ fixture bill job', 'A job for a bill to be matched to.', 'Not Started', v_zone, 'M-ZZF1', v_taker);
  end if;

  -- ---------------------------------------------------------------------
  -- D. Five bills-inbox cards, each with its own photo row. Five, because
  --    each of row 9's five controls consumes the card it is pressed on:
  --    record general, file as utility, match to a job, save, delete.
  --    The kind is left unset on purpose — choosing it is part of the press.
  -- ---------------------------------------------------------------------
  for i in 1..5 loop
    select id into v_bill from bills_inbox where note = 'ZZ fixture bill ' || i limit 1;
    if v_bill is null then
      insert into bills_inbox (taken_by, bill_date, amount, note)
      values (v_taker, current_date - 1, 100 + i, 'ZZ fixture bill ' || i)
      returning id into v_bill;
    end if;
    if not exists (select 1 from attachments where owner_type = 'bill_inbox' and owner_id = v_bill) then
      insert into attachments (owner_type, owner_id, drive_file_id, file_name, uploaded_by)
      values ('bill_inbox', v_bill, 'zz-fixture-bill-' || i, 'ZZ fixture bill ' || i || '.jpg', v_taker);
    end if;
  end loop;

  -- ---------------------------------------------------------------------
  -- E. A recurring job due every day, assigned to one login, so /my has a
  --    row to mark done — which is what draws the take-back button (row 1).
  --    link_path stays null so no eligibility page is asked about.
  -- ---------------------------------------------------------------------
  if v_login is not null then
    select id into v_job from recurring_jobs where title = 'ZZ fixture daily job' limit 1;
    if v_job is null then
      insert into recurring_jobs (title, description, repeat, every, weekdays, starts_on, overdue_from, time_of_day, active, created_by)
      values ('ZZ fixture daily job', 'Due every day, so /my always has a row to mark done and take back.',
              'weekly', 1, '{1,2,3,4,5,6,7}', current_date - 7, current_date, 'anytime', true, v_taker)
      returning id into v_job;
    end if;
    insert into recurring_job_assignees (job_id, user_id) values (v_job, v_login)
      on conflict (job_id, user_id) do nothing;
    -- Its own job's own occurrence only: clearing today's row is how a pressed
    -- fixture becomes pressable again.
    delete from recurring_job_occurrences where job_id = v_job and occurs_on = shelter_today();
  end if;

  -- ---------------------------------------------------------------------
  -- F. A supplier marked as a Shelter Friend (row 11a). The card is
  --    publish_shelter_friends and it already exists; what the page needs
  --    is a row to draw its controls against. Unpublished, so the website
  --    never shows it.
  -- ---------------------------------------------------------------------
  select id into v_contact from contacts where name = 'ZZ fixture friend' limit 1;
  if v_contact is null then
    insert into contacts (name, type) values ('ZZ fixture friend', 'Vendor') returning id into v_contact;
  end if;
  -- Publish and Up/Down (row 11a) change these; re-running puts the card back to a draft at the bottom.
  update shelter_friends set published = false, sort_order = 9999 where contact_id = v_contact;
  if not exists (select 1 from shelter_friends where contact_id = v_contact) then
    insert into shelter_friends (contact_id, blurb, help_kind, published, sort_order)
    values (v_contact, 'ZZ fixture: a supplier to press the Shelter Friend controls against.', 'Discount', false, 9999);
  end if;

  -- ---------------------------------------------------------------------
  -- G. A living resident with a running diet AND a live prescription
  --    (row 11b the per-row diet controls, row 11c /operations/feeding-list
  --    and /operations/medication-list). Borrows the first recipe and first
  --    medication on dev; makes neither.
  -- ---------------------------------------------------------------------
  select id into v_diet_res from residents where name = 'ZZ fixture diet and prescription' limit 1;
  if v_diet_res is null then
    insert into residents (name, species, intake_date, created_by)
    values ('ZZ fixture diet and prescription', 'Dog', current_date - 30, v_taker)
    returning id into v_diet_res;
  end if;
  if not exists (select 1 from placement_history where resident_id = v_diet_res and end_date is null) then
    select e.id into v_encl from enclosures e join zones z on z.id = e.zone_id
     where z.name = 'Lifecycle' and e.name = 'Unassigned' limit 1;
    insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, created_by)
    values (v_diet_res, 'Intake', now() - interval '30 days',
            (select zone_id from enclosures where id = v_encl), v_encl, v_taker);
  end if;
  select id into v_diet from diets order by name limit 1;
  if v_diet is null then raise exception 'dev has no diet recipe to give the fixture resident'; end if;
  -- End today (row 11b) stamps end_date; re-running puts the diet back to running.
  update resident_diets set end_date = null where resident_id = v_diet_res and end_date is not null;
  if not exists (select 1 from resident_diets where resident_id = v_diet_res and end_date is null) then
    insert into resident_diets (resident_id, diet_id, start_date, meals_per_day, created_by)
    values (v_diet_res, v_diet, current_date - 7, 2, v_taker);
  end if;
  select id into v_med from medication order by name limit 1;
  if v_med is null then raise exception 'dev has no medication to prescribe'; end if;
  if not exists (select 1 from prescriptions where resident_id = v_diet_res and end_date is null and archived_at is null) then
    insert into prescriptions (resident_id, medication_id, start_date, dose_quantity, schedule_unit, schedule_every, created_by)
    values (v_diet_res, v_med, current_date - 3, 1, 'day', 1, v_taker);
  end if;

  perform set_config('app.deceased_lock_bypass', 'off', true);
end $fx$;
`;

const REMOVE = `
do $fx$
declare
  v_res uuid[];
begin
  perform set_config('app.deceased_lock_bypass', 'on', true);
  select array_agg(id) into v_res from residents where name like 'ZZ fixture %';

  delete from attachments where owner_type = 'bill_inbox'
    and owner_id in (select id from bills_inbox where note like 'ZZ fixture bill %');
  delete from bills_inbox where note like 'ZZ fixture bill %';
  delete from maintenance where title = 'ZZ fixture bill job';
  delete from contacts where name = 'ZZ fixture friend';
  delete from recurring_job_occurrence_assignees where job_id in (select id from recurring_jobs where title = 'ZZ fixture daily job');
  delete from recurring_job_occurrences where job_id in (select id from recurring_jobs where title = 'ZZ fixture daily job');
  delete from recurring_job_assignees where job_id in (select id from recurring_jobs where title = 'ZZ fixture daily job');
  delete from recurring_jobs where title = 'ZZ fixture daily job';

  if v_res is not null then
    delete from prescriptions where resident_id = any(v_res);
    delete from resident_diets where resident_id = any(v_res);
    delete from attachments where owner_type = 'blood_test'
      and owner_id in (select id from blood_tests where resident_id = any(v_res));
    delete from blood_tests where resident_id = any(v_res);
    delete from attachments where owner_type = 'resident' and owner_id = any(v_res);
    delete from placement_history where resident_id = any(v_res);
    delete from residents where id = any(v_res);
  end if;
  perform set_config('app.deceased_lock_bypass', 'off', true);
end $fx$;
`;

if (remove) {
  await sql(REMOVE);
  console.log("Removed every row named `ZZ fixture …`. Nothing else was touched.");
} else if (!statusOnly) {
  let loginId = null;
  if (loginEmail) {
    const rows = await sql(`select id from auth.users where lower(email) = lower(${lit(loginEmail)}) limit 1`);
    if (!rows.length) throw new Error(`no login on dev with the email ${loginEmail} — run scripts/dev-signin.mjs first`);
    loginId = rows[0].id;
  }
  await sql(MAKE(loginId));
}

const report = await sql(REPORT);
console.log(remove ? "\nAfter removal:" : statusOnly ? "On dev now:" : "\nFixtures on dev:");
for (const row of report) console.log(`  ${row.fixture.padEnd(44)} ${row.state}`);
if (!loginEmail && !remove) {
  console.log("\n  (no --login given, so the recurring job for row 1 was not assigned to anybody)");
}
