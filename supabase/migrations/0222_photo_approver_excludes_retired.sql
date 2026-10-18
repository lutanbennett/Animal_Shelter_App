-- consumer: src/lib/permissions/cards.ts, src/app/admin/who-does-what/page.tsx, src/app/admin/who-does-what/actions.ts, scripts/check-cards-schema.mjs
--
-- approve-photos-app (docs/decisions/2026-10-18-retired-roles-do-not-approve.md): Lutan, 2026-10-18, "exclude retired roles as
-- this will future proof the system going forward". 0221's approver test counted any role holding photos.resident_publish,
-- including a RETIRED one (roles.archived_at set: Staff, 0173), so removing Residents from Management was not refused while
-- Staff still "approved". A retired role can no longer be signed in as, so it approves nothing.
--
-- ONE CHANGE, to the two role_permissions lookups that ask "does another role approve?": they join roles and require
-- archived_at is null. The test is the flag, never the name 'staff', so the next role to be retired drops out by itself.
-- Everything else is 0221 exactly: both messages, the edited role counted by the bundle it is handed, the permissiveness (an
-- already-inconsistent state never blocks an unrelated edit; removing add_photos is always allowed). No cell is written.
-- The second lookup (does the edited role itself approve today?) is NOT filtered: it asks about the role being edited.
--
-- Re-runnable: create or replace, same signature and grants as 0194 / 0221.

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
    or exists (select 1 from public.role_permissions rp join public.roles ar on ar.id = rp.role_id
                where rp.role_id <> p_role and ar.archived_at is null and rp.activity = 'photos.resident_publish' and rp.level >= 1);

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
  'Give a role exactly these cards, in this order, and recompute its role_permissions as the union of their bundles plus its extras (0194). Admin at 2-step only. Refuses (check_violation) to give add_photos while no non-Admin role holds photos.resident_publish, and to take the last such role''s approval away while a role holds add_photos (0221). A retired role (roles.archived_at set) does not count as an approver (0222).';
