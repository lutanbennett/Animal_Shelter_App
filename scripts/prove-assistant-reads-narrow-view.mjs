#!/usr/bin/env node
/**
 * Proves the assistant's resident reads work for a card narrowed to who-and-where, and that
 * making them work widened nothing. Against REAL rows, keeping nothing.
 *
 *   node scripts/prove-assistant-reads-narrow-view.mjs              # test (dev) project
 *   node scripts/prove-assistant-reads-narrow-view.mjs --env uat
 *
 * One `begin … rollback`; each claim is a `raise exception` inside a `do $$ … $$` block, the shape of
 * scripts/prove-assistant-record-card.mjs. Fixtures are throwaway roles built from CARDS only.
 *
 * THE FAULT. The assistant's picker, where/who lookups and enclosure headcount read resident_list_view and
 * residents, whose select policy asks resident.record. The assistant card grants resident.who_and_where,
 * not resident.record (0268), so a login holding it saw an empty picker and every write was unusable.
 * The reads now go to resident_who_and_where, which asks works_with_residents().
 *
 * WHAT IT PROVES
 *   1  a login holding exactly the assistant card reads every resident from resident_who_and_where
 *   2  the same login reads NOTHING from resident_list_view or residents, so the old reads really were the
 *      fault and the card was not quietly widened
 *   3  the view is still narrow: its column list is the fixed one, with no breed, notes, dates or carer
 *   4  that login also cannot read the other tables a lookup might be tempted by
 *      (placement_history, weight, prescriptions, clinic_visits)
 *   5  a login holding no card reads nothing from the view
 *   6  a login holding view_residents (resident.record) counts the same placed residents in the view as
 *      in resident_list_view, so the enclosure headcount is unchanged for the login that always had it
 *   7  the source: neither assistant file reads resident_list_view or residents any more
 */
import { readFileSync } from "node:fs";
import { exitWith } from "./lib/exit.mjs";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token || !env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required.");
  await exitWith(2);
}
const ref = projectRef(env);

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      /* not JSON — keep the raw body */
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

// 7, the source. Checked first and in node: it needs the repo, not the database.
const SOURCES = ["src/lib/assistant/data.ts", "src/app/assistant/lookups.ts"];
for (const file of SOURCES) {
  const text = readFileSync(file, "utf8");
  const bad = [/\.from\(\s*["']resident_list_view["']/, /\.from\(\s*["']residents["']/].find((re) => re.test(text));
  if (bad) {
    console.error(`7 FAILED: ${file} reads ${bad.source}, which asks resident.record. The assistant reads resident_who_and_where.`);
    await exitWith(1);
  }
  if (!/\.from\(\s*["']resident_who_and_where["']/.test(text)) {
    console.error(`7 FAILED: ${file} no longer reads resident_who_and_where.`);
    await exitWith(1);
  }
}

const COLUMNS = `'id','name','thai_name','resident_code','species','sex','profile_photo_drive_file_id','current_status',
  'enclosure_id','enclosure_name','enclosure_name_th','zone_id','zone_name','zone_name_th','zone_colour'`;

const harness = `
begin;

do $$
declare
  u_a uuid; u_b uuid; u_c uuid;
  r_a uuid; r_b uuid; r_c uuid;
  v_n integer; v_all integer; v_list integer;
  t text;
begin
  select user_id into u_a from user_roles where archived_at is null order by user_id limit 1;
  select user_id into u_b from user_roles where archived_at is null and user_id <> u_a order by user_id limit 1;
  select user_id into u_c from user_roles where archived_at is null and user_id not in (u_a, u_b) order by user_id limit 1;
  if u_c is null then raise exception 'PROOF SETUP: needs three logins with roles'; end if;
  select count(*) into v_all from residents;
  if v_all = 0 then raise exception 'PROOF SETUP: no residents to read'; end if;
  delete from user_roles where user_id in (u_a, u_b, u_c);

  insert into roles (key, name, kind, home_path) values ('proof_narrow_a', 'Proof narrow: assistant card', 'custom', '/home') returning id into r_a;
  insert into roles (key, name, kind, home_path) values ('proof_narrow_b', 'Proof narrow: no cards', 'custom', '/home') returning id into r_b;
  insert into roles (key, name, kind, home_path) values ('proof_narrow_c', 'Proof narrow: view residents', 'custom', '/home') returning id into r_c;
  insert into role_cards (role_id, card, position) values (r_a, 'assistant', 1);
  insert into role_cards (role_id, card, position) values (r_c, 'view_residents', 1);
  insert into user_roles (user_id, role_id) values (u_a, r_a), (u_b, r_b), (u_c, r_c);

  -- 1, 2, 4: the assistant card alone
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  if has_permission('resident.record', 'read') then
    raise exception '1 FAILED: the assistant card now grants resident.record, so this fixture no longer proves a narrowed card';
  end if;
  set local role authenticated;
  select count(*) into v_n from resident_who_and_where;
  if v_n <> v_all then raise exception '1 FAILED: a login holding exactly the assistant card reads % of % residents from the view', v_n, v_all; end if;
  raise notice '1 ok   the assistant card alone reads all % residents through resident_who_and_where', v_n;

  select count(*) into v_n from resident_list_view;
  if v_n <> 0 then raise exception '2 FAILED: the assistant card reads % rows of resident_list_view, so the card was widened', v_n; end if;
  select count(*) into v_n from residents;
  if v_n <> 0 then raise exception '2 FAILED: the assistant card reads % rows of residents, so the card was widened', v_n; end if;
  raise notice '2 ok   the same login reads nothing from resident_list_view or residents';

  select count(*) into v_n from placement_history;
  if v_n <> 0 then raise exception '4 FAILED: placement_history readable by the assistant card (% rows)', v_n; end if;
  select count(*) into v_n from weight;
  if v_n <> 0 then raise exception '4 FAILED: weight readable by the assistant card (% rows)', v_n; end if;
  select count(*) into v_n from prescriptions;
  if v_n <> 0 then raise exception '4 FAILED: prescriptions readable by the assistant card (% rows)', v_n; end if;
  select count(*) into v_n from clinic_visits;
  if v_n <> 0 then raise exception '4 FAILED: clinic_visits readable by the assistant card (% rows)', v_n; end if;
  reset role;
  raise notice '4 ok   placement_history, weight, prescriptions and clinic_visits stay unreadable to the assistant card';

  -- 3: the view is still the narrow one
  select string_agg(column_name, ', ') into t from information_schema.columns
   where table_schema = 'public' and table_name = 'resident_who_and_where' and column_name not in (${COLUMNS});
  if t is not null then
    raise exception '3 FAILED: resident_who_and_where has gained column(s): %. The assistant now reads them.', t;
  end if;
  raise notice '3 ok   resident_who_and_where still has only its fixed who-and-where columns';

  -- 5: no card
  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from resident_who_and_where;
  reset role;
  if v_n <> 0 then raise exception '5 FAILED: a login with no card reads % rows of the view', v_n; end if;
  raise notice '5 ok   a login holding no card reads nothing from the view';

  -- 6: headcount unchanged for resident.record
  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from resident_who_and_where where enclosure_id is not null;
  select count(*) into v_list from resident_list_view where enclosure_id is not null;
  reset role;
  if v_n <> v_list or v_n = 0 then
    raise exception '6 FAILED: view_residents counts % placed residents in the narrow view and % in the list view', v_n, v_list;
  end if;
  raise notice '6 ok   view_residents counts the same % placed residents either way', v_n;

  raise notice 'ALL PROOFS PASSED. Nothing is kept: the transaction is rolled back.';
end
$$;

rollback;
`;

try {
  await query(harness);
  console.log(`assistant-reads-narrow-view proofs: all passed against ${envName} (project ${ref}), nothing kept.`);
  console.log("The Management API does not return notices, so a pass is the absence of a raised exception;");
  console.log("any failed proof arrives as an error naming its number.");
  await exitWith(0);
} catch (err) {
  console.error(`assistant-reads-narrow-view proofs FAILED against ${envName} (project ${ref}):`);
  console.error(`  ${err.message}`);
  await exitWith(1);
}
