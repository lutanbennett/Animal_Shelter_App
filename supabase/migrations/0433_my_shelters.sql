-- consumer: none yet. The app half (#apxld, the shelter chooser page under src/app/platform/) calls it with supabase.rpc('my_shelters').
--
-- #apxld SCHEMA HALF. Which shelters does THIS login hold a role at, and where do they sign in to each?
-- Lutan, 2026-11-20: a person who works at several shelters gets "a list of shelters that they can access". Picking one is a link, so they sign
-- in again there (the website address decides the shelter).
--
-- WHY A FUNCTION: the 0392 restrictive policy limits every read to the request's shelter, so a login on shelter A cannot read its own user_roles
-- rows for shelter B, and shelters / shelter_hosts are revoked from authenticated outright (0382). Security definer runs as rls_definer, which
-- those policies do not apply to.
-- MUST HOLD (#shsup): it answers about auth.uid() and nobody else. It takes NO argument (a parameter is a way to ask about someone else), and a
-- caller with no auth.uid() gets no rows. It returns only shelters the caller already holds a role at, so it reveals no shelter or account that
-- caller is not already part of.
-- HOST RULE: the shelter's PRIMARY address (shelter_hosts.is_primary, 0428; set automatically on a shelter's first address, one per shelter).
-- No column added. A shelter with no address has nowhere to send anyone and is left out; an archived shelter (0428) is unreachable and left out.
-- Re-runnable. TO UNDO: drop function public.my_shelters().

create or replace function public.my_shelters()
returns table (shelter_id uuid, name text, host text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, h.host
    from public.shelters s
    join public.shelter_hosts h on h.shelter_id = s.id and h.is_primary
   where s.archived_at is null
     and auth.uid() is not null
     and exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.shelter_id = s.id)
   order by s.name, s.id;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.my_shelters() owner to rls_definer;
  end if;
end $$;

revoke all on function public.my_shelters() from public, anon;
grant execute on function public.my_shelters() to authenticated;
