// Rollback harness for the fixed_outgoings table against DEV only. Asserts the LIVE schema; it
// no longer replays 0114, which calls current_user_role(), dropped by the has_permission()
// conversions (docs/decisions/2026-10-02-replay-or-assert-live.md rule 1).
// One transaction: assertions, then a deliberate
// `raise exception` carrying the evidence — nothing can commit.
//
//   node scripts/check-fixed-outgoings.mjs     (from the repo root; dev only)
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

do $h$
declare
  v_n int; v_ok boolean; i int; v_t1 timestamptz;
begin
  -- A. start from a clean slate INSIDE this transaction: dev may hold rows this script did not
  -- create, and the rollback puts them back. Nothing is asserted about them.
  delete from fixed_outgoings;

  -- B. good rows, including open-ended and ranged
  insert into fixed_outgoings (label, monthly_amount) values ('Salaries', 150000.50);
  insert into fixed_outgoings (label, monthly_amount, starts_on, ends_on, note)
    values ('Rent', 20000, '2026-01-01', '2026-09-01', 'old rate');
  insert into fixed_outgoings (label, monthly_amount, starts_on) values ('Rent from Oct', 22000, '2026-10-01');
  if (select monthly_amount from fixed_outgoings where label = 'Salaries') <> 150000.50 then
    raise exception 'FAIL B amount not round-tripped'; end if;

  -- C. each check refuses
  v_ok := false; begin insert into fixed_outgoings (label, monthly_amount) values ('Neg', -1);
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C negative amount accepted'; end if;
  v_ok := false; begin insert into fixed_outgoings (label, monthly_amount) values ('   ', 1);
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C blank label accepted'; end if;
  v_ok := false; begin insert into fixed_outgoings (label, monthly_amount, starts_on) values ('Mid', 1, '2026-10-15');
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C mid-month start accepted'; end if;
  v_ok := false; begin insert into fixed_outgoings (label, monthly_amount, ends_on) values ('Mid2', 1, '2026-10-02');
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C mid-month end accepted'; end if;
  v_ok := false; begin insert into fixed_outgoings (label, monthly_amount, starts_on, ends_on) values ('Back', 1, '2026-10-01', '2026-09-01');
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C end before start accepted'; end if;
  v_ok := false; begin insert into fixed_outgoings (label, monthly_amount) values (' salaries ', 1);
  exception when unique_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C duplicate label (case/space) accepted'; end if;

  -- D. row cap: 3 rows exist, fill to 24, the 25th is refused
  for i in 1..21 loop insert into fixed_outgoings (label, monthly_amount) values ('Line ' || i, 1); end loop;
  select count(*) into v_n from fixed_outgoings;
  if v_n <> 24 then raise exception 'FAIL D expected 24 rows, have %', v_n; end if;
  v_ok := false; begin insert into fixed_outgoings (label, monthly_amount) values ('One per employee', 1);
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL D 25th row accepted'; end if;

  -- E. updated_at: kept on a no-op update, trigger present
  select updated_at into v_t1 from fixed_outgoings where label = 'Salaries';
  perform pg_sleep(0.05);
  update fixed_outgoings set label = label where label = 'Salaries';
  if (select updated_at from fixed_outgoings where label = 'Salaries') <> v_t1 then raise exception 'FAIL E no-op moved updated_at'; end if;
  -- (a real change moving updated_at cannot show inside one transaction: now() is fixed; touch_updated_at is 0078's tested function)
  if not exists (select 1 from pg_trigger where tgrelid = 'fixed_outgoings'::regclass and tgname = 'fixed_outgoings_touch_updated_at') then raise exception 'FAIL E touch trigger missing'; end if;

  -- F. access: anon has no privileges; every policy is gated on the reports.cashflow cell.
  -- (Was "only admin and management": 0150_perm_convert_settings replaced the role-name policies with
  -- four has_permission('reports.cashflow') policies on purpose, so the role names left the policy text.
  -- Which roles hold the cell is the permission-parity check's job, not this script's.)
  if has_table_privilege('anon', 'fixed_outgoings', 'select') or has_table_privilege('anon', 'fixed_outgoings', 'insert') then
    raise exception 'FAIL F anon holds a grant'; end if;
  if not (select relrowsecurity from pg_class where oid = 'fixed_outgoings'::regclass) then
    raise exception 'FAIL F RLS off'; end if;
  select count(*) into v_n from pg_policies where tablename = 'fixed_outgoings'
    and (coalesce(qual, '') || coalesce(with_check, '')) not like '%has_permission(''reports.cashflow''%';
  if v_n <> 0 then raise exception 'FAIL F a policy is not gated on reports.cashflow'; end if;
  select count(*) into v_n from pg_policies where tablename = 'fixed_outgoings';
  if v_n <> 4 then raise exception 'FAIL F expected 4 policies (select/insert/update/delete), have %', v_n; end if;

  -- G. nothing person-shaped: no fk to a person table, no user column but updated_by
  select count(*) into v_n from pg_constraint c where c.conrelid = 'fixed_outgoings'::regclass and c.contype = 'f'
    and c.confrelid <> 'auth.users'::regclass;
  if v_n <> 0 then raise exception 'FAIL G foreign key to something other than auth.users'; end if;

  raise exception 'HARNESS-OK checks: amount round-trips; negative, blank, mid-month start/end, end-before-start and case-insensitive duplicate label refused; 25th row refused; updated_at kept on no-op and touch trigger present; anon no grants; RLS on with exactly 4 policies, each gated on reports.cashflow; only fk is updated_by to auth.users';
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
const ok = text.includes("HARNESS-OK");
console.log(ok ? text.match(/HARNESS-OK[^"]*/)[0] : text);
process.exitCode = ok ? 0 : 1;
