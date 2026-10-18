-- consumer: src/lib/permissions/cards.ts, src/app/admin/who-does-what/actions.ts, src/app/admin/who-does-what/page.tsx, scripts/check-cards-schema.mjs
--
-- approve-photos (docs/decisions/2026-10-18-approve-photos-schema.md): the schema half. set_role_cards() (0194) now
-- refuses to leave the shelter with photos nobody on site can approve. NOTHING a user can see changes, and no role loses or
-- gains a cell: the rule only refuses calls, it writes nothing.
--
-- THE RULE (counted on the state AFTER the call, because the role being edited is handed its new bundle):
--   An "approver" is a role other than Admin (Admin is fixed and holds no cells) holding photos.resident_publish, through a
--   card (Residents today, Approve photos once it exists) or an extra. The condition is on the ACTIVITY, not on a card name,
--   because the activity exists (0217) and the Approve photos card does not yet; and so Residents keeps counting for free.
--   1. Giving a role the Add resident photos card (add_photos), which it did not hold, is refused while no approver exists.
--   2. Taking approval away from a role that has it is refused while no other approver exists and any role holds add_photos
--      (after this call). The message names those roles.
--   If an approver exists after the call, the function does no more than it did in 0194. A state that is already
--   inconsistent is never made a reason to refuse an unrelated edit: only the two moves above can be refused.
--
-- Re-runnable: create or replace, same signature and grants as 0194.

create or replace function set_role_cards(p_role uuid, p_cards text[], p_bundle jsonb)
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

  -- Is there an approver once this call lands? The edited role counts by the bundle it is being handed, every other role by
  -- the cells it holds now (role_permissions is always the union of cards and extras).
  v_approver_after :=
    exists (select 1 from jsonb_array_elements(coalesce(p_bundle, '[]'::jsonb)) e
             where e ->> 'activity' = 'photos.resident_publish' and (e ->> 'level')::smallint >= 1)
    or exists (select 1 from public.role_permissions rp
                where rp.role_id <> p_role and rp.activity = 'photos.resident_publish' and rp.level >= 1);

  if not v_approver_after then
    if 'add_photos' = any (coalesce(p_cards, array[]::text[]))
       and not exists (select 1 from public.role_cards rc where rc.role_id = p_role and rc.card = 'add_photos') then
      raise exception 'Give a role the Approve photos card first, so someone can approve these photos.'
        using errcode = 'check_violation';
    end if;

    if exists (select 1 from public.role_permissions rp
                where rp.role_id = p_role and rp.activity = 'photos.resident_publish' and rp.level >= 1) then
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

  perform public.recompute_role_permissions(p_role, p_bundle);
end;
$$;

comment on function set_role_cards(uuid, text[], jsonb) is
  'Give a role exactly these cards, in this order, and recompute its role_permissions as the union of their bundles plus its extras (0194). Admin at 2-step only. Refuses (check_violation) to give add_photos while no non-Admin role holds photos.resident_publish, and to take the last such role''s approval away while a role holds add_photos (0221).';
