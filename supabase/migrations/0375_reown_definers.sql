-- consumer: none
--
-- RE-OWN THE OWNER-RUN VIEWS AND SECURITY DEFINER FUNCTIONS TO A POSTGRES ROLE THAT OBEYS ROW-LEVEL SECURITY
-- (backlog #ykefa, one part; docs/decisions/2026-11-14-tenancy-reown.md).
--
-- On Supabase `postgres` has BYPASSRLS, so a view that is not security_invoker and a security definer function both skip every
-- row-level policy. Multi-tenancy needs them to obey the tenant policy, so they must be owned by a Postgres role (NOT an app
-- role) that does not bypass RLS. This file creates that Postgres role, gives it a permissive policy per RLS table (inside a
-- definer object the ordinary per-login policies are not meant to apply; a later restrictive tenant policy still will), and
-- moves ownership. Nothing a shelter user sees changes: that is the deliverable.
--
-- Scope is what scripts/lib/tenancy-catalogue.mjs flags: API-reachable (anon or authenticated can use it AND reach its schema).
-- Survivors stay owned by postgres, by name, with a reason, in that script's ALLOWED list: private.app_users and
-- public.login_display_name and public.label_translations both read auth.users, which has RLS on and no policy and which postgres cannot add one to.
-- Re-runnable: every step is a no-op the second time.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'rls_definer') then
    create role rls_definer nologin inherit nobypassrls nosuperuser nocreatedb nocreaterole noreplication;
  end if;
end $$;

-- postgres must be a member to hand objects to it; INHERIT authenticated is how definer code reaches auth.uid()/auth.jwt().
grant rls_definer to postgres;
grant authenticated to rls_definer;
grant usage on schema public, private, extensions to rls_definer;
grant create on schema public, private to rls_definer;
grant select, insert, update, delete on all tables in schema public to rls_definer;
grant select on all tables in schema private to rls_definer;
grant usage, select on all sequences in schema public to rls_definer;
grant execute on all functions in schema public, private, extensions to rls_definer;
-- Objects created later by the migration runner get the same reach, so a new owned object fails loudly rather than reading 0 rows.
alter default privileges for role postgres in schema public grant select, insert, update, delete on tables to rls_definer;
alter default privileges for role postgres in schema public grant usage, select on sequences to rls_definer;
alter default privileges for role postgres in schema public grant execute on functions to rls_definer;

-- One permissive policy per RLS-enabled table: inside owner-run code, every row is in scope (the tenant restriction comes later).
do $$
declare r record;
begin
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relrowsecurity
       and not exists (select 1 from pg_policy p where p.polrelid = c.oid and p.polname = 'definer_all')
  loop
    execute format('create policy definer_all on public.%I for all to rls_definer using (true) with check (true)', r.relname);
  end loop;
end $$;

do $$
declare r record;
begin
  -- views and materialised views that run as their owner, reachable from the API, bar the named survivor
  for r in
    select n.nspname, c.relname, c.relkind
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where c.relkind in ('v', 'm') and n.nspname in ('public', 'private')
       and coalesce(c.reloptions::text, '') !~* 'security_invoker\s*=\s*(true|on)'
       and ((has_table_privilege('anon', c.oid, 'select') and has_schema_privilege('anon', n.oid, 'usage'))
         or (has_table_privilege('authenticated', c.oid, 'select') and has_schema_privilege('authenticated', n.oid, 'usage')))
       and pg_get_userbyid(c.relowner) <> 'rls_definer'
       and (n.nspname, c.relname) <> ('private', 'app_users')
  loop
    execute format('alter %s %I.%I owner to rls_definer', case r.relkind when 'm' then 'materialized view' else 'view' end, r.nspname, r.relname);
  end loop;
  -- security definer functions anon or authenticated can execute (extension members excluded), bar the named survivor
  for r in
    select p.oid::regprocedure as f
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where p.prokind = 'f' and p.prosecdef and n.nspname in ('public', 'private')
       and ((has_function_privilege('anon', p.oid, 'execute') and has_schema_privilege('anon', n.oid, 'usage'))
         or (has_function_privilege('authenticated', p.oid, 'execute') and has_schema_privilege('authenticated', n.oid, 'usage')))
       and pg_get_userbyid(p.proowner) <> 'rls_definer'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
       and not (n.nspname = 'public' and p.proname in ('login_display_name', 'label_translations'))
  loop
    execute format('alter function %s owner to rls_definer', r.f);
  end loop;
end $$;
