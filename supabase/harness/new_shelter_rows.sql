-- #shrow: what rows does a brand-new shelter have the moment product_admin_create_shelter returns? Read-only in effect: rolls back.
-- Places a throwaway product_admins row INSIDE the transaction to pass is_product_admin(); sets an aal2 claim (the gate reads the JWT).
-- Reports, per public table carrying shelter_id: rows for the new shelter, rows for 'lanna', and rows for any other shelter.
-- Also lists triggers on shelters and non-null shelter_id columns with no default. Run: node scripts/run-harness.mjs supabase/harness/new_shelter_rows.sql
begin;
do $$
declare u uuid; sid uuid; r text := ''; t record; n_new bigint; n_lanna bigint; n_other bigint; lanna uuid;
begin
  select id into u from auth.users order by created_at limit 1;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  select id into lanna from public.shelters where key = 'lanna';
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  sid := public.product_admin_create_shelter('zz-shrow', 'ZZ shrow throwaway');
  reset role;
  r := E'gate: ok at aal2 with in-transaction product_admins row\ntriggers on shelters: ' ||
       coalesce((select string_agg(tgname, ',') from pg_trigger where tgrelid = 'public.shelters'::regclass and not tgisinternal), 'none') || E'\n';
  for t in select c.table_name from information_schema.columns c join information_schema.tables tb
             on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
           where c.table_schema = 'public' and c.column_name = 'shelter_id' order by 1 loop
    execute format('select count(*) filter (where shelter_id = %L), count(*) filter (where shelter_id = %L), count(*) filter (where shelter_id not in (%L,%L)) from public.%I', sid, lanna, sid, lanna, t.table_name)
      into n_new, n_lanna, n_other;
    r := r || format('%s new=%s lanna=%s other=%s%s', rpad(t.table_name, 40), n_new, n_lanna, n_other, E'\n');
  end loop;
  raise exception E'HARNESS:\n%', r;
end $$;
rollback;
