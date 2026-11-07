-- consumer: none
--
-- SCHEMA half of backlog item #v3h8m. NOTHING IN src/ READS THIS YET; the app half (src/lib/reels/queries.ts, which today embeds
-- residents(...) in its reel_residents select) switches to it. See docs/decisions/2026-11-07-reel-residents-schema.md.
--
-- THE FAULT: reel_residents_select_perm asks social.reels at Read, but the embedded residents row is cut by the residents policy, so a
-- login without a resident card gets the link row and a null resident, and the screen reads that as "No animal is tagged".
--
-- THE ANSWER: a login is told HOW MANY animals a reel tags (it holds social.reels Read, so the fact a reel tags something is its to
-- know) and is given NAMES only where private.works_with_residents() is true, which is exactly the gate on resident_who_and_where. So
-- the function widens no one's read of a resident's name: whoever may already list residents by name gets names, nobody else does.
-- It is SECURITY INVOKER on purpose: private.works_with_residents() opens with current_user not in (anon, authenticated), so inside a
-- definer function it is always true and would hand every login the names. The view runs that check as the caller.
-- A refused row comes back with named = false and null id and names, so the app can say "N animals tagged, you cannot see which".
--
-- Cards only: social.reels at Read (a card's grant) and works_with_residents() (card checks). No role key, no role column.
-- Additive and re-runnable.

create or replace function public.reel_resident_tags(p_reel_ids uuid[])
returns table (reel_id uuid, resident_id uuid, name text, thai_name text, named boolean)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $fn$
  select rr.reel_id, w.id, w.name, w.thai_name, (w.id is not null)
    from public.reel_residents rr
    left join public.resident_who_and_where w on w.id = rr.resident_id
   where rr.reel_id = any (p_reel_ids)
$fn$;

comment on function public.reel_resident_tags(uuid[]) is
  'Per tagged animal of the given reels: one row each. The link rows answer to social.reels at Read (reel_residents_select_perm), so a login without it gets no rows. named is false, and resident_id, name and thai_name null, unless the login may list residents by name (resident_who_and_where). Added 0330.';

revoke all on function public.reel_resident_tags(uuid[]) from public, anon;
grant execute on function public.reel_resident_tags(uuid[]) to authenticated, service_role;
