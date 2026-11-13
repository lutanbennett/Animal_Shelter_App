-- Rollback harness for 0366_refusal_keys_last_group.sql. Dev only.
-- Success is the HARNESS-OK message, raised on purpose so nothing commits.
--   node scripts/run-harness.mjs supabase/harness/0366_refusal_keys_last_group_harness.sql
--
-- Every probe asserts the REFUSAL MESSAGE IS THE KEY, not merely that the call was refused.
-- Fixtures are named "ZZ fixture ..." and nothing is committed.
begin;

create function pg_temp.err_as(u uuid, aal text, stmt text) returns text language plpgsql as $f$
declare e text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated', 'aal', aal)::text, true);
  set local role authenticated;
  begin
    execute stmt;
    e := 'NO ERROR';
  exception when others then
    e := sqlerrm;
  end;
  reset role;
  return e;
end $f$;

do $h$
declare
  u_none uuid := gen_random_uuid();  -- no cards at all
  u_prop uuid := gen_random_uuid();  -- website.propose only
  r_none uuid; r_prop uuid; r_other uuid;
  seen int := 0; missed text := '';
  got text;
begin
  insert into auth.users (id, email) values
    (u_none, 'zz-fixture-none@example.invalid'), (u_prop, 'zz-fixture-prop@example.invalid');
  insert into roles (key, name, kind) values ('zz_fixture_none', 'ZZ fixture none', 'custom') returning id into r_none;
  insert into roles (key, name, kind) values ('zz_fixture_prop', 'ZZ fixture proposer', 'custom') returning id into r_prop;
  insert into roles (key, name, kind) values ('zz_fixture_other', 'ZZ fixture other', 'custom') returning id into r_other;
  insert into role_permissions (role_id, activity, level) values (r_prop, 'website.propose', 2);
  insert into user_roles (user_id, role_id) values (u_none, r_none), (u_prop, r_prop);

  -- 1. recurrence_dates, a span over two years
  got := pg_temp.err_as(u_none, 'aal2', $$select * from recurrence_dates('weekly', 1, array[1]::smallint[], null, null, date '2026-01-01', null, date '2026-01-01', date '2029-01-01')$$);
  if got = 'recurring_job.span_too_long' then seen := seen + 1;
  else missed := missed || format(' [1 recurrence_dates -> %s]', got); end if;

  -- 2. recurring_job_dates, the same span (shares the key)
  got := pg_temp.err_as(u_none, 'aal2', $$select * from recurring_job_dates(date '2026-01-01', date '2029-01-01')$$);
  if got = 'recurring_job.span_too_long' then seen := seen + 1;
  else missed := missed || format(' [2 recurring_job_dates -> %s]', got); end if;

  -- 3. role_can, asking about a role the login neither holds nor may manage
  got := pg_temp.err_as(u_none, 'aal2', format('select role_can(%L, %L, %L)', 'zz_fixture_other', 'website.propose', 'read'));
  if got = 'role.eligibility_not_allowed' then seen := seen + 1;
  else missed := missed || format(' [3 role_can -> %s]', got); end if;

  -- 3b. control: the same login asking about its OWN role is answered, not refused
  got := pg_temp.err_as(u_none, 'aal2', format('select role_can(%L, %L, %L)', 'zz_fixture_none', 'website.propose', 'read'));
  if got <> 'NO ERROR' then missed := missed || format(' [3b own-role control -> %s]', got); end if;

  -- 4. propose_website_draft without the card
  got := pg_temp.err_as(u_none, 'aal2', $$select propose_website_draft('site_content', 'site', '{}'::jsonb)$$);
  if got = 'website.propose_not_allowed' then seen := seen + 1;
  else missed := missed || format(' [4 propose_not_allowed -> %s]', got); end if;

  -- 5. propose_website_draft with the card, on a table that cannot be drafted
  got := pg_temp.err_as(u_prop, 'aal2', $$select propose_website_draft('profiles', 'x', '{}'::jsonb)$$);
  if got = 'website.draft_table_invalid' then seen := seen + 1;
  else missed := missed || format(' [5 draft_table_invalid -> %s]', got); end if;

  raise exception 'HARNESS-OK 0366: % of 5 raises provoked and each gave its KEY, not a sentence.%',
    seen, case when missed = '' then ' Nothing missed.' else ' MISSED:' || missed end;
end $h$;

rollback;
