-- consumer: none
--
-- Multi-tenancy programme part 1 (#mz75e, under #ykefa): the shelters table, the host -> shelter table and the function that turns a
-- request host into a shelter or into NOTHING. Nothing reads these yet (Part 4's Worker will), so the data lands before any reader.
-- Table-driven on purpose (docs/decisions/2026-11-14-cooperjaidee-hostnames.md): stripping a label off <shelter>.cooperjaidee.org would
-- not cover Lanna, which is on its own domain.
--
-- "No shelter" is an EXPLICIT row with shelter_id null (the platform front door: cooperjaidee.org, www.cooperjaidee.org). A host with
-- no row at all is UNKNOWN. Both resolve to null, but shelter_host_kind() tells them apart, so the Worker can show the front door
-- for one and refuse the other. An unmapped host never falls through to Lanna.
--
-- Both tables are RLS-on with only the rls_definer policy (0375 convention), and anon/authenticated hold no grant: the Worker reads
-- them with the service role. The functions are security INVOKER and executable by service_role only.
-- Re-runnable. To undo: drop function resolve_shelter_host(text), shelter_host_kind(text), normalise_request_host(text);
-- then drop table shelter_hosts; then drop table shelters.

create table if not exists shelters (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name       text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists shelter_hosts (
  host       text primary key check (host = lower(host) and host !~ '[[:space:]:]' and host !~ '\.$' and length(host) > 0),
  shelter_id uuid references shelters(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists shelter_hosts_shelter_idx on shelter_hosts (shelter_id);

alter table shelters enable row level security;
alter table shelter_hosts enable row level security;
revoke all on shelters, shelter_hosts from anon, authenticated;
grant select, insert, update, delete on shelters, shelter_hosts to service_role;

do $$
declare t text;
begin
  foreach t in array array['shelters', 'shelter_hosts'] loop
    if exists (select 1 from pg_roles where rolname = 'rls_definer') then
      execute format('drop policy if exists definer_all on public.%I', t);
      execute format('create policy definer_all on public.%I for all to rls_definer using (true) with check (true)', t);
    end if;
  end loop;
end $$;

insert into shelters (key, name) values ('lanna', 'Lanna Care for Animals') on conflict (key) do nothing;

insert into shelter_hosts (host, shelter_id)
select 'lannacareforanimals.org', id from shelters where key = 'lanna'
on conflict (host) do nothing;
insert into shelter_hosts (host, shelter_id) values ('cooperjaidee.org', null), ('www.cooperjaidee.org', null)
on conflict (host) do nothing;

-- Lower-case, trim, drop one :port and one trailing dot. NOT done: no www. stripping, no wildcard or label rules, no IPv6 literals.
create or replace function normalise_request_host(p_host text) returns text
language sql immutable security invoker set search_path = public, pg_temp as $$
  select nullif(regexp_replace(regexp_replace(lower(btrim(coalesce(p_host, ''))), ':[0-9]*$', ''), '\.$', ''), '')
$$;

create or replace function resolve_shelter_host(p_host text) returns uuid
language sql stable security invoker set search_path = public, pg_temp as $$
  select shelter_id from shelter_hosts where host = normalise_request_host(p_host)
$$;

-- 'shelter' | 'front_door' | 'unknown'
create or replace function shelter_host_kind(p_host text) returns text
language sql stable security invoker set search_path = public, pg_temp as $$
  select coalesce((select case when shelter_id is null then 'front_door' else 'shelter' end
                     from shelter_hosts where host = normalise_request_host(p_host)), 'unknown')
$$;

revoke all on function normalise_request_host(text), resolve_shelter_host(text), shelter_host_kind(text) from public, anon, authenticated;
grant execute on function normalise_request_host(text), resolve_shelter_host(text), shelter_host_kind(text) to service_role;
