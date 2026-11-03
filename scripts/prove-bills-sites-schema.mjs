#!/usr/bin/env node
/**
 * Proves 0304/0305 (premises, bill kinds, utility and general bills, three bill cards) against the real
 * database, keeping nothing. Everything runs in one `begin ... rollback`; each claim is a `raise exception`
 * inside a `do $$ ... $$` block, which the Management API surfaces as an error.
 *
 *   node scripts/prove-bills-sites-schema.mjs        # test (dev) project
 *
 * Unlike the older harnesses this one SWITCHES the SQL role to `authenticated` (set local role), so row level
 * security is exercised, not just has_permission().
 *
 * WHAT IT PROVES
 *   1  no premises or account is seeded, and the kind catalogue has the starting kinds, Other, and six utility types
 *   2  a login holding only the utility_bills card writes a utility bill, and cannot write a general bill
 *   3  a login holding NO bill card cannot write a utility bill, a general bill, a premises or a kind
 *   4  Admin (outside the card system) writes both and adds a premises
 *   5  an OTHER bill with no premises, no account and no links saves (every kind-implied key is optional)
 *   6  a bill_sites holder adds a premises and an account, and a bill naming the account takes its premises
 *   7  a bill naming an account and a DIFFERENT premises is refused
 *   8  covers_month must be the first day of a month, and an amount cannot be negative
 *   9  a login with only a bill card can SEE the catalogue (premises, kinds) but cannot change it
 *  10  existing bills_inbox and maintenance_bills rows are unchanged in shape: the new columns are null-able
 *  11  the card grants hold exactly one activity each and no role was given any of the cards
 */
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
      /* not JSON, keep the raw body */
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

const harness = `
begin;

create temp table who (who text primary key, uid uuid not null);
insert into who values ('admin', gen_random_uuid()), ('utility', gen_random_uuid()), ('sites', gen_random_uuid()), ('nobody', gen_random_uuid());
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0305-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from who;
grant select on who to authenticated;

-- Disposable roles holding exactly one card each: the card is what grants, 0257's triggers derive the cells.
insert into roles (key, name, kind) values ('h0305_utility', 'h utility', 'custom'), ('h0305_sites', 'h sites', 'custom'), ('h0305_nobody', 'h nobody', 'custom');
insert into role_cards (role_id, card) select id, 'utility_bills' from roles where key = 'h0305_utility';
insert into role_cards (role_id, card) select id, 'bill_sites' from roles where key = 'h0305_sites';
insert into role_cards (role_id, card) select id, 'view_residents' from roles where key = 'h0305_nobody';
insert into user_roles (user_id, role_id) select w.uid, r.id from who w join roles r on r.key = 'admin' where w.who = 'admin';
insert into user_roles (user_id, role_id) select w.uid, r.id from who w join roles r on r.key = 'h0305_utility' where w.who = 'utility';
insert into user_roles (user_id, role_id) select w.uid, r.id from who w join roles r on r.key = 'h0305_sites' where w.who = 'sites';
insert into user_roles (user_id, role_id) select w.uid, r.id from who w join roles r on r.key = 'h0305_nobody' where w.who = 'nobody';

create function pg_temp.as_login(p_who text) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = p_who), 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end
$f$;
create function pg_temp.as_owner() returns void language plpgsql as $f$ begin execute 'reset role'; end $f$;
grant execute on function pg_temp.as_login(text), pg_temp.as_owner() to public;

do $$
declare
  v_water uuid;
  v_other uuid;
  v_prem uuid;
  v_prem2 uuid;
  v_acct uuid;
  v_n integer;
  v_msg text;
  v_row record;
begin
  ---------------------------------------------------------------- 1. data, not code
  if exists (select 1 from premises) then raise exception '1 FAILED: premises are seeded'; end if;
  if exists (select 1 from bill_accounts) then raise exception '1 FAILED: accounts are seeded'; end if;
  select id into v_other from bill_kinds where key = 'other';
  if v_other is null then raise exception '1 FAILED: no Other kind'; end if;
  select count(*) into v_n from bill_kinds where parent_id = (select id from bill_kinds where key = 'utilities');
  if v_n < 6 then raise exception '1 FAILED: expected six utility types, found %', v_n; end if;
  select id into v_water from bill_kinds where key = 'utility_water';
  if (select count(*) from bill_kinds where key in ('vet_appointment', 'food', 'medicine', 'maintenance', 'materials', 'cleaning_products')) <> 6 then
    raise exception '1 FAILED: a starting kind is missing';
  end if;

  ---------------------------------------------------------------- 2. the utility card writes utility bills only
  perform pg_temp.as_login('utility');
  insert into utility_bills (kind_id, covers_month, amount) values (v_water, date_trunc('month', current_date)::date, 123.45);
  begin
    insert into general_bills (kind_id, amount) values (v_other, 10);
    raise exception '2 FAILED: the utility card wrote a general bill';
  exception when insufficient_privilege or others then
    get stacked diagnostics v_msg = message_text;
    if v_msg like '2 FAILED%' then raise; end if;
  end;

  perform pg_temp.as_owner();
  raise notice 'claims 1-2 ok';
end
$$;

do $$
declare
  v_water uuid;
  v_other uuid;
  v_prem uuid;
  v_prem2 uuid;
  v_acct uuid;
  v_n integer;
  v_msg text;
begin
  select id into v_other from bill_kinds where key = 'other';
  select id into v_water from bill_kinds where key = 'utility_water';

  ---------------------------------------------------------------- 3. no card, no write
  perform pg_temp.as_owner();
  perform pg_temp.as_login('nobody');
  begin insert into utility_bills (kind_id, covers_month, amount) values (v_water, date_trunc('month', current_date)::date, 1);
    raise exception '3 FAILED: utility bill without the card';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '3 FAILED%' then raise; end if; end;
  begin insert into general_bills (kind_id, amount) values (v_other, 1);
    raise exception '3 FAILED: general bill without the card';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '3 FAILED%' then raise; end if; end;
  begin insert into premises (name) values ('h0305 nope');
    raise exception '3 FAILED: premises without the card';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '3 FAILED%' then raise; end if; end;
  begin insert into bill_kinds (key, label) values ('h0305_nope', 'Nope');
    raise exception '3 FAILED: kind without the card';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '3 FAILED%' then raise; end if; end;
  if (select count(*) from utility_bills) <> 0 then raise exception '3 FAILED: a login without the card can read utility bills'; end if;

  ---------------------------------------------------------------- 4 and 5. Admin, and an Other bill with nothing linked
  perform pg_temp.as_owner();
  perform pg_temp.as_login('admin');
  insert into utility_bills (kind_id, covers_month, amount) values (v_water, date_trunc('month', current_date)::date, 50);
  insert into general_bills (kind_id, amount, note) values (v_other, 300, 'domain renewal');
  select count(*) into v_n from general_bills where kind_id = v_other and premises_id is null and account_id is null;
  if v_n <> 1 then raise exception '5 FAILED: the Other bill with no premises and no account did not save'; end if;
  insert into premises (name) values ('h0305 admin place');

  ---------------------------------------------------------------- 6. a bill_sites holder, account carries premises
  perform pg_temp.as_owner();
  perform pg_temp.as_login('sites');
  insert into premises (name) values ('h0305 place A') returning id into v_prem;
  insert into premises (name) values ('h0305 place B') returning id into v_prem2;
  insert into bill_accounts (premises_id, kind_id, supplier, account_ref) values (v_prem, v_water, 'h0305 water board', 'W-1') returning id into v_acct;
  -- the sites card does not write bills
  begin insert into general_bills (kind_id, amount) values (v_other, 1);
    raise exception '6 FAILED: the sites card wrote a bill';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '6 FAILED%' then raise; end if; end;
  perform pg_temp.as_owner();
  perform pg_temp.as_login('admin');
  insert into utility_bills (kind_id, account_id, covers_month, amount) values (v_water, v_acct, date_trunc('month', current_date)::date, 70);
  if (select premises_id from utility_bills where account_id = v_acct) is distinct from v_prem then
    raise exception '6 FAILED: the bill did not take its account premises';
  end if;

  ---------------------------------------------------------------- 7. an account and a different premises
  begin
    insert into utility_bills (kind_id, account_id, premises_id, covers_month, amount) values (v_water, v_acct, v_prem2, date_trunc('month', current_date)::date, 1);
    raise exception '7 FAILED: account and a different premises were accepted';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '7 FAILED%' then raise; end if; end;

  ---------------------------------------------------------------- 8. shape checks
  begin
    insert into utility_bills (kind_id, covers_month, amount) values (v_water, (date_trunc('month', current_date) + interval '3 days')::date, 1);
    raise exception '8 FAILED: a mid-month covers_month was accepted';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '8 FAILED%' then raise; end if; end;
  begin
    insert into general_bills (kind_id, amount) values (v_other, -1);
    raise exception '8 FAILED: a negative amount was accepted';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '8 FAILED%' then raise; end if; end;

  ---------------------------------------------------------------- 9. a bill-card holder sees the catalogue, cannot change it
  perform pg_temp.as_login('utility');
  if (select count(*) from bill_kinds) < 8 then raise exception '9 FAILED: a bill-card holder cannot see the kinds'; end if;
  if (select count(*) from premises) < 1 then raise exception '9 FAILED: a bill-card holder cannot see premises'; end if;
  begin insert into premises (name) values ('h0305 sneaky');
    raise exception '9 FAILED: a bill-card holder added a premises';
  exception when others then get stacked diagnostics v_msg = message_text; if v_msg like '9 FAILED%' then raise; end if; end;

  ---------------------------------------------------------------- 10. the old tables took their new columns without losing rows
  perform pg_temp.as_owner();
  if (select count(*) from information_schema.columns where table_name = 'bills_inbox' and column_name in ('kind_id', 'premises_id', 'account_id') and is_nullable = 'YES') <> 3 then
    raise exception '10 FAILED: bills_inbox columns are not all nullable';
  end if;
  if (select count(*) from information_schema.columns where table_name = 'maintenance_bills' and column_name in ('premises_id', 'account_id') and is_nullable = 'YES') <> 2 then
    raise exception '10 FAILED: maintenance_bills columns are not both nullable';
  end if;

  ---------------------------------------------------------------- 11. grants
  if exists (select 1 from card_grants where card = 'utility_bills' and activity <> 'bills.utilities')
     or exists (select 1 from card_grants where card = 'general_bills' and activity <> 'bills.general')
     or exists (select 1 from card_grants where card = 'bill_sites' and activity <> 'bills.sites') then
    raise exception '11 FAILED: a bill card grants something else';
  end if;
  if exists (select 1 from role_cards rc join roles r on r.id = rc.role_id
              where rc.card in ('utility_bills', 'general_bills', 'bill_sites') and r.key not like 'h0305%') then
    raise exception '11 FAILED: a real role holds one of the new cards';
  end if;

  raise notice 'ALL PROOFS PASSED. Nothing is kept: the transaction is rolled back.';
end
$$;

rollback;
`;

try {
  await query(harness);
  console.log(`bills-sites-schema proofs: all passed against ${envName} (project ${ref}), nothing kept.`);
  console.log("A pass is the absence of a raised exception; a failed proof arrives as an error naming its number.");
  await exitWith(0);
} catch (err) {
  console.error(`bills-sites-schema proofs FAILED against ${envName} (project ${ref}):`);
  console.error(`  ${err.message}`);
  await exitWith(1);
}
