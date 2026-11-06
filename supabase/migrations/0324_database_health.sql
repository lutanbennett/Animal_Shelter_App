-- consumer: src/lib/status/health.ts
--
-- Two plain numbers for the health endpoint Home Assistant reads (GET /api/status/health):
-- how big the database is and how many connections are open. Nothing else: no query text,
-- no user names, no addresses.
--
-- SECURITY INVOKER on purpose. It reads only pg_database_size() and a count of
-- pg_stat_activity rows, both of which any role may run, so it needs no elevated rights
-- and grants nobody anything. Executable by service_role only, so no login can call it
-- through the API. Re-runnable: create or replace, revoke/grant.

create or replace function database_health()
returns table (size_bytes bigint, connections integer)
language sql
security invoker
set search_path = ''
as $$
  select pg_catalog.pg_database_size(pg_catalog.current_database()),
         (select count(*)::integer from pg_catalog.pg_stat_activity
           where datname = pg_catalog.current_database())
$$;
comment on function database_health() is
  'Database size in bytes and open connection count. Read by the health endpoint (src/lib/status/health.ts) and nothing else.';
revoke all on function database_health() from public, anon, authenticated;
grant execute on function database_health() to service_role;
