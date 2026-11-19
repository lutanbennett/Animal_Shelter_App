-- consumer: worker/shelter.mjs
--
-- #wbsof: whether a shelter's PUBLIC WEBSITE is open, locked or off is one Worker variable (PUBLIC_SITE) for the whole deployment, so one
-- shelter's website cannot be off while another's is on. This puts the same three states on the shelter. The Worker reads it with the
-- host it already resolves (resolve_shelter_site below, one call instead of resolve_shelter_host's) and forwards it as x-public-site.
-- PUBLIC_SITE stays as a floor: the request gets the MORE CLOSED of the two (src/lib/public-site.ts), so a shelter can close its own site
-- further, never open it past the deployment.
--
-- NOT a card question: it grants no person anything; it is shelter configuration like stocktaking_*_enabled. Admin is not touched.
--
-- Default 'locked': a brand-new shelter has strangers OUT until someone opens it, never open. The existing Lanna row is set to 'open'
-- ONCE, when the column is first added, so that PUBLIC_SITE alone keeps governing it exactly as before (production/UAT are 'locked' by
-- that variable; the dev and any unset deployment are open). A re-run never touches an existing value.
-- Not seeded in 0416's new-shelter defaults: that seeds site_content; this lives on the shelters row, whose column default does it.
-- Re-runnable. To undo: drop function resolve_shelter_site(text); alter table shelters drop column public_site.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'shelters' and column_name = 'public_site') then
    alter table public.shelters add column public_site text not null default 'locked' check (public_site in ('open', 'locked', 'off'));
    update public.shelters set public_site = 'open' where key = 'lanna';
  end if;
end $$;

-- { "id": uuid|null, "site": 'open'|'locked'|'off'|null } for a request host. id null means no shelter (front door or unknown host);
-- site is then null and only the deployment floor applies. Like resolve_shelter_host: security invoker, service_role only.
create or replace function resolve_shelter_site(p_host text) returns json
language sql stable security invoker set search_path = public, pg_temp as $$
  select json_build_object('id', h.shelter_id, 'site', s.public_site)
    from shelter_hosts h left join shelters s on s.id = h.shelter_id
   where h.host = normalise_request_host(p_host)
$$;

revoke all on function resolve_shelter_site(text) from public, anon, authenticated;
grant execute on function resolve_shelter_site(text) to service_role;
