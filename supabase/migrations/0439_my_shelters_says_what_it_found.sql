-- consumer: src/app/platform/shelters/page.tsx
--
-- #shmis. my_shelters() (0433) joined shelter_hosts on is_primary with an INNER join and only walked live shelters, so a shelter you hold a role at
-- but that has no primary address (the normal state of every new shelter until its address answers, #hstau) or that has been closed was dropped
-- with no row, no note and no count. Three different states looked like one blank list.
-- NOW: every shelter the caller holds a role at is returned, with two more facts: host is NULL when the shelter has no primary address (so it
-- cannot be linked to), and archived says it has been closed. The host rule is NOT turned off: is_primary still decides which address is
-- offered, and the page lists a shelter with no host WITHOUT a link. A shelter the caller holds no role at is still not returned at all.
-- MUST HOLD (#shsup), unchanged from 0433: answers about auth.uid() only, takes NO argument, no auth.uid() gives no rows, returns only shelters
-- the caller already holds a role at.
-- The return type changes, so the old function is dropped first (create or replace cannot change it). Re-runnable. Owner rls_definer as before.
-- TO UNDO: re-apply 0433_my_shelters.sql after dropping this function.

drop function if exists public.my_shelters();

create function public.my_shelters()
returns table (shelter_id uuid, name text, host text, archived boolean)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare v_hdr text; v_ids uuid[]; v_id uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then return; end if;
  -- rls_definer is a member of authenticated, so the 0392 policies still apply inside this function (0433): ask one shelter at a time, with
  -- the request's shelter set to it for that read, and put it back.
  v_hdr := current_setting('request.headers', true);
  select array_agg(s0.id) into v_ids from public.shelters s0;
  foreach v_id in array coalesce(v_ids, '{}'::uuid[]) loop
    perform set_config('request.headers', json_build_object('x-shelter-id', v_id::text)::text, true);
    return query
    select s.id, s.name,
           (select h.host from public.shelter_hosts h where h.shelter_id = s.id and h.is_primary limit 1),
           s.archived_at is not null
      from public.shelters s
     where s.id = v_id
       and exists (select 1 from public.user_roles ur where ur.user_id = v_uid and ur.shelter_id = v_id);
  end loop;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.my_shelters() owner to rls_definer;
  end if;
end $$;

revoke all on function public.my_shelters() from public, anon;
grant execute on function public.my_shelters() to authenticated;
