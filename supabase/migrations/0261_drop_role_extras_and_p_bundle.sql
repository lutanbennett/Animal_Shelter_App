-- consumer: src/app/admin/who-does-what/actions.ts, scripts/dev-signin.mjs
--
-- Two removals that ship together with the app change in the same PR.
--   1. role_extras is dropped. 0257 stopped it counting for access (role_permissions is exactly the union of a role's cards'
--      grants); nothing reads it. Its triggers, policies and grants go with the table.
--   2. set_role_cards loses its ignored p_bundle input, leaving (p_role, p_cards). Body is 0257's, unchanged apart from that.
--      A function with a different input list is a different function, so the old three-input one is dropped first and the
--      grants are made again, as 0194 made them.
-- DEPLOY ORDER: the app and this migration go out TOGETHER. An app still sending p_bundle to the two-input function fails the
-- way 0.40.2 did (PostgREST PGRST202), in the other direction.
-- Re-runnable.

drop function if exists set_role_cards(uuid, text[], jsonb);

create or replace function set_role_cards(p_role uuid, p_cards text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_approver_after boolean;
  v_holders text;
begin
  if exists (select 1 from unnest(p_cards) c group by c having count(*) > 1) then
    raise exception 'A card can be given to a role once.' using errcode = 'unique_violation';
  end if;

  -- Is there an approver once this call lands? The edited role counts by what the cards it is being handed require (card_grants,
  -- with includes), every other role by the cells it holds now (role_permissions is exactly its cards' union).
  v_approver_after :=
    exists (select 1 from public.card_closure(p_cards) cl join public.card_grants g on g.card = cl.card
             where g.activity = 'photos.approve' and g.level >= 1)
    or exists (select 1 from public.role_permissions rp join public.roles ar on ar.id = rp.role_id
                where rp.role_id <> p_role and ar.archived_at is null and rp.activity = 'photos.approve' and rp.level >= 1);

  if not v_approver_after then
    if 'add_photos' = any (coalesce(p_cards, array[]::text[]))
       and not exists (select 1 from public.role_cards rc where rc.role_id = p_role and rc.card = 'add_photos') then
      raise exception 'Give a role the Approve photos card first, so someone can approve these photos.'
        using errcode = 'check_violation';
    end if;

    if exists (select 1 from public.role_permissions rp
                where rp.role_id = p_role and rp.activity = 'photos.approve' and rp.level >= 1) then
      select string_agg(h.name, ', ' order by h.name) into v_holders
        from (
          select r.name from public.role_cards rc join public.roles r on r.id = rc.role_id
           where rc.card = 'add_photos' and rc.role_id <> p_role
          union
          select r.name from public.roles r
           where r.id = p_role and 'add_photos' = any (coalesce(p_cards, array[]::text[]))
        ) h;
      if v_holders is not null then
        raise exception 'This is the last role that can approve photos, and these roles still add resident photos: %. Take Add resident photos off them first, or give another role the Approve photos card.', v_holders
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  delete from public.role_cards rc
   where rc.role_id = p_role and not (rc.card = any (coalesce(p_cards, array[]::text[])));

  insert into public.role_cards (role_id, card, position)
  select p_role, c.card, c.pos
    from unnest(coalesce(p_cards, array[]::text[])) with ordinality as c (card, pos)
  on conflict (role_id, card) do update set position = excluded.position
    where public.role_cards.position is distinct from excluded.position;

  perform public.recompute_role_permissions(p_role, null);
end;
$$;

revoke all on function set_role_cards(uuid, text[]) from public, anon;
grant execute on function set_role_cards(uuid, text[]) to authenticated, service_role;

comment on function set_role_cards(uuid, text[]) is
  'Give a role exactly these cards, in this order; role_permissions is then exactly the union of what the cards require (card_grants, 0257). Admin at 2-step only. Refuses (check_violation) to give add_photos while no non-Admin role holds photos.approve, and to take the last such role''s approval away while a role holds add_photos (0221). A retired role does not count as an approver (0222, 0224).';

drop table if exists role_extras;
